// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title CVTStaking
 * @dev Staking contract for CVT tokens with yield distribution
 * Stake CVTs, earn yield distributed by protocol or marketplace fees
 */
contract CVTStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public cvtToken;
    
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaimed;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public pendingRewards;
    
    // Total staked amount
    uint256 public totalStaked;
    
    // Yield distribution settings
    uint256 public yieldPerSecond; // Yield per second per token (in wei)
    uint256 public lastUpdateTime;
    
    // Authorized distributors (can distribute yield)
    mapping(address => bool) public authorizedDistributors;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);
    event YieldDistributed(address indexed distributor, uint256 totalAmount);
    event YieldRateUpdated(uint256 oldRate, uint256 newRate);
    event DistributorUpdated(address indexed distributor, bool authorized);
    
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
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Stake CVT tokens
     * @param amount Amount of CVT tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate pending rewards before updating stake
        _updateRewards(msg.sender);
        
        // Transfer tokens from user to contract
        cvtToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].stakedAt = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake CVT tokens
     * @param amount Amount of CVT tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Calculate pending rewards before updating stake
        _updateRewards(msg.sender);
        
        // Update stake info
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        cvtToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim pending yield rewards
     */
    function claimYield() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        pendingRewards[msg.sender] = 0;
        stakes[msg.sender].lastRewardClaimed = block.timestamp;
        
        // Transfer rewards to user
        cvtToken.safeTransfer(msg.sender, reward);
        
        emit YieldClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Distribute yield to stakers (only authorized distributors)
     * @param stakers Array of staker addresses
     * @param yields Array of yield amounts to distribute
     */
    function distributeYield(
        address[] calldata stakers,
        uint256[] calldata yields
    ) external nonReentrant {
        require(
            authorizedDistributors[msg.sender] || msg.sender == owner(),
            "Not authorized distributor"
        );
        require(stakers.length == yields.length, "Array length mismatch");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < stakers.length; i++) {
            if (stakes[stakers[i]].amount > 0) {
                pendingRewards[stakers[i]] += yields[i];
                totalAmount += yields[i];
            }
        }
        
        // Transfer total yield amount from distributor to contract
        if (totalAmount > 0) {
            cvtToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        }
        
        emit YieldDistributed(msg.sender, totalAmount);
    }
    
    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @return reward Pending reward amount
     */
    function getPendingRewards(address user) external view returns (uint256) {
        uint256 reward = pendingRewards[user];
        
        // Calculate additional rewards based on time and yield rate
        if (stakes[user].amount > 0 && yieldPerSecond > 0) {
            uint256 timeSinceLastClaim = block.timestamp - stakes[user].lastRewardClaimed;
            reward += (stakes[user].amount * yieldPerSecond * timeSinceLastClaim) / 1e18;
        }
        
        return reward;
    }
    
    /**
     * @dev Get total staked amount for a user
     * @param user Address of the user
     * @return amount Total staked amount
     */
    function getUserStake(address user) external view returns (uint256) {
        return stakes[user].amount;
    }
    
    /**
     * @dev Update rewards for a user (internal)
     * @param user Address of the user
     */
    function _updateRewards(address user) internal {
        if (stakes[user].amount > 0 && yieldPerSecond > 0) {
            uint256 timeSinceLastClaim = block.timestamp - stakes[user].lastRewardClaimed;
            uint256 additionalReward = (stakes[user].amount * yieldPerSecond * timeSinceLastClaim) / 1e18;
            pendingRewards[user] += additionalReward;
        }
        stakes[user].lastRewardClaimed = block.timestamp;
    }
    
    /**
     * @dev Set yield rate per second (only owner)
     * @param newRate New yield rate per second per token (in wei)
     */
    function setYieldRate(uint256 newRate) external onlyOwner {
        uint256 oldRate = yieldPerSecond;
        yieldPerSecond = newRate;
        lastUpdateTime = block.timestamp;
        emit YieldRateUpdated(oldRate, newRate);
    }
    
    /**
     * @dev Set authorized distributor (only owner)
     * @param distributor Address of the distributor
     * @param authorized Whether the distributor is authorized
     */
    function setAuthorizedDistributor(address distributor, bool authorized) external onlyOwner {
        require(distributor != address(0), "Invalid distributor address");
        authorizedDistributors[distributor] = authorized;
        emit DistributorUpdated(distributor, authorized);
    }
}

