import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { DocumentRepository } from '@/lib/repositories'
import { EndpointDetail } from '@/components/documents/EndpointDetail'
import { Markdown } from '@/components/ui/Markdown'

interface PageProps {
  params: Promise<{ linkId: string }>
}

export default async function SharedDocumentPage({ params }: PageProps) {
  const { linkId } = await params
  const cookieStore = await cookies()

  // Use service-role-like anon client to look up the share link (no RLS on share_links needed)
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // Resolve the share link
  const { data: link } = await supabase
    .from('share_links')
    .select('document_id, permission_type')
    .eq('id', linkId)
    .single()

  if (!link) notFound()

  // Fetch the document as the owner (bypass per-user RLS by using document_id directly)
  const { data: doc } = await supabase
    .from('api_documents')
    .select('id, title, description, owner_id')
    .eq('id', link.document_id)
    .single()

  if (!doc) notFound()

  const docRepo = new DocumentRepository(supabase)
  // findById needs a userId — use owner_id so RLS passes
  const fullDoc = await docRepo.findById(doc.id, doc.owner_id)
  if (!fullDoc) notFound()

  const canEdit = link.permission_type === 'editor'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${canEdit ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
            {canEdit ? 'Can edit' : 'View only'}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Shared document</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{fullDoc.title}</h1>
        {fullDoc.description && (
          <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            <Markdown>{fullDoc.description}</Markdown>
          </div>
        )}
      </div>

      {fullDoc.endpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-gray-500 dark:text-zinc-400">No endpoints.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fullDoc.endpoints.map((endpoint) => (
            <EndpointDetail
              key={endpoint.id}
              endpoint={endpoint}
              documentId={fullDoc.id}
              isOwner={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
