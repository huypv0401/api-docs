'use client'

import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Authentication context type definition.
 * Provides user session data and authentication state to child components.
 */
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component that manages authentication state.
 * 
 * Features:
 * - Manages user session lifecycle
 * - Provides user profile data to child components
 * - Listens for authentication state changes
 * - Handles session refresh automatically
 * - Provides loading and error states
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.6, 15.6
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { session: initialSession }, error: sessionError } = 
          await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event)
      
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      
      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'USER_UPDATED') {
        console.log('User profile updated')
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 * 
 * @returns Authentication context with user, session, loading, and error states
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
