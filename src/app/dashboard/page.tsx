'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  ChartBarIcon,
  TrophyIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export default function SimpleDashboard() {
  const { user, signOut, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Business Systemizer Dashboard</h1>
              <p className="text-purple-200">Welcome back{user?.email ? `, ${user.email}` : ''}!</p>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <CogIcon className="w-4 h-4" />
                <span>Home</span>
              </Link>

              {user && (
                <button
                  onClick={signOut}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/service-delivery-systemizer"
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-purple-200">Workflow Analyzer</h3>
                <p className="text-purple-300">Optimize your workflows</p>
              </div>
            </div>
          </Link>

          <Link
            href="/template-manager"
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-indigo-200">Templates</h3>
                <p className="text-indigo-300">Manage workflow templates</p>
              </div>
            </div>
          </Link>

          <Link
            href="/export-manager"
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <RocketLaunchIcon className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-violet-200">Export Manager</h3>
                <p className="text-violet-300">Export to platforms</p>
              </div>
            </div>
          </Link>

          <Link
            href="/workflow-analytics"
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-teal-200">Workflow Analytics</h3>
                <p className="text-teal-300">Track optimization metrics</p>
              </div>
            </div>
          </Link>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Achievements</h3>
                <p className="text-amber-300">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Settings</h3>
                <p className="text-gray-300">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl text-green-400 mb-2">✅</div>
              <h3 className="text-lg font-semibold text-white">Database</h3>
              <p className="text-green-300">Connected</p>
            </div>
            <div className="text-center">
              <div className="text-3xl text-purple-400 mb-2">⚙️</div>
              <h3 className="text-lg font-semibold text-white">Workflows</h3>
              <p className="text-purple-300">Ready</p>
            </div>
            <div className="text-center">
              <div className="text-3xl text-blue-400 mb-2">🚀</div>
              <h3 className="text-lg font-semibold text-white">Export System</h3>
              <p className="text-blue-300">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}