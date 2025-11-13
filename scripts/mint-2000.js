const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Load deployed contract addresses
const deployedAddresses = require("../deployed-addresses.json");

// Generate commitment hash
function generateCommitment(projectId, co2Tons, timestamp) {
  const secret = crypto.randomBytes(32).toString("hex");
  const data = `${projectId}${co2Tons}${timestamp}${secret}`;
  const commitment = crypto.createHash("sha256").update(data).digest("hex");
  return { commitment: "0x" + commitment, secret };
}

// Generate mock ZK proof (for testing)
function generateMockProof(projectId, co2Tons, timestamp, commitment) {
  const proofBytes = "0x" + crypto.randomBytes(128).toString("hex");
  const commitmentUint = BigInt(commitment);
  
  const publicInputs = [
    commitmentUint.toString(),
    co2Tons,
    (timestamp - 86400).toString(),
    (timestamp + 86400).toString(),
    "1"
  ];

  return { proof: proofBytes, publicInputs };
}

// Save minting record
function saveMintingRecord(record) {
  const recordsFile = path.join(__dirname, "..", "minting-records.json");
  let records = [];

  if (fs.existsSync(recordsFile)) {
    try {
      const fileContent = fs.readFileSync(recordsFile, "utf8");
      records = JSON.parse(fileContent);
    } catch (error) {
      console.log("   ⚠️  Could not read existing records, creating new file");
    }
  }

  records.push(record);
  fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          Minting 2000 CVT on Mantle Sepolia                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const [signer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("\n📋 Configuration:");
  console.log(`  Network: ${network.name}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(`  Signer: ${signer.address}`);
  console.log(`  CVTMinting Contract: ${deployedAddresses.contracts.CVTMinting}`);

  // Get contract instances
  const CVTMinting = await hre.ethers.getContractFactory("CVTMinting");
  const cvtContract = CVTMinting.attach(deployedAddresses.contracts.CVTMinting);
  
  // CVTMinting contract IS the CVT token (ERC20)
  const cvtToken = cvtContract;

  // Check balance
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log(`  Signer Balance: ${hre.ethers.formatEther(balance)} MNT`);

  // Minting parameters
  const amount = "2000";
  const projectId = "CARBON-PROJECT-2000";
  const co2Tons = "2000";
  const recipient = signer.address;
  const validator = "0x0000000000000000000000000000000000000000";
  const timestamp = Math.floor(Date.now() / 1000);

  console.log("\n🌍 Minting Parameters:");
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${amount} CVT`);
  console.log(`  Project ID: ${projectId}`);
  console.log(`  CO2 Tons: ${co2Tons}`);

  // Generate commitment
  console.log("\n🔐 Generating commitment...");
  const { commitment, secret } = generateCommitment(projectId, co2Tons, timestamp);
  console.log(`  Commitment: ${commitment.substring(0, 10)}...${commitment.substring(commitment.length - 8)}`);

  // Generate proof
  console.log("\n🔧 Generating ZK proof...");
  const { proof, publicInputs } = generateMockProof(projectId, co2Tons, timestamp, commitment);
  console.log("  ✓ Proof generated (mock for testing)");

  // Get current balance
  const currentBalance = await cvtToken.balanceOf(recipient);
  console.log(`\n💰 Current CVT Balance:`);
  console.log(`  ${hre.ethers.formatEther(currentBalance)} CVT`);

  // Submit minting transaction
  console.log("\n📤 Submitting minting transaction...");
  console.log("   This may take a few moments on Mantle Sepolia...");

  const amountWei = hre.ethers.parseEther(amount);
  const tx = await cvtContract.mintCVT(
    recipient,
    amountWei,
    proof,
    publicInputs,
    commitment,
    projectId,
    validator
  );

  console.log("\n✓ Transaction submitted!");
  console.log(`  Transaction Hash: ${tx.hash}`);
  console.log(`  Explorer: https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`);

  console.log("\n⏳ Waiting for confirmation...");
  const receipt = await tx.wait();

  console.log("\n✅ Transaction Confirmed!");
  console.log(`  Block Number: ${receipt.blockNumber.toLocaleString()}`);
  console.log(`  Gas Used: ${receipt.gasUsed.toLocaleString()}`);

  // Get new balance
  const newBalance = await cvtToken.balanceOf(recipient);
  const mintedAmount = newBalance - currentBalance;

  console.log("\n💎 Minting Summary:");
  console.log(`  Previous Balance: ${hre.ethers.formatEther(currentBalance)} CVT`);
  console.log(`  New Balance: ${hre.ethers.formatEther(newBalance)} CVT`);
  console.log(`  Minted Amount: ${hre.ethers.formatEther(mintedAmount)} CVT`);

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
    console.log(`  Project ID: ${parsed.args.projectId}`);
  }

  // Save record
  const record = {
    timestamp: new Date().toISOString(),
    network: network.name,
    chainId: network.chainId.toString(),
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    recipient,
    amount,
    projectId,
    co2Tons,
    commitment,
    secret,
    validator,
    gasUsed: receipt.gasUsed.toString(),
  };

  saveMintingRecord(record);
  console.log("\n💾 Minting record saved to: minting-records.json");

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                  ✨ Minting Complete! ✨                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n🔗 Useful Links:");
  console.log(`  Block Explorer: https://explorer.sepolia.mantle.xyz/address/${signer.address}`);
  console.log(`  CVTMinting Contract: https://explorer.sepolia.mantle.xyz/address/${deployedAddresses.contracts.CVTMinting}`);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal Error:");
    console.error(error);
    process.exit(1);
  });

