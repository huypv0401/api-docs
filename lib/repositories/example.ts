import { TypedSupabaseClient, Database } from '@/lib/supabase/types'
import type { Example } from '@/lib/types'
import type { CreateExampleInput } from '@/lib/schemas'

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
    responseHeaders: (row.response_headers as Record<string, string> | null) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class ExampleRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByEndpointId(endpointId: string): Promise<Example[]> {
    const { data } = await this.supabase
      .from('examples')
      .select('*')
      .eq('endpoint_id', endpointId)
      .order('created_at')
    return (data ?? []).map(mapExample)
  }

  async create(endpointId: string, input: CreateExampleInput): Promise<Example> {
    const jsonContent = JSON.parse(input.jsonContent)
    const { data, error } = await this.supabase
      .from('examples')
      .insert({
        endpoint_id: endpointId,
        type: input.type,
        name: input.name,
        description: input.description ?? null,
        json_content: jsonContent,
        status_code: input.statusCode ?? null,
        response_headers: input.responseHeaders ?? null,
      })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create example')
    return mapExample(data)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('examples').delete().eq('id', id)
    return !error
  }
}
