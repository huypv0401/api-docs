import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const path = `${user.id}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('guide-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('guide-images').getPublicUrl(path)
  return Response.json({ url: data.publicUrl }, { status: 201 })
}
