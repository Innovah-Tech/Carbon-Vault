const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy CarbonVault
  const CarbonVault = await hre.ethers.getContractFactory("CarbonVault");
  const carbonVault = await CarbonVault.deploy(
    "CarbonVault Token",
    "CVT",
    deployer.address
  );
  
  await carbonVault.waitForDeployment();
  const carbonVaultAddress = await carbonVault.getAddress();
  
  console.log("CarbonVault deployed to:", carbonVaultAddress);

  // Note: ZK Verifier needs to be deployed separately
  // For now, we'll deploy CarbonVaultZK with a placeholder verifier
  // In production, deploy a real ZK verifier contract first
  
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("CarbonVault Address:", carbonVaultAddress);
  console.log("Deployer:", deployer.address);
  
  // Save deployment addresses
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    contracts: {
      CarbonVault: carbonVaultAddress,
    },
    deployer: deployer.address,
  };
  
  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\nDeployment info saved to:", `${deploymentsDir}/${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

