'use client'

import { Wallet, Coins, TrendingUp } from 'lucide-react'
import { useAccount } from 'wagmi'

interface HoldingsCardProps {
  totalCVT: number
  stakedCVT: number
  availableCVT: number
}

export function HoldingsCard({ totalCVT, stakedCVT, availableCVT }: HoldingsCardProps) {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Connect your wallet to view holdings
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Wallet size={20} />
          <span>CVT Holdings</span>
        </h3>
        <TrendingUp size={20} className="text-primary-green" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Coins size={16} className="text-primary-blue" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total CVT</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {totalCVT.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Coins size={16} className="text-primary-green" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Staked CVT</span>
          </div>
          <span className="text-lg font-bold text-primary-green">
            {stakedCVT.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wallet size={16} className="text-primary-yellow" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Available CVT</span>
          </div>
          <span className="text-lg font-bold text-primary-yellow">
            {availableCVT.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

