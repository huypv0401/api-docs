'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { GuideSummary } from '@/lib/types'

interface GuideListProps {
  guides: GuideSummary[]
  documentId: string
  isOwner: boolean
}

export function GuideList({ guides, documentId, isOwner }: GuideListProps) {
  const router = useRouter()

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/documents/${documentId}/guides/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (guides.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-zinc-700">
        <p className="text-sm text-gray-500 dark:text-zinc-400">No guides yet.</p>
        {isOwner && (
          <Link
            href={`/documents/${documentId}/guides/new`}
            className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Add a guide
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {guides.map((guide) => (
        <div
          key={guide.id}
          className="flex flex-col rounded-lg border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        >
          {guide.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={guide.coverImageUrl} alt="" className="h-28 w-full rounded-t-lg object-cover" />
          )}
          <div className="flex flex-1 flex-col p-3">
            <Link
              href={`/documents/${documentId}/guides/${guide.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
            >
              {guide.title}
            </Link>
            {isOwner && (
              <div className="mt-2 flex gap-3">
                <Link
                  href={`/documents/${documentId}/guides/${guide.id}/edit`}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(guide.id, guide.title)}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
