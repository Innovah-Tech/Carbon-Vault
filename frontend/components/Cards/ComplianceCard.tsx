'use client'

import { FileText, Download, Shield } from 'lucide-react'
import { useState } from 'react'

export function ComplianceCard() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
      // In production, this would generate and download the report
      alert('ESG/ZK Proof Report generated successfully!')
    }, 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Shield size={20} />
          <span>Compliance & Reports</span>
        </h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate ESG compliance reports and ZK proof verification documents for your carbon offset portfolio.
        </p>

        <div className="flex flex-col space-y-2">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText size={16} />
                <span>Generate ESG Report</span>
              </>
            )}
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield size={16} />
            <span>Generate ZK Proof Report</span>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Download size={16} />
            <span>Download previous reports</span>
          </div>
        </div>
      </div>
    </div>
  )
}

