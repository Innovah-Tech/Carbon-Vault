// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ValidatorRewardsV2
 * @dev Enhanced validator rewards contract with staking requirement
 * Validators must stake 500 CVT to participate and earn rewards
 */
contract ValidatorRewardsV2 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public cvtToken;
    
    // Staking requirement to become a validator
    uint256 public constant VALIDATOR_STAKE_REQUIRED = 500 * 10**18; // 500 CVT
    
    // Validator struct
    struct Validator {
        uint256 stakedAmount;
        uint256 rewards;
        uint256 verifiedProofsCount;
        uint256 stakedAt;
        bool isActive;
    }
    
    // Mapping of validator addresses to their data
    mapping(address => Validator) public validators;
    
    // Array of all validator addresses
    address[] public validatorAddresses;
    
    // Authorized contracts that can submit proof verifications
    mapping(address => bool) public authorizedSubmitters;
    
    // Reward rate per proof verification (in CVT tokens)
    uint256 public rewardPerProof;
    
    // Total staked by all validators
    uint256 public totalStaked;
    
    // Events
    event ValidatorRegistered(address indexed validator, uint256 amount);
    event ValidatorUnregistered(address indexed validator, uint256 amount);
    event ProofSubmitted(
        address indexed validator,
        address indexed submitter,
        uint256 reward
    );
    event RewardClaimed(address indexed validator, uint256 amount);
    event AuthorizedSubmitterUpdated(address indexed submitter, bool authorized);
    event RewardPerProofUpdated(uint256 oldRate, uint256 newRate);
    event StakeIncreased(address indexed validator, uint256 amount, uint256 newTotal);
    
    /**
     * @dev Constructor
     * @param _cvt Address of CVT token contract
     */
    constructor(
        address _cvt
    ) Ownable(msg.sender) {
        require(_cvt != address(0), "Invalid CVT address");
        cvtToken = IERC20(_cvt);
        rewardPerProof = 1e18; // 1 CVT per proof by default
    }
    
    /**
     * @dev Register as a validator by staking 500 CVT
     */
    function registerValidator() external nonReentrant {
        require(validators[msg.sender].stakedAmount == 0, "Already registered");
        require(
            cvtToken.balanceOf(msg.sender) >= VALIDATOR_STAKE_REQUIRED,
            "Insufficient CVT balance"
        );
        
        // Transfer stake to contract
        cvtToken.safeTransferFrom(msg.sender, address(this), VALIDATOR_STAKE_REQUIRED);
        
        // Register validator
        validators[msg.sender] = Validator({
            stakedAmount: VALIDATOR_STAKE_REQUIRED,
            rewards: 0,
            verifiedProofsCount: 0,
            stakedAt: block.timestamp,
            isActive: true
        });
        
        validatorAddresses.push(msg.sender);
        totalStaked += VALIDATOR_STAKE_REQUIRED;
        
        emit ValidatorRegistered(msg.sender, VALIDATOR_STAKE_REQUIRED);
    }
    
    /**
     * @dev Increase stake (optional, for higher reputation)
     */
    function increaseStake(uint256 amount) external nonReentrant {
        require(validators[msg.sender].isActive, "Not a registered validator");
        require(amount > 0, "Amount must be greater than 0");
        
        cvtToken.safeTransferFrom(msg.sender, address(this), amount);
        
        validators[msg.sender].stakedAmount += amount;
        totalStaked += amount;
        
        emit StakeIncreased(msg.sender, amount, validators[msg.sender].stakedAmount);
    }
    
    /**
     * @dev Unregister as validator and withdraw stake
     * Can only withdraw if no pending rewards
     */
    function unregisterValidator() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        require(validator.isActive, "Not a registered validator");
        require(validator.rewards == 0, "Claim rewards first");
        
        uint256 stakeToReturn = validator.stakedAmount;
        
        // Mark as inactive
        validator.isActive = false;
        validator.stakedAmount = 0;
        totalStaked -= stakeToReturn;
        
        // Return stake
        cvtToken.safeTransfer(msg.sender, stakeToReturn);
        
        emit ValidatorUnregistered(msg.sender, stakeToReturn);
    }
    
    /**
     * @dev Submit proof verification and reward validator
     * Only authorized contracts or owner can call this
     * @param validatorAddress Address of the validator who verified the proof
     */
    function submitProof(address validatorAddress) external nonReentrant {
        require(
            authorizedSubmitters[msg.sender] || msg.sender == owner(),
            "Not authorized submitter"
        );
        require(validatorAddress != address(0), "Invalid validator address");
        require(validators[validatorAddress].isActive, "Validator not active");
        require(rewardPerProof > 0, "Reward rate not set");
        
        // Add reward to validator
        validators[validatorAddress].rewards += rewardPerProof;
        validators[validatorAddress].verifiedProofsCount += 1;
        
        emit ProofSubmitted(validatorAddress, msg.sender, rewardPerProof);
    }
    
    /**
     * @dev Batch submit proof verifications
     * @param validatorAddressList Array of validator addresses
     */
    function batchSubmitProof(address[] calldata validatorAddressList) external nonReentrant {
        require(
            authorizedSubmitters[msg.sender] || msg.sender == owner(),
            "Not authorized submitter"
        );
        require(rewardPerProof > 0, "Reward rate not set");
        
        for (uint256 i = 0; i < validatorAddressList.length; i++) {
            address validatorAddress = validatorAddressList[i];
            if (validatorAddress != address(0) && validators[validatorAddress].isActive) {
                validators[validatorAddress].rewards += rewardPerProof;
                validators[validatorAddress].verifiedProofsCount += 1;
                
                emit ProofSubmitted(validatorAddress, msg.sender, rewardPerProof);
            }
        }
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimReward() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        require(validator.isActive, "Not a registered validator");
        require(validator.rewards > 0, "No rewards to claim");
        
        uint256 reward = validator.rewards;
        validator.rewards = 0;
        
        // Transfer rewards to validator
        cvtToken.safeTransfer(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Get validator info
     * @param validatorAddress Address of the validator
     */
    function getValidator(address validatorAddress) external view returns (
        uint256 stakedAmount,
        uint256 rewards,
        uint256 verifiedProofsCount,
        uint256 stakedAt,
        bool isActive
    ) {
        Validator memory validator = validators[validatorAddress];
        return (
            validator.stakedAmount,
            validator.rewards,
            validator.verifiedProofsCount,
            validator.stakedAt,
            validator.isActive
        );
    }
    
    /**
     * @dev Get pending rewards for a validator
     * @param validatorAddress Address of the validator
     * @return reward Pending reward amount
     */
    function getPendingRewards(address validatorAddress) external view returns (uint256) {
        return validators[validatorAddress].rewards;
    }
    
    /**
     * @dev Get total verified proofs count for a validator
     * @param validatorAddress Address of the validator
     * @return count Total verified proofs count
     */
    function getVerifiedProofsCount(address validatorAddress) external view returns (uint256) {
        return validators[validatorAddress].verifiedProofsCount;
    }
    
    /**
     * @dev Check if address is an active validator
     * @param validatorAddress Address to check
     */
    function isValidator(address validatorAddress) external view returns (bool) {
        return validators[validatorAddress].isActive;
    }
    
    /**
     * @dev Get total number of validators
     */
    function getTotalValidators() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < validatorAddresses.length; i++) {
            if (validators[validatorAddresses[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Get all active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active validators
        for (uint256 i = 0; i < validatorAddresses.length; i++) {
            if (validators[validatorAddresses[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active validators
        address[] memory active = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < validatorAddresses.length; i++) {
            if (validators[validatorAddresses[i]].isActive) {
                active[index] = validatorAddresses[i];
                index++;
            }
        }
        
        return active;
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
    
    /**
     * @dev Emergency withdraw (only owner) - for stuck funds
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        cvtToken.safeTransfer(owner(), amount);
    }
}

