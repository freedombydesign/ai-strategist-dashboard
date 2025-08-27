'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Mail, LogIn, UserPlus, Chrome, Eye, EyeOff } from 'lucide-react'

interface AuthFormProps {
  mode?: 'login' | 'signup'
  redirectTo?: string
}

export default function AuthForm({ mode = 'login', redirectTo = '/dashboard' }: AuthFormProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [authMode, setAuthMode] = useState(mode)

  // Check URL parameters for error messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error')
      const urlMessage = urlParams.get('message')
      
      if (urlError === 'link_expired') {
        setMessage('Your magic link has expired. Please request a new one.')
      } else if (urlError === 'auth_error' || urlError === 'auth_failed') {
        setMessage(urlMessage || 'Authentication failed. Please try again.')
      }
      
      // Clear URL parameters
      if (urlError) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[AUTH] User already logged in, redirecting...')
        router.push(redirectTo)
      }
    }
    checkUser()
  }, [supabase.auth, router, redirectTo])

  const handleEmailAuth = async (type: 'login' | 'signup') => {
    setIsLoading(true)
    setMessage('')
    
    try {
      if (type === 'signup') {
        console.log('[AUTH] Attempting signup for:', email)
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        
        if (error) throw error
        
        if (data.user && !data.session) {
          setMessage('Check your email for the confirmation link!')
        } else if (data.session) {
          console.log('[AUTH] Signup successful, user logged in')
          await createUserProfile(data.user.id, data.user.email!)
          router.push(redirectTo)
        }
        
      } else {
        console.log('[AUTH] Attempting login for:', email)
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        console.log('[AUTH] Login successful')
        router.push(redirectTo)
      }
      
    } catch (error: any) {
      console.error('[AUTH] Error:', error)
      setMessage(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      console.log('[AUTH] Sending magic link to:', email)
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      
      setMessage('Check your email for the magic link!')
      
    } catch (error: any) {
      console.error('[AUTH] Magic link error:', error)
      setMessage(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      console.log('[AUTH] Starting Google OAuth')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      
    } catch (error: any) {
      console.error('[AUTH] Google auth error:', error)
      setMessage(error.message || 'An error occurred')
      setIsLoading(false)
    }
  }

  const createUserProfile = async (userId: string, email: string) => {
    try {
      console.log('[AUTH] Creating user profile for:', userId)
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (!existingProfile) {
        const { error } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
        
        if (error) {
          console.error('[AUTH] Error creating user profile:', error)
        } else {
          console.log('[AUTH] User profile created successfully')
        }
      } else {
        console.log('[AUTH] User profile already exists')
      }
      
    } catch (error) {
      console.error('[AUTH] Error in createUserProfile:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {authMode === 'signup' 
              ? 'Start your Freedom Operating System journey' 
              : 'Continue building your business freedom'}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            message.includes('Check your email') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input (for login/signup modes) */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleEmailAuth(authMode)}
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {authMode === 'signup' ? <UserPlus className="w-5 h-5 mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                  {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={isLoading || !email.trim()}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              Send Magic Link
            </button>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </button>
          </div>
        </form>

        {/* Mode Toggle */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}