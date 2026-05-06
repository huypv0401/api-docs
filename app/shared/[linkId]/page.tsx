import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { DocumentRepository } from '@/lib/repositories'
import { EndpointDetail } from '@/components/documents/EndpointDetail'
import { Markdown } from '@/components/ui/Markdown'
import { SharedExportButton } from '@/components/import-export/SharedExportButton'
import { SharedImportButton } from '@/components/import-export/SharedImportButton'

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

  const canEdit = link.permission_type === 'editor'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${canEdit ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
              {canEdit ? 'Can edit' : 'View only'}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">Shared document</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{doc.title}</h1>
          {doc.description && (
            <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              <Markdown>{doc.description}</Markdown>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SharedExportButton linkId={linkId} title={doc.title} />
          {canEdit && <SharedImportButton documentId={doc.id} />}
        </div>
      </div>

      {doc.endpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-gray-500 dark:text-zinc-400">No endpoints.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {doc.endpoints.map((endpoint) => (
            <EndpointDetail key={endpoint.id} endpoint={endpoint} documentId={doc.id} isOwner={canEdit} />
          ))}
        </div>
      )}
    </div>
  )
}
