import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'
import { DocumentRepository, EndpointRepository, ExampleRepository } from '@/lib/repositories'
import { PostmanParser } from '@/lib/postman-parser'
import { OpenApiParser } from '@/lib/openapi-parser'
import { detectFormat } from '@/lib/format-detector'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: link } = await supabase
    .from('share_links')
    .select('document_id, permission_type')
    .eq('id', linkId)
    .single()

  if (!link) return Response.json({ error: 'Not found' }, { status: 404 })
  if (link.permission_type !== 'editor') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON body' }, { status: 400 })

  const format = detectFormat(body)

  let parsed
  try {
    parsed = format === 'openapi' ? new OpenApiParser().parse(body) : new PostmanParser().parse(body)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Parse failed' }, { status: 422 })
  }

  const { data: meta } = await supabase
    .from('api_documents')
    .select('owner_id')
    .eq('id', link.document_id)
    .single()

  if (!meta) return Response.json({ error: 'Not found' }, { status: 404 })

  const docRepo = new DocumentRepository(supabase)
  const endpointRepo = new EndpointRepository(supabase)
  const exampleRepo = new ExampleRepository(supabase)

  await docRepo.update(link.document_id, { title: parsed.title, description: parsed.description ?? null }, meta.owner_id)

  if (format === 'postman') {
    await supabase.from('api_documents').update({ raw_postman: body }).eq('id', link.document_id)
  }

  const existing = await endpointRepo.findByDocumentId(link.document_id)
  await Promise.all(existing.map((ep) => endpointRepo.delete(ep.id)))

  for (const ep of parsed.endpoints) {
    const endpoint = await endpointRepo.create(link.document_id, {
      name: ep.name, method: ep.method, url: ep.url,
      headers: ep.headers, queryParams: ep.queryParams,
      body: ep.body ?? undefined, description: ep.description ?? undefined,
    })
    for (const ex of ep.examples) {
      await exampleRepo.create(endpoint.id, {
        type: ex.type, name: ex.name, description: ex.description ?? undefined,
        jsonContent: JSON.stringify(ex.jsonContent),
        statusCode: ex.statusCode ?? undefined, responseHeaders: ex.responseHeaders ?? undefined,
      })
    }
  }

  return Response.json({ id: link.document_id, title: parsed.title }, { status: 200 })
}
