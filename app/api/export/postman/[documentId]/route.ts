import { NextRequest } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { PostmanPrinter } from '@/lib/postman-printer'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { supabase, user } = await getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = await params
  const repo = new DocumentRepository(supabase)
  const doc = await repo.findById(documentId, user.id)
  if (!doc) return Response.json({ error: 'Not found or access denied' }, { status: 404 })

  // Check for raw postman JSON
  const { data: raw } = await supabase
    .from('api_documents')
    .select('raw_postman, title')
    .eq('id', documentId)
    .single()

  const filename = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.postman_collection.json`
  const collection = raw?.raw_postman ?? new PostmanPrinter().print(doc)

  return new Response(JSON.stringify(collection, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
