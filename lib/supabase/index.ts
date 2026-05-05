/**
 * Supabase client utilities for the API Documentation Manager.
 * 
 * This module provides:
 * - Server-side Supabase client for Server Components, Server Actions, and Route Handlers
 * - Client-side Supabase client for Client Components
 * - Type definitions for the database schema
 * 
 * Usage:
 * 
 * Server Components:
 * ```typescript
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('api_documents').select()
 *   // ...
 * }
 * ```
 * 
 * Client Components:
 * ```typescript
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * export default function Component() {
 *   const supabase = createClient()
 *   // ...
 * }
 * ```
 */

export type { Database, TypedSupabaseClient } from './types'
