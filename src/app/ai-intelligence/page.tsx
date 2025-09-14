'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AIIntelligencePage() {
  const [activeSystem, setActiveSystem] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-3xl font-bold text-white">AI Executive Intelligence</h1>
              <p className="text-blue-200">Strategic AI-Powered Business Command Center</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/freedom-suite"
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                ← Back to Systems
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Intelligence Overview */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Executive AI Command Center</h2>
            <p className="text-blue-200 text-lg mb-6 max-w-2xl mx-auto">
              Access advanced AI intelligence systems designed for strategic business leadership and operational excellence.
            </p>
          </div>
        </div>

        {/* AI Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Strategic Advisor AI</h3>
            <p className="text-blue-200 text-sm mb-4">AI-powered strategic guidance and business intelligence</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Executive Analytics</h3>
            <p className="text-blue-200 text-sm mb-4">Real-time business intelligence and performance metrics</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Beta
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Decision Engine</h3>
            <p className="text-blue-200 text-sm mb-4">AI-assisted decision making and scenario analysis</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Quick Access Panel */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Executive Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/ai-strategist" 
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300"
            >
              <div className="text-white font-medium mb-1">AI Strategist</div>
              <div className="text-blue-200 text-sm">Strategic business consultation</div>
            </Link>

            <Link 
              href="/implementation-coach" 
              className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:from-emerald-600/30 hover:to-teal-600/30 transition-all duration-300"
            >
              <div className="text-white font-medium mb-1">Implementation Coach</div>
              <div className="text-emerald-200 text-sm">Execution guidance and support</div>
            </Link>

            <button className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:from-purple-600/30 hover:to-indigo-600/30 transition-all duration-300 text-left">
              <div className="text-white font-medium mb-1">Executive Briefing</div>
              <div className="text-purple-200 text-sm">Daily intelligence summary</div>
            </button>

            <button className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:from-orange-600/30 hover:to-red-600/30 transition-all duration-300 text-left">
              <div className="text-white font-medium mb-1">Crisis Command</div>
              <div className="text-orange-200 text-sm">Emergency response center</div>
            </button>
          </div>
        </div>

        {/* Intelligence Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">AI Utilization</h4>
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">87%</div>
            <div className="text-green-300 text-sm">Optimal performance range</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Strategic Insights</h4>
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">24</div>
            <div className="text-blue-300 text-sm">This week</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Decision Speed</h4>
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2">2.3x</div>
            <div className="text-purple-300 text-sm">Faster than industry</div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
              <span className="text-white font-medium">Freedom Suite</span>
              <span className="text-green-400 text-sm flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
              <span className="text-white font-medium">DeliverEase</span>
              <span className="text-green-400 text-sm flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Synchronized
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
              <span className="text-white font-medium">Executive APIs</span>
              <span className="text-green-400 text-sm flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}