'use client'

import { Coins, TrendingUp } from 'lucide-react'

interface StakedBalanceCardProps {
  stakedAmount: number
  availableAmount: number
  apy: number
  pendingRewards: number
}

export function StakedBalanceCard({ stakedAmount, availableAmount, apy, pendingRewards }: StakedBalanceCardProps) {
  const totalAmount = stakedAmount + availableAmount
  const stakedPercentage = (stakedAmount / totalAmount) * 100

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Coins size={20} />
          <span>Staked Balance</span>
        </h3>
        <TrendingUp size={20} className="text-primary-green" />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Staked</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stakedAmount.toLocaleString()} CVT
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
            <div
              className="bg-primary-green h-3 rounded-full transition-all"
              style={{ width: `${stakedPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">APY</p>
            <p className="text-xl font-bold text-primary-green">
              {apy.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Rewards</p>
            <p className="text-xl font-bold text-primary-yellow">
              {pendingRewards.toLocaleString()} CVT
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

