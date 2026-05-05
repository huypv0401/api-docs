import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { DocumentList } from '@/components/documents/DocumentList'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { filter = 'all' } = await searchParams
  const validFilter = ['owned', 'shared', 'all'].includes(filter) ? (filter as 'owned' | 'shared' | 'all') : 'all'

  const repo = new DocumentRepository(supabase)
  const documents = await repo.findAllByUser(user.id, validFilter)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">API Documents</h1>
        <Link
          href="/documents/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          New Document
        </Link>
      </div>

      <div className="mb-4 flex gap-2" role="tablist" aria-label="Filter documents">
        {(['all', 'owned', 'shared'] as const).map((f) => (
          <Link
            key={f}
            href={`/documents?filter=${f}`}
            role="tab"
            aria-selected={validFilter === f}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              validFilter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      <DocumentList documents={documents} filter={validFilter} />
    </div>
  )
}
