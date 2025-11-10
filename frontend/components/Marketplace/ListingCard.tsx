'use client'

import { User, Calendar, TrendingUp, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

interface Listing {
  id: number
  seller: string
  amount: number
  price: number
  offsetType: string
  vintageYear: number
  yieldRate: number
}

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const [isBuying, setIsBuying] = useState(false)

  const handleBuy = async () => {
    setIsBuying(true)
    // Simulate purchase
    setTimeout(() => {
      setIsBuying(false)
      alert('Purchase successful!')
    }, 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <User size={16} className="text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {listing.seller}
          </span>
        </div>
        <span className="text-xs px-2 py-1 bg-primary-green text-white rounded-full">
          {listing.offsetType}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {listing.amount.toLocaleString()} CVT
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
          <span className="text-lg font-bold text-primary-blue">
            ${listing.price.toFixed(2)} per CVT
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ${(listing.amount * listing.price).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center space-x-4 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-1">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {listing.vintageYear}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp size={14} className="text-primary-green" />
            <span className="text-xs text-primary-green">
              {listing.yieldRate}% APY
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleBuy}
        disabled={isBuying}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBuying ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <ShoppingCart size={16} />
            <span>Buy Now</span>
          </>
        )}
      </button>
    </div>
  )
}

