import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { GuideEditor } from '@/components/guides'

interface PageProps {
  params: Promise<{ linkId: string; guideId: string }>
}

export default async function SharedEditGuidePage({ params }: PageProps) {
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
  if (link.permission_type !== 'editor') redirect(`/shared/${linkId}/guides/${guideId}`)

  const serviceSupabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: g } = await serviceSupabase
    .from('guides')
    .select('*')
    .eq('id', guideId)
    .eq('document_id', link.document_id)
    .single()
  if (!g) notFound()

  const guide = {
    id: g.id,
    documentId: g.document_id,
    title: g.title,
    content: g.content,
    coverImageUrl: g.cover_image_url,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-zinc-100">Edit Guide</h1>
      <GuideEditor guide={guide} documentId={link.document_id} mode="edit" linkId={linkId} />
    </div>
  )
}
