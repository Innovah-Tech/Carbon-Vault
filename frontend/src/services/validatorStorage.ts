// Validator storage service for managing validator data
// This bridges the gap between on-chain data (which doesn't store all validators)
// and the leaderboard UI (which needs a list of all validators)

const VALIDATORS_STORAGE_KEY = 'carbon_vault_validators';
const VALIDATOR_ACTIVITY_KEY = 'carbon_vault_validator_activity';

export interface ValidatorData {
  address: string;
  verifiedProofsCount: number;
  totalRewards: string;
  pendingRewards: string;
  lastUpdated: number;
  firstSeen: number;
}

export interface ValidatorActivity {
  address: string;
  timestamp: number;
  action: 'proof_verified' | 'reward_claimed' | 'connected';
  proofCount?: number;
  rewardAmount?: string;
}

// Get all stored validators
export function getStoredValidators(): ValidatorData[] {
  try {
    const stored = localStorage.getItem(VALIDATORS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading validators from storage:', error);
    return [];
  }
}

// Save validators to storage
function saveValidators(validators: ValidatorData[]): void {
  try {
    localStorage.setItem(VALIDATORS_STORAGE_KEY, JSON.stringify(validators));
  } catch (error) {
    console.error('Error saving validators to storage:', error);
  }
}

// Update or add a validator
export function updateValidator(
  address: string,
  verifiedProofsCount: number,
  totalRewards: string,
  pendingRewards: string
): void {
  const validators = getStoredValidators();
  const existingIndex = validators.findIndex(v => v.address.toLowerCase() === address.toLowerCase());
  
  const now = Date.now();
  
  if (existingIndex >= 0) {
    // Update existing validator
    validators[existingIndex] = {
      ...validators[existingIndex],
      verifiedProofsCount,
      totalRewards,
      pendingRewards,
      lastUpdated: now,
    };
  } else {
    // Add new validator
    validators.push({
      address,
      verifiedProofsCount,
      totalRewards,
      pendingRewards,
      lastUpdated: now,
      firstSeen: now,
    });
  }
  
  saveValidators(validators);
  
  // Log activity
  logValidatorActivity({
    address,
    timestamp: now,
    action: 'proof_verified',
    proofCount: verifiedProofsCount,
  });
}

// Get validator activity log
export function getValidatorActivity(): ValidatorActivity[] {
  try {
    const stored = localStorage.getItem(VALIDATOR_ACTIVITY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading validator activity:', error);
    return [];
  }
}

// Log validator activity
export function logValidatorActivity(activity: ValidatorActivity): void {
  try {
    const activities = getValidatorActivity();
    activities.unshift(activity); // Add to beginning
    
    // Keep only last 1000 activities
    const trimmed = activities.slice(0, 1000);
    
    localStorage.setItem(VALIDATOR_ACTIVITY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error logging validator activity:', error);
  }
}

// Get leaderboard data sorted by various criteria
export function getLeaderboardData(sortBy: 'proofs' | 'rewards' | 'recent' = 'proofs'): ValidatorData[] {
  const validators = getStoredValidators();
  
  const sorted = [...validators].sort((a, b) => {
    switch (sortBy) {
      case 'proofs':
        return b.verifiedProofsCount - a.verifiedProofsCount;
      case 'rewards':
        return parseFloat(b.totalRewards) - parseFloat(a.totalRewards);
      case 'recent':
        return b.lastUpdated - a.lastUpdated;
      default:
        return b.verifiedProofsCount - a.verifiedProofsCount;
    }
  });
  
  return sorted;
}

// Calculate validator statistics
export function calculateValidatorMetrics(validator: ValidatorData) {
  const avgRewardPerProof = validator.verifiedProofsCount > 0
    ? (parseFloat(validator.totalRewards) / validator.verifiedProofsCount).toFixed(2)
    : '0';
  
  const daysSinceJoined = Math.floor((Date.now() - validator.firstSeen) / (1000 * 60 * 60 * 24));
  const proofsPerDay = daysSinceJoined > 0
    ? (validator.verifiedProofsCount / daysSinceJoined).toFixed(2)
    : validator.verifiedProofsCount.toFixed(2);
  
  // Calculate reputation score (0-100)
  const proofScore = Math.min(50, validator.verifiedProofsCount * 0.5); // Max 50 points
  const rewardScore = Math.min(30, parseFloat(validator.totalRewards) * 0.3); // Max 30 points
  const activityScore = Math.min(20, Math.max(0, 20 - (daysSinceJoined * 0.1))); // Max 20 points, decreases over time
  
  const reputation = Math.round(proofScore + rewardScore + activityScore);
  
  return {
    avgRewardPerProof,
    proofsPerDay,
    reputation,
    daysSinceJoined,
    isActive: (Date.now() - validator.lastUpdated) < (7 * 24 * 60 * 60 * 1000), // Active if updated in last 7 days
  };
}

// Get validator rank
export function getValidatorRank(address: string): number {
  const leaderboard = getLeaderboardData('proofs');
  const index = leaderboard.findIndex(v => v.address.toLowerCase() === address.toLowerCase());
  return index >= 0 ? index + 1 : -1;
}

// Initialize with connected wallet
export function registerValidator(address: string): void {
  const validators = getStoredValidators();
  const existing = validators.find(v => v.address.toLowerCase() === address.toLowerCase());
  
  if (!existing) {
    const now = Date.now();
    validators.push({
      address,
      verifiedProofsCount: 0,
      totalRewards: '0',
      pendingRewards: '0',
      lastUpdated: now,
      firstSeen: now,
    });
    saveValidators(validators);
    
    logValidatorActivity({
      address,
      timestamp: now,
      action: 'connected',
    });
  }
}

// Clear all validator data (for testing/reset)
export function clearValidatorData(): void {
  localStorage.removeItem(VALIDATORS_STORAGE_KEY);
  localStorage.removeItem(VALIDATOR_ACTIVITY_KEY);
}

// Get global statistics
export function getGlobalValidatorStats() {
  const validators = getStoredValidators();
  const metrics = validators.map(calculateValidatorMetrics);
  
  const totalValidators = validators.length;
  const activeValidators = metrics.filter(m => m.isActive).length;
  const totalProofs = validators.reduce((sum, v) => sum + v.verifiedProofsCount, 0);
  const totalRewards = validators.reduce((sum, v) => sum + parseFloat(v.totalRewards), 0);
  const avgRewardPerValidator = totalValidators > 0 ? (totalRewards / totalValidators).toFixed(2) : '0';
  const avgProofsPerValidator = totalValidators > 0 ? (totalProofs / totalValidators).toFixed(0) : '0';
  
  return {
    totalValidators,
    activeValidators,
    totalProofs,
    totalRewards: totalRewards.toFixed(2),
    avgRewardPerValidator,
    avgProofsPerValidator,
  };
}

