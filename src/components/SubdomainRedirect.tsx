'use client'

import { useEffect } from 'react'

export default function SubdomainRedirect() {
  useEffect(() => {
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    
    // Only redirect from root paths, don't interfere with internal navigation
    if (pathname !== '/') return
    
    console.log('Client-side redirect check:', { hostname, pathname })
    
    // Suite subdomain check - only from root
    if (hostname.includes('suite.scalewithruth.com')) {
      console.log('Redirecting to Freedom Suite')
      window.location.replace('/freedom-suite')
      return
    }
    
    // AI subdomain check - only from root  
    if (hostname.includes('ai.scalewithruth.com')) {
      console.log('Redirecting to Executive Intelligence')
      window.location.replace('/executive-intelligence')
      return
    }
  }, [])

  return null
}