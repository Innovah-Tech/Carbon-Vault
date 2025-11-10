'use client'

import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

