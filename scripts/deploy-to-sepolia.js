const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CarbonVault contracts to Mantle Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MNT\n");

  if (balance === 0n) {
    console.error("❌ Error: Account has no MNT balance!");
    console.log("\n📝 To get test MNT:");
    console.log("   1. Visit: https://faucet.sepolia.mantle.xyz");
    console.log("   2. Connect wallet:", deployer.address);
    console.log("   3. Request test MNT tokens\n");
    process.exit(1);
  }

  // 1. Deploy CVTMinting (ERC20 token)
  console.log("📄 Deploying CVTMinting...");
  const CVTMinting = await hre.ethers.getContractFactory("CVTMinting");
  
  // Deploy with placeholder verifier (update later)
  const placeholderVerifier = deployer.address; // Temporary
  const cvtMinting = await CVTMinting.deploy(
    placeholderVerifier,
    hre.ethers.ZeroAddress, // No validator rewards initially
    deployer.address
  );
  await cvtMinting.waitForDeployment();
  const cvtAddress = await cvtMinting.getAddress();
  console.log("✅ CVTMinting deployed to:", cvtAddress);

  // 2. Deploy ValidatorRewards
  console.log("\n📄 Deploying ValidatorRewards...");
  const ValidatorRewards = await hre.ethers.getContractFactory("ValidatorRewards");
  const validatorRewards = await ValidatorRewards.deploy(cvtAddress);
  await validatorRewards.waitForDeployment();
  const validatorRewardsAddress = await validatorRewards.getAddress();
  console.log("✅ ValidatorRewards deployed to:", validatorRewardsAddress);

  // 3. Deploy CVTStaking
  console.log("\n📄 Deploying CVTStaking...");
  const CVTStaking = await hre.ethers.getContractFactory("CVTStaking");
  const cvtStaking = await CVTStaking.deploy(cvtAddress, deployer.address);
  await cvtStaking.waitForDeployment();
  const cvtStakingAddress = await cvtStaking.getAddress();
  console.log("✅ CVTStaking deployed to:", cvtStakingAddress);

  // 4. Deploy CVTMarketplace
  console.log("\n📄 Deploying CVTMarketplace...");
  const CVTMarketplace = await hre.ethers.getContractFactory("CVTMarketplace");
  
  // Deploy with USDT placeholder (you can use any stablecoin address or deploy mock)
  const mockStablecoin = deployer.address; // Temporary
  const cvtMarketplace = await CVTMarketplace.deploy(cvtAddress, mockStablecoin, deployer.address);
  await cvtMarketplace.waitForDeployment();
  const cvtMarketplaceAddress = await cvtMarketplace.getAddress();
  console.log("✅ CVTMarketplace deployed to:", cvtMarketplaceAddress);

  // Update CVTMinting with ValidatorRewards address
  console.log("\n🔗 Linking ValidatorRewards to CVTMinting...");
  const tx = await cvtMinting.setValidatorRewards(validatorRewardsAddress);
  await tx.wait();
  console.log("✅ ValidatorRewards linked");

  // Set initial yield rate (5% APY)
  console.log("\n⚙️  Setting initial yield rate (5% APY)...");
  // 5% APY = 0.05 / 365 / 24 / 60 / 60 ≈ 1.585e-9 per second
  const yieldRate = hre.ethers.parseEther("0.000000001585"); // ~5% APY
  const yieldTx = await cvtStaking.setYieldRatePerSecond(yieldRate);
  await yieldTx.wait();
  console.log("✅ Yield rate set to ~5% APY");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("━".repeat(60));
  console.log("CVTMinting:       ", cvtAddress);
  console.log("CVTStaking:       ", cvtStakingAddress);
  console.log("CVTMarketplace:   ", cvtMarketplaceAddress);
  console.log("ValidatorRewards: ", validatorRewardsAddress);
  console.log("━".repeat(60));

  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend/src/lib/contracts.ts with these addresses");
  console.log("2. Verify contracts on explorer (optional)");
  console.log("3. Test minting CVT tokens");
  console.log("\n🔗 View on Explorer:");
  console.log(`   https://explorer.sepolia.mantle.xyz/address/${cvtAddress}`);

  // Save addresses to file
  const fs = require('fs');
  const addresses = {
    network: "mantleSepolia",
    chainId: 5003,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CVTMinting: cvtAddress,
      CVTStaking: cvtStakingAddress,
      CVTMarketplace: cvtMarketplaceAddress,
      ValidatorRewards: validatorRewardsAddress,
    }
  };
  
  fs.writeFileSync(
    './deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Addresses saved to: deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

