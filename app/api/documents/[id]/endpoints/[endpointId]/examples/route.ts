import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, ExampleRepository } from '@/lib/repositories'
import { CreateExampleSchema } from '@/lib/schemas'
import { validateJSON } from '@/lib/validate-json'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, endpointId } = await params
  const docRepo = new DocumentRepository(supabase)
  const isOwner = await docRepo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = CreateExampleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const jsonValidation = validateJSON(parsed.data.jsonContent)
  if (!jsonValidation.isValid) {
    return Response.json({ error: 'Invalid JSON content', detail: jsonValidation.error }, { status: 400 })
  }

  const exampleRepo = new ExampleRepository(supabase)
  const example = await exampleRepo.create(endpointId, parsed.data)
  return Response.json(example, { status: 201 })
}
