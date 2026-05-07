import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { GuideEditor } from '@/components/guides'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NewGuidePage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const perm = await new DocumentRepository(supabase).getPermission(id, user.id)
  if (!perm) notFound()
  if (perm === 'viewer') redirect(`/documents/${id}/guides`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-zinc-100">New Guide</h1>
      <GuideEditor documentId={id} mode="create" />
    </div>
  )
}
