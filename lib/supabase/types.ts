import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Type definitions for Supabase client and database schema.
 * These types provide type safety for database operations.
 */

// Database schema types will be generated from Supabase
// For now, we define the basic structure
export type Database = {
  public: {
    Tables: {
      api_documents: {
        Row: {
          id: string
          title: string
          description: string | null
          owner_id: string
          raw_postman: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_id: string
          raw_postman?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          owner_id?: string
          raw_postman?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      endpoints: {
        Row: {
          id: string
          document_id: string
          name: string
          method: string
          url: string
          headers: Record<string, string>
          query_params: Record<string, string>
          body: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          name: string
          method: string
          url: string
          headers?: Record<string, string>
          query_params?: Record<string, string>
          body?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          name?: string
          method?: string
          url?: string
          headers?: Record<string, string>
          query_params?: Record<string, string>
          body?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      examples: {
        Row: {
          id: string
          endpoint_id: string
          type: 'request' | 'response'
          name: string
          description: string | null
          json_content: unknown
          status_code: number | null
          response_headers: Record<string, string> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          endpoint_id: string
          type: 'request' | 'response'
          name: string
          description?: string | null
          json_content: unknown
          status_code?: number | null
          response_headers?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          endpoint_id?: string
          type?: 'request' | 'response'
          name?: string
          description?: string | null
          json_content?: unknown
          status_code?: number | null
          response_headers?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      share_permissions: {
        Row: {
          id: string
          document_id: string
          user_id: string | null
          email: string
          permission_type: 'viewer' | 'editor'
          is_pending: boolean
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id?: string | null
          email: string
          permission_type?: 'viewer' | 'editor'
          is_pending?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string | null
          email?: string
          permission_type?: 'viewer' | 'editor'
          is_pending?: boolean
          created_at?: string
        }
        Relationships: []
      }
      guides: {
        Row: {
          id: string
          document_id: string
          title: string
          content: string
          cover_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          title: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          title?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          id: string
          document_id: string
          permission_type: 'viewer' | 'editor'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          permission_type?: 'viewer' | 'editor'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          permission_type?: 'viewer' | 'editor'
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// Type for the Supabase client with our database schema
export type TypedSupabaseClient = SupabaseClient<Database>
