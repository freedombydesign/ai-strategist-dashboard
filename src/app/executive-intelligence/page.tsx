'use client'

import { useState } from 'react'

export default function ExecutiveIntelligencePage() {
  const [isEmailSending, setIsEmailSending] = useState(false)

  const handleEmailBriefing = async () => {
    const email = prompt('Enter your email address to receive the executive briefing:')
    if (!email) return
    
    setIsEmailSending(true)
    try {
      const response = await fetch('/api/freedom-suite/email-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      if (result.success) {
        alert('✅ Executive briefing sent successfully!')
      } else {
        alert('❌ Failed to send briefing: ' + result.error)
      }
    } catch (error) {
      alert('❌ Failed to send briefing. Please try again.')
    } finally {
      setIsEmailSending(false)
    }
  }

  const briefing = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    topPriority: "Client portfolio risk assessment needed - Top 3 clients represent 47% of revenue",
    keyWin: "December revenue exceeded target by 12% ($485k vs $433k target)",
    mainConcern: "Sales conversion rate declined to 24% from 31% last month - pipeline quality issue",
    healthScore: 8.4,
    healthTrend: 'improving',
    confidence: 87.5
  }

  const alerts = [
    {
      id: 1,
      severity: 'high',
      title: 'Client Churn Risk Detected',
      message: 'TechCorp Solutions showing early churn signals: 36% increase in support tickets',
      timeToImpact: 'within 4-6 weeks',
      affectedRevenue: 85000,
      confidence: 78.5
    },
    {
      id: 2,
      severity: 'medium',
      title: 'Cash Flow Dip Predicted',
      message: 'Invoice collection slowdown detected - projected 15% cash flow reduction',
      timeToImpact: 'next 6 weeks',
      affectedRevenue: 0,
      confidence: 83.2
    },
    {
      id: 3,
      severity: 'medium',
      title: 'Upsell Opportunity Identified',
      message: 'RetailPlus showing expansion signals - 40% increase in strategic questions',
      timeToImpact: 'next 2-3 weeks',
      affectedRevenue: 125000,
      confidence: 71.8
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Executive Intelligence</h1>
              <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">AI-Powered</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://suite.scalewithruth.com"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                📊 Business Suite
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Executive Briefing */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">🧠 Daily Executive Briefing</h2>
              <p className="text-xl opacity-90">{briefing.date}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{briefing.healthScore}/10</div>
              <div className="text-sm opacity-80">Business Health</div>
              <div className="text-xs opacity-70">{briefing.healthTrend === 'improving' ? '↗️ Improving' : briefing.healthTrend === 'declining' ? '↘️ Declining' : '→ Stable'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">🎯 Top Priority</h3>
              <p className="text-sm opacity-90">{briefing.topPriority}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">🏆 Key Win</h3>
              <p className="text-sm opacity-90 text-green-200">{briefing.keyWin}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">⚠️ Main Concern</h3>
              <p className="text-sm opacity-90 text-red-200">{briefing.mainConcern}</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm opacity-70">Analysis Confidence: {briefing.confidence}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Predictive Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">🚨 Predictive Alerts</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length} Critical
              </span>
            </div>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{alert.title}</h4>
                    <span className="text-xs bg-white px-2 py-1 rounded">{alert.confidence}% confident</span>
                  </div>
                  <p className="text-sm mb-3">{alert.message}</p>
                  <div className="flex justify-between text-xs">
                    <span>Impact: {alert.timeToImpact}</span>
                    {alert.affectedRevenue > 0 && (
                      <span className="font-medium">Revenue: ${alert.affectedRevenue.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Intelligence */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 System Intelligence</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <p className="font-medium text-gray-900">Cash Flow Command</p>
                    <p className="text-sm text-gray-600">3 invoices overdue</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-orange-600">85%</div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📈</span>
                  <div>
                    <p className="font-medium text-gray-900">ProfitPulse</p>
                    <p className="text-sm text-gray-600">34.2% margin</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">92%</div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔄</span>
                  <div>
                    <p className="font-medium text-gray-900">ConvertFlow</p>
                    <p className="text-sm text-gray-600">24% conversion rate</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-red-600">73%</div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🚀</span>
                  <div>
                    <p className="font-medium text-gray-900">DeliverEase</p>
                    <p className="text-sm text-gray-600">8 active projects</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">94%</div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🧠 Executive Intelligence is LIVE!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your AI-powered decision support system is analyzing data across all 7 business systems to provide strategic insights and predictive alerts.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://suite.scalewithruth.com"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              📊 View Business Suite →
            </a>
            <button 
              onClick={handleEmailBriefing}
              disabled={isEmailSending}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isEmailSending ? '📧 Sending...' : '📧 Email Briefing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}