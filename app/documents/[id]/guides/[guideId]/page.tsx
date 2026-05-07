import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, GuideRepository } from '@/lib/repositories'
import { GuideDetail } from '@/components/guides'

interface PageProps {
  params: Promise<{ id: string; guideId: string }>
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id, guideId } = await params
  const docRepo = new DocumentRepository(supabase)
  const doc = await docRepo.findById(id, user.id)
  if (!doc) notFound()

  const repo = new GuideRepository(supabase)
  const guide = await repo.findById(guideId, id)
  if (!guide) notFound()

  const isOwner = doc.ownerId === user.id

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link href={`/documents/${id}/guides`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
          ← Guides
        </Link>
      </div>
      <GuideDetail guide={guide} isOwner={isOwner} />
    </div>
  )
}
