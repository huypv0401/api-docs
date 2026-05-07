import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { getUser } from '@/lib/supabase/server'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
const API_SECRET = process.env.CLOUDINARY_API_SECRET!
const API_KEY = process.env.CLOUDINARY_API_KEY!

export async function POST(request: NextRequest) {
  const { user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type))
    return Response.json({ error: 'Invalid file type' }, { status: 400 })

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const folder = `guides/${user.id}`
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${API_SECRET}`)
    .digest('hex')

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', API_KEY)
  body.append('timestamp', timestamp)
  body.append('folder', folder)
  body.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body,
  })

  if (!res.ok) {
    const err = await res.json()
    return Response.json({ error: err.error?.message ?? 'Upload failed' }, { status: 500 })
  }

  const data = await res.json()
  return Response.json({ url: data.secure_url }, { status: 201 })
}
