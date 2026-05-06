import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { DocumentRepository, SharePermissionRepository } from '@/lib/repositories'
import { ShareDialog } from '@/components/sharing/ShareDialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShareDocumentPage({ params }: PageProps) {
  const { supabase, user } = await getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const docRepo = new DocumentRepository(supabase)
  const doc = await docRepo.findById(id, user.id)
  if (!doc) notFound()
  if (doc.ownerId !== user.id) redirect(`/documents/${id}`)

  const shareRepo = new SharePermissionRepository(supabase)
  const [permissions, shareLinks] = await Promise.all([
    shareRepo.findByDocumentId(id),
    shareRepo.findShareLinks(id),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href={`/documents/${id}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
          ← Back to document
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">Share "{doc.title}"</h1>
      </div>
      <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-700">
        <ShareDialog documentId={id} ownerId={user.id} permissions={permissions} shareLinks={shareLinks} />
      </div>
    </div>
  )
}
