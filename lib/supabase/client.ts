import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Creates a Supabase client for use in Client Components.
 * This client handles cookie-based session management for client-side operations.
 * 
 * The client is memoized to ensure only one instance is created per browser session.
 * 
 * @returns A Supabase client configured for client-side use
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
