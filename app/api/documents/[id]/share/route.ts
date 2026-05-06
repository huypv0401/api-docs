import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, SharePermissionRepository } from '@/lib/repositories'
import { ShareDocumentSchema } from '@/lib/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const docRepo = new DocumentRepository(supabase)
  const isOwner = await docRepo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = ShareDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const shareRepo = new SharePermissionRepository(supabase)
  const existingUserId = await shareRepo.findUserByEmail(parsed.data.email)
  const permission = await shareRepo.create(id, parsed.data.email, existingUserId, parsed.data.permissionType)
  return Response.json(permission, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const docRepo = new DocumentRepository(supabase)
  const isOwner = await docRepo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const shareRepo = new SharePermissionRepository(supabase)
  const [permissions, links] = await Promise.all([
    shareRepo.findByDocumentId(id),
    shareRepo.findShareLinks(id),
  ])
  return Response.json({ permissions, links })
}
