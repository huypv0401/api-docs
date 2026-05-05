import { TypedSupabaseClient, Database } from '@/lib/supabase/types'
import type { Endpoint } from '@/lib/types'
import type { CreateEndpointInput, UpdateEndpointInput } from '@/lib/schemas'

type EndpointRow = Database['public']['Tables']['endpoints']['Row']

function mapEndpoint(row: EndpointRow): Endpoint {
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
    examples: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class EndpointRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByDocumentId(documentId: string): Promise<Endpoint[]> {
    const { data } = await this.supabase
      .from('endpoints')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at')
    return (data ?? []).map(mapEndpoint)
  }

  async create(documentId: string, input: CreateEndpointInput): Promise<Endpoint> {
    const { data, error } = await this.supabase
      .from('endpoints')
      .insert({
        document_id: documentId,
        name: input.name,
        method: input.method,
        url: input.url,
        headers: input.headers ?? {},
        query_params: input.queryParams ?? {},
        body: input.body ?? null,
        description: input.description ?? null,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create endpoint')
    return mapEndpoint(data)
  }

  async update(id: string, input: UpdateEndpointInput): Promise<Endpoint | null> {
    const updateData: Database['public']['Tables']['endpoints']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (input.name !== undefined) updateData.name = input.name
    if (input.method !== undefined) updateData.method = input.method
    if (input.url !== undefined) updateData.url = input.url
    if (input.headers !== undefined) updateData.headers = input.headers
    if (input.queryParams !== undefined) updateData.query_params = input.queryParams
    if (input.body !== undefined) updateData.body = input.body
    if (input.description !== undefined) updateData.description = input.description

    const { data, error } = await this.supabase
      .from('endpoints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return null
    return mapEndpoint(data)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('endpoints').delete().eq('id', id)
    return !error
  }
}
