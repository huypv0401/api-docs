'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * ProtectedRoute component that wraps content requiring authentication.
 * 
 * Features:
 * - Redirects unauthenticated users to login page
 * - Displays loading state during session check
 * - Handles authentication errors gracefully
 * - Provides seamless user experience for authenticated users
 * 
 * Requirements: 1.5, 15.6
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-zinc-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  // Show error state if authentication check failed
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                Authentication Error
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no user after loading, return null (redirect will happen via useEffect)
  if (!user) {
    return null
  }

  // User is authenticated, render protected content
  return <>{children}</>
}
