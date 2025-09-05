'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SystemStackPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  const [systems, setSystems] = useState([
    {
      id: 1,
      name: 'Client Onboarding',
      category: 'Operations',
      processes: 12,
      completion: 94,
      lastUpdated: '2 days ago',
      owner: 'Sarah M.',
      status: 'active',
      impact: 'high'
    },
    {
      id: 2,
      name: 'Sales Pipeline',
      category: 'Revenue',
      processes: 8,
      completion: 87,
      lastUpdated: '1 week ago',
      owner: 'Mike R.',
      status: 'active',
      impact: 'critical'
    },
    {
      id: 3,
      name: 'Quality Assurance',
      category: 'Delivery',
      processes: 15,
      completion: 92,
      lastUpdated: '3 days ago',
      owner: 'Lisa K.',
      status: 'active',
      impact: 'high'
    },
    {
      id: 4,
      name: 'Financial Controls',
      category: 'Finance',
      processes: 6,
      completion: 89,
      lastUpdated: '1 day ago',
      owner: 'David L.',
      status: 'updating',
      impact: 'critical'
    },
    {
      id: 5,
      name: 'Team Management',
      category: 'HR',
      processes: 10,
      completion: 83,
      lastUpdated: '5 days ago',
      owner: 'Emma T.',
      status: 'needs-review',
      impact: 'medium'
    }
  ])

  const [processes, setProcesses] = useState([
    { id: 1, name: 'Initial Discovery Call', system: 'Client Onboarding', steps: 8, avgTime: '45 min', compliance: 98 },
    { id: 2, name: 'Proposal Creation', system: 'Sales Pipeline', steps: 12, avgTime: '2 hours', compliance: 94 },
    { id: 3, name: 'Contract Review', system: 'Client Onboarding', steps: 6, avgTime: '30 min', compliance: 97 },
    { id: 4, name: 'Project Kickoff', system: 'Client Onboarding', steps: 10, avgTime: '90 min', compliance: 96 },
    { id: 5, name: 'Deliverable Review', system: 'Quality Assurance', steps: 9, avgTime: '60 min', compliance: 92 },
    { id: 6, name: 'Invoice Processing', system: 'Financial Controls', steps: 7, avgTime: '20 min', compliance: 99 },
    { id: 7, name: 'Client Check-in', system: 'Client Onboarding', steps: 5, avgTime: '25 min', compliance: 89 },
    { id: 8, name: 'Performance Review', system: 'Team Management', steps: 11, avgTime: '75 min', compliance: 85 }
  ])

  const [metrics, setMetrics] = useState({
    totalSystems: 5,
    totalProcesses: 51,
    avgCompliance: 94,
    systemsUpdated: 3,
    processesOptimized: 12,
    timeReduction: 23,
    errorReduction: 67,
    healthScore: 88
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'updating': return 'bg-yellow-100 text-yellow-800'
      case 'needs-review': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'critical': return 'text-red-600 font-bold'
      case 'high': return 'text-orange-600 font-semibold'
      case 'medium': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">📚 SystemStack</h1>
              <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                {metrics.healthScore}% Health
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                ← Dashboard
              </Link>
              <Link
                href="https://suite.scalewithruth.com"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🏢 Full Suite
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'systems', name: 'System Library' },
              { id: 'processes', name: 'Active Processes' },
              { id: 'optimization', name: 'Optimization' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Systems</p>
                    <p className="text-2xl font-semibold text-gray-900">{metrics.totalSystems}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">⚙</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Processes</p>
                    <p className="text-2xl font-semibold text-gray-900">{metrics.totalProcesses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">✓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Compliance</p>
                    <p className="text-2xl font-semibold text-green-600">{metrics.avgCompliance}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">⚡</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Time Saved</p>
                    <p className="text-2xl font-semibold text-green-600">{metrics.timeReduction}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 System Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Process Compliance</span>
                    <span className="text-sm font-medium text-green-600">{metrics.avgCompliance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${metrics.avgCompliance}%` }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">System Health</span>
                    <span className="text-sm font-medium text-orange-600">{metrics.healthScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${metrics.healthScore}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Optimization Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{metrics.timeReduction}%</div>
                    <div className="text-sm text-gray-600">Time Reduction</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.errorReduction}%</div>
                    <div className="text-sm text-gray-600">Error Reduction</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{metrics.processesOptimized}</div>
                    <div className="text-sm text-gray-600">Processes Optimized</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{metrics.systemsUpdated}</div>
                    <div className="text-sm text-gray-600">Systems Updated</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Systems Tab */}
        {activeTab === 'systems' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Business Systems</h3>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                + Add System
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {systems.map((system) => (
                    <tr key={system.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{system.name}</div>
                          <div className={`text-sm ${getImpactColor(system.impact)}`}>
                            {system.impact} impact
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{system.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{system.processes}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">{system.completion}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{system.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(system.status)}`}>
                          {system.status.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Processes Tab */}
        {activeTab === 'processes' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Process Library</h3>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                + Add Process
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steps</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processes.map((process) => (
                    <tr key={process.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {process.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.system}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.steps}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.avgTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          process.compliance >= 95 ? 'text-green-600' :
                          process.compliance >= 90 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {process.compliance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ System Optimization Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  📊 Analyze Process Bottlenecks
                </button>
                <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
                  ⚡ Automate Manual Steps
                </button>
                <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                  📋 Generate Process Templates
                </button>
                <button className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors">
                  📈 Performance Benchmarking
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Optimization Recommendations</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50">
                  <h4 className="font-semibold text-gray-900">Team Management System Needs Review</h4>
                  <p className="text-sm text-gray-600 mt-1">Performance review process at 85% compliance - below target. Consider template updates.</p>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-green-400 bg-green-50">
                  <h4 className="font-semibold text-gray-900">Client Onboarding Performing Well</h4>
                  <p className="text-sm text-gray-600 mt-1">94% completion rate with consistent execution. Consider this as template for other systems.</p>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                  <h4 className="font-semibold text-gray-900">Automation Opportunity Identified</h4>
                  <p className="text-sm text-gray-600 mt-1">Invoice processing could be 40% faster with automation - implement workflow triggers.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-green-600 text-xl mr-3">✅</span>
            <div>
              <h3 className="text-sm font-medium text-green-800">SystemStack is operational!</h3>
              <p className="mt-2 text-sm text-green-700">
                Process documentation system managing {metrics.totalSystems} business systems with {metrics.totalProcesses} active processes at {metrics.avgCompliance}% average compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}