import { TypedSupabaseClient, Database } from '@/lib/supabase/types'
import type { Document, DocumentSummary, Endpoint, Example } from '@/lib/types'
import type { CreateDocumentInput, UpdateDocumentInput } from '@/lib/schemas'

type DocRow = Database['public']['Tables']['api_documents']['Row']
type EndpointRow = Database['public']['Tables']['endpoints']['Row']
type ExampleRow = Database['public']['Tables']['examples']['Row']

function mapExample(row: ExampleRow): Example {
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    type: row.type,
    name: row.name,
    description: row.description,
    jsonContent: row.json_content,
    statusCode: row.status_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEndpoint(row: EndpointRow, examples: Example[]): Endpoint {
  return {
    id: row.id,
    documentId: row.document_id,
    name: row.name,
    method: row.method as Endpoint['method'],
    url: row.url,
    headers: row.headers ?? {},
    queryParams: row.query_params ?? {},
    body: row.body,
    description: row.description,
    examples: examples.filter((e) => e.endpointId === row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class DocumentRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findById(id: string, userId: string): Promise<Document | null> {
    const { data: doc } = await this.supabase
      .from('api_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (!doc) return null

    const isOwner = doc.owner_id === userId
    if (!isOwner) {
      const { data: perm } = await this.supabase
        .from('share_permissions')
        .select('id')
        .eq('document_id', id)
        .eq('user_id', userId)
        .single()
      if (!perm) return null
    }

    const { data: endpoints } = await this.supabase
      .from('endpoints')
      .select('*')
      .eq('document_id', id)
      .order('created_at')

    const endpointIds = (endpoints ?? []).map((e) => e.id)
    const { data: examples } = endpointIds.length
      ? await this.supabase.from('examples').select('*').in('endpoint_id', endpointIds)
      : { data: [] as ExampleRow[] }

    const mappedExamples = (examples ?? []).map(mapExample)

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      ownerId: doc.owner_id,
      endpoints: (endpoints ?? []).map((e) => mapEndpoint(e, mappedExamples)),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }
  }

  async findAllByUser(userId: string, filter: 'owned' | 'shared' | 'all' = 'all'): Promise<DocumentSummary[]> {
    if (filter === 'owned') {
      const { data } = await this.supabase
        .from('api_documents')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false })
      return (data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        ownerId: d.owner_id,
        ownerEmail: null,
        isOwner: true,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }))
    }

    if (filter === 'shared') {
      const { data: perms } = await this.supabase
        .from('share_permissions')
        .select('document_id')
        .eq('user_id', userId)
        .eq('is_pending', false)

      const docIds = (perms ?? []).map((p) => p.document_id)
      if (!docIds.length) return []

      const { data } = await this.supabase
        .from('api_documents')
        .select('*')
        .in('id', docIds)
        .order('updated_at', { ascending: false })

      return (data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        ownerId: d.owner_id,
        ownerEmail: null,
        isOwner: false,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }))
    }

    const [owned, shared] = await Promise.all([
      this.findAllByUser(userId, 'owned'),
      this.findAllByUser(userId, 'shared'),
    ])
    const seen = new Set(owned.map((d) => d.id))
    return [...owned, ...shared.filter((d) => !seen.has(d.id))]
  }

  async create(input: CreateDocumentInput, ownerId: string): Promise<Document> {
    const { data, error } = await this.supabase
      .from('api_documents')
      .insert({ title: input.title, description: input.description ?? null, owner_id: ownerId })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create document')

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      ownerId: data.owner_id,
      endpoints: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  async update(id: string, input: UpdateDocumentInput, ownerId: string): Promise<Document | null> {
    const updateData: Database['public']['Tables']['api_documents']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description

    const { data, error } = await this.supabase
      .from('api_documents')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single()

    if (error || !data) return null
    return this.findById(id, ownerId)
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('api_documents')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId)
    return !error
  }

  async isOwner(id: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('api_documents')
      .select('id')
      .eq('id', id)
      .eq('owner_id', userId)
      .single()
    return !!data
  }
}
