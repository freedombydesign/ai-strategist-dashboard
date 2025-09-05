'use client'

import Link from 'next/link'

export default function DeliverEasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🚀 DeliverEase</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">94% Health</span>
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
            <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
            <p className="text-2xl font-semibold text-gray-900">8</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">On-Time Delivery</h3>
            <p className="text-2xl font-semibold text-green-600">94%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Client Satisfaction</h3>
            <p className="text-2xl font-semibold text-gray-900">4.8/5</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Team Efficiency</h3>
            <p className="text-2xl font-semibold text-gray-900">87%</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-green-600 text-xl mr-3">✅</span>
            <div>
              <h3 className="text-sm font-medium text-green-800">DeliverEase is operational!</h3>
              <p className="mt-2 text-sm text-green-700">
                Client delivery system active with ClickUp project management, Google Drive file storage, and Slack communication integration.
                Configure your CLICKUP_API_TOKEN, GOOGLE credentials, and SLACK_BOT_TOKEN for live data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}