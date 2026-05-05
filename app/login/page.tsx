import { LoginButton } from '@/components/auth'

/**
 * Login page for the API Documentation Manager.
 * 
 * Features:
 * - Google OAuth authentication via LoginButton
 * - Clean, centered layout
 * - Responsive design
 * - Dark mode support
 * 
 * Requirements: 1.2, 1.5
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            API Documentation Manager
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Sign in to create, manage, and share API documentation
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white px-6 py-8 shadow-sm dark:bg-zinc-900">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-zinc-100">
                Welcome
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Sign in with your Google account to get started
              </p>
            </div>

            <LoginButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-zinc-900 dark:text-zinc-500">
                  Secure authentication via Supabase
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-zinc-500">
              <p>
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-zinc-400">
          <p>
            Need help?{' '}
            <a
              href="/docs"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400"
            >
              View documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
