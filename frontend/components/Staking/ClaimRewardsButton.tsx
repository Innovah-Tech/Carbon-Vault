'use client'

import { Gift } from 'lucide-react'
import { useState } from 'react'

interface ClaimRewardsButtonProps {
  pendingRewards: number
}

export function ClaimRewardsButton({ pendingRewards }: ClaimRewardsButtonProps) {
  const [isClaiming, setIsClaiming] = useState(false)

  const handleClaim = async () => {
    if (pendingRewards <= 0) return
    setIsClaiming(true)
    // Simulate claim
    setTimeout(() => {
      setIsClaiming(false)
      alert('Rewards claimed successfully!')
    }, 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Gift size={20} />
          <span>Pending Rewards</span>
        </h3>
        <span className="text-2xl font-bold text-primary-yellow">
          {pendingRewards.toLocaleString()} CVT
        </span>
      </div>

      <button
        onClick={handleClaim}
        disabled={isClaiming || pendingRewards <= 0}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-yellow text-white rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isClaiming ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Claiming...</span>
          </>
        ) : (
          <>
            <Gift size={16} />
            <span>Claim Rewards</span>
          </>
        )}
      </button>
    </div>
  )
}

