import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, GuideRepository } from '@/lib/repositories'
import { CreateGuideSchema } from '@/lib/schemas'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const docRepo = new DocumentRepository(supabase)
  const perm = await docRepo.getPermission(id, user.id)
  if (!perm) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(await new GuideRepository(supabase).findAllByDocument(id))
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const docRepo = new DocumentRepository(supabase)
  const perm = await docRepo.getPermission(id, user.id)
  if (!perm) return Response.json({ error: 'Not found' }, { status: 404 })
  if (perm === 'viewer') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = CreateGuideSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })

  const guide = await new GuideRepository(supabase).create(parsed.data, id)
  return Response.json(guide, { status: 201 })
}
