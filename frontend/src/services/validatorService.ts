import { formatUnits } from 'viem';

export interface Validator {
  address: string;
  totalRewards: string;
  pendingRewards: string;
  verifiedProofsCount: number;
  successRate: number;
  reputation: number;
  rank: number;
  isActive: boolean;
  joinedDate: number;
  lastActivityDate: number;
  totalEarnings: string;
  avgRewardPerProof: string;
}

export interface ProofSubmission {
  id: string;
  validator: string;
  projectId: string;
  emissionData: string;
  documentation: string;
  status: 'pending' | 'verified' | 'rejected';
  reward: string;
  submittedAt: number;
  reviewedAt?: number;
  reviewer?: string;
  notes?: string;
}

export interface ValidatorStats {
  totalValidators: number;
  activeValidators: number;
  totalProofsVerified: number;
  totalRewardsDistributed: string;
  averageRewardPerProof: string;
  topValidator: {
    address: string;
    proofCount: number;
  } | null;
}

export interface ValidatorPerformance {
  validator: string;
  dailyProofs: number[];
  weeklyProofs: number[];
  monthlyProofs: number[];
  rewardTrend: number[];
  successRateTrend: number[];
}

const SUBMISSIONS_KEY = 'carbon_vault_proof_submissions';
const VALIDATOR_STATS_KEY = 'carbon_vault_validator_stats';

// Get all submissions from localStorage
export function getSubmissions(): ProofSubmission[] {
  try {
    const stored = localStorage.getItem(SUBMISSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading submissions:', error);
    return [];
  }
}

// Save submissions to localStorage
export function saveSubmissions(submissions: ProofSubmission[]): void {
  try {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Error saving submissions:', error);
  }
}

// Add new proof submission
export function addSubmission(submission: Omit<ProofSubmission, 'id' | 'status' | 'submittedAt'>): ProofSubmission {
  const submissions = getSubmissions();
  
  const newSubmission: ProofSubmission = {
    ...submission,
    id: `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    submittedAt: Date.now(),
  };
  
  submissions.unshift(newSubmission);
  saveSubmissions(submissions);
  
  return newSubmission;
}

// Update submission status
export function updateSubmissionStatus(
  submissionId: string,
  status: 'verified' | 'rejected',
  reward?: string,
  notes?: string
): boolean {
  const submissions = getSubmissions();
  const submission = submissions.find(s => s.id === submissionId);
  
  if (!submission) return false;
  
  submission.status = status;
  submission.reviewedAt = Date.now();
  if (reward) submission.reward = reward;
  if (notes) submission.notes = notes;
  
  saveSubmissions(submissions);
  return true;
}

// Get submissions by validator
export function getSubmissionsByValidator(validatorAddress: string): ProofSubmission[] {
  const submissions = getSubmissions();
  return submissions.filter(s => s.validator.toLowerCase() === validatorAddress.toLowerCase());
}

// Calculate validator statistics
export function calculateValidatorStats(
  validatorAddress: string,
  verifiedCount: number,
  pendingRewards: string
): {
  verifiedProofs: number;
  pendingProofs: number;
  rejectedProofs: number;
  successRate: number;
  totalEarned: string;
} {
  const submissions = getSubmissionsByValidator(validatorAddress);
  
  const verified = submissions.filter(s => s.status === 'verified').length;
  const pending = submissions.filter(s => s.status === 'pending').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  
  const total = verified + rejected;
  const successRate = total > 0 ? (verified / total) * 100 : 0;
  
  const totalEarned = submissions
    .filter(s => s.status === 'verified' && s.reward)
    .reduce((sum, s) => sum + parseFloat(s.reward || '0'), 0);
  
  return {
    verifiedProofs: verified,
    pendingProofs: pending,
    rejectedProofs: rejected,
    successRate,
    totalEarned: totalEarned.toFixed(2),
  };
}

// Calculate validator reputation score (0-100)
export function calculateReputationScore(
  verifiedCount: number,
  successRate: number,
  accountAge: number // in days
): number {
  // Reputation formula:
  // - 40 points for proof count (max at 100 proofs)
  // - 40 points for success rate
  // - 20 points for account age (max at 180 days)
  
  const proofScore = Math.min((verifiedCount / 100) * 40, 40);
  const successScore = (successRate / 100) * 40;
  const ageScore = Math.min((accountAge / 180) * 20, 20);
  
  return Math.round(proofScore + successScore + ageScore);
}

// Generate mock validators for demonstration
export function generateMockValidators(count: number = 10): Validator[] {
  const validators: Validator[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const verifiedCount = Math.floor(Math.random() * 150) + 10;
    const successRate = 70 + Math.random() * 25; // 70-95%
    const accountAgeDays = Math.floor(Math.random() * 200) + 10;
    const pendingRewards = (Math.random() * 50 + 5).toFixed(2);
    const totalEarnings = (verifiedCount * (Math.random() * 2 + 0.5)).toFixed(2);
    
    validators.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      totalRewards: totalEarnings,
      pendingRewards,
      verifiedProofsCount: verifiedCount,
      successRate: parseFloat(successRate.toFixed(1)),
      reputation: calculateReputationScore(verifiedCount, successRate, accountAgeDays),
      rank: i + 1,
      isActive: Math.random() > 0.2,
      joinedDate: now - (accountAgeDays * 24 * 60 * 60 * 1000),
      lastActivityDate: now - (Math.random() * 7 * 24 * 60 * 60 * 1000),
      totalEarnings,
      avgRewardPerProof: (parseFloat(totalEarnings) / verifiedCount).toFixed(2),
    });
  }
  
  // Sort by verified proofs count for ranking
  validators.sort((a, b) => b.verifiedProofsCount - a.verifiedProofsCount);
  validators.forEach((v, i) => v.rank = i + 1);
  
  return validators;
}

// Calculate overall validator statistics
export function calculateGlobalStats(validators: Validator[]): ValidatorStats {
  const activeValidators = validators.filter(v => v.isActive);
  const totalProofs = validators.reduce((sum, v) => sum + v.verifiedProofsCount, 0);
  const totalRewards = validators.reduce((sum, v) => sum + parseFloat(v.totalRewards), 0);
  
  const topValidator = validators.length > 0 ? {
    address: validators[0].address,
    proofCount: validators[0].verifiedProofsCount,
  } : null;
  
  return {
    totalValidators: validators.length,
    activeValidators: activeValidators.length,
    totalProofsVerified: totalProofs,
    totalRewardsDistributed: totalRewards.toFixed(2),
    averageRewardPerProof: totalProofs > 0 ? (totalRewards / totalProofs).toFixed(2) : '0',
    topValidator,
  };
}

// Get validator rank
export function getValidatorRank(validators: Validator[], validatorAddress: string): number {
  const sorted = [...validators].sort((a, b) => b.verifiedProofsCount - a.verifiedProofsCount);
  const index = sorted.findIndex(v => v.address.toLowerCase() === validatorAddress.toLowerCase());
  return index !== -1 ? index + 1 : validators.length + 1;
}

// Calculate performance trend
export function calculatePerformanceTrend(submissions: ProofSubmission[], days: number = 7): number[] {
  const trend: number[] = [];
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i * 24 * 60 * 60 * 1000);
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);
    
    const daySubmissions = submissions.filter(s => 
      s.submittedAt >= dayStart && s.submittedAt < dayEnd
    );
    
    trend.push(daySubmissions.length);
  }
  
  return trend;
}

// Format validator address for display
export function formatValidatorAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Get reputation tier
export function getReputationTier(reputation: number): {
  tier: string;
  color: string;
  icon: string;
} {
  if (reputation >= 90) {
    return { tier: 'Elite', color: 'text-yellow-500', icon: '👑' };
  } else if (reputation >= 75) {
    return { tier: 'Expert', color: 'text-purple-500', icon: '⭐' };
  } else if (reputation >= 60) {
    return { tier: 'Advanced', color: 'text-blue-500', icon: '💎' };
  } else if (reputation >= 40) {
    return { tier: 'Intermediate', color: 'text-green-500', icon: '🌟' };
  } else {
    return { tier: 'Beginner', color: 'text-gray-500', icon: '🌱' };
  }
}

// Calculate time ago
export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Export validator data as CSV
export function exportValidatorsToCSV(validators: Validator[]): void {
  let csvContent = 'Rank,Address,Verified Proofs,Success Rate,Reputation,Pending Rewards,Total Earnings,Avg Reward,Status\n';
  
  validators.forEach(validator => {
    csvContent += `${validator.rank},`;
    csvContent += `${validator.address},`;
    csvContent += `${validator.verifiedProofsCount},`;
    csvContent += `${validator.successRate}%,`;
    csvContent += `${validator.reputation},`;
    csvContent += `${validator.pendingRewards} CVT,`;
    csvContent += `${validator.totalEarnings} CVT,`;
    csvContent += `${validator.avgRewardPerProof} CVT,`;
    csvContent += `${validator.isActive ? 'Active' : 'Inactive'}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `validators_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export submissions as CSV
export function exportSubmissionsToCSV(submissions: ProofSubmission[]): void {
  let csvContent = 'ID,Project ID,Validator,Emission Data,Status,Reward,Submitted At,Reviewed At\n';
  
  submissions.forEach(submission => {
    csvContent += `${submission.id},`;
    csvContent += `${submission.projectId},`;
    csvContent += `${submission.validator},`;
    csvContent += `${submission.emissionData},`;
    csvContent += `${submission.status},`;
    csvContent += `${submission.reward || 'N/A'},`;
    csvContent += `${new Date(submission.submittedAt).toLocaleString()},`;
    csvContent += `${submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleString() : 'Pending'}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `proof_submissions_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Validate proof submission
export function validateProofSubmission(data: {
  projectId: string;
  emissionData: string;
  documentation: string;
}): string | null {
  if (!data.projectId || data.projectId.trim().length === 0) {
    return 'Project ID is required';
  }
  
  if (!data.emissionData || parseFloat(data.emissionData) <= 0) {
    return 'Valid emission data is required';
  }
  
  if (!data.documentation || data.documentation.trim().length < 50) {
    return 'Documentation must be at least 50 characters';
  }
  
  return null;
}

// Calculate estimated reward
export function calculateEstimatedReward(
  emissionData: number,
  rewardPerProof: number
): string {
  // Base reward + bonus for larger emissions
  const baseReward = rewardPerProof;
  const emissionBonus = Math.min(emissionData / 1000, 1) * 0.5; // Max 50% bonus
  
  return (baseReward * (1 + emissionBonus)).toFixed(2);
}

