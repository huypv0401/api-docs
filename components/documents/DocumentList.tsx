import Link from 'next/link'
import type { DocumentSummary } from '@/lib/types'

interface DocumentListProps {
  documents: DocumentSummary[]
  filter: 'owned' | 'shared' | 'all'
}

export function DocumentList({ documents, filter }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {filter === 'shared' ? 'No documents shared with you.' : 'No documents yet. Create your first one!'}
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-zinc-800" role="list">
      {documents.map((doc) => (
        <li key={doc.id} className="py-4">
          <Link
            href={`/documents/${doc.id}`}
            className="group flex items-start justify-between gap-4 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                  {doc.title}
                </h3>
                {!doc.isOwner && (
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Shared
                  </span>
                )}
              </div>
              {doc.description && (
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-zinc-400">{doc.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                Updated {new Date(doc.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
