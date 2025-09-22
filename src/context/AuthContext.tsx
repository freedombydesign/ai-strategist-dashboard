'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isSigningOut: boolean
  signOut: () => Promise<void>
  getUserProfile: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  
  // Using centralized supabase client

  // Ensure we're on the client side and clear conflicting auth storage
  useEffect(() => {
    setIsClient(true)

    // Clear conflicting auth storage keys when on business systemizer domain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      console.log('[AUTH] Current hostname:', hostname)

      if (hostname === 'business-systemizer.scalewithruth.com') {
        // Clear AI Strategist auth storage if it exists
        const aiAuthKey = 'ai-strategist-auth-v2'
        const oldAuthKey = 'sb-dylzuudcvkcydmdyigcf-auth-token'
        const businessAuthKey = 'business-systemizer-auth-v1'

        console.log('[AUTH] Business Systemizer domain detected - clearing conflicting storage')

        // SELECTIVE CLEARING - Only remove conflicting auth keys, not all localStorage
        const conflictingKeys = [
          'ai-strategist-auth-v2',
          'sb-dylzuudcvkcydmdyigcf-auth-token',
          'freedom-by-design-auth'
        ]

        conflictingKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            console.log('[AUTH] Removing conflicting key:', key)
            localStorage.removeItem(key)
          }
        })

        // Remove any Supabase auth tokens that aren't business-systemizer
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') && key.includes('auth') && !key.includes('business-systemizer')) {
            console.log('[AUTH] Removing conflicting Supabase auth key:', key)
            localStorage.removeItem(key)
          }
        })

        // Clear all cookies for this domain
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
          console.log('[AUTH] Cleared cookie:', name.trim())
        })

        // Clear sessionStorage
        sessionStorage.clear()
        console.log('[AUTH] Cleared sessionStorage')

        console.log('[AUTH] Business Systemizer auth key in use:', businessAuthKey)
        console.log('[AUTH] Storage clearing completed - no reload needed')
      }
    }
  }, [])

  useEffect(() => {
    // Only run auth logic on the client side
    if (!isClient) return

    // Get initial session with timeout and error handling
    const getInitialSession = async () => {
      try {
        console.log('[AUTH] Starting session fetch...')

        // Add timeout to prevent hanging (reduced to 5 seconds)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )

        const sessionPromise = supabase.auth.getSession()

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

        console.log('[AUTH] Session fetched successfully:', !!session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('[AUTH] Error fetching session:', error)
        // Set loading to false even on error to prevent infinite loading
        setSession(null)
        setUser(null)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes with error handling
    let subscription: any = null
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            console.log('[AUTH] Auth state change:', event, !!session)

            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)

            // Ensure business systemizer users stay on their domain
            if (session?.user && typeof window !== 'undefined') {
              const hostname = window.location.hostname
              if (hostname === 'business-systemizer.scalewithruth.com') {
                console.log('[AUTH] Business systemizer user authenticated - ensuring domain lock')
                // Additional protection: if user somehow gets to wrong domain, redirect back
                if (window.location.href.includes('scalewithruth.com') && !window.location.href.includes('business-systemizer')) {
                  console.log('[AUTH] CRITICAL: Business user detected on wrong domain, redirecting back')
                  window.location.href = 'https://business-systemizer.scalewithruth.com/dashboard'
                  return
                }
              }
            }

            // Handle sign in - create/update user profile
            if (event === 'SIGNED_IN' && session?.user) {
              try {
                const { error } = await supabase
                  .from('users')
                  .upsert({
                    id: session.user.id,
                    email: session.user.email,
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'id'
                  })

                if (error) {
                  console.error('[AUTH] Error upserting user profile:', error)
                } else {
                  console.log('[AUTH] User profile updated successfully')
                }
              } catch (error) {
                console.error('[AUTH] Error in user profile upsert:', error)
              }
            }
          } catch (error) {
            console.error('[AUTH] Error in auth state change handler:', error)
            setLoading(false)
          }
        }
      )
      subscription = sub
    } catch (error) {
      console.error('[AUTH] Error setting up auth listener:', error)
      setLoading(false)
    }

    return () => {
      try {
        subscription?.unsubscribe()
      } catch (error) {
        console.error('[AUTH] Error unsubscribing:', error)
      }
    }
  }, [isClient])

  const [isSigningOut, setIsSigningOut] = useState(false)
  
  const signOut = async () => {
    // Prevent multiple simultaneous sign out attempts
    if (isSigningOut) {
      console.log('[AUTH-CONTEXT] Sign out already in progress, ignoring duplicate call')
      return
    }
    
    console.log('[AUTH-CONTEXT] Starting sign out sequence')
    
    try {
      setIsSigningOut(true)
      console.log('[AUTH-CONTEXT] Starting sign out process')
      
      // Sign out from Supabase first
      console.log('[AUTH-CONTEXT] Calling Supabase signOut...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[AUTH-CONTEXT] Supabase sign out error:', error)
        // Continue with cleanup anyway
      } else {
        console.log('[AUTH-CONTEXT] Supabase sign out successful')
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        console.log('[AUTH-CONTEXT] Clearing localStorage...')
        try {
          localStorage.removeItem('lastFreedomScore')
          localStorage.removeItem('scoreCompletedAt')
          localStorage.removeItem('chatSessions')
          // Clear any other user-specific data
          Object.keys(localStorage).forEach(key => {
            if (key.includes('user_name_') || key.includes('chat_history_') || key.includes('started_sprints_') || key.includes('chat_session_')) {
              localStorage.removeItem(key)
            }
          })
          console.log('[AUTH-CONTEXT] Local storage cleared')
        } catch (storageError) {
          console.error('[AUTH-CONTEXT] Error clearing localStorage:', storageError)
        }
        
        // Force redirect to stay on current domain
        const hostname = window.location.hostname
        if (hostname === 'business-systemizer.scalewithruth.com') {
          console.log('[AUTH-CONTEXT] Redirecting to business systemizer home page')
          window.location.href = 'https://business-systemizer.scalewithruth.com/'
        } else {
          console.log('[AUTH-CONTEXT] Redirecting to home page')
          window.location.href = '/'
        }
      }
    } catch (error) {
      console.error('[AUTH-CONTEXT] Sign out process failed:', error)
      // Force redirect anyway
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        if (hostname === 'business-systemizer.scalewithruth.com') {
          window.location.href = 'https://business-systemizer.scalewithruth.com/'
        } else {
          window.location.href = '/'
        }
      }
    } finally {
      setIsSigningOut(false)
    }
  }

  const getUserProfile = async () => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[AUTH-CONTEXT] Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error in getUserProfile:', error)
      return null
    }
  }

  const value = {
    user,
    session,
    loading: loading || !isClient, // Keep loading true until client-side hydration
    isSigningOut,
    signOut,
    getUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}