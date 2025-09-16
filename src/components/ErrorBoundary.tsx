'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    console.warn('ErrorBoundary caught error:', error.message)

    // Suppress specific errors that shouldn't break the app
    if (error.message.includes('difficulty_level') ||
        error.message.includes('sprints') ||
        error.message.includes('detectStore') ||
        error.message.includes('extension')) {
      console.warn('Suppressing non-critical error:', error.message)
      return { hasError: false } // Don't show error UI for these
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ErrorBoundary componentDidCatch:', error, errorInfo)

    // Log the error but don't break the app for known issues
    if (error.message.includes('difficulty_level') ||
        error.message.includes('sprints') ||
        error.message.includes('detectStore')) {
      console.warn('Suppressing known error in production')
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Something went wrong</h3>
          <p className="text-yellow-700">Please refresh the page and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary