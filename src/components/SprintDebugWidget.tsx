'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SprintDebugWidget() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const analyzeLocalStorage = () => {
    if (!user?.id) return

    const userId = user.id
    const localStorageData: any = {}

    // Get all localStorage items related to sprints
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('sprint') || key.includes('task') || key.includes(userId))) {
        try {
          localStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null')
        } catch {
          localStorageData[key] = localStorage.getItem(key)
        }
      }
    }

    setDebugInfo(localStorageData)
  }

  const clearSprintData = () => {
    if (!user?.id) return

    const userId = user.id
    const keysToDelete = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('sprint') || key.includes('task') || key.includes('completed'))) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key))
    alert(`Cleared ${keysToDelete.length} sprint-related localStorage keys`)
    analyzeLocalStorage()
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-900 mb-4">🐛 Sprint Progress Debug</h3>
      
      <div className="space-x-3 mb-4">
        <button
          onClick={analyzeLocalStorage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          Analyze localStorage
        </button>
        <button
          onClick={clearSprintData}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          Clear Sprint Data
        </button>
      </div>

      {debugInfo && (
        <div className="bg-white rounded p-3 max-h-96 overflow-auto">
          <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}