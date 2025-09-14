'use client'

import { useState } from 'react'

export default function QuickTest() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      setResult(data.success ? `✅ ${data.message}` : `❌ ${data.error}`)
    } catch (err) {
      setResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>✅ Quick Test Page</h1>
      <p>If you can see this, the deployment is working!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      
      <h2>Test Links:</h2>
      <ul>
        <li><a href="/api/test-auth">Test Auth API</a></li>
        <li><a href="/api/diagnostic-questions">Diagnostic Questions</a></li>
        <li><a href="/health">Health Check</a></li>
      </ul>

      <h2>Login Tests:</h2>
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h3>Direct API Test</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email" 
            style={{ padding: '8px', marginRight: '10px' }}
            required
          />
          <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}>
            Send Magic Link
          </button>
        </form>
        
        {result && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', border: '1px solid #ccc' }}>
            {result}
          </div>
        )}
      </div>
    </div>
  )
}