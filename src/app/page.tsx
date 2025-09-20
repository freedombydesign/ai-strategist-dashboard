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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Business Systemizer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your service delivery workflows into streamlined, repeatable systems. Generate custom templates and export to your favorite platforms.
          </p>
        </div>

        {/* Main CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
              <CogIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Discover Your Business Freedom Score & Systemize Everything
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Take our Freedom Diagnostic to discover your business archetype and get personalized sprint recommendations. Then analyze workflows, generate custom templates, and export to Trello, Asana, ClickUp, Monday.com, and Notion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/diagnostic-assessment"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3 text-lg font-semibold"
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Start Your Business Assessment
            </Link>

            <Link
              href="/diagnostic-assessment"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg inline-flex items-center gap-3"
            >
              <CogIcon className="w-6 h-6" />
              Take Freedom Diagnostic
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <Link
              href="/workflow-analyzer"
              className="text-center border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="text-xs text-gray-600 font-medium">Analyze Workflow</div>
            </Link>
            <Link
              href="/templates"
              className="text-center border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="text-xs text-gray-600 font-medium">Browse Templates</div>
            </Link>
            <Link
              href="/checkin"
              className="text-center border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="text-xs text-gray-600 font-medium">Track Daily Activity</div>
            </Link>
            <Link
              href="/business-metrics"
              className="text-center border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="text-xs text-gray-600 font-medium">View Analytics</div>
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

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Diagnose</h3>
              <p className="text-gray-600">
                Take our 15-question Freedom Diagnostic to discover your business archetype and get personalized recommendations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analyze</h3>
              <p className="text-gray-600">
                Describe your current workflows. Our AI identifies inefficiencies and generates sprint recommendations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Generate</h3>
              <p className="text-gray-600">
                Get customized templates, SOPs, and automation workflows optimized for your business freedom goals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Export</h3>
              <p className="text-gray-600">
                One-click export to Trello, Asana, ClickUp, Monday.com, or Notion. Your team starts using it immediately.
              </p>
            </div>
          </div>
        </div>

        {/* AI Enhanced Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Why We Built This</h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-4xl mx-auto">
            Join service providers using our AI to get back hours per week.
            Built with OpenAI + custom workflow engine.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold mb-2 text-gray-900">The Problem</div>
              <p className="text-gray-600">Service providers spend 60% of their time on operations instead of growth</p>
            </div>
            <div>
              <div className="text-2xl font-bold mb-2 text-gray-900">Our Mission</div>
              <p className="text-gray-600">Use AI to give back 10+ hours/week to every service business founder</p>
            </div>
            <div>
              <div className="text-2xl font-bold mb-2 text-gray-900">The Vision</div>
              <p className="text-gray-600">Every service business running on intelligent, self-optimizing systems</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 mb-4 flex items-center justify-center mx-auto">
              <CogIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Delivery Systemizer</h3>
            <p className="text-gray-600">
              Create comprehensive workflows and standard operating procedures for consistent service delivery
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-100 mb-4 flex items-center justify-center mx-auto">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Template Manager</h3>
            <p className="text-gray-600">
              Generate and customize templates for proposals, onboarding, project management, and more
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-100 mb-4 flex items-center justify-center mx-auto">
              <SparklesIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Export Manager</h3>
            <p className="text-gray-600">
              Export your systems to Trello, Asana, ClickUp, Monday.com, or Notion with one click
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}