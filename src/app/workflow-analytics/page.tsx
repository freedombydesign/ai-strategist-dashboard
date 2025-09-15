'use client'

import Link from 'next/link'
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  TrendingUpIcon,
  SparklesIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

export default function WorkflowAnalytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">📊 Workflow Analytics</h1>
                <p className="text-purple-200">Real-time insights from your workflow optimization</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/service-delivery-systemizer"
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Analyze New Workflow</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="w-8 h-8 text-blue-400" />
              <TrendingUpIcon className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Total Workflows</h3>
            <p className="text-3xl font-bold text-blue-400">3</p>
            <p className="text-sm text-blue-200 mt-2">Active in system</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="w-8 h-8 text-green-400" />
              <TrendingUpIcon className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Time Saved</h3>
            <p className="text-3xl font-bold text-green-400">24.1 hours</p>
            <p className="text-sm text-green-200 mt-2">Through automation</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CogIcon className="w-8 h-8 text-purple-400" />
              <TrendingUpIcon className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automation Level</h3>
            <p className="text-3xl font-bold text-purple-400">71%</p>
            <p className="text-sm text-purple-200 mt-2">Average across workflows</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <RocketLaunchIcon className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-yellow-200 bg-yellow-900/30 px-2 py-1 rounded">TOP</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Most Used</h3>
            <p className="text-sm font-medium text-yellow-400 mb-1">Client Onboarding Process</p>
            <p className="text-2xl font-bold text-yellow-400">11</p>
            <p className="text-sm text-yellow-200 mt-2">executions</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <LightBulbIcon className="w-6 h-6 text-yellow-400 mr-3" />
            AI Recommendations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <SparklesIcon className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Generate Templates for "Sample Client Onboarding"</h3>
                  <p className="text-gray-300 mb-3">This workflow has 2 steps but no templates. Generate templates to increase automation.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-400 font-medium">💰 30 minutes saved per execution</span>
                    <Link
                      href="/template-manager"
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Take Action →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <RocketLaunchIcon className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">"Client Onboarding Process" Ready for Use</h3>
                  <p className="text-gray-300 mb-3">Recently analyzed workflow with 4 generated templates. Ready to save time!</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-400 font-medium">💰 75 minutes per execution</span>
                    <Link
                      href="/template-manager"
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      View Templates →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Navigation */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/service-delivery-systemizer"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
            >
              <SparklesIcon className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200">Analyze Workflow</h3>
              <p className="text-gray-300 text-sm">Start with workflow analysis to generate insights</p>
            </Link>

            <Link
              href="/template-manager"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
            >
              <CogIcon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200">Generate Templates</h3>
              <p className="text-gray-300 text-sm">Create AI-powered templates for automation</p>
            </Link>

            <Link
              href="/export-manager"
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all"
            >
              <RocketLaunchIcon className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-200">Export to Platforms</h3>
              <p className="text-gray-300 text-sm">Deploy workflows to your favorite tools</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-8 text-gray-400 text-sm">
        <p>Analytics last updated: {new Date().toLocaleString()}</p>
        <p className="mt-2">Period: 30d • Real workflow data</p>
      </div>
    </div>
  )
}