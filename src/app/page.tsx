'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Strategist Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Remove yourself as the bottleneck. Get focused Sprints, AI-generated 
            assets, and step-by-step guidance to scale your service business.
          </p>
        </div>

        {/* Main CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Remove Your Biggest Bottleneck?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the Freedom Score™ diagnostic to identify your constraint and get your personalized Sprint plan.
          </p>
          
          <Link 
            href="/diagnostic"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-lg transition-colors"
          >
            Start Freedom Score™ Diagnostic
          </Link>
          
          <div className="mt-6 space-x-4">
            <Link 
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign In
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Create Account
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Dashboard →
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4">Freedom Score Assessment</h3>
            <p className="text-gray-600">
              12-question diagnostic to identify your biggest business bottlenecks
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4">Personalized Sprints</h3>
            <p className="text-gray-600">
              7-10 day action plans with daily 10-minute tasks to remove bottlenecks
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4">AI Strategist</h3>
            <p className="text-gray-600">
              24/7 business coach trained on proven frameworks to guide your growth
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}