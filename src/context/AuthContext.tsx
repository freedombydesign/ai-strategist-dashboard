'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
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

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run auth logic on the client side
    if (!isClient) return
    
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH-CONTEXT] Auth state change:', event, session?.user?.id)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

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
              console.error('[AUTH-CONTEXT] Error upserting user profile:', error)
            } else {
              console.log('[AUTH-CONTEXT] User profile updated successfully')
            }
          } catch (error) {
            console.error('[AUTH-CONTEXT] Error in user profile upsert:', error)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isClient])

  const signOut = async () => {
    console.log('[AUTH-CONTEXT] Signing out user')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('[AUTH-CONTEXT] Sign out error:', error)
    } else {
      console.log('[AUTH-CONTEXT] Sign out successful, redirecting to home')
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lastFreedomScore')
        localStorage.removeItem('scoreCompletedAt')
        // Redirect to home page
        window.location.href = '/'
      }
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