import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository } from '@/lib/repositories'
import { DocumentEditor } from '@/components/documents/DocumentEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditDocumentPage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const repo = new DocumentRepository(supabase)
  const doc = await repo.findById(id, user.id)
  if (!doc) notFound()
  if (doc.ownerId !== user.id) redirect(`/documents/${id}`)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-zinc-100">Edit Document</h1>
      <DocumentEditor document={doc} mode="edit" />
    </div>
  )
}
