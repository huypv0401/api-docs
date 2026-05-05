import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { CreateDocumentSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = CreateDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new DocumentRepository(supabase)
  const doc = await repo.create(parsed.data, user.id)
  return Response.json(doc, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const filter = (request.nextUrl.searchParams.get('filter') ?? 'all') as 'owned' | 'shared' | 'all'
  const repo = new DocumentRepository(supabase)
  const docs = await repo.findAllByUser(user.id, filter)
  return Response.json(docs)
}
