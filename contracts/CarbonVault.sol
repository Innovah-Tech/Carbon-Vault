// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CarbonVault
 * @dev Main contract for tokenizing Real World Assets (RWA) with carbon credits
 * Built on Mantle Network with ZK privacy features
 */
contract CarbonVault is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    // Asset structure for RWA tokenization
    struct Asset {
        uint256 assetId;
        string assetType; // e.g., "carbon_credit", "commodity"
        uint256 amount;
        string metadata; // IPFS hash or JSON string
        address issuer;
        uint256 timestamp;
        bool verified;
        bool active;
    }

    // Mapping of asset IDs to Asset structs
    mapping(uint256 => Asset) public assets;
    
    // Mapping of asset type to total supply
    mapping(string => uint256) public assetTypeSupply;
    
    // Counter for asset IDs
    uint256 private _assetIdCounter;
    
    // ZK proof verification (placeholder for future ZK integration)
    mapping(bytes32 => bool) public verifiedProofs;
    
    // Events
    event AssetTokenized(
        uint256 indexed assetId,
        string assetType,
        uint256 amount,
        address indexed issuer
    );
    
    event AssetVerified(
        uint256 indexed assetId,
        bool verified
    );
    
    event ZKProofVerified(
        bytes32 indexed proofHash,
        address indexed verifier
    );

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Initialize with zero supply
    }

    /**
     * @dev Tokenize a Real World Asset
     * @param assetType Type of asset (e.g., "carbon_credit")
     * @param amount Amount to tokenize
     * @param metadata Metadata hash or JSON string
     */
    function tokenizeAsset(
        string memory assetType,
        uint256 amount,
        string memory metadata
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(assetType).length > 0, "Asset type cannot be empty");
        
        _assetIdCounter++;
        uint256 assetId = _assetIdCounter;
        
        assets[assetId] = Asset({
            assetId: assetId,
            assetType: assetType,
            amount: amount,
            metadata: metadata,
            issuer: msg.sender,
            timestamp: block.timestamp,
            verified: false,
            active: true
        });
        
        assetTypeSupply[assetType] += amount;
        
        // Mint tokens representing the asset
        _mint(msg.sender, amount);
        
        emit AssetTokenized(assetId, assetType, amount, msg.sender);
        
        return assetId;
    }

    /**
     * @dev Verify an asset (only owner)
     * @param assetId ID of the asset to verify
     */
    function verifyAsset(uint256 assetId) external onlyOwner {
        require(assets[assetId].active, "Asset does not exist or is inactive");
        require(!assets[assetId].verified, "Asset already verified");
        
        assets[assetId].verified = true;
        
        emit AssetVerified(assetId, true);
    }

    /**
     * @dev Record a verified ZK proof (placeholder for ZK integration)
     * @param proofHash Hash of the ZK proof
     */
    function recordZKProof(bytes32 proofHash) external {
        require(!verifiedProofs[proofHash], "Proof already verified");
        
        verifiedProofs[proofHash] = true;
        
        emit ZKProofVerified(proofHash, msg.sender);
    }

    /**
     * @dev Get asset details
     * @param assetId ID of the asset
     */
    function getAsset(uint256 assetId) external view returns (Asset memory) {
        return assets[assetId];
    }

    /**
     * @dev Get total assets count
     */
    function getTotalAssets() external view returns (uint256) {
        return _assetIdCounter;
    }

    /**
     * @dev Deactivate an asset (only owner)
     * @param assetId ID of the asset to deactivate
     */
    function deactivateAsset(uint256 assetId) external onlyOwner {
        require(assets[assetId].active, "Asset already inactive");
        
        assets[assetId].active = false;
    }
}

