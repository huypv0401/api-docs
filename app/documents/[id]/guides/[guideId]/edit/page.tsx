import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, GuideRepository } from '@/lib/repositories'
import { GuideEditor } from '@/components/guides'

interface PageProps {
  params: Promise<{ id: string; guideId: string }>
}

export default async function EditGuidePage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id, guideId } = await params
  const docRepo = new DocumentRepository(supabase)
  const doc = await docRepo.findById(id, user.id)
  if (!doc) notFound()
  if (doc.ownerId !== user.id) redirect(`/documents/${id}/guides/${guideId}`)

  const repo = new GuideRepository(supabase)
  const guide = await repo.findById(guideId, id)
  if (!guide) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-zinc-100">Edit Guide</h1>
      <GuideEditor guide={guide} documentId={id} mode="edit" />
    </div>
  )
}
