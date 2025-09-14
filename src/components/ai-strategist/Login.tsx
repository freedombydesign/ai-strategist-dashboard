'use client'

import { supabase } from '../../lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  // Using centralized supabase client
  const router = useRouter()
  const [email, setEmail] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (!error) {
      router.push('/dashboard')
    } else {
      console.error('Login error:', error.message)
    }
  }

  return (
    <div>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Send Magic Link</button>
    </div>
  )
}
