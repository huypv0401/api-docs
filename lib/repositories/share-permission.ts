import { TypedSupabaseClient, Database } from '@/lib/supabase/types'
import type { SharePermission } from '@/lib/types'

type PermRow = Database['public']['Tables']['share_permissions']['Row']

function mapPermission(row: PermRow): SharePermission {
  return {
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    email: row.email,
    permissionType: 'viewer',
    isPending: row.is_pending,
    createdAt: row.created_at,
  }
}

export class SharePermissionRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByDocumentId(documentId: string): Promise<SharePermission[]> {
    const { data } = await this.supabase
      .from('share_permissions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at')
    return (data ?? []).map(mapPermission)
  }

  async create(documentId: string, email: string, userId: string | null, permissionType: 'viewer' | 'editor' = 'viewer'): Promise<SharePermission> {
    const isPending = userId === null
    const { data, error } = await this.supabase
      .from('share_permissions')
      .insert({
        document_id: documentId,
        email,
        user_id: userId,
        permission_type: permissionType,
        is_pending: isPending,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create share permission')
    return mapPermission(data)
  }

  async delete(documentId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('share_permissions')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', userId)
    return !error
  }

  async deleteByEmail(documentId: string, email: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('share_permissions')
      .delete()
      .eq('document_id', documentId)
      .eq('email', email)
    return !error
  }

  async activatePending(email: string, userId: string): Promise<void> {
    await this.supabase
      .from('share_permissions')
      .update({ user_id: userId, is_pending: false })
      .eq('email', email)
      .eq('is_pending', true)
  }

  async findUserByEmail(email: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('share_permissions')
      .select('user_id')
      .eq('email', email)
      .eq('is_pending', false)
      .limit(1)
      .single()
    return data?.user_id ?? null
  }

  async createShareLink(documentId: string, createdBy: string, permissionType: 'viewer' | 'editor'): Promise<string> {
    const { data, error } = await this.supabase
      .from('share_links')
      .insert({ document_id: documentId, created_by: createdBy, permission_type: permissionType })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Failed to create share link')
    return data.id
  }

  async findShareLinks(documentId: string): Promise<Array<{ id: string; permissionType: 'viewer' | 'editor'; createdAt: string }>> {
    const { data } = await this.supabase
      .from('share_links')
      .select('id, permission_type, created_at')
      .eq('document_id', documentId)
      .order('created_at')
    return (data ?? []).map((r) => ({ id: r.id, permissionType: r.permission_type as 'viewer' | 'editor', createdAt: r.created_at }))
  }

  async deleteShareLink(id: string): Promise<void> {
    await this.supabase.from('share_links').delete().eq('id', id)
  }
}
