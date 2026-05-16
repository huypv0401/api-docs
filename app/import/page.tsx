import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { ApiImport } from '@/components/import-export/ApiImport'

export default async function ImportPage() {
  const { user } = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/documents" className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
          ← Documents
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">Import API Collection</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
          Upload a Postman Collection v2.1 or OpenAPI 3.x (JSON or YAML) file.
        </p>
      </div>
      <ApiImport />
    </div>
  )
}
