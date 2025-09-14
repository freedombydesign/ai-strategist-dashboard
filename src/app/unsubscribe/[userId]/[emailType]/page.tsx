'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react'

export default function UnsubscribePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailType, setEmailType] = useState<string>('')

  useEffect(() => {
    if (params.userId && params.emailType) {
      handleUnsubscribe()
    }
  }, [params])

  const handleUnsubscribe = async () => {
    try {
      const emailTypeParam = Array.isArray(params.emailType) ? params.emailType[0] : params.emailType
      setEmailType(emailTypeParam)

      // Map email types to preference keys
      const preferenceMap: Record<string, string> = {
        'missed_checkin_day2': 'missed_checkins',
        'missed_checkin_day5': 'missed_checkins',
        'missed_checkin_day10': 'missed_checkins',
        'milestone_celebration': 'milestone_celebrations',
        'weekly_summary': 'weekly_summaries',
        'ai_insights': 'ai_insights'
      }

      const preferenceKey = preferenceMap[emailTypeParam] || emailTypeParam

      // Update preferences to disable this email type
      const updateData = {
        [preferenceKey]: false
      }

      const response = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: updateData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to unsubscribe')
      }

      setUnsubscribed(true)
    } catch (err) {
      console.error('Unsubscribe error:', err)
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe')
    } finally {
      setLoading(false)
    }
  }

  const getEmailTypeName = (type: string) => {
    const names: Record<string, string> = {
      'missed_checkin_day2': 'Check-in Reminders',
      'missed_checkin_day5': 'Check-in Reminders', 
      'missed_checkin_day10': 'Check-in Reminders',
      'milestone_celebration': 'Milestone Celebrations',
      'weekly_summary': 'Weekly Summaries',
      'ai_insights': 'AI Insights',
      'missed_checkins': 'Check-in Reminders',
      'milestone_celebrations': 'Milestone Celebrations', 
      'weekly_summaries': 'Weekly Summaries'
    }
    return names[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your unsubscribe request...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {error ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsubscribe Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Return to Dashboard
            </Link>
          </div>
        ) : unsubscribed ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Successfully Unsubscribed</h1>
            <p className="text-gray-600 mb-6">
              You have been unsubscribed from <strong>{getEmailTypeName(emailType)}</strong> emails.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You can manage all your email preferences from your dashboard settings.
                You'll still receive important account-related emails.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Return to Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Manage Email Preferences
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}