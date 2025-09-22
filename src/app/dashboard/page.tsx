'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut, isSigningOut } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Systemizer Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.email?.split('@')[0] || 'User'}!</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/service-delivery-systemizer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Workflow Systemizer
                </Link>
                <Link
                  href="/template-manager"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Template Manager
                </Link>
                <Link
                  href="/export-manager"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Export Manager
                </Link>
                <Link
                  href="/business-metrics"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
                >
                  Analytics
                </Link>
                <Link
                  href="/diagnostic"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
                >
                  Assessment
                </Link>
                <button
                  onClick={signOut}
                  disabled={isSigningOut}
                  className={`flex items-center gap-2 font-medium ${
                    isSigningOut
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Transform Your Business Operations
            </h2>
            <p className="text-gray-600 mb-6">
              Streamline your workflow automation with AI-powered systemization tools designed to optimize your business processes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/service-delivery-systemizer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Get Started with Workflow Systemizer
              </Link>
              <Link
                href="/diagnostic"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium"
              >
                Take Business Assessment
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Delivery Systemizer */}
            <Link
              href="/service-delivery-systemizer"
              className="group bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <RocketLaunchIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Systemizer</h3>
              <p className="text-gray-600 text-sm">
                Upload and systematize your service delivery workflows with AI-powered automation.
              </p>
            </Link>

            {/* Template Manager */}
            <Link
              href="/template-manager"
              className="group bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Manager</h3>
              <p className="text-gray-600 text-sm">
                Manage and organize your email templates, documents, and workflow assets.
              </p>
            </Link>

            {/* Export Manager */}
            <Link
              href="/export-manager"
              className="group bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <ArrowDownTrayIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Manager</h3>
              <p className="text-gray-600 text-sm">
                Export your workflows to various platforms like Asana, ClickUp, and more.
              </p>
            </Link>

            {/* Business Analytics */}
            <Link
              href="/business-metrics"
              className="group bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Analytics</h3>
              <p className="text-gray-600 text-sm">
                Track performance and optimize your business processes with detailed analytics.
              </p>
            </Link>

            {/* Diagnostic Assessment */}
            <Link
              href="/diagnostic"
              className="group bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                <ClipboardDocumentListIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Assessment</h3>
              <p className="text-gray-600 text-sm">
                Evaluate your current business processes and identify optimization opportunities.
              </p>
            </Link>

            {/* Settings */}
            <div className="group bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 text-sm">
                Configure your Business Systemizer preferences and account settings.
              </p>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 mt-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Getting Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mb-3">
                  1
                </div>
                <h3 className="font-medium text-blue-900 mb-2">Upload Your Workflows</h3>
                <p className="text-blue-700 text-sm">
                  Start by uploading your existing service delivery processes to the Workflow Systemizer.
                </p>
              </div>
              <div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mb-3">
                  2
                </div>
                <h3 className="font-medium text-blue-900 mb-2">Generate Templates</h3>
                <p className="text-blue-700 text-sm">
                  Let AI create professional templates and documents based on your workflow steps.
                </p>
              </div>
              <div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mb-3">
                  3
                </div>
                <h3 className="font-medium text-blue-900 mb-2">Export & Implement</h3>
                <p className="text-blue-700 text-sm">
                  Export your systematized workflows to your preferred project management platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}