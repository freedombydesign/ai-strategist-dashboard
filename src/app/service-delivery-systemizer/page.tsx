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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-3xl font-bold text-white">Service Delivery Systemizer</h1>
              <p className="text-purple-200">AI-Powered Workflow Automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/ai-home"
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
              >
                ← Back to AI Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-6">
            Transform Your Service Delivery
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            Upload your workflow steps and let our AI generate comprehensive email templates,
            documents, task lists, and export configurations for seamless integration with
            Asana, ClickUp, and other platforms.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Upload Workflow Steps</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="workflowName" className="block text-sm font-medium text-purple-200 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                id="workflowName"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Client Onboarding Process"
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="workflowSteps" className="block text-sm font-medium text-purple-200 mb-2">
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
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                disabled={isLoading}
              />
              <p className="text-sm text-purple-300 mt-2">
                Describe each step of your service delivery process. Be as detailed as possible for better AI processing.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !workflowName.trim() || !workflowSteps.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading Workflow...' : 'Upload & Process Workflow'}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              messageType === 'success'
                ? 'bg-green-500/20 border border-green-400/30 text-green-200'
                : 'bg-red-500/20 border border-red-400/30 text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Debug Information</h3>
          <div className="text-sm text-purple-200 space-y-2">
            <p><strong>Form State:</strong> {workflowName ? 'Name entered' : 'No name'}, {workflowSteps ? 'Steps entered' : 'No steps'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Last Message:</strong> {message || 'None'}</p>
            <p><strong>Message Type:</strong> {messageType || 'None'}</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email Templates</h3>
            <p className="text-purple-200 text-sm">AI generates professional email templates for each workflow step</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Documents</h3>
            <p className="text-purple-200 text-sm">Comprehensive documents and checklists for consistent delivery</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Task Lists</h3>
            <p className="text-purple-200 text-sm">Detailed task breakdowns with dependencies and timelines</p>
          </div>
        </div>
      </div>
    </div>
  )
}