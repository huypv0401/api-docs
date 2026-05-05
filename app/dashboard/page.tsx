'use client'

import { ProtectedRoute, useAuth } from '@/components/auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Dashboard page - protected route example.
 * 
 * Features:
 * - Protected by authentication
 * - Displays user profile information
 * - Provides sign-out functionality
 * - Demonstrates useAuth hook usage
 * 
 * Requirements: 1.5, 1.6, 9.3, 9.4
 */
function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                API Documentation Manager
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-zinc-400">
                {user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            Welcome to your Dashboard
          </h2>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">
            You are successfully authenticated!
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                User Information
              </h3>
              <dl className="mt-2 divide-y divide-gray-200 dark:divide-zinc-800">
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-zinc-500">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">
                    {user?.email}
                  </dd>
                </div>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-zinc-500">
                    User ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">
                    {user?.id}
                  </dd>
                </div>
                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-zinc-500">
                    Last Sign In
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-zinc-100 sm:col-span-2 sm:mt-0">
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This is a protected route. Only authenticated users can access this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
