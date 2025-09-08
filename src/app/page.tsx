'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChartBarIcon, RocketLaunchIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Only run client-side
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase()
      
      // Route based on domain - lightweight routing
      if (hostname.includes('suite.scalewithruth.com')) {
        router.push('/suite')
        return
      } else if (hostname.includes('ai.scalewithruth.com')) {
        router.push('/ai-intelligence')
        return
      }
      
      // Default: show landing page for main domain
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Freedom by Design
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your business with AI-powered strategic guidance
          </p>
        </div>

        {/* Main CTA Section */}
        <div className="bg-white rounded-lg shadow-sm border p-12 mb-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Unlock Your Business Freedom?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the Freedom Score diagnostic to identify your constraints and get personalized strategies.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/assessment"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              <ChartBarIcon className="w-6 h-6" />
              Start Freedom Score Assessment
            </Link>
            
            <Link 
              href="/login"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Access Dashboard
            </Link>
          </div>
          
          <div className="mt-8 flex justify-center items-center gap-4">
            <div className="text-sm text-gray-500">Already have an account?</div>
            <Link 
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign In
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <Link 
              href="/signup"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 mb-4 flex items-center justify-center mx-auto">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Freedom Score Assessment</h3>
            <p className="text-gray-600">
              Strategic diagnostic to identify your business constraints and unlock growth potential
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-100 mb-4 flex items-center justify-center mx-auto">
              <RocketLaunchIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sprint Planning</h3>
            <p className="text-gray-600">
              Strategic sprints with guidance to systematically improve your business
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-100 mb-4 flex items-center justify-center mx-auto">
              <SparklesIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Business Strategist</h3>
            <p className="text-gray-600">
              AI advisor trained on business frameworks to accelerate your growth
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}