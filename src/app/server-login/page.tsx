'use client'

import { useState } from 'react'

export default function ServerLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setMessage('')
      
      console.log('[SERVER-LOGIN] Sending request to server-side API')
      
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      
      console.log('[SERVER-LOGIN] Server response:', result)
      
      if (result.success) {
        setMessage(`✅ Success! ${result.message}`)
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (err) {
      console.error('[SERVER-LOGIN] Request failed:', err)
      setMessage(`❌ Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🔧 Server-Side Login Test</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        This uses a server-side API endpoint to completely bypass client-side Supabase issues.
      </p>
      
      <form onSubmit={handleLogin} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Email Address:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            required
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '⏳ Sending...' : '📧 Send Magic Link (Server-Side)'}
        </button>
      </form>
      
      {message && (
        <div style={{
          padding: '15px',
          borderRadius: '4px',
          background: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
          color: message.startsWith('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Debug Info:</h3>
        <ul>
          <li><a href="/api/test-auth">Test Auth API (GET)</a></li>
          <li><a href="/health">Health Check</a></li>
          <li><a href="/api/diagnostic-questions">Diagnostic Questions API</a></li>
        </ul>
      </div>
    </div>
  )
}