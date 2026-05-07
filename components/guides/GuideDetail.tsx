import Link from 'next/link'
import { Markdown } from '@/components/ui/Markdown'
import type { Guide } from '@/lib/types'

interface GuideDetailProps {
  guide: Guide
  isOwner: boolean
  linkId?: string
}

export function GuideDetail({ guide, isOwner, linkId }: GuideDetailProps) {
  const editHref = linkId
    ? `/shared/${linkId}/guides/${guide.id}/edit`
    : `/documents/${guide.documentId}/guides/${guide.id}/edit`

  return (
    <article>
      {guide.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={guide.coverImageUrl} alt="" className="mb-6 h-48 w-full rounded-lg object-cover sm:h-64" />
      )}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{guide.title}</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            Updated {new Date(guide.updatedAt).toLocaleDateString()}
          </p>
        </div>
        {isOwner && (
          <Link href={editHref} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Edit
          </Link>
        )}
      </div>
      {guide.content ? (
        <div className="prose-sm max-w-none text-gray-700 dark:text-zinc-300">
          <Markdown>{guide.content}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-zinc-500">No content yet.</p>
      )}
    </article>
  )
}
