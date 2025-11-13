const hre = require("hardhat");

/**
 * Simple example script for submitting validator proofs
 * 
 * Usage:
 * VALIDATOR=0xAddress PROOFS=10 npx hardhat run scripts/submit-proof-example.js --network mantleSepolia
 */

async function main() {
  console.log("\n🎯 Validator Proof Submission Example\n");

  // Get configuration from environment
  const validatorAddress = process.env.VALIDATOR || null;
  const proofCount = parseInt(process.env.PROOFS || "5");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Submitter:", signer.address);

  // Load deployed addresses
  const deployedAddresses = require("../deployed-addresses.json");
  const validatorRewardsAddress = deployedAddresses.contracts.ValidatorRewards;
  console.log("ValidatorRewards:", validatorRewardsAddress);

  // Get contract instance
  const ValidatorRewards = await hre.ethers.getContractFactory("ValidatorRewards");
  const validatorRewards = ValidatorRewards.attach(validatorRewardsAddress);

  // Determine validator (use signer if not specified)
  const targetValidator = validatorAddress || signer.address;
  console.log("\nTarget Validator:", targetValidator);
  console.log("Proofs to Submit:", proofCount);

  // Check current stats
  console.log("\n📊 Current Stats:");
  const rewardsBefore = await validatorRewards.getPendingRewards(targetValidator);
  const proofsBefore = await validatorRewards.getVerifiedProofsCount(targetValidator);
  console.log("  Pending Rewards:", hre.ethers.formatEther(rewardsBefore), "CVT");
  console.log("  Verified Proofs:", proofsBefore.toString());

  // Submit proofs
  console.log("\n⏳ Submitting proofs...");
  
  try {
    // Create array of validator addresses (one per proof)
    const validators = Array(proofCount).fill(targetValidator);
    
    // Submit batch
    const tx = await validatorRewards.batchSubmitProof(validators);
    console.log("Transaction Hash:", tx.hash);
    console.log("Explorer:", `https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`);
    
    // Wait for confirmation
    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Confirmed! Block:", receipt.blockNumber);
    
    // Check updated stats
    console.log("\n✨ Updated Stats:");
    const rewardsAfter = await validatorRewards.getPendingRewards(targetValidator);
    const proofsAfter = await validatorRewards.getVerifiedProofsCount(targetValidator);
    console.log("  Pending Rewards:", hre.ethers.formatEther(rewardsAfter), "CVT");
    console.log("  Verified Proofs:", proofsAfter.toString());
    console.log("  New Rewards:", hre.ethers.formatEther(rewardsAfter - rewardsBefore), "CVT");
    
    console.log("\n🎉 Success! Proofs submitted successfully.");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message.includes("Not authorized")) {
      console.log("\n💡 Tip: Only the contract owner or authorized submitters can submit proofs.");
    } else if (error.message.includes("Validator not active")) {
      console.log("\n💡 Tip: The validator must register first (stake 500 CVT).");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

