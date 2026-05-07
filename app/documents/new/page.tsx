import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { DocumentEditor } from '@/components/documents/DocumentEditor'
import { PostmanImport } from '@/components/import-export/PostmanImport'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function NewDocumentPage({ searchParams }: PageProps) {
  const { user } = await getUser()
  if (!user) redirect('/login')

  const { tab = 'create' } = await searchParams
  const isImport = tab === 'import'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
          ← Documents
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">New Document</h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-zinc-700">
        <Link
          href="/documents/new?tab=create"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
            !isImport
              ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Create new
        </Link>
        <Link
          href="/documents/new?tab=import"
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
            isImport
              ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Import from Postman
        </Link>
      </div>

      {isImport ? <PostmanImport /> : <DocumentEditor mode="create" />}
    </div>
  )
}
