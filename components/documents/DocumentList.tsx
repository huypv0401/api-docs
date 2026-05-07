'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Markdown } from '@/components/ui/Markdown'
import type { DocumentSummary } from '@/lib/types'

function DeleteDialog({ doc, onClose }: { doc: DocumentSummary; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-zinc-100">Delete document</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
          This action cannot be undone. Type <span className="font-mono font-medium text-red-600 dark:text-red-400">"{doc.title}"</span> to confirm.
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={doc.title}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={input !== doc.title || loading}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DocumentListProps {
  documents: DocumentSummary[]
  filter: 'owned' | 'shared' | 'all'
  userId: string
}

export function DocumentList({ documents, filter, userId }: DocumentListProps) {
  const [deleting, setDeleting] = useState<DocumentSummary | null>(null)

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
    <>
      {deleting && <DeleteDialog doc={deleting} onClose={() => setDeleting(null)} />}
      <div className="space-y-4">
        {documents.map((doc) => {
          const isOwner = doc.ownerId === userId
          return (
            <div key={doc.id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/documents/${doc.id}`} className="truncate text-base font-semibold text-gray-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400">
                      {doc.title}
                    </Link>
                    {!isOwner && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Shared</span>
                    )}
                  </div>
                  {doc.description && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                      <Markdown>{doc.description}</Markdown>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/documents/${doc.id}`} className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                    Open
                  </Link>
                  {isOwner && (
                    <button onClick={() => setDeleting(doc)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      aria-label={`Delete ${doc.title}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
