'use client'

import { MainLayout } from '@/components/Layout/MainLayout'
import { MarketplaceFilters } from '@/components/Marketplace/MarketplaceFilters'
import { ListingCard } from '@/components/Marketplace/ListingCard'
import { MyListingsTable } from '@/components/Marketplace/MyListingsTable'
import { useState } from 'react'

// Mock data
const mockListings = [
  {
    id: 1,
    seller: '0x1234...5678',
    amount: 1000,
    price: 1.5,
    offsetType: 'Carbon Credit',
    vintageYear: 2023,
    yieldRate: 5.5,
  },
  {
    id: 2,
    seller: '0xabcd...efgh',
    amount: 500,
    price: 1.8,
    offsetType: 'Renewable Energy',
    vintageYear: 2024,
    yieldRate: 6.2,
  },
]

export default function MarketplacePage() {
  const [filters, setFilters] = useState({
    offsetType: '',
    vintageYear: '',
    minYield: '',
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Buy, sell, or list CVT tokens
          </p>
        </div>

        <MarketplaceFilters filters={filters} onFiltersChange={setFilters} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            My Listings
          </h2>
          <MyListingsTable listings={mockListings} />
        </div>
      </div>
    </MainLayout>
  )
}

