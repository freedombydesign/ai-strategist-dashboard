'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

export default function ClientTest() {
  const [status, setStatus] = useState('Loading...')
  
  useEffect(() => {
    console.log('[CLIENT-TEST] Testing Supabase client')
    
    const testClient = async () => {
      try {
        // Simple test - get session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus(`Error: ${error.message}`)
        } else {
          setStatus(`Success: ${session ? 'Logged in' : 'Not logged in'}`)
        }
      } catch (err) {
        setStatus(`Exception: ${err}`)
      }
    }
    
    testClient()
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Supabase Client Test</h1>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <p>This page tests the Supabase client directly without AuthContext.</p>
        <p>Check console for "Creating SINGLE Supabase instance v2.0" message.</p>
      </div>
    </div>
  )
}