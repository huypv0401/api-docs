import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { UpdateDocumentSchema } from '@/lib/schemas'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const repo = new DocumentRepository(supabase)
  const doc = await repo.findById(id, user.id)
  if (!doc) return Response.json({ error: 'Not found or access denied' }, { status: 404 })
  return Response.json(doc)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const repo = new DocumentRepository(supabase)
  const isOwner = await repo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = UpdateDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const doc = await repo.update(id, parsed.data, user.id)
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(doc)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const repo = new DocumentRepository(supabase)
  const isOwner = await repo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const deleted = await repo.delete(id, user.id)
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ success: true })
}
