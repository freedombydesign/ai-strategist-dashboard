'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase-client'

export default function TestLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setMessage('')
      
      console.log('[TEST-LOGIN] Attempting login with:', email)
      console.log('[TEST-LOGIN] Supabase client:', !!supabase)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      console.log('[TEST-LOGIN] Result:', { data, error })
      
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Magic link sent! Check your email.')
      }
    } catch (err) {
      console.error('[TEST-LOGIN] Exception:', err)
      setMessage(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Test Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        
        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}