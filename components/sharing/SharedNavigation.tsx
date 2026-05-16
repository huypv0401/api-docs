'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/documents', label: 'Documents' },
  { href: '/viewer', label: 'OpenAPI Viewer' },
]

export function SharedNavigation() {
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.refresh()
  }

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-zinc-100">
            API Docs
          </Link>
          <div className="hidden sm:flex sm:gap-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-xs text-gray-500 dark:text-zinc-400 sm:block">{user.email}</span>
              <button onClick={handleSignOut}
                className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login"
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
