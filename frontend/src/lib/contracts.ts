// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  CVTMinting: '0xc5645f895a48c8A572368AaFeaAb2D42d1203819',
  CVTStaking: '0x80bBdD4D4606DF5Ba6561e4B9C4a59B49061f713',
  CVTMarketplace: '0x290C258b604a3Cda5014B004ffe9c92Ab22D0F1c',
  ValidatorRewards: '0x647F8C626a90b5b8D4A69723bB672C759DD8A027',
} as const

// ERC20 ABI (for CVT token)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// CVT Staking ABI
export const CVT_STAKING_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'stakes',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'lastClaimTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'rewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'staker', type: 'address' }],
    name: 'getPendingRewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldRatePerSecond',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimYield',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// CVT Marketplace ABI
export const CVT_MARKETPLACE_ABI = [
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'listings',
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'listingCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Validator Rewards ABI
export const VALIDATOR_REWARDS_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'rewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

