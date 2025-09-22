'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

export default function WorkflowAnalytics() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflowData()
  }, [])

  const loadWorkflowData = async () => {
    try {
      // Simulate loading workflow analytics data
      setLoading(true)

      // Mock data for demonstration
      const mockWorkflows = [
        {
          id: 1,
          name: 'Client Onboarding',
          status: 'active',
          efficiency: 85,
          completedSteps: 12,
          totalSteps: 15,
          avgCompletionTime: '2.5 hours'
        },
        {
          id: 2,
          name: 'Service Delivery',
          status: 'needs_attention',
          efficiency: 67,
          completedSteps: 8,
          totalSteps: 12,
          avgCompletionTime: '4.2 hours'
        },
        {
          id: 3,
          name: 'Quality Assurance',
          status: 'active',
          efficiency: 92,
          completedSteps: 10,
          totalSteps: 10,
          avgCompletionTime: '1.8 hours'
        }
      ]

      setWorkflows(mockWorkflows)
      setLoading(false)
    } catch (error) {
      console.error('Error loading workflow data:', error)
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'needs_attention':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'needs_attention':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workflow analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workflow Analytics</h1>
                <p className="text-gray-600">Monitor and optimize your business workflows</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/export-manager"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export Manager
                </Link>
                <Link
                  href="/dashboard"
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                  <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(workflows.reduce((acc, w: any) => acc + w.efficiency, 0) / workflows.length || 0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflows.filter((w: any) => w.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workflows.filter((w: any) => w.status === 'needs_attention').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Workflow Performance</h2>
                <Link
                  href="/export-manager"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export Data
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {workflows.map((workflow: any) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(workflow.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-500">
                          {workflow.completedSteps}/{workflow.totalSteps} steps completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Efficiency</p>
                        <p className="text-2xl font-bold text-gray-900">{workflow.efficiency}%</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Avg Time</p>
                        <p className="text-lg font-semibold text-gray-900">{workflow.avgCompletionTime}</p>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                        {workflow.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((workflow.completedSteps / workflow.totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(workflow.completedSteps / workflow.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Export Your Analytics</h3>
                <p className="text-blue-700 mt-1">
                  Export workflow data to various platforms for deeper analysis and reporting.
                </p>
              </div>
              <Link
                href="/export-manager"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Open Export Manager
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}