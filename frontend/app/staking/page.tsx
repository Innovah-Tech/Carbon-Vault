'use client'

import { MainLayout } from '@/components/Layout/MainLayout'
import { StakingInput } from '@/components/Staking/StakingInput'
import { StakedBalanceCard } from '@/components/Staking/StakedBalanceCard'
import { ClaimRewardsButton } from '@/components/Staking/ClaimRewardsButton'
import { UnstakeButton } from '@/components/Staking/UnstakeButton'
import { useAccount } from 'wagmi'

// Mock data
const mockStaking = {
  stakedAmount: 5000,
  availableAmount: 5000,
  apy: 5.5,
  pendingRewards: 125,
}

export default function StakingPage() {
  const { isConnected } = useAccount()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Staking & Yield
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stake CVTs and earn rewards
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StakedBalanceCard {...mockStaking} />
          
          <div className="space-y-4">
            <StakingInput availableAmount={mockStaking.availableAmount} />
            <ClaimRewardsButton pendingRewards={mockStaking.pendingRewards} />
            <UnstakeButton stakedAmount={mockStaking.stakedAmount} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Staking Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Staked Balance</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {mockStaking.stakedAmount.toLocaleString()} CVT
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-4">
              <div
                className="bg-primary-green h-4 rounded-full transition-all"
                style={{ width: `${(mockStaking.stakedAmount / (mockStaking.stakedAmount + mockStaking.availableAmount)) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Staked: {mockStaking.stakedAmount.toLocaleString()} CVT</span>
              <span>Available: {mockStaking.availableAmount.toLocaleString()} CVT</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

