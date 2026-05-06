import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'
import { DocumentRepository } from '@/lib/repositories'
import { PostmanPrinter } from '@/lib/postman-printer'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: link } = await supabase
    .from('share_links')
    .select('document_id')
    .eq('id', linkId)
    .single()

  if (!link) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: raw } = await supabase
    .from('api_documents')
    .select('raw_postman, title, owner_id')
    .eq('id', link.document_id)
    .single()

  if (!raw) return Response.json({ error: 'Not found' }, { status: 404 })

  let collection = raw.raw_postman
  if (!collection) {
    const repo = new DocumentRepository(supabase)
    const doc = await repo.findById(link.document_id, raw.owner_id)
    if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })
    collection = new PostmanPrinter().print(doc)
  }

  const filename = `${(raw.title as string).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.postman_collection.json`
  return new Response(JSON.stringify(collection, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
