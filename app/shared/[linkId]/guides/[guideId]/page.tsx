import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { GuideDetail } from '@/components/guides'

interface PageProps {
  params: Promise<{ linkId: string; guideId: string }>
}

export default async function SharedGuideDetailPage({ params }: PageProps) {
  const { linkId, guideId } = await params
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

  const serviceSupabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: guide } = await serviceSupabase
    .from('guides')
    .select('*')
    .eq('id', guideId)
    .eq('document_id', link.document_id)
    .single()
  if (!guide) notFound()

  const mappedGuide = {
    id: guide.id,
    documentId: guide.document_id,
    title: guide.title,
    content: guide.content,
    coverImageUrl: guide.cover_image_url,
    createdAt: guide.created_at,
    updatedAt: guide.updated_at,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link href={`/shared/${linkId}/guides`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400">
          ← Guides
        </Link>
      </div>
      <GuideDetail guide={mappedGuide} isOwner={link.permission_type === 'editor'} linkId={linkId} />
    </div>
  )
}
