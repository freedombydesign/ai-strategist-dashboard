'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CogIcon, DocumentTextIcon, RocketLaunchIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const router = useRouter()
  const [isAISubdomain, setIsAISubdomain] = useState(false)

  useEffect(() => {
    // Check if we're on the ai.scalewithruth.com subdomain
    const hostname = window.location.hostname
    if (hostname === 'ai.scalewithruth.com') {
      setIsAISubdomain(true)
      router.replace('/ai-intelligence')
    }
  }, [router])

  // If we're on the AI subdomain, show loading
  if (isAISubdomain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to AI Intelligence...</p>
        </div>
      </div>
    )
  }

  // For main domain, show Business Systemizer homepage
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header - Enhanced with AI messaging */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Business Systemizer
          </h1>
          <p className="text-2xl font-semibold text-blue-600 mb-4">
            An AI-powered systemization engine for service businesses
          </p>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We use AI to analyze workflows, generate custom SOPs, and export them instantly to your tools.
            Built with OpenAI + custom workflow engine.
          </p>
        </div>

        {/* Main CTA Section - Original structure with startup positioning */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
              <CogIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Try the AI Systemizer Beta – Free for Early Adopters
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join 500+ service providers using our AI to get back 10+ hours per week.
            Unlike static template libraries, our AI diagnoses your workflows and generates tailored sprint plans in minutes.
          </p>

          {/* Traction Metrics */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex justify-center items-center gap-8 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-700">1,200+</div>
                <div className="text-green-600">Workflows Generated</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-700">8 Countries</div>
                <div className="text-green-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-700">12 Hours</div>
                <div className="text-green-600">Avg. Time Saved/Week</div>
              </div>
            </div>
          </div>

          {/* Original button structure with correct links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/service-delivery-systemizer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3 text-lg font-semibold"
            >
              <CogIcon className="w-6 h-6" />
              Start Systemizing
            </Link>

            <Link
              href="/dashboard"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Access Dashboard
            </Link>
          </div>

          {/* Original login/signup section */}
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

        {/* Founder Vision Section - New addition */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 mb-16 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Why We Built This</h2>
            <p className="text-xl mb-8 text-purple-100">
              As service business founders ourselves, we were drowning in operational chaos.
              Every client had different workflows, nothing was documented, and we were working 70+ hour weeks just to keep up.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold mb-2">The Problem</div>
                <p className="text-purple-100">Service providers spend 60% of their time on operations instead of growth</p>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">Our Mission</div>
                <p className="text-purple-100">Use AI to give back 10+ hours/week to every service business founder</p>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">The Vision</div>
                <p className="text-purple-100">Every service business running on intelligent, self-optimizing systems</p>
              </div>
            </div>
          </div>
        </div>

        {/* Original Features Grid - Enhanced with AI emphasis */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 mb-4 flex items-center justify-center mx-auto">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Workflow Analysis</h3>
            <p className="text-gray-600 mb-4">
              Our AI analyzes your current workflows, identifies inefficiencies, and generates custom optimization plans
            </p>
            <div className="text-sm text-blue-600 font-medium">Built with OpenAI GPT-4</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-100 mb-4 flex items-center justify-center mx-auto">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart SOP Generation</h3>
            <p className="text-gray-600 mb-4">
              Generate tailored SOPs, templates, and processes based on your specific business context and industry
            </p>
            <div className="text-sm text-purple-600 font-medium">Custom AI Models</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-100 mb-4 flex items-center justify-center mx-auto">
              <CogIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">One-Click Integration</h3>
            <p className="text-gray-600 mb-4">
              Instantly export your AI-generated systems to Trello, Asana, ClickUp, Monday.com, or Notion
            </p>
            <div className="text-sm text-green-600 font-medium">API Automation</div>
          </div>
        </div>
      </div>
    </div>
  )
}