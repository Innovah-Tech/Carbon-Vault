import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import {
  CONTRACT_ADDRESSES,
  ERC20_ABI,
  CVT_STAKING_ABI,
  VALIDATOR_REWARDS_ABI,
} from '@/lib/contracts'

// Hook to get CVT balance
export function useCVTBalance() {
  const { address } = useAccount()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    balance: balance ? formatUnits(balance as bigint, 18) : '0',
    balanceRaw: balance as bigint | undefined,
    isLoading,
    refetch,
  }
}

// Hook to get staking info
export function useStakingInfo() {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.CVTStaking as `0x${string}`,
        abi: CVT_STAKING_ABI,
        functionName: 'stakes',
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.CVTStaking as `0x${string}`,
        abi: CVT_STAKING_ABI,
        functionName: 'getPendingRewards',
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.CVTStaking as `0x${string}`,
        abi: CVT_STAKING_ABI,
        functionName: 'yieldRatePerSecond',
      },
    ],
    query: {
      enabled: !!address,
    },
  })

  const stakes = data?.[0]?.result as [bigint, bigint, bigint] | undefined
  const pendingRewards = data?.[1]?.result as bigint | undefined
  const yieldRate = data?.[2]?.result as bigint | undefined

  return {
    stakedAmount: stakes ? formatUnits(stakes[0], 18) : '0',
    stakedAmountRaw: stakes?.[0],
    startTime: stakes?.[1],
    lastClaimTime: stakes?.[2],
    pendingRewards: pendingRewards ? formatUnits(pendingRewards, 18) : '0',
    pendingRewardsRaw: pendingRewards,
    yieldRate: yieldRate ? formatUnits(yieldRate, 18) : '0',
    yieldRateRaw: yieldRate,
    isLoading,
    refetch,
  }
}

// Hook to get validator rewards
export function useValidatorRewards() {
  const { address } = useAccount()

  const { data: rewards, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
    abi: VALIDATOR_REWARDS_ABI,
    functionName: 'rewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    rewards: rewards ? formatUnits(rewards as bigint, 18) : '0',
    rewardsRaw: rewards as bigint | undefined,
    isLoading,
    refetch,
  }
}

// Hook to calculate APY
export function useCalculateAPY() {
  const { yieldRateRaw } = useStakingInfo()

  if (!yieldRateRaw) return '0'

  // yieldRatePerSecond is in wei, calculate annual percentage
  // APY = (yieldRatePerSecond * seconds_per_year) * 100
  const secondsPerYear = BigInt(365 * 24 * 60 * 60)
  const apy = (yieldRateRaw * secondsPerYear * BigInt(100)) / BigInt(10 ** 18)

  return apy.toString()
}

// Hook to get all dashboard data at once
export function useDashboardData() {
  const { balance, isLoading: balanceLoading } = useCVTBalance()
  const {
    stakedAmount,
    pendingRewards,
    isLoading: stakingLoading,
  } = useStakingInfo()
  const apy = useCalculateAPY()

  const totalHoldings = parseFloat(balance) + parseFloat(stakedAmount)
  const stakedPercentage = totalHoldings > 0 
    ? ((parseFloat(stakedAmount) / totalHoldings) * 100).toFixed(1)
    : '0'

  return {
    totalCVT: totalHoldings.toFixed(2),
    availableCVT: parseFloat(balance).toFixed(2),
    stakedCVT: parseFloat(stakedAmount).toFixed(2),
    stakedPercentage,
    pendingRewards: parseFloat(pendingRewards).toFixed(4),
    apy: parseFloat(apy).toFixed(2),
    isLoading: balanceLoading || stakingLoading,
  }
}

