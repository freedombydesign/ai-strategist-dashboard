'use client'

import { useEffect } from 'react'

export default function SubdomainRedirect() {
  useEffect(() => {
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    
    console.log('Client-side redirect check:', { hostname, pathname })
    
    // Suite subdomain check
    if (hostname.includes('suite.scalewithruth.com') && !pathname.startsWith('/freedom-suite')) {
      console.log('Redirecting to Freedom Suite')
      window.location.replace('/freedom-suite')
      return
    }
    
    // AI subdomain check  
    if (hostname.includes('ai.scalewithruth.com') && !pathname.startsWith('/executive-intelligence')) {
      console.log('Redirecting to Executive Intelligence')
      window.location.replace('/executive-intelligence')
      return
    }
  }, [])

  return null
}