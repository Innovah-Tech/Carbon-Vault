const hre = require("hardhat");

async function main() {
  console.log("🔧 CVT Staking - Yield Rate Manager");
  console.log("═".repeat(60));

  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n👤 Using account:", deployer.address);

  // Load contract addresses
  const deployedAddresses = require("../deployed-addresses.json");
  const cvtStakingAddress = deployedAddresses.contracts.CVTStaking;

  console.log("📍 CVTStaking address:", cvtStakingAddress);

  // Get contract instance
  const CVTStaking = await hre.ethers.getContractFactory("CVTStaking");
  const cvtStaking = CVTStaking.attach(cvtStakingAddress);

  // Check current yield rate
  console.log("\n📊 Current Configuration:");
  console.log("━".repeat(60));

  const currentYieldRate = await cvtStaking.yieldPerSecond();
  console.log("Current yieldPerSecond:", currentYieldRate.toString(), "wei");
  console.log("Current yieldPerSecond:", hre.ethers.formatEther(currentYieldRate), "tokens");

  // Calculate current APY
  const secondsPerYear = 365 * 24 * 60 * 60;
  const currentAPY = (Number(hre.ethers.formatEther(currentYieldRate)) * secondsPerYear * 100);
  console.log("Current APY:", currentAPY.toFixed(4) + "%");

  const totalStaked = await cvtStaking.totalStaked();
  console.log("Total staked:", hre.ethers.formatEther(totalStaked), "CVT");

  const owner = await cvtStaking.owner();
  console.log("Contract owner:", owner);
  console.log("Your address:", deployer.address);
  console.log("Is owner:", owner.toLowerCase() === deployer.address.toLowerCase());

  // Ask if user wants to update
  console.log("\n" + "═".repeat(60));
  console.log("💡 Yield Rate Options:");
  console.log("━".repeat(60));

  const yieldOptions = [
    { apy: 5, rate: "0.000000001585" },
    { apy: 10, rate: "0.000000003170" },
    { apy: 15, rate: "0.000000004756" },
    { apy: 20, rate: "0.000000006341" },
    { apy: 25, rate: "0.000000007927" },
  ];

  yieldOptions.forEach((option, i) => {
    console.log(`${i + 1}. ${option.apy}% APY - ${option.rate} tokens per second`);
  });

  // For now, let's set it to a reasonable 10% APY
  const targetAPY = process.env.APY ? parseFloat(process.env.APY) : 10;
  console.log(`\n🎯 Setting yield to ${targetAPY}% APY...`);

  // Calculate yield rate for target APY
  // Formula: yieldPerSecond = (APY / 100) / secondsPerYear
  const yieldPerSecond = (targetAPY / 100) / secondsPerYear;
  
  // Convert to wei using a more precise method
  // Use parseUnits with more decimal places to avoid scientific notation issues
  const yieldPerSecondStr = yieldPerSecond.toFixed(18); // 18 decimal places
  const yieldRate = hre.ethers.parseUnits(yieldPerSecondStr, 18);

  console.log("New yieldPerSecond:", yieldRate.toString(), "wei");
  console.log("New yieldPerSecond:", hre.ethers.formatEther(yieldRate), "tokens");

  try {
    console.log("\n📝 Sending transaction...");
    const tx = await cvtStaking.setYieldRatePerSecond(yieldRate);
    console.log("Transaction hash:", tx.hash);
    
    console.log("⏳ Waiting for confirmation...");
    await tx.wait();
    
    console.log("✅ Yield rate updated successfully!");

    // Verify new rate
    const newYieldRate = await cvtStaking.yieldPerSecond();
    const newAPY = (Number(hre.ethers.formatEther(newYieldRate)) * secondsPerYear * 100);
    console.log("\n✨ New Configuration:");
    console.log("━".repeat(60));
    console.log("New yieldPerSecond:", hre.ethers.formatEther(newYieldRate), "tokens");
    console.log("New APY:", newAPY.toFixed(4) + "%");

    console.log("\n" + "═".repeat(60));
    console.log("🎉 Yield rate updated successfully!");
    console.log("═".repeat(60));

  } catch (error) {
    console.error("\n❌ Error updating yield rate:");
    console.error(error.message);
    
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("\n⚠️  You are not the owner of this contract.");
      console.log("Only the contract owner can update the yield rate.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

