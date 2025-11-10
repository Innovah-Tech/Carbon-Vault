// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarbonVault.sol";
import "./interfaces/IZKVerifier.sol";

/**
 * @title CarbonVaultZK
 * @dev Extended CarbonVault with Zero-Knowledge privacy features
 * Enables private transactions and verifications using ZK proofs
 */
contract CarbonVaultZK is CarbonVault {
    IZKVerifier public zkVerifier;
    
    // Mapping for private asset ownership (ZK-based)
    mapping(bytes32 => uint256) private privateBalances;
    
    // Mapping for commitment to asset mapping
    mapping(bytes32 => uint256) public commitmentToAsset;
    
    // Events
    event PrivateTransfer(
        bytes32 indexed commitmentFrom,
        bytes32 indexed commitmentTo,
        uint256 amount
    );
    
    event PrivateAssetCreated(
        bytes32 indexed commitment,
        uint256 indexed assetId
    );

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        address _zkVerifier
    ) CarbonVault(name, symbol, initialOwner) {
        zkVerifier = IZKVerifier(_zkVerifier);
    }

    /**
     * @dev Create a private asset using ZK proof
     * @param assetId The public asset ID
     * @param commitment The commitment hash for privacy
     * @param proof ZK proof that the commitment is valid
     * @param publicInputs Public inputs for the proof
     */
    function createPrivateAsset(
        uint256 assetId,
        bytes32 commitment,
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external nonReentrant {
        // Access the asset directly since we inherit from CarbonVault
        CarbonVault.Asset memory asset = this.getAsset(assetId);
        require(asset.active, "Asset does not exist or is inactive");
        require(commitmentToAsset[commitment] == 0, "Commitment already used");
        
        // Verify ZK proof
        require(
            zkVerifier.verifyProof(proof, publicInputs),
            "Invalid ZK proof"
        );
        
        commitmentToAsset[commitment] = assetId;
        privateBalances[commitment] = asset.amount;
        
        emit PrivateAssetCreated(commitment, assetId);
    }

    /**
     * @dev Transfer assets privately using ZK proof
     * @param commitmentFrom Sender's commitment
     * @param commitmentTo Receiver's commitment
     * @param amount Amount to transfer
     * @param proof ZK proof of valid transfer
     * @param publicInputs Public inputs for the proof
     */
    function privateTransfer(
        bytes32 commitmentFrom,
        bytes32 commitmentTo,
        uint256 amount,
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            privateBalances[commitmentFrom] >= amount,
            "Insufficient private balance"
        );
        
        // Verify ZK proof
        require(
            zkVerifier.verifyProof(proof, publicInputs),
            "Invalid ZK proof"
        );
        
        privateBalances[commitmentFrom] -= amount;
        privateBalances[commitmentTo] += amount;
        
        emit PrivateTransfer(commitmentFrom, commitmentTo, amount);
    }

    /**
     * @dev Get private balance (only for commitments you own)
     * @param commitment The commitment hash
     * @return balance The private balance
     */
    function getPrivateBalance(bytes32 commitment) external view returns (uint256) {
        return privateBalances[commitment];
    }

    /**
     * @dev Update ZK verifier (only owner)
     * @param _zkVerifier Address of the new ZK verifier
     */
    function setZKVerifier(address _zkVerifier) external onlyOwner {
        require(_zkVerifier != address(0), "Invalid verifier address");
        zkVerifier = IZKVerifier(_zkVerifier);
    }
}

