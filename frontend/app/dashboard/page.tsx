'use client'

import { MainLayout } from '@/components/Layout/MainLayout'
import { HoldingsCard } from '@/components/Cards/HoldingsCard'
import { YieldCard } from '@/components/Cards/YieldCard'
import { ComplianceCard } from '@/components/Cards/ComplianceCard'
import { TransactionsTable } from '@/components/Tables/TransactionsTable'
import { useAccount } from 'wagmi'

// Mock data - replace with actual data from contracts
const mockHoldings = {
  totalCVT: 10000,
  stakedCVT: 5000,
  availableCVT: 5000,
}

const mockYield = {
  currentYield: 250,
  apy: 5.5,
  pendingRewards: 125,
}

const mockTransactions = [
  {
    id: 1,
    type: 'purchase',
    amount: 1000,
    timestamp: new Date('2024-01-15'),
    status: 'completed',
  },
  {
    id: 2,
    type: 'stake',
    amount: 5000,
    timestamp: new Date('2024-01-14'),
    status: 'completed',
  },
  {
    id: 3,
    type: 'reward',
    amount: 125,
    timestamp: new Date('2024-01-13'),
    status: 'completed',
  },
]

export default function DashboardPage() {
  const { isConnected } = useAccount()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Corporate Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your CVT holdings, staking, yield, and compliance reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HoldingsCard {...mockHoldings} />
          <YieldCard {...mockYield} />
          <ComplianceCard />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h2>
          <TransactionsTable transactions={mockTransactions} />
        </div>
      </div>
    </MainLayout>
  )
}

