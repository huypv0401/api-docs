import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { DocumentEditor } from '@/components/documents/DocumentEditor'

export default async function NewDocumentPage() {
  const { user } = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-zinc-100">New Document</h1>
      <DocumentEditor mode="create" />
    </div>
  )
}
