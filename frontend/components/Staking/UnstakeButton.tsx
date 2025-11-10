'use client'

import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

interface UnstakeButtonProps {
  stakedAmount: number
}

export function UnstakeButton({ stakedAmount }: UnstakeButtonProps) {
  const [amount, setAmount] = useState('')
  const [isUnstaking, setIsUnstaking] = useState(false)

  const handleUnstake = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setIsUnstaking(true)
    // Simulate unstaking
    setTimeout(() => {
      setIsUnstaking(false)
      setAmount('')
      alert('Unstaking successful!')
    }, 2000)
  }

  const handleMax = () => {
    setAmount(stakedAmount.toString())
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <ArrowUp size={20} />
        <span>Unstake CVT</span>
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              max={stakedAmount}
              className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleMax}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm text-primary-blue hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Staked: {stakedAmount.toLocaleString()} CVT
          </p>
        </div>

        <button
          onClick={handleUnstake}
          disabled={isUnstaking || !amount || parseFloat(amount) <= 0}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUnstaking ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Unstaking...</span>
            </>
          ) : (
            <>
              <ArrowUp size={16} />
              <span>Unstake</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

