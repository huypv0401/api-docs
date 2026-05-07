import { TypedSupabaseClient, Database } from '@/lib/supabase/types'
import type { Guide, GuideSummary } from '@/lib/types'
import type { CreateGuideInput, UpdateGuideInput } from '@/lib/schemas'

type GuideRow = Database['public']['Tables']['guides']['Row']

function mapGuide(row: GuideRow): Guide {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class GuideRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findAllByDocument(documentId: string): Promise<GuideSummary[]> {
    const { data } = await this.supabase
      .from('guides')
      .select('id, document_id, title, cover_image_url, created_at, updated_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
    return (data ?? []).map((d) => ({
      id: d.id,
      documentId: d.document_id,
      title: d.title,
      coverImageUrl: d.cover_image_url,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }))
  }

  async findById(id: string, documentId: string): Promise<Guide | null> {
    const { data } = await this.supabase
      .from('guides')
      .select('*')
      .eq('id', id)
      .eq('document_id', documentId)
      .single()
    return data ? mapGuide(data) : null
  }

  async create(input: CreateGuideInput, documentId: string): Promise<Guide> {
    const { data, error } = await this.supabase
      .from('guides')
      .insert({
        document_id: documentId,
        title: input.title,
        content: input.content ?? '',
        cover_image_url: input.coverImageUrl ?? null,
      })
      .select()
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Failed to create guide')
    return mapGuide(data)
  }

  async update(id: string, input: UpdateGuideInput, documentId: string): Promise<Guide | null> {
    const updateData: Database['public']['Tables']['guides']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.coverImageUrl !== undefined) updateData.cover_image_url = input.coverImageUrl

    const { data, error } = await this.supabase
      .from('guides')
      .update(updateData)
      .eq('id', id)
      .eq('document_id', documentId)
      .select()
      .single()
    if (error || !data) return null
    return mapGuide(data)
  }

  async delete(id: string, documentId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('guides')
      .delete()
      .eq('id', id)
      .eq('document_id', documentId)
    return !error
  }
}
