'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import MobileOptimizedLayout from '@/components/MobileOptimizedLayout'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Target, Zap, TrendingUp, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CheckinData {
  completed_tasks: string[]
  obstacles: string
  energy_level: number
  business_updates: {
    revenue_update?: string
    client_update?: string
    key_win?: string
  }
  notes: string
}

export default function DailyCheckin() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  
  // Sprint context from URL params
  const sprintId = searchParams.get('sprint')
  const sprintName = searchParams.get('name')
  
  const [checkinData, setCheckinData] = useState<CheckinData>({
    completed_tasks: [],
    obstacles: '',
    energy_level: 7,
    business_updates: {},
    notes: ''
  })
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [todaysCheckin, setTodaysCheckin] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      checkTodaysCheckin()
    }
  }, [user?.id])

  const checkTodaysCheckin = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user!.id)
        .eq('checkin_date', today)
        .single()

      if (data && !error) {
        setHasCheckedInToday(true)
        setTodaysCheckin(data)
        setCheckinData({
          completed_tasks: data.completed_tasks || [],
          obstacles: data.obstacles || '',
          energy_level: data.energy_level || 7,
          business_updates: data.business_updates || {},
          notes: data.notes || ''
        })
      }
    } catch (error) {
      // No checkin today - that's fine
      console.log('[CHECKIN] No checkin found for today:', error)
    }
  }

  const addTask = () => {
    if (newTask.trim()) {
      setCheckinData(prev => ({
        ...prev,
        completed_tasks: [...prev.completed_tasks, newTask.trim()]
      }))
      setNewTask('')
    }
  }

  const removeTask = (index: number) => {
    setCheckinData(prev => ({
      ...prev,
      completed_tasks: prev.completed_tasks.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const submitData = {
        user_id: user!.id,
        checkin_date: today,
        completed_tasks: checkinData.completed_tasks,
        obstacles: checkinData.obstacles,
        energy_level: checkinData.energy_level,
        business_updates: checkinData.business_updates,
        notes: checkinData.notes
      }

      const { error } = await supabase
        .from('daily_checkins')
        .upsert(submitData, { 
          onConflict: 'user_id,checkin_date' 
        })

      if (error) throw error

      setHasCheckedInToday(true)
      console.log('[CHECKIN] Daily check-in saved successfully')
      
      // Show success message or redirect
      alert('Daily check-in saved! Great work today! 🎉')

    } catch (error) {
      console.error('[CHECKIN] Error saving check-in:', error)
      alert('Error saving check-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const energyLabels = {
    1: '😴 Exhausted', 2: '😪 Very Low', 3: '😑 Low', 4: '😕 Below Average',
    5: '😐 Neutral', 6: '🙂 Good', 7: '😊 Great', 8: '😄 Excellent',
    9: '🔥 On Fire', 10: '⚡ Unstoppable'
  }

  return (
    <ProtectedRoute>
      <MobileOptimizedLayout>
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            {/* Back Button */}
            {sprintId && (
              <Link 
                href={`/sprint/${sprintId}`} 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Sprint
              </Link>
            )}
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Daily Implementation Check-in
              </h1>
              
              {/* Sprint Context */}
              {sprintName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 mx-auto max-w-lg">
                  <div className="flex items-center justify-center">
                    <Target className="text-blue-600 mr-2" size={18} />
                    <span className="text-blue-900 font-medium">
                      Sprint Focus: {decodeURIComponent(sprintName)}
                    </span>
                  </div>
                </div>
              )}
              
              <p className="text-gray-600">
                Track your progress and build momentum • Takes less than 2 minutes
              </p>
              <div className="mt-4 text-sm text-blue-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {hasCheckedInToday && !loading ? (
            // Already checked in today - show summary
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <CheckCircle2 size={64} className="text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're all set for today! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                You completed your daily check-in. Keep up the momentum!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Target className="text-blue-600 mx-auto mb-2" size={24} />
                  <div className="font-semibold text-blue-900">
                    {todaysCheckin?.completed_tasks?.length || 0} Tasks
                  </div>
                  <div className="text-sm text-blue-700">Completed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <Zap className="text-green-600 mx-auto mb-2" size={24} />
                  <div className="font-semibold text-green-900">
                    {todaysCheckin?.energy_level || 7}/10
                  </div>
                  <div className="text-sm text-green-700">Energy Level</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <TrendingUp className="text-purple-600 mx-auto mb-2" size={24} />
                  <div className="font-semibold text-purple-900">Building</div>
                  <div className="text-sm text-purple-700">Momentum</div>
                </div>
              </div>

              <button
                onClick={() => setHasCheckedInToday(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Update Today's Check-in
              </button>
            </div>
          ) : (
            // Check-in form
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Completed Tasks */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    🎯 What did you accomplish today?
                  </label>
                  
                  <div className="space-y-3 mb-4">
                    {checkinData.completed_tasks.map((task, index) => (
                      <div key={index} className="flex items-center bg-green-50 p-3 rounded-lg">
                        <CheckCircle2 size={20} className="text-green-600 mr-3" />
                        <span className="flex-1 text-green-900">{task}</span>
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Add an accomplishment..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                    />
                    <button
                      type="button"
                      onClick={addTask}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    ⚡ How's your energy level today?
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={checkinData.energy_level}
                      onChange={(e) => setCheckinData(prev => ({ ...prev, energy_level: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center">
                      <span className="text-2xl">{energyLabels[checkinData.energy_level as keyof typeof energyLabels]}</span>
                      <div className="text-sm text-gray-600 mt-1">{checkinData.energy_level}/10</div>
                    </div>
                  </div>
                </div>

                {/* Obstacles */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    🚧 Any obstacles or challenges today?
                  </label>
                  <textarea
                    value={checkinData.obstacles}
                    onChange={(e) => setCheckinData(prev => ({ ...prev, obstacles: e.target.value }))}
                    placeholder="Describe any challenges you faced or support you need..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Business Updates */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    💼 Any business wins or updates?
                  </label>
                  <input
                    type="text"
                    value={checkinData.business_updates.key_win || ''}
                    onChange={(e) => setCheckinData(prev => ({
                      ...prev,
                      business_updates: { ...prev.business_updates, key_win: e.target.value }
                    }))}
                    placeholder="New client, revenue milestone, key breakthrough..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    📝 Additional thoughts or reflection?
                  </label>
                  <textarea
                    value={checkinData.notes}
                    onChange={(e) => setCheckinData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any insights, ideas, or thoughts about today..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading || checkinData.completed_tasks.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Saving Check-in...
                      </>
                    ) : (
                      <>
                        Complete Daily Check-in
                        <ArrowRight size={20} className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="mt-8 text-center">
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
      </MobileOptimizedLayout>
    </ProtectedRoute>
  )
}