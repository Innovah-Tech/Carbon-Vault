const hre = require("hardhat");

async function main() {
  console.log("🔧 Adding Validator Proofs");
  console.log("═".repeat(60));

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n👤 Using account:", deployer.address);

  // Load contract addresses
  const deployedAddresses = require("../deployed-addresses.json");
  const validatorRewardsAddress = deployedAddresses.contracts.ValidatorRewards;

  console.log("📍 ValidatorRewards address:", validatorRewardsAddress);

  // Get contract instance
  const ValidatorRewards = await hre.ethers.getContractFactory("ValidatorRewards");
  const validatorRewards = ValidatorRewards.attach(validatorRewardsAddress);

  // Check current configuration
  console.log("\n📊 Current Configuration:");
  console.log("━".repeat(60));

  const rewardPerProof = await validatorRewards.rewardPerProof();
  console.log("Reward per proof:", hre.ethers.formatEther(rewardPerProof), "CVT");

  const owner = await validatorRewards.owner();
  console.log("Contract owner:", owner);
  console.log("Your address:", deployer.address);
  console.log("Is owner:", owner.toLowerCase() === deployer.address.toLowerCase());

  // Check deployer's current stats
  const deployerRewards = await validatorRewards.getPendingRewards(deployer.address);
  const deployerProofs = await validatorRewards.getVerifiedProofsCount(deployer.address);
  console.log("\nYour current stats:");
  console.log("  Pending rewards:", hre.ethers.formatEther(deployerRewards), "CVT");
  console.log("  Verified proofs:", deployerProofs.toString());

  // Add some proof verifications for demonstration
  const proofsToAdd = parseInt(process.env.PROOFS || "5");
  console.log(`\n📝 Adding ${proofsToAdd} proof verification(s) for ${deployer.address}...`);

  try {
    // Use batchSubmitProof for efficiency
    const validators = Array(proofsToAdd).fill(deployer.address);
    const tx = await validatorRewards.batchSubmitProof(validators);
    console.log("Transaction hash:", tx.hash);
    
    console.log("⏳ Waiting for confirmation...");
    await tx.wait();
    
    console.log("✅ Proofs submitted successfully!");

    // Check updated stats
    const newRewards = await validatorRewards.getPendingRewards(deployer.address);
    const newProofs = await validatorRewards.getVerifiedProofsCount(deployer.address);
    
    console.log("\n✨ Updated Stats:");
    console.log("━".repeat(60));
    console.log("Pending rewards:", hre.ethers.formatEther(newRewards), "CVT");
    console.log("Verified proofs:", newProofs.toString());
    console.log("New rewards earned:", hre.ethers.formatEther(newRewards - deployerRewards), "CVT");

    console.log("\n" + "═".repeat(60));
    console.log("🎉 Validator proofs added successfully!");
    console.log("═".repeat(60));
    console.log("\n💡 Tip: Run this script again with different PROOFS value:");
    console.log("   PROOFS=10 npx hardhat run scripts/add-validator-proofs.js --network mantleSepolia");

  } catch (error) {
    console.error("\n❌ Error adding proofs:");
    console.error(error.message);
    
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("\n⚠️  You are not the owner of this contract.");
      console.log("Only the contract owner can submit proofs.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

