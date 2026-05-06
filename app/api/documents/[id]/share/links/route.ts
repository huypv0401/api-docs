import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, SharePermissionRepository } from '@/lib/repositories'

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

  const { permissionType = 'viewer' } = await request.json().catch(() => ({}))
  const shareRepo = new SharePermissionRepository(supabase)
  const linkId = await shareRepo.createShareLink(id, user.id, permissionType)
  return Response.json({ id: linkId }, { status: 201 })
}
