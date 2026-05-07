import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, GuideRepository } from '@/lib/repositories'
import { UpdateGuideSchema } from '@/lib/schemas'

interface RouteContext {
  params: Promise<{ id: string; guideId: string }>
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, guideId } = await params
  const docRepo = new DocumentRepository(supabase)
  if (!(await docRepo.findById(id, user.id))) return Response.json({ error: 'Not found' }, { status: 404 })

  const repo = new GuideRepository(supabase)
  const guide = await repo.findById(guideId, id)
  if (!guide) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(guide)
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, guideId } = await params
  const docRepo = new DocumentRepository(supabase)
  if (!(await docRepo.isOwner(id, user.id))) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = UpdateGuideSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })

  const repo = new GuideRepository(supabase)
  const guide = await repo.update(guideId, parsed.data, id)
  if (!guide) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(guide)
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, guideId } = await params
  const docRepo = new DocumentRepository(supabase)
  if (!(await docRepo.isOwner(id, user.id))) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const repo = new GuideRepository(supabase)
  const ok = await repo.delete(guideId, id)
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 })
  return new Response(null, { status: 204 })
}
