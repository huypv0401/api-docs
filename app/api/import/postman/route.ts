import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, EndpointRepository, ExampleRepository } from '@/lib/repositories'
import { PostmanParser } from '@/lib/postman-parser'

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parser = new PostmanParser()
  let parsed
  try {
    parsed = parser.parse(body)
  } catch (err) {
    return Response.json(
      { error: 'Invalid Postman collection', detail: err instanceof Error ? err.message : String(err) },
      { status: 422 }
    )
  }

  const docRepo = new DocumentRepository(supabase)
  const endpointRepo = new EndpointRepository(supabase)
  const exampleRepo = new ExampleRepository(supabase)

  // Overwrite mode: documentId provided → delete existing endpoints then re-import
  const overwriteId = request.nextUrl.searchParams.get('documentId')
  let docId: string

  if (overwriteId) {
    const isOwner = await docRepo.isOwner(overwriteId, user.id)
    if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Update title/description
    await docRepo.update(overwriteId, { title: parsed.title, description: parsed.description ?? null }, user.id)

    // Delete all existing endpoints (cascades to examples via DB or we do it manually)
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
      })
    }
  }

  return Response.json({ id: docId, title: parsed.title }, { status: 201 })
}
