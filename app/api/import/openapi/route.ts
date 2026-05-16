import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, EndpointRepository, ExampleRepository } from '@/lib/repositories'
import { OpenApiParser } from '@/lib/openapi-parser'

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parser = new OpenApiParser()
  let parsed
  try {
    parsed = parser.parse(body)
  } catch (err) {
    return Response.json(
      { error: 'Invalid OpenAPI document', detail: err instanceof Error ? err.message : String(err) },
      { status: 422 }
    )
  }

  const docRepo = new DocumentRepository(supabase)
  const endpointRepo = new EndpointRepository(supabase)
  const exampleRepo = new ExampleRepository(supabase)

  const overwriteId = request.nextUrl.searchParams.get('documentId')
  let docId: string

  if (overwriteId) {
    const isOwner = await docRepo.isOwner(overwriteId, user.id)
    if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })
    await docRepo.update(overwriteId, { title: parsed.title, description: parsed.description ?? null }, user.id)
    const existing = await endpointRepo.findByDocumentId(overwriteId)
    await Promise.all(existing.map((ep) => endpointRepo.delete(ep.id)))
    docId = overwriteId
  } else {
    const doc = await docRepo.create({ title: parsed.title, description: parsed.description ?? undefined }, user.id)
    docId = doc.id
  }

  for (const ep of parsed.endpoints) {
    const endpoint = await endpointRepo.create(docId, {
      name: ep.name,
      method: ep.method,
      url: ep.url,
      headers: ep.headers,
      queryParams: ep.queryParams,
      body: ep.body ?? undefined,
      description: ep.description ?? undefined,
    })
    for (const ex of ep.examples) {
      await exampleRepo.create(endpoint.id, {
        type: ex.type,
        name: ex.name,
        description: ex.description ?? undefined,
        jsonContent: JSON.stringify(ex.jsonContent),
        statusCode: ex.statusCode ?? undefined,
        responseHeaders: ex.responseHeaders ?? undefined,
      })
    }
  }

  return Response.json({ id: docId, title: parsed.title }, { status: 201 })
}
