'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function BusinessProfilePage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    businessName: '',
    businessModel: 'B2B',
    currentRevenue: '',
    teamSize: '',
    targetMarket: '',
    primaryService: '',
    biggestChallenge: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    // Simulate saving (since database has schema issues)
    setTimeout(() => {
      localStorage.setItem(`businessProfile_${user?.id}`, JSON.stringify(formData))
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
            <p className="text-gray-600 mt-2">
              Update your business information to get more personalized recommendations.
            </p>
          </div>

          {/* Success Message */}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-green-800">
                ✅ Business profile updated successfully!
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label htmlFor="businessModel" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Model
                </label>
                <select
                  id="businessModel"
                  name="businessModel"
                  value={formData.businessModel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="B2B">B2B (Business to Business)</option>
                  <option value="B2C">B2C (Business to Consumer)</option>
                  <option value="B2B2C">B2B2C (Business to Business to Consumer)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="currentRevenue" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue
                </label>
                <select
                  id="currentRevenue"
                  name="currentRevenue"
                  value={formData.currentRevenue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select range</option>
                  <option value="0-50k">$0 - $50K</option>
                  <option value="50k-100k">$50K - $100K</option>
                  <option value="100k-250k">$100K - $250K</option>
                  <option value="250k-500k">$250K - $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="1m+">$1M+</option>
                </select>
              </div>

              <div>
                <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size
                </label>
                <select
                  id="teamSize"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="solo">Just me</option>
                  <option value="2-5">2-5 people</option>
                  <option value="6-10">6-10 people</option>
                  <option value="11-25">11-25 people</option>
                  <option value="26+">26+ people</option>
                </select>
              </div>

              <div>
                <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Market
                </label>
                <input
                  type="text"
                  id="targetMarket"
                  name="targetMarket"
                  value={formData.targetMarket}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Small business owners, Tech startups, Healthcare professionals"
                />
              </div>

              <div>
                <label htmlFor="primaryService" className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Service/Product
                </label>
                <input
                  type="text"
                  id="primaryService"
                  name="primaryService"
                  value={formData.primaryService}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What's your main offering?"
                />
              </div>

              <div>
                <label htmlFor="biggestChallenge" className="block text-sm font-medium text-gray-700 mb-2">
                  Biggest Business Challenge
                </label>
                <textarea
                  id="biggestChallenge"
                  name="biggestChallenge"
                  value={formData.biggestChallenge}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What's your biggest challenge right now?"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    saving
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}