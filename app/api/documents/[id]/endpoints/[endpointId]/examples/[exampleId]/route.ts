import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, ExampleRepository } from '@/lib/repositories'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string; exampleId: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, exampleId } = await params
  const docRepo = new DocumentRepository(supabase)
  const isOwner = await docRepo.isOwner(id, user.id)
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const exampleRepo = new ExampleRepository(supabase)
  const deleted = await exampleRepo.delete(exampleId)
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ success: true })
}
