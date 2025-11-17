const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Load deployed contract addresses
const deployedAddresses = require("../deployed-addresses.json");

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    amount: "100", // Default 100 CVT
    recipient: null, // Will use signer address
    projectId: "CARBON-PROJECT-001",
    co2Tons: "100",
    validator: "0x0000000000000000000000000000000000000000",
    batch: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--help" || arg === "-h") {
      config.help = true;
    } else if (arg === "--amount") {
      config.amount = args[++i];
    } else if (arg === "--recipient") {
      config.recipient = args[++i];
    } else if (arg === "--project") {
      config.projectId = args[++i];
    } else if (arg === "--co2") {
      config.co2Tons = args[++i];
    } else if (arg === "--validator") {
      config.validator = args[++i];
    } else if (arg === "--batch") {
      config.batch = args[++i];
    }
  }

  return config;
}

// Show help message
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║               CVT Token Minting Script - Help                  ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npx hardhat run scripts/mint-cvt.js --network mantleSepolia [options]

Options:
  --amount <number>       Amount of CVT to mint (default: 100)
  --recipient <address>   Recipient address (default: signer)
  --project <string>      Project identifier (default: CARBON-PROJECT-001)
  --co2 <number>          CO2 tons offset (default: 100)
  --validator <address>   Validator address (default: zero address)
  --batch <file>          Batch mint from JSON file
  --help, -h              Show this help message

Examples:
  # Mint 100 CVT to yourself
  npx hardhat run scripts/mint-cvt.js --network mantleSepolia

  # Mint custom amount
  npx hardhat run scripts/mint-cvt.js --network mantleSepolia --amount 500

  # Mint to specific address
  npx hardhat run scripts/mint-cvt.js --network mantleSepolia \\
    --amount 250 \\
    --recipient 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

  # Mint with custom project
  npx hardhat run scripts/mint-cvt.js --network mantleSepolia \\
    --amount 1000 \\
    --project "FOREST-RESTORATION-2024" \\
    --co2 1000

  # Batch mint from file
  npx hardhat run scripts/mint-cvt.js --network mantleSepolia \\
    --batch minting-list.json

Batch File Format (JSON):
  [
    {
      "recipient": "0x7c538b83D0295f94C4bBAf8302095d9ED4b2Ad5f",
      "amount": "100",
      "projectId": "PROJECT-001",
      "co2Tons": "100",
      "validator": "0x0000000000000000000000000000000000000000"
    }
  ]

Network:
  Mantle Sepolia Testnet
  Chain ID: 5003
  RPC: https://rpc.sepolia.mantle.xyz
  Explorer: https://explorer.sepolia.mantle.xyz

Deployed Contracts:
  CVTMinting: ${deployedAddresses.contracts.CVTMinting}
  CVTStaking: ${deployedAddresses.contracts.CVTStaking}
  CVTMarketplace: ${deployedAddresses.contracts.CVTMarketplace}
  ValidatorRewards: ${deployedAddresses.contracts.ValidatorRewards}

Notes:
  - Ensure you have testnet MNT for gas fees
  - Get testnet MNT from: https://faucet.sepolia.mantle.xyz
  - Each minting generates a unique commitment
  - Minting records are saved to minting-records.json
  `);
}

// Generate commitment hash
function generateCommitment(projectId, co2Tons, timestamp) {
  const secret = crypto.randomBytes(32).toString("hex");
  const data = `${projectId}${co2Tons}${timestamp}${secret}`;
  const commitment = crypto.createHash("sha256").update(data).digest("hex");
  return { commitment: "0x" + commitment, secret };
}

// Generate mock ZK proof (for testing)
// In production, this should call the actual ZK circuit
function generateMockProof(projectId, co2Tons, timestamp, commitment) {
  // Generate mock proof bytes (128 bytes for Groth16 proof)
  const proofBytes = "0x" + crypto.randomBytes(128).toString("hex");

  // Public inputs: [commitment, co2Tons, minTimestamp, maxTimestamp, verifierId]
  // Note: commitment needs to be converted from bytes32 to uint256
  const commitmentUint = BigInt(commitment);
  
  const publicInputs = [
    commitmentUint.toString(),
    co2Tons,
    (timestamp - 86400).toString(), // minTimestamp (24h ago)
    (timestamp + 86400).toString(), // maxTimestamp (24h from now)
    "1"   // verifierId
  ];

  return { proof: proofBytes, publicInputs };
}

// Save minting record
function saveMintingRecord(record) {
  const recordsFile = path.join(__dirname, "..", "minting-records.json");
  let records = [];

  if (fs.existsSync(recordsFile)) {
    const data = fs.readFileSync(recordsFile, "utf8");
    records = JSON.parse(data);
  }

  records.push(record);
  fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Mint CVT tokens
async function mintCVT(cvtContract, config, signer) {
  const recipient = config.recipient || signer.address;
  const amount = hre.ethers.parseEther(config.amount);
  const timestamp = config.timestamp || Math.floor(Date.now() / 1000);

  console.log("\n🌍 Minting Parameters:");
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${config.amount} CVT`);
  console.log(`  Project ID: ${config.projectId}`);
  console.log(`  CO2 Tons: ${config.co2Tons}`);
  console.log(`  Timestamp: ${new Date(timestamp * 1000).toISOString()}`);
  console.log(`  Validator: ${config.validator}`);

  // Generate commitment
  console.log("\n🔐 Generating commitment...");
  const { commitment, secret } = generateCommitment(
    config.projectId,
    config.co2Tons,
    timestamp
  );
  console.log(`  Commitment: ${commitment.substring(0, 10)}...${commitment.substring(commitment.length - 8)}`);

  // Generate ZK proof
  console.log("\n🔧 Generating ZK proof...");
  const { proof, publicInputs } = generateMockProof(
    config.projectId,
    config.co2Tons,
    timestamp,
    commitment
  );
  console.log("  ✓ Proof generated (mock for testing)");
  console.log("\n📊 Public Inputs:");
  publicInputs.forEach((input, i) => {
    const display = typeof input === "string" && input.startsWith("0x") && input.length > 20
      ? `${input.substring(0, 12)}...`
      : input;
    console.log(`  [${i}]: ${display}`);
  });

  // Check current balance
  console.log("\n💰 Current CVT Balance:");
  const balanceBefore = await cvtContract.balanceOf(recipient);
  console.log(`  ${hre.ethers.formatEther(balanceBefore)} CVT`);

  // Submit minting transaction
  console.log("\n📤 Submitting minting transaction...");
  console.log("   This may take a few moments on Mantle Sepolia...");

  try {
    // Convert commitment string to bytes32
    const commitmentBytes32 = commitment;
    
    const tx = await cvtContract.mintCVT(
      recipient,
      amount,
      proof,
      publicInputs,
      commitmentBytes32,
      config.projectId,
      config.validator
      // Let Mantle auto-estimate gas (explicit gasLimit causes issues)
    );

    console.log("\n✓ Transaction submitted!");
    console.log(`  Transaction Hash: ${tx.hash}`);
    console.log(`  Explorer: https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`);

    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("\n✅ Transaction Confirmed!");
    console.log(`  Block Number: ${receipt.blockNumber}`);
    console.log(`  Gas Used: ${formatNumber(receipt.gasUsed.toString())}`);

    // Check new balance
    const balanceAfter = await cvtContract.balanceOf(recipient);
    const minted = balanceAfter - balanceBefore;

    console.log("\n💎 Minting Summary:");
    console.log(`  Previous Balance: ${hre.ethers.formatEther(balanceBefore)} CVT`);
    console.log(`  New Balance: ${hre.ethers.formatEther(balanceAfter)} CVT`);
    console.log(`  Minted Amount: ${hre.ethers.formatEther(minted)} CVT`);

    // Parse events
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = cvtContract.interface.parseLog(log);
        return parsed && parsed.name === "CVTMinted";
      } catch {
        return false;
      }
    });

    if (mintEvent) {
      const parsed = cvtContract.interface.parseLog(mintEvent);
      console.log("\n📋 Mint Event Details:");
      console.log(`  To: ${parsed.args.to}`);
      console.log(`  Amount: ${hre.ethers.formatEther(parsed.args.amount)} CVT`);
      console.log(`  Commitment: ${parsed.args.commitment.substring(0, 10)}...${parsed.args.commitment.substring(parsed.args.commitment.length - 8)}`);
      console.log(`  Project ID: ${config.projectId}`);
    }

    // Save minting record
    const record = {
      timestamp: new Date().toISOString(),
      recipient,
      amount: config.amount,
      projectId: config.projectId,
      co2Tons: config.co2Tons,
      commitment,
      secret,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      validator: config.validator
    };

    saveMintingRecord(record);
    console.log("\n💾 Minting record saved to: minting-records.json");

    return true;
  } catch (error) {
    console.error("\n❌ Minting failed!");
    console.error(`  Error: ${error.message}`);
    
    if (error.message.includes("Invalid proof")) {
      console.error("\n⚠️  Note: This contract requires valid ZK proofs.");
      console.error("   For testing, deploy a mock verifier or use the full ZK circuit.");
      console.error("   See zk-circuits/README.md for setup instructions.");
    }
    
    return false;
  }
}

// Batch mint from JSON file
async function batchMint(cvtContract, batchFile, signer) {
  console.log(`\n📦 Loading batch file: ${batchFile}`);
  
  const filePath = path.join(process.cwd(), batchFile);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Batch file not found: ${batchFile}`);
    return;
  }

  const batchData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`  Found ${batchData.length} minting operations`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < batchData.length; i++) {
    const item = batchData[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Batch Item ${i + 1}/${batchData.length}`);
    console.log("=".repeat(60));

    const config = {
      amount: item.amount,
      recipient: item.recipient,
      projectId: item.projectId,
      co2Tons: item.co2Tons,
      validator: item.validator || "0x0000000000000000000000000000000000000000"
    };

    const success = await mintCVT(cvtContract, config, signer);
    if (success) {
      successful++;
    } else {
      failed++;
    }

    // Wait a bit between transactions
    if (i < batchData.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next transaction...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Batch Minting Summary");
  console.log("=".repeat(60));
  console.log(`  Total Operations: ${batchData.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
}

// Main function
async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    return;
  }

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          CVT Token Minting on Mantle Sepolia                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("\n📋 Configuration:");
  console.log(`  Network: ${network.name}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(`  Signer: ${signer.address}`);
  console.log(`  CVTMinting Contract: ${deployedAddresses.contracts.CVTMinting}`);

  // Get contract instance
  const CVTMinting = await hre.ethers.getContractFactory("CVTMinting");
  const cvtContract = CVTMinting.attach(deployedAddresses.contracts.CVTMinting);

  // Verify contract exists
  const code = await hre.ethers.provider.getCode(deployedAddresses.contracts.CVTMinting);
  if (code === "0x") {
    console.error("\n❌ Error: CVTMinting contract not found at specified address!");
    console.error("   Please verify the contract address in deployed-addresses.json");
    return;
  }

  // Check signer balance
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log(`  Signer Balance: ${hre.ethers.formatEther(balance)} MNT`);

  if (balance === 0n) {
    console.error("\n❌ Error: Insufficient MNT balance for gas fees!");
    console.error("   Get testnet MNT from: https://faucet.sepolia.mantle.xyz");
    return;
  }

  // Execute minting
  if (config.batch) {
    await batchMint(cvtContract, config.batch, signer);
  } else {
    await mintCVT(cvtContract, config, signer);
  }

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                  ✨ Minting Complete! ✨                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n🔗 Useful Links:");
  console.log(`  Block Explorer: https://explorer.sepolia.mantle.xyz/address/${signer.address}`);
  console.log(`  CVTMinting Contract: https://explorer.sepolia.mantle.xyz/address/${deployedAddresses.contracts.CVTMinting}`);
  console.log(`  Minting Records: ${path.join(__dirname, "..", "minting-records.json")}`);
  console.log("\n💡 Next Steps:");
  console.log("  - View your CVT balance in the frontend dashboard");
  console.log("  - Stake CVT to earn yield rewards");
  console.log("  - List CVT on the marketplace");
  console.log("  - Generate compliance reports");
  console.log("\n");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Fatal Error:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  mintCVT,
  saveMintingRecord,
  generateCommitment,
  generateMockProof,
};

