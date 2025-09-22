'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ServiceDeliverySystemizerPage() {
  const [workflowSteps, setWorkflowSteps] = useState('')
  const [workflowName, setWorkflowName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workflowName.trim() || !workflowSteps.trim()) {
      setMessage('Please provide both workflow name and steps')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      console.log('Submitting workflow data:', { workflowName, workflowSteps })

      const response = await fetch('/api/service-delivery-systemizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowName: workflowName.trim(),
          workflowSteps: workflowSteps.trim(),
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setMessage('Workflow uploaded successfully! AI processing will begin shortly.')
        setMessageType('success')
        setWorkflowName('')
        setWorkflowSteps('')
      } else {
        setMessage(data.error || 'Failed to upload workflow')
        setMessageType('error')
        console.error('API Error:', data)
      }
    } catch (error) {
      console.error('Network error:', error)
      setMessage('Network error. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Delivery Systemizer</h1>
              <p className="text-gray-600">Streamline your workflow automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transform Your Service Delivery
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload your workflow steps and let our AI generate comprehensive email templates,
            documents, task lists, and export configurations for seamless integration with
            Asana, ClickUp, and other platforms.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Workflow Steps</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="workflowName" className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                id="workflowName"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Client Onboarding Process"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="workflowSteps" className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Steps
              </label>
              <textarea
                id="workflowSteps"
                value={workflowSteps}
                onChange={(e) => setWorkflowSteps(e.target.value)}
                rows={12}
                placeholder="Enter your workflow steps here... For example:

1. Send welcome email to new client
2. Schedule kickoff call
3. Collect project requirements
4. Create project timeline
5. Set up project management board
6. Send first deliverable
..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600 mt-2">
                Describe each step of your service delivery process. Be as detailed as possible for better AI processing.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !workflowName.trim() || !workflowSteps.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading Workflow...' : 'Upload & Process Workflow'}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              messageType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Form State:</strong> {workflowName ? 'Name entered' : 'No name'}, {workflowSteps ? 'Steps entered' : 'No steps'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Last Message:</strong> {message || 'None'}</p>
            <p><strong>Message Type:</strong> {messageType || 'None'}</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Templates</h3>
            <p className="text-gray-600 text-sm">AI generates professional email templates for each workflow step</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
            <p className="text-gray-600 text-sm">Comprehensive documents and checklists for consistent delivery</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Task Lists</h3>
            <p className="text-gray-600 text-sm">Detailed task breakdowns with dependencies and timelines</p>
          </div>
        </div>
      </div>
    </div>
  )
}