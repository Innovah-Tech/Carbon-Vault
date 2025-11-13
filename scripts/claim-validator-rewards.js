const hre = require("hardhat");

// Load deployed contract addresses
const deployedAddresses = require("../deployed-addresses.json");

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           Claim Validator Rewards                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("\n📋 Configuration:");
  console.log(`  Network: ${network.name}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(`  Your Address: ${signer.address}`);
  console.log(`  ValidatorRewards: ${deployedAddresses.contracts.ValidatorRewards}`);

  // Get contract instances
  const ValidatorRewards = await hre.ethers.getContractFactory("ValidatorRewards");
  const validatorRewards = ValidatorRewards.attach(deployedAddresses.contracts.ValidatorRewards);

  const CVTMinting = await hre.ethers.getContractFactory("CVTMinting");
  const cvtContract = CVTMinting.attach(deployedAddresses.contracts.CVTMinting);

  // Check pending rewards
  console.log("\n💰 Checking Your Rewards...");
  console.log("━".repeat(60));

  const pendingRewards = await validatorRewards.getPendingRewards(signer.address);
  const verifiedProofs = await validatorRewards.getVerifiedProofsCount(signer.address);
  const rewardPerProof = await validatorRewards.rewardPerProof();

  console.log(`Pending Rewards: ${hre.ethers.formatEther(pendingRewards)} CVT`);
  console.log(`Verified Proofs: ${verifiedProofs.toString()}`);
  console.log(`Reward Rate: ${hre.ethers.formatEther(rewardPerProof)} CVT per proof`);

  if (pendingRewards === 0n) {
    console.log("\n⚠️  No rewards to claim!");
    console.log("\n💡 Tip: Submit some proof verifications first:");
    console.log("   ACTION=submit PROOFS=10 npx hardhat run scripts/manage-validators.js --network mantleSepolia");
    return;
  }

  // Check contract balance
  console.log("\n🏦 Contract Balance Check:");
  console.log("━".repeat(60));

  const contractBalance = await cvtContract.balanceOf(deployedAddresses.contracts.ValidatorRewards);
  console.log(`Contract CVT Balance: ${hre.ethers.formatEther(contractBalance)} CVT`);
  console.log(`Your Pending Rewards: ${hre.ethers.formatEther(pendingRewards)} CVT`);

  if (contractBalance < pendingRewards) {
    console.log("\n❌ Error: Contract has insufficient CVT balance!");
    console.log(`   Contract needs: ${hre.ethers.formatEther(pendingRewards)} CVT`);
    console.log(`   Contract has: ${hre.ethers.formatEther(contractBalance)} CVT`);
    console.log(`   Shortfall: ${hre.ethers.formatEther(pendingRewards - contractBalance)} CVT`);
    console.log("\n💡 Fund the contract first:");
    console.log(`   ACTION=fund AMOUNT=${Math.ceil(Number(hre.ethers.formatEther(pendingRewards - contractBalance)) + 100)} \\`);
    console.log("     npx hardhat run scripts/manage-validators.js --network mantleSepolia");
    return;
  }

  console.log("✅ Contract has sufficient balance!");

  // Check current CVT balance
  const balanceBefore = await cvtContract.balanceOf(signer.address);
  console.log("\n📊 Your Current CVT Balance:");
  console.log(`  ${hre.ethers.formatEther(balanceBefore)} CVT`);

  // Claim rewards
  console.log("\n🎁 Claiming Rewards...");
  console.log("━".repeat(60));

  try {
    const tx = await validatorRewards.claimReward();
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log(`Explorer: https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`);

    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log(`\n✅ Rewards Claimed! Block: ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);

    // Check new balance
    const balanceAfter = await cvtContract.balanceOf(signer.address);
    const claimed = balanceAfter - balanceBefore;

    console.log("\n💎 Claim Summary:");
    console.log("━".repeat(60));
    console.log(`Previous CVT Balance: ${hre.ethers.formatEther(balanceBefore)} CVT`);
    console.log(`New CVT Balance: ${hre.ethers.formatEther(balanceAfter)} CVT`);
    console.log(`Claimed Amount: ${hre.ethers.formatEther(claimed)} CVT`);

    // Check remaining rewards (should be 0)
    const remainingRewards = await validatorRewards.getPendingRewards(signer.address);
    console.log(`Remaining Pending Rewards: ${hre.ethers.formatEther(remainingRewards)} CVT`);

    // Parse events
    const claimEvent = receipt.logs.find(log => {
      try {
        const parsed = validatorRewards.interface.parseLog(log);
        return parsed && parsed.name === "RewardClaimed";
      } catch {
        return false;
      }
    });

    if (claimEvent) {
      const parsed = validatorRewards.interface.parseLog(claimEvent);
      console.log("\n📋 Claim Event Details:");
      console.log(`  Validator: ${parsed.args.validator}`);
      console.log(`  Amount: ${hre.ethers.formatEther(parsed.args.amount)} CVT`);
    }

    // Calculate value at current price ($0.50)
    const usdValue = Number(hre.ethers.formatEther(claimed)) * 0.5;
    console.log(`\n💵 Value: $${usdValue.toFixed(2)} USD (at $0.50/CVT)`);

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                    🎉 Success! 🎉                             ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");

    console.log("\n🔗 Useful Links:");
    console.log(`  Your Address: https://explorer.sepolia.mantle.xyz/address/${signer.address}`);
    console.log(`  ValidatorRewards Contract: https://explorer.sepolia.mantle.xyz/address/${deployedAddresses.contracts.ValidatorRewards}`);
    console.log(`  Transaction: https://explorer.sepolia.mantle.xyz/tx/${tx.hash}`);

    console.log("\n💡 Next Steps:");
    console.log("  - View your updated balance in the frontend dashboard");
    console.log("  - Stake your CVT to earn more rewards");
    console.log("  - Continue validating to earn more rewards");
    console.log("  - Check the Validators leaderboard");

  } catch (error) {
    console.error("\n❌ Claim Failed!");
    console.error(`  Error: ${error.message}`);

    if (error.message.includes("No rewards to claim")) {
      console.log("\n⚠️  You have no rewards to claim.");
      console.log("Submit proof verifications first to earn rewards.");
    } else if (error.message.includes("user rejected")) {
      console.log("\n⚠️  Transaction was rejected in your wallet.");
    } else if (error.message.includes("insufficient funds")) {
      console.log("\n⚠️  Insufficient MNT for gas fees.");
      console.log("Get testnet MNT from: https://faucet.sepolia.mantle.xyz");
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

