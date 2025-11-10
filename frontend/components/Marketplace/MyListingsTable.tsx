'use client'

import { Edit, X, CheckCircle } from 'lucide-react'
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

interface MyListingsTableProps {
  listings: Listing[]
}

export function MyListingsTable({ listings }: MyListingsTableProps) {
  const [cancelling, setCancelling] = useState<number | null>(null)

  const handleCancel = async (id: number) => {
    setCancelling(id)
    // Simulate cancellation
    setTimeout(() => {
      setCancelling(null)
      alert('Listing cancelled successfully!')
    }, 2000)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Price
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Type
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr
              key={listing.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {listing.amount.toLocaleString()} CVT
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-900 dark:text-white">
                  ${listing.price.toFixed(2)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {listing.offsetType}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="flex items-center space-x-1 text-sm text-primary-green">
                  <CheckCircle size={14} />
                  <span>Active</span>
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-primary-blue hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleCancel(listing.id)}
                    disabled={cancelling === listing.id}
                    className="p-1 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
                  >
                    {cancelling === listing.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

