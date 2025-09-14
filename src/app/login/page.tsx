'use client'

import AuthForm from '@/components/AuthForm'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const [redirectTo, setRedirectTo] = useState('/dashboard')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase()
      
      if (hostname.includes('suite.scalewithruth.com')) {
        setRedirectTo('/suite')
      } else if (hostname.includes('ai.scalewithruth.com')) {
        setRedirectTo('/ai-intelligence')
      } else {
        setRedirectTo('/dashboard')
      }
    }
  }, [])

  return <AuthForm mode="login" redirectTo={redirectTo} />
}