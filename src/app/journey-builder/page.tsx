'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function JourneyBuilderPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  const [journeys, setJourneys] = useState([
    {
      id: 1,
      name: 'Enterprise Onboarding',
      status: 'active',
      clients: 24,
      conversion: 87,
      avgDuration: '45 days',
      revenue: 580000,
      stages: 8,
      health: 92
    },
    {
      id: 2,
      name: 'SMB Quick Start',
      status: 'active', 
      clients: 67,
      conversion: 73,
      avgDuration: '21 days',
      revenue: 234000,
      stages: 5,
      health: 78
    },
    {
      id: 3,
      name: 'Premium Consulting Path',
      status: 'optimizing',
      clients: 12,
      conversion: 91,
      avgDuration: '90 days',
      revenue: 720000,
      stages: 12,
      health: 89
    }
  ])

  const [stages, setStages] = useState([
    { id: 1, name: 'Discovery Call', conversion: 85, avgTime: '2 days', clients: 45 },
    { id: 2, name: 'Proposal Review', conversion: 78, avgTime: '5 days', clients: 38 },
    { id: 3, name: 'Contract Signing', conversion: 92, avgTime: '3 days', clients: 35 },
    { id: 4, name: 'Onboarding Kickoff', conversion: 96, avgTime: '1 day', clients: 34 },
    { id: 5, name: 'Implementation Phase', conversion: 89, avgTime: '30 days', clients: 33 },
    { id: 6, name: 'First Results Review', conversion: 94, avgTime: '7 days', clients: 31 },
    { id: 7, name: 'Optimization Phase', conversion: 88, avgTime: '14 days', clients: 29 },
    { id: 8, name: 'Success Milestone', conversion: 85, avgTime: '7 days', clients: 26 }
  ])

  const [insights, setInsights] = useState([
    {
      type: 'opportunity',
      title: 'Proposal Review Bottleneck',
      message: 'Stage 2 has 78% conversion - 7% below target. Consider simplifying proposal format.',
      impact: 'high'
    },
    {
      type: 'success',
      title: 'Strong Contract Close Rate', 
      message: 'Stage 3 consistently performing at 92% - excellent trust building in earlier stages.',
      impact: 'positive'
    },
    {
      type: 'warning',
      title: 'Implementation Phase Drop-off',
      message: '4% client loss in implementation. Need better expectation setting.',
      impact: 'medium'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🎯 JourneyBuilder</h1>
              <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                {journeys.length} Active Journeys
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
              { id: 'journeys', name: 'Active Journeys' },
              { id: 'stages', name: 'Stage Analysis' },
              { id: 'optimization', name: 'Optimization' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Clients</p>
                    <p className="text-2xl font-semibold text-gray-900">103</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">%</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Conversion</p>
                    <p className="text-2xl font-semibold text-green-600">83.7%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">⏱</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                    <p className="text-2xl font-semibold text-gray-900">52 days</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">$</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Journey Revenue</p>
                    <p className="text-2xl font-semibold text-green-600">$1.53M</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Journey Insights</h3>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' 
                      ? 'border-green-400 bg-green-50' 
                      : insight.type === 'warning'
                      ? 'border-red-400 bg-red-50'
                      : 'border-yellow-400 bg-yellow-50'
                  }`}>
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active Journeys Tab */}
        {activeTab === 'journeys' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Customer Journeys</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Journey</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {journeys.map((journey) => (
                    <tr key={journey.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{journey.name}</div>
                          <div className="text-sm text-gray-500">{journey.stages} stages</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{journey.clients}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">{journey.conversion}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{journey.avgDuration}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${journey.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          journey.health >= 90 ? 'bg-green-100 text-green-800' :
                          journey.health >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {journey.health}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stage Analysis Tab */}
        {activeTab === 'stages' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Journey Stage Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Clients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stages.map((stage) => (
                    <tr key={stage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          stage.conversion >= 90 ? 'text-green-600' :
                          stage.conversion >= 80 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {stage.conversion}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stage.avgTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stage.clients}</td>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Journey Optimization Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  🔍 Analyze Bottlenecks
                </button>
                <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
                  📊 A/B Test Stages
                </button>
                <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                  🎯 Optimize Conversion
                </button>
                <button className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors">
                  📧 Automate Follow-ups
                </button>
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
              <h3 className="text-sm font-medium text-green-800">JourneyBuilder is operational!</h3>
              <p className="mt-2 text-sm text-green-700">
                Customer journey optimization system actively tracking {journeys.reduce((sum, j) => sum + j.clients, 0)} clients across {journeys.length} journey types with average 83.7% conversion rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}