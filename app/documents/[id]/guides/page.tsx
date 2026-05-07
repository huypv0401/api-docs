import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, GuideRepository } from '@/lib/repositories'
import { GuideList } from '@/components/guides'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentGuidesPage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const docRepo = new DocumentRepository(supabase)
  const perm = await docRepo.getPermission(id, user.id)
  if (!perm) notFound()

  const canEdit = perm === 'owner' || perm === 'editor'
  const doc = await docRepo.findById(id, user.id)

  const guides = await new GuideRepository(supabase).findAllByDocument(id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/documents/${id}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
            ← {doc?.title}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">Guides</h1>
        </div>
        {canEdit && (
          <Link href={`/documents/${id}/guides/new`} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + New Guide
          </Link>
        )}
      </div>
      <GuideList guides={guides} documentId={id} isOwner={canEdit} />
    </div>
  )
}
