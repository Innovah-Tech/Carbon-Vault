const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load deployed contract addresses
const deployedAddresses = require("../deployed-addresses.json");

// Parse configuration from environment variables
function parseArgs() {
  const config = {
    action: process.env.ACTION || null,
    validator: process.env.VALIDATOR || null,
    amount: process.env.AMOUNT || null,
    proofs: process.env.PROOFS || "5",
    file: process.env.FILE || null,
    help: process.env.HELP === "true" || false
  };

  return config;
}

// Show help message
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Validator Submissions Management Script             ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  ACTION=<action> [OPTIONS] npx hardhat run scripts/manage-validators.js --network mantleSepolia

Actions (use ACTION environment variable):
  submit                    Submit proof verifications
  batch                     Batch submit for multiple validators
  check                     Check validator stats
  fund                      Fund the rewards contract
  set-reward                Set reward per proof
  list                      List all validator stats

Environment Variables:
  ACTION                    Action to perform (required)
  VALIDATOR                 Validator address (for submit/check)
  PROOFS                    Number of proofs to submit (default: 5)
  AMOUNT                    Amount of CVT (for fund/set-reward)
  FILE                      JSON file with validator list (for batch)
  HELP                      Set to 'true' to show help

Examples:

  # Submit 5 proofs for yourself
  ACTION=submit npx hardhat run scripts/manage-validators.js --network mantleSepolia

  # Submit 10 proofs for a specific validator
  ACTION=submit VALIDATOR=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb PROOFS=10 \\
    npx hardhat run scripts/manage-validators.js --network mantleSepolia

  # Check validator stats
  ACTION=check VALIDATOR=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb \\
    npx hardhat run scripts/manage-validators.js --network mantleSepolia

  # Fund rewards contract with 1000 CVT
  ACTION=fund AMOUNT=1000 \\
    npx hardhat run scripts/manage-validators.js --network mantleSepolia

  # Set reward per proof to 2 CVT
  ACTION=set-reward AMOUNT=2 \\
    npx hardhat run scripts/manage-validators.js --network mantleSepolia

  # Batch submit from file
  ACTION=batch FILE=validators.json \\
    npx hardhat run scripts/manage-validators.js --network mantleSepolia

  # List all validators
  ACTION=list npx hardhat run scripts/manage-validators.js --network mantleSepolia

Batch File Format (JSON):
  [
    {
      "address": "0x7c538b83D0295f94C4bBAf8302095d9ED4b2Ad5f",
      "proofs": 5
    },
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "proofs": 3
    }
  ]

Deployed Contracts:
  ValidatorRewards: ${deployedAddresses.contracts.ValidatorRewards}
  CVTMinting: ${deployedAddresses.contracts.CVTMinting}
  `);
}

// Submit proof verifications
async function submitProofs(validatorRewards, validator, proofs, signer) {
  console.log("\n📝 Submitting Proof Verifications");
  console.log("━".repeat(60));
  console.log(`Validator: ${validator}`);
  console.log(`Proofs to submit: ${proofs}`);

  // Check current stats
  const rewardsBefore = await validatorRewards.getPendingRewards(validator);
  const proofsBefore = await validatorRewards.getVerifiedProofsCount(validator);
  
  console.log("\nCurrent Stats:");
  console.log(`  Pending rewards: ${hre.ethers.formatEther(rewardsBefore)} CVT`);
  console.log(`  Verified proofs: ${proofsBefore.toString()}`);

  // Submit proofs
  console.log("\n⏳ Submitting proofs...");
  const validators = Array(parseInt(proofs)).fill(validator);
  const tx = await validatorRewards.batchSubmitProof(validators);
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`Explorer: https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`);
  
  console.log("\n⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  console.log(`\n✅ Proofs submitted! Block: ${receipt.blockNumber}`);

  // Check updated stats
  const rewardsAfter = await validatorRewards.getPendingRewards(validator);
  const proofsAfter = await validatorRewards.getVerifiedProofsCount(validator);
  
  console.log("\n✨ Updated Stats:");
  console.log("━".repeat(60));
  console.log(`Pending rewards: ${hre.ethers.formatEther(rewardsAfter)} CVT`);
  console.log(`Verified proofs: ${proofsAfter.toString()}`);
  console.log(`New rewards earned: ${hre.ethers.formatEther(rewardsAfter - rewardsBefore)} CVT`);
}

// Check validator stats
async function checkValidator(validatorRewards, validator) {
  console.log("\n📊 Validator Statistics");
  console.log("━".repeat(60));
  console.log(`Validator: ${validator}`);

  const rewards = await validatorRewards.getPendingRewards(validator);
  const proofs = await validatorRewards.getVerifiedProofsCount(validator);
  const rewardPerProof = await validatorRewards.rewardPerProof();

  console.log("\nStats:");
  console.log(`  Pending rewards: ${hre.ethers.formatEther(rewards)} CVT`);
  console.log(`  Verified proofs: ${proofs.toString()}`);
  console.log(`  Reward per proof: ${hre.ethers.formatEther(rewardPerProof)} CVT`);
  console.log(`  Total earned: ${hre.ethers.formatEther(BigInt(proofs) * rewardPerProof)} CVT`);
}

// Fund rewards contract
async function fundRewards(validatorRewards, cvtContract, amount, signer) {
  console.log("\n💰 Funding Rewards Contract");
  console.log("━".repeat(60));
  console.log(`Amount: ${amount} CVT`);

  const amountWei = hre.ethers.parseEther(amount);
  
  // Check balance
  const balance = await cvtContract.balanceOf(signer.address);
  console.log(`\nYour CVT balance: ${hre.ethers.formatEther(balance)} CVT`);
  
  if (balance < amountWei) {
    throw new Error("Insufficient CVT balance");
  }

  // Approve
  console.log("\n⏳ Approving CVT...");
  const approveTx = await cvtContract.approve(
    await validatorRewards.getAddress(),
    amountWei
  );
  await approveTx.wait();
  console.log("✅ Approved");

  // Fund
  console.log("\n⏳ Funding contract...");
  const fundTx = await validatorRewards.fundRewards(amountWei);
  console.log(`Transaction hash: ${fundTx.hash}`);
  
  await fundTx.wait();
  console.log("\n✅ Contract funded successfully!");
  
  // Check contract balance
  const contractBalance = await cvtContract.balanceOf(await validatorRewards.getAddress());
  console.log(`\nContract CVT balance: ${hre.ethers.formatEther(contractBalance)} CVT`);
}

// Set reward per proof
async function setRewardPerProof(validatorRewards, amount) {
  console.log("\n⚙️  Setting Reward Per Proof");
  console.log("━".repeat(60));
  
  const oldRate = await validatorRewards.rewardPerProof();
  console.log(`Current rate: ${hre.ethers.formatEther(oldRate)} CVT per proof`);
  console.log(`New rate: ${amount} CVT per proof`);

  const newRate = hre.ethers.parseEther(amount);
  
  console.log("\n⏳ Updating reward rate...");
  const tx = await validatorRewards.setRewardPerProof(newRate);
  await tx.wait();
  
  console.log("\n✅ Reward rate updated!");
}

// Batch submit from file
async function batchSubmitFromFile(validatorRewards, filePath) {
  console.log("\n📦 Batch Submit from File");
  console.log("━".repeat(60));
  console.log(`File: ${filePath}`);

  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  console.log(`Found ${data.length} validators`);

  let totalProofs = 0;
  for (const item of data) {
    console.log(`\n${"─".repeat(60)}`);
    await submitProofs(validatorRewards, item.address, item.proofs.toString(), null);
    totalProofs += parseInt(item.proofs);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("📊 Batch Summary");
  console.log("═".repeat(60));
  console.log(`Total validators: ${data.length}`);
  console.log(`Total proofs submitted: ${totalProofs}`);
}

// List all validators (from storage)
async function listValidators(validatorRewards) {
  console.log("\n📋 Validator List");
  console.log("━".repeat(60));

  // Load from local storage file if exists
  const storageFile = path.join(__dirname, "..", "validator-submissions.json");
  let validators = [];

  if (fs.existsSync(storageFile)) {
    validators = JSON.parse(fs.readFileSync(storageFile, "utf8"));
  }

  if (validators.length === 0) {
    console.log("No validators found in local storage.");
    console.log("\n💡 Tip: Submit some proofs first to populate the list.");
    return;
  }

  console.log(`Found ${validators.length} validators\n`);

  for (const validator of validators) {
    const rewards = await validatorRewards.getPendingRewards(validator);
    const proofs = await validatorRewards.getVerifiedProofsCount(validator);
    
    console.log(`${validator}`);
    console.log(`  Rewards: ${hre.ethers.formatEther(rewards)} CVT`);
    console.log(`  Proofs: ${proofs.toString()}`);
    console.log();
  }
}

// Save validator to storage
function saveValidatorToStorage(validator) {
  const storageFile = path.join(__dirname, "..", "validator-submissions.json");
  let validators = [];

  if (fs.existsSync(storageFile)) {
    validators = JSON.parse(fs.readFileSync(storageFile, "utf8"));
  }

  if (!validators.includes(validator)) {
    validators.push(validator);
    fs.writeFileSync(storageFile, JSON.stringify(validators, null, 2));
  }
}

// Main function
async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    return;
  }

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           Validator Submissions Management                    ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("\n📋 Configuration:");
  console.log(`  Network: ${network.name}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(`  Signer: ${signer.address}`);
  console.log(`  ValidatorRewards: ${deployedAddresses.contracts.ValidatorRewards}`);

  // Get contract instances
  const ValidatorRewards = await hre.ethers.getContractFactory("ValidatorRewards");
  const validatorRewards = ValidatorRewards.attach(deployedAddresses.contracts.ValidatorRewards);

  const CVTMinting = await hre.ethers.getContractFactory("CVTMinting");
  const cvtContract = CVTMinting.attach(deployedAddresses.contracts.CVTMinting);

  // Check contract configuration
  const rewardPerProof = await validatorRewards.rewardPerProof();
  const owner = await validatorRewards.owner();
  const isOwner = owner.toLowerCase() === signer.address.toLowerCase();

  console.log("\n⚙️  Contract Configuration:");
  console.log(`  Reward per proof: ${hre.ethers.formatEther(rewardPerProof)} CVT`);
  console.log(`  Contract owner: ${owner}`);
  console.log(`  You are owner: ${isOwner ? "✅ Yes" : "❌ No"}`);

  // Execute action
  const validator = config.validator || signer.address;

  try {
    switch (config.action) {
      case "submit":
        await submitProofs(validatorRewards, validator, config.proofs, signer);
        saveValidatorToStorage(validator);
        break;

      case "check":
        await checkValidator(validatorRewards, validator);
        break;

      case "fund":
        if (!config.amount) {
          throw new Error("Amount required. Use --amount <number>");
        }
        await fundRewards(validatorRewards, cvtContract, config.amount, signer);
        break;

      case "set-reward":
        if (!config.amount) {
          throw new Error("Amount required. Use --amount <number>");
        }
        await setRewardPerProof(validatorRewards, config.amount);
        break;

      case "batch":
        if (!config.file) {
          throw new Error("File required. Use --file <path>");
        }
        await batchSubmitFromFile(validatorRewards, config.file);
        break;

      case "list":
        await listValidators(validatorRewards);
        break;

      default:
        console.log("\n❌ Invalid action. Use --help to see available actions.");
        return;
    }

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                    ✨ Success! ✨                             ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");

  } catch (error) {
    console.error("\n❌ Error:");
    console.error(`  ${error.message}`);
    
    if (error.message.includes("Not authorized submitter")) {
      console.log("\n⚠️  You are not authorized to submit proofs.");
      console.log("Only the contract owner or authorized submitters can submit.");
    }
  }

  console.log("\n");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal Error:");
    console.error(error);
    process.exit(1);
  });

