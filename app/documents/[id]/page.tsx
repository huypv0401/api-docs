import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { EndpointList } from '@/components/documents/EndpointList'
import { ExportButton } from '@/components/import-export/ExportButton'
import { ImportButton } from '@/components/import-export/ImportButton'
import { Markdown } from '@/components/ui/Markdown'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const repo = new DocumentRepository(supabase)
  const doc = await repo.findById(id, user.id)
  if (!doc) notFound()

  const isOwner = doc.ownerId === user.id

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
            ← Documents
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">{doc.title}</h1>
          {doc.description && (
            <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              <Markdown>{doc.description}</Markdown>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButton documentId={id} title={doc.title} />
          <Link href={`/documents/${id}/guides`} className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            Guides
          </Link>
          {isOwner && (
            <>
              <ImportButton documentId={id} />
              <Link href={`/documents/${id}/edit`} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Edit
              </Link>
              <Link href={`/documents/${id}/share`} className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                Share
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Endpoints */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-zinc-100">Endpoints</h2>
        {doc.endpoints.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-zinc-400">No endpoints yet.</p>
            {isOwner && (
              <Link href={`/documents/${id}/edit`} className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
                Add endpoints
              </Link>
            )}
          </div>
        ) : (
          <EndpointList endpoints={doc.endpoints} documentId={id} isOwner={isOwner} />
        )}
      </section>
    </div>
  )
}
