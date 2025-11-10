'use client'

import { ArrowUpRight, ArrowDownLeft, Coins, Clock, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'

export interface Transaction {
  id: number
  type: 'purchase' | 'sale' | 'stake' | 'unstake' | 'reward' | 'mint'
  amount: number
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

interface TransactionsTableProps {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
      case 'mint':
        return <ArrowDownLeft size={16} className="text-primary-green" />
      case 'sale':
      case 'unstake':
        return <ArrowUpRight size={16} className="text-primary-yellow" />
      case 'stake':
      case 'reward':
        return <Coins size={16} className="text-primary-blue" />
      default:
        return <Coins size={16} />
    }
  }

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
      case 'mint':
        return 'text-primary-green'
      case 'sale':
      case 'unstake':
        return 'text-primary-yellow'
      case 'stake':
      case 'reward':
        return 'text-primary-blue'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-primary-green" />
      case 'pending':
        return <Clock size={16} className="text-primary-yellow" />
      case 'failed':
        return <XCircle size={16} className="text-red-500" />
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Type
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(tx.type)}
                  <span className={clsx('font-medium capitalize', getTypeColor(tx.type))}>
                    {tx.type}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {tx.amount.toLocaleString()} CVT
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {tx.timestamp.toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(tx.status)}
                  <span className="text-sm capitalize">{tx.status}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

