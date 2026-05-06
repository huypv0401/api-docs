import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, SharePermissionRepository } from '@/lib/repositories'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, linkId } = await params
  const docRepo = new DocumentRepository(supabase)
  const isOwner = await docRepo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const shareRepo = new SharePermissionRepository(supabase)
  await shareRepo.deleteShareLink(linkId)
  return Response.json({ success: true })
}
