const hre = require("hardhat");

async function main() {
  console.log("📊 CVT Staking - Yield Rate Check");
  console.log("═".repeat(60));

  // Load contract addresses
  const deployedAddresses = require("../deployed-addresses.json");
  const cvtStakingAddress = deployedAddresses.contracts.CVTStaking;

  console.log("📍 CVTStaking address:", cvtStakingAddress);

  // Get contract instance
  const CVTStaking = await hre.ethers.getContractFactory("CVTStaking");
  const cvtStaking = CVTStaking.attach(cvtStakingAddress);

  // Get yield rate
  console.log("\n📈 Current Staking Information:");
  console.log("━".repeat(60));

  const yieldRate = await cvtStaking.yieldPerSecond();
  const totalStaked = await cvtStaking.totalStaked();
  const owner = await cvtStaking.owner();

  console.log("Yield per second:", hre.ethers.formatEther(yieldRate), "tokens");
  console.log("Yield per second (wei):", yieldRate.toString());

  // Calculate APY
  const secondsPerYear = 365 * 24 * 60 * 60;
  const apy = (Number(hre.ethers.formatEther(yieldRate)) * secondsPerYear * 100);
  
  console.log("\n💰 Annual Percentage Yield:");
  console.log("APY:", apy.toFixed(4) + "%");

  console.log("\n📦 Staking Statistics:");
  console.log("Total staked:", hre.ethers.formatEther(totalStaked), "CVT");
  
  // Calculate annual rewards if someone stakes 1000 CVT
  const exampleStake = 1000;
  const annualReward = exampleStake * apy / 100;
  console.log(`\nExample: Staking ${exampleStake} CVT for 1 year:`);
  console.log(`  - Annual rewards: ${annualReward.toFixed(2)} CVT`);
  console.log(`  - Monthly rewards: ${(annualReward / 12).toFixed(2)} CVT`);
  console.log(`  - Daily rewards: ${(annualReward / 365).toFixed(4)} CVT`);

  console.log("\n👤 Contract Owner:", owner);
  
  console.log("\n" + "═".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

