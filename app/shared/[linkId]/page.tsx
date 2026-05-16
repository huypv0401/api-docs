import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { DocumentRepository } from '@/lib/repositories'
import { SharedDocumentPageClient } from '@/components/sharing/SharedDocumentPageClient'

interface PageProps {
  params: Promise<{ linkId: string }>
}

export default async function SharedDocumentPage({ params }: PageProps) {
  const { linkId } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: link } = await supabase
    .from('share_links')
    .select('document_id, permission_type')
    .eq('id', linkId)
    .single()

  if (!link) notFound()

  const { data: meta } = await supabase
    .from('api_documents')
    .select('owner_id')
    .eq('id', link.document_id)
    .single()

  if (!meta) notFound()

  const repo = new DocumentRepository(supabase)
  const doc = await repo.findById(link.document_id, meta.owner_id)
  if (!doc) notFound()

  return (
    <SharedDocumentPageClient
      doc={doc}
      linkId={linkId}
      canEdit={link.permission_type === 'editor'}
    />
  )
}
