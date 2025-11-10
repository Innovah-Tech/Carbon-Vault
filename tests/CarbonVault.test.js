const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonVault", function () {
  let carbonVault;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const CarbonVault = await ethers.getContractFactory("CarbonVault");
    carbonVault = await CarbonVault.deploy(
      "CarbonVault Token",
      "CVT",
      owner.address
    );
    
    await carbonVault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await carbonVault.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await carbonVault.name()).to.equal("CarbonVault Token");
      expect(await carbonVault.symbol()).to.equal("CVT");
    });
  });

  describe("Asset Tokenization", function () {
    it("Should tokenize an asset", async function () {
      const assetType = "carbon_credit";
      const amount = ethers.parseEther("1000");
      const metadata = "QmHash123";

      await expect(
        carbonVault.connect(addr1).tokenizeAsset(assetType, amount, metadata)
      )
        .to.emit(carbonVault, "AssetTokenized")
        .withArgs(1, assetType, amount, addr1.address);

      const asset = await carbonVault.getAsset(1);
      expect(asset.assetType).to.equal(assetType);
      expect(asset.amount).to.equal(amount);
      expect(asset.issuer).to.equal(addr1.address);
      expect(asset.verified).to.be.false;
      expect(asset.active).to.be.true;
    });

    it("Should mint tokens when asset is tokenized", async function () {
      const amount = ethers.parseEther("1000");
      
      await carbonVault.connect(addr1).tokenizeAsset(
        "carbon_credit",
        amount,
        "metadata"
      );

      expect(await carbonVault.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should reject tokenization with zero amount", async function () {
      await expect(
        carbonVault.connect(addr1).tokenizeAsset(
          "carbon_credit",
          0,
          "metadata"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Asset Verification", function () {
    it("Should verify an asset", async function () {
      const amount = ethers.parseEther("1000");
      
      await carbonVault.connect(addr1).tokenizeAsset(
        "carbon_credit",
        amount,
        "metadata"
      );

      await expect(carbonVault.connect(owner).verifyAsset(1))
        .to.emit(carbonVault, "AssetVerified")
        .withArgs(1, true);

      const asset = await carbonVault.getAsset(1);
      expect(asset.verified).to.be.true;
    });

    it("Should reject verification by non-owner", async function () {
      await carbonVault.connect(addr1).tokenizeAsset(
        "carbon_credit",
        ethers.parseEther("1000"),
        "metadata"
      );

      await expect(
        carbonVault.connect(addr1).verifyAsset(1)
      ).to.be.revertedWithCustomError(carbonVault, "OwnableUnauthorizedAccount");
    });
  });

  describe("ZK Proof Recording", function () {
    it("Should record a ZK proof", async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("test_proof"));

      await expect(
        carbonVault.connect(addr1).recordZKProof(proofHash)
      )
        .to.emit(carbonVault, "ZKProofVerified")
        .withArgs(proofHash, addr1.address);

      expect(await carbonVault.verifiedProofs(proofHash)).to.be.true;
    });
  });
});

