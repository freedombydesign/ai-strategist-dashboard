'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

export default function Dashboard() {
  const [activeView, setActiveView] = useState('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [theme, setTheme] = useState('light')

  // Apply theme changes
  const applyTheme = (newTheme: string) => {
    console.log('[THEME] Applying theme:', newTheme)
    setTheme(newTheme)

    if (newTheme === 'dark') {
      console.log('[THEME] Setting dark theme')
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#1f2937'
      document.body.style.color = '#f9fafb'
    } else if (newTheme === 'light') {
      console.log('[THEME] Setting light theme')
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#1f2937'
    } else if (newTheme === 'auto') {
      console.log('[THEME] Setting auto theme')
      // System preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      console.log('[THEME] System prefers dark mode:', isDarkMode)
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
        document.body.style.backgroundColor = '#1f2937'
        document.body.style.color = '#f9fafb'
      } else {
        document.documentElement.classList.remove('dark')
        document.body.style.backgroundColor = '#ffffff'
        document.body.style.color = '#1f2937'
      }
    }

    // Save to localStorage
    localStorage.setItem('dashboard-theme', newTheme)
    console.log('[THEME] Theme saved to localStorage:', newTheme)
  }
  const router = useRouter()
  const { user, signOut } = useAuth()

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'light'
    console.log('[THEME] Loading saved theme on mount:', savedTheme)
    setTheme(savedTheme)

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#1f2937'
      document.body.style.color = '#f9fafb'
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#1f2937'
    } else if (savedTheme === 'auto') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
        document.body.style.backgroundColor = '#1f2937'
        document.body.style.color = '#f9fafb'
      } else {
        document.documentElement.classList.remove('dark')
        document.body.style.backgroundColor = '#ffffff'
        document.body.style.color = '#1f2937'
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleExport = () => {
    // Export functionality
    const data = {
      freedomScore: 78,
      goals: ['Reduce Hours', 'Increase Revenue', 'Delegate Tasks'],
      metrics: { hours: 42.5, revenue: 68500, team: 5 }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dashboard-data.json'
    a.click()
  }

  const handleSettings = () => {
    console.log('[SETTINGS] Opening settings panel')
    setShowSettings(true)
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-br from-purple-50 via-white to-indigo-50 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`border-b px-6 py-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Executive Dashboard</h1>
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>Your business freedom metrics at a glance</p>
            </div>

            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleExport}
              >
                📊 Export
              </button>
              <button
                className="px-4 py-2 btn-gradient-gold text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                onClick={handleSettings}
              >
                ⚙️ Settings
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className={`border-b px-6 py-4 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto flex gap-4 flex-wrap">
            <button
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/')}
            >
              🏠 Home
            </button>
            <button
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/diagnostic-assessment')}
            >
              📋 Take Assessment
            </button>
            <button
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/achievements')}
            >
              🎯 Manage Goals
            </button>
            <button
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/executive-intelligence')}
            >
              💡 View Insights
            </button>
            <button
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/workflow-analytics')}
            >
              📊 Analytics
            </button>
            <button
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => router.push('/ai-strategist')}
            >
              🤖 AI Business Advisor
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Freedom Score Card */}
            <div className={`lg:col-span-2 border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Freedom Score</h3>
              <div className="flex items-baseline justify-center mb-6">
                <div className="text-6xl font-bold text-gray-900">78</div>
                <div className="text-lg text-gray-600 ml-2">/ 100</div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-1000" style={{width: '78%'}}></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Time Freedom</span>
                  <span className="font-semibold text-gray-900">82</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Money Freedom</span>
                  <span className="font-semibold text-gray-900">75</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Systems Freedom</span>
                  <span className="font-semibold text-gray-900">71</span>
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Activity</h3>
              <div className="h-48">
                <div className="flex items-end justify-between h-40 mb-4">
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '60%'}}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '80%'}}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '45%'}}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '90%'}}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '70%'}}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '85%'}}></div>
                  <div className="w-8 bg-gradient-to-t from-purple-600 to-blue-600 rounded-t transition-all duration-700" style={{height: '65%'}}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Additional Cards */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Goals</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Reduce Hours</div>
                    <div className="text-xs text-gray-600">Target: 35 hrs/week</div>
                  </div>
                  <div className="font-semibold text-purple-600">78%</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Increase Revenue</div>
                    <div className="text-xs text-gray-600">Target: $75K/month</div>
                  </div>
                  <div className="font-semibold text-purple-600">83%</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">42.5h</div>
                  <div className="text-xs text-gray-600">Hours This Week</div>
                  <div className="text-xs font-medium text-red-600">-12.5%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">$68.5K</div>
                  <div className="text-xs text-gray-600">Monthly Revenue</div>
                  <div className="text-xs font-medium text-green-600">+8.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowSettings(false)} />
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-2xl w-11/12 max-w-md max-h-4/5 overflow-hidden z-51 ${
            theme === 'dark'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex justify-between items-center p-6 border-b ${
              theme === 'dark'
                ? 'border-gray-700'
                : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Dashboard Settings</h3>
              <button
                className={`text-lg hover:opacity-75 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`}
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-80 overflow-y-auto">
              <div className="mb-5">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Theme</label>
                <select
                  className={`w-full p-2 border rounded-md text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                  value={theme}
                  onChange={(e) => applyTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Refresh Rate</label>
                <select className={`w-full p-2 border rounded-md text-sm ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <option value="30">Every 30 seconds</option>
                  <option value="60">Every minute</option>
                  <option value="300">Every 5 minutes</option>
                </select>
              </div>

              <div className="mb-5">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Notifications</label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <input type="checkbox" defaultChecked className="rounded" /> Goal reminders
                  </label>
                  <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <input type="checkbox" defaultChecked className="rounded" /> Insight alerts
                  </label>
                  <label className={`flex items-center gap-2 text-sm cursor-pointer ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <input type="checkbox" className="rounded" /> Weekly reports
                  </label>
                </div>
              </div>
            </div>

            <div className={`flex justify-end gap-3 p-5 border-t ${
              theme === 'dark'
                ? 'border-gray-700'
                : 'border-gray-200'
            }`}>
              <button
                className={`px-4 py-2 border rounded-md text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 btn-gradient-gold text-white rounded-md text-sm hover:shadow-lg transition-all"
                onClick={() => setShowSettings(false)}
              >
                Save Settings
              </button>
            </div>
          </div>
        </>
      )}
    </ProtectedRoute>
  )
}