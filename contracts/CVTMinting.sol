// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IZKVerifier.sol";
import "./ValidatorRewards.sol";

/**
 * @title CVTMinting
 * @dev Mint CarbonVault Tokens (CVT) only if verified by ZK proof
 * Supports ERC-20 and can be extended to NFT-wrapped CVTs for fractionalization
 */
contract CVTMinting is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    IZKVerifier public zkVerifier;
    ValidatorRewards public validatorRewards;
    
    // Mapping to track minted amounts per commitment to prevent double minting
    mapping(bytes32 => bool) public mintedCommitments;
    
    // Mapping to track minted amounts per project
    mapping(string => uint256) public projectMintedAmounts;
    
    // Mapping to track validator for each proof verification
    mapping(bytes32 => address) public proofValidators;
    
    // Events
    event CVTMinted(
        address indexed to,
        uint256 amount,
        bytes32 indexed commitment,
        string projectId
    );
    
    event ZKVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    
    /**
     * @dev Constructor
     * @param _verifier Address of the ZK verifier contract
     * @param _validatorRewards Address of the ValidatorRewards contract (optional)
     * @param initialOwner Address of the contract owner
     */
    constructor(
        address _verifier,
        address _validatorRewards,
        address initialOwner
    ) ERC20("CarbonVault Token", "CVT") Ownable(initialOwner) {
        require(_verifier != address(0), "Invalid verifier address");
        zkVerifier = IZKVerifier(_verifier);
        if (_validatorRewards != address(0)) {
            validatorRewards = ValidatorRewards(_validatorRewards);
        }
    }
    
    /**
     * @dev Mint CVT tokens after ZK proof verification
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param proof ZK proof bytes
     * @param publicInputs Public inputs for the proof
     * @param commitment Commitment hash to prevent double minting
     * @param projectId Project identifier
     * @param validator Address of the validator who verified the proof (optional)
     */
    function mintCVT(
        address to,
        uint256 amount,
        bytes calldata proof,
        uint256[] calldata publicInputs,
        bytes32 commitment,
        string memory projectId,
        address validator
    ) external nonReentrant {
        _mintCVT(to, amount, proof, publicInputs, commitment, projectId, validator);
    }
    
    /**
     * @dev Batch mint CVT tokens (for multiple proofs)
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     * @param proofs Array of ZK proofs
     * @param publicInputsArray Array of public inputs arrays
     * @param commitments Array of commitment hashes
     * @param projectIds Array of project identifiers
     * @param validators Array of validator addresses (optional)
     */
    function batchMintCVT(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes[] calldata proofs,
        uint256[][] calldata publicInputsArray,
        bytes32[] calldata commitments,
        string[] memory projectIds,
        address[] calldata validators
    ) external nonReentrant {
        require(
            recipients.length == amounts.length &&
            amounts.length == proofs.length &&
            proofs.length == publicInputsArray.length &&
            publicInputsArray.length == commitments.length &&
            commitments.length == projectIds.length &&
            projectIds.length == validators.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mintCVT(
                recipients[i],
                amounts[i],
                proofs[i],
                publicInputsArray[i],
                commitments[i],
                projectIds[i],
                validators[i]
            );
        }
    }
    
    /**
     * @dev Internal mint function
     */
    function _mintCVT(
        address to,
        uint256 amount,
        bytes calldata proof,
        uint256[] calldata publicInputs,
        bytes32 commitment,
        string memory projectId,
        address validator
    ) internal {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(!mintedCommitments[commitment], "Commitment already used");
        require(publicInputs.length >= 5, "Invalid public inputs length");
        
        // Verify ZK proof
        require(
            zkVerifier.verifyProof(proof, publicInputs),
            "Invalid ZK proof"
        );
        
        // Verify commitment matches public input
        require(
            publicInputs[0] == uint256(commitment),
            "Commitment mismatch"
        );
        
        // Mark commitment as used
        mintedCommitments[commitment] = true;
        
        // Track validator if provided
        if (validator != address(0)) {
            proofValidators[commitment] = validator;
        }
        
        // Track project minted amounts
        projectMintedAmounts[projectId] += amount;
        
        // Mint tokens
        _mint(to, amount);
        
        // Reward validator if ValidatorRewards contract is set
        if (address(validatorRewards) != address(0) && validator != address(0)) {
            validatorRewards.submitProof(validator);
        }
        
        emit CVTMinted(to, amount, commitment, projectId);
    }
    
    /**
     * @dev Set ValidatorRewards contract (only owner)
     * @param _validatorRewards Address of the ValidatorRewards contract
     */
    function setValidatorRewards(address _validatorRewards) external onlyOwner {
        validatorRewards = ValidatorRewards(_validatorRewards);
    }
    
    /**
     * @dev Update ZK verifier (only owner)
     * @param _verifier Address of the new verifier contract
     */
    function setZKVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        address oldVerifier = address(zkVerifier);
        zkVerifier = IZKVerifier(_verifier);
        emit ZKVerifierUpdated(oldVerifier, _verifier);
    }
    
    /**
     * @dev Get minted amount for a project
     * @param projectId Project identifier
     * @return amount Total minted amount for the project
     */
    function getProjectMintedAmount(string memory projectId) external view returns (uint256) {
        return projectMintedAmounts[projectId];
    }
    
    /**
     * @dev Check if a commitment has been used
     * @param commitment Commitment hash
     * @return used Whether the commitment has been used
     */
    function isCommitmentUsed(bytes32 commitment) external view returns (bool) {
        return mintedCommitments[commitment];
    }
}

