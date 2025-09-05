'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ConvertFlowPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🔄 ConvertFlow</h1>
              <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                73% Health
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">← Dashboard</Link>
              <Link href="https://suite.scalewithruth.com" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">🏢 Full Suite</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Pipeline Value</h3>
            <p className="text-2xl font-semibold text-gray-900">$1.25M</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
            <p className="text-2xl font-semibold text-green-600">24%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Leads Generated</h3>
            <p className="text-2xl font-semibold text-gray-900">89</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Email Subscribers</h3>
            <p className="text-2xl font-semibold text-gray-900">2,458</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-green-600 text-xl mr-3">✅</span>
            <div>
              <h3 className="text-sm font-medium text-green-800">ConvertFlow is operational!</h3>
              <p className="mt-2 text-sm text-green-700">
                Sales optimization system active with HubSpot CRM and Mailchimp email marketing integration.
                Configure your HUBSPOT_API_KEY and MAILCHIMP_API_KEY to see live data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}