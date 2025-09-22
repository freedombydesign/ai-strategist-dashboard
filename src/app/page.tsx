'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Business Systemizer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your service delivery workflows into streamlined, repeatable systems
          </p>
        </div>

        {/* Main CTA Section */}
        <div className="bg-white rounded-lg shadow-sm border p-12 mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Systemize Your Business?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Access your dashboard to view business metrics and take diagnostic assessments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg inline-flex items-center justify-center gap-3"
            >
              Open Dashboard
            </Link>
            <Link
              href="/login"
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg inline-flex items-center justify-center gap-3"
            >
              Start Assessment
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
