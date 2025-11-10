'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun, Wifi, WifiOff } from 'lucide-react'
import { useAccount, useNetwork } from 'wagmi'
import clsx from 'clsx'

export function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const { isConnected } = useAccount()
  const { chain } = useNetwork()

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            CarbonVault
          </h1>
          
          {/* Network Status */}
          <div className="flex items-center space-x-2">
            {isConnected && chain ? (
              <>
                <Wifi size={16} className="text-primary-green" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {chain.name}
                </span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">Not Connected</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-primary-yellow" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>

          {/* Wallet Connect */}
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}

