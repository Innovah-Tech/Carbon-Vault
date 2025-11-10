'use client'

import { Search, Filter } from 'lucide-react'

interface Filters {
  offsetType: string
  vintageYear: string
  minYield: string
}

interface MarketplaceFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function MarketplaceFilters({ filters, onFiltersChange }: MarketplaceFiltersProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center space-x-2 mb-4">
        <Filter size={20} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={filters.offsetType}
          onChange={(e) => handleChange('offsetType', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Offset Types</option>
          <option value="carbon-credit">Carbon Credit</option>
          <option value="renewable-energy">Renewable Energy</option>
          <option value="forestry">Forestry</option>
        </select>

        <select
          value={filters.vintageYear}
          onChange={(e) => handleChange('vintageYear', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Years</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>

        <input
          type="number"
          placeholder="Min Yield %"
          value={filters.minYield}
          onChange={(e) => handleChange('minYield', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  )
}

