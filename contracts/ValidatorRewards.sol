// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ValidatorRewards
 * @dev Contract for distributing rewards to validators who verify ZK proofs
 * Only authorized contracts (like CVTMinting) can submit proof verifications
 */
contract ValidatorRewards is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public cvtToken;
    
    // Mapping of validator addresses to their rewards
    mapping(address => uint256) public rewards;
    
    // Mapping of validator addresses to their total verified proofs count
    mapping(address => uint256) public verifiedProofsCount;
    
    // Authorized contracts that can submit proof verifications
    mapping(address => bool) public authorizedSubmitters;
    
    // Reward rate per proof verification (in CVT tokens)
    uint256 public rewardPerProof;
    
    // Events
    event ProofSubmitted(
        address indexed validator,
        address indexed submitter,
        uint256 reward
    );
    
    event RewardClaimed(address indexed validator, uint256 amount);
    
    event AuthorizedSubmitterUpdated(address indexed submitter, bool authorized);
    
    event RewardPerProofUpdated(uint256 oldRate, uint256 newRate);
    
    /**
     * @dev Constructor
     * @param _cvt Address of CVT token contract
     * @param initialOwner Address of the contract owner
     */
    constructor(
        address _cvt,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_cvt != address(0), "Invalid CVT address");
        cvtToken = IERC20(_cvt);
        rewardPerProof = 1e18; // 1 CVT per proof by default
    }
    
    /**
     * @dev Submit proof verification and reward validator
     * Only authorized contracts (like CVTMinting) can call this
     * @param validator Address of the validator who verified the proof
     */
    function submitProof(address validator) external nonReentrant {
        require(
            authorizedSubmitters[msg.sender] || msg.sender == owner(),
            "Not authorized submitter"
        );
        require(validator != address(0), "Invalid validator address");
        require(rewardPerProof > 0, "Reward rate not set");
        
        // Add reward to validator
        rewards[validator] += rewardPerProof;
        verifiedProofsCount[validator] += 1;
        
        emit ProofSubmitted(validator, msg.sender, rewardPerProof);
    }
    
    /**
     * @dev Batch submit proof verifications
     * @param validators Array of validator addresses
     */
    function batchSubmitProof(address[] calldata validators) external nonReentrant {
        require(
            authorizedSubmitters[msg.sender] || msg.sender == owner(),
            "Not authorized submitter"
        );
        require(rewardPerProof > 0, "Reward rate not set");
        
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i] != address(0)) {
                rewards[validators[i]] += rewardPerProof;
                verifiedProofsCount[validators[i]] += 1;
                
                emit ProofSubmitted(validators[i], msg.sender, rewardPerProof);
            }
        }
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimReward() external nonReentrant {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        rewards[msg.sender] = 0;
        
        // Transfer rewards to validator
        cvtToken.safeTransfer(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Get pending rewards for a validator
     * @param validator Address of the validator
     * @return reward Pending reward amount
     */
    function getPendingRewards(address validator) external view returns (uint256) {
        return rewards[validator];
    }
    
    /**
     * @dev Get total verified proofs count for a validator
     * @param validator Address of the validator
     * @return count Total verified proofs count
     */
    function getVerifiedProofsCount(address validator) external view returns (uint256) {
        return verifiedProofsCount[validator];
    }
    
    /**
     * @dev Set authorized submitter (only owner)
     * @param submitter Address of the contract that can submit proofs
     * @param authorized Whether the submitter is authorized
     */
    function setAuthorizedSubmitter(address submitter, bool authorized) external onlyOwner {
        require(submitter != address(0), "Invalid submitter address");
        authorizedSubmitters[submitter] = authorized;
        emit AuthorizedSubmitterUpdated(submitter, authorized);
    }
    
    /**
     * @dev Set reward per proof (only owner)
     * @param newRate New reward rate per proof (in CVT tokens)
     */
    function setRewardPerProof(uint256 newRate) external onlyOwner {
        uint256 oldRate = rewardPerProof;
        rewardPerProof = newRate;
        emit RewardPerProofUpdated(oldRate, newRate);
    }
    
    /**
     * @dev Fund the contract with CVT tokens for rewards (only owner)
     * @param amount Amount of CVT tokens to fund
     */
    function fundRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        cvtToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}

