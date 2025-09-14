'use client'

import NavigationHeader from '../../components/NavigationHeader'
import Link from 'next/link'
import { ChartBarIcon, ClockIcon, DocumentIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

export default function WorkflowAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <NavigationHeader
        title="📊 Workflow Analytics"
        subtitle="Track your workflow optimization and template generation metrics"
      />

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-6">📈</div>
            <h2 className="text-3xl font-bold text-white mb-4">Workflow Analytics</h2>
            <p className="text-purple-200 text-lg mb-8">
              Monitor your workflow optimization progress, template usage, and export statistics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <ChartBarIcon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Workflows Analyzed</h3>
                <p className="text-2xl text-blue-400 font-bold mb-1">0</p>
                <p className="text-gray-300 text-sm">Total workflows processed</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <DocumentIcon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Templates Generated</h3>
                <p className="text-2xl text-purple-400 font-bold mb-1">0</p>
                <p className="text-gray-300 text-sm">AI-generated templates</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Platform Exports</h3>
                <p className="text-2xl text-green-400 font-bold mb-1">0</p>
                <p className="text-gray-300 text-sm">Successful exports</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-purple-300">
                Analytics tracking is coming soon! Start using the system to see your metrics here.
              </p>

              <div className="flex justify-center space-x-4">
                <Link
                  href="/service-delivery-systemizer"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Analyze Workflows
                </Link>

                <Link
                  href="/template-manager"
                  className="border border-purple-600 hover:bg-purple-600/10 text-purple-200 px-6 py-3 rounded-lg transition-colors"
                >
                  View Templates
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
