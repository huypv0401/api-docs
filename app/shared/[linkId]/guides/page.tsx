import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { GuideList } from '@/components/guides'

interface PageProps {
  params: Promise<{ linkId: string }>
}

export default async function SharedGuidesPage({ params }: PageProps) {
  const { linkId } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: link } = await supabase
    .from('share_links')
    .select('document_id, permission_type')
    .eq('id', linkId)
    .single()
  if (!link) notFound()

  const { data: doc } = await supabase
    .from('api_documents')
    .select('id, title')
    .eq('id', link.document_id)
    .single()
  if (!doc) notFound()

  const serviceSupabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: guides } = await serviceSupabase
    .from('guides')
    .select('id, document_id, title, cover_image_url, created_at, updated_at')
    .eq('document_id', link.document_id)
    .order('created_at', { ascending: true })

  const canEdit = link.permission_type === 'editor'

  const mappedGuides = (guides ?? []).map((g) => ({
    id: g.id,
    documentId: g.document_id,
    title: g.title,
    coverImageUrl: g.cover_image_url,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/shared/${linkId}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
            ← {doc.title}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">Guides</h1>
        </div>
        {canEdit && (
          <Link href={`/shared/${linkId}/guides/new`} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + New Guide
          </Link>
        )}
      </div>
      <GuideList guides={mappedGuides} documentId={doc.id} isOwner={canEdit} linkId={linkId} />
    </div>
  )
}
