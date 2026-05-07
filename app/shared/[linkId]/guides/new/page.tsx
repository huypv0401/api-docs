import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import { GuideEditor } from '@/components/guides'

interface PageProps {
  params: Promise<{ linkId: string }>
}

export default async function SharedNewGuidePage({ params }: PageProps) {
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
  if (link.permission_type !== 'editor') redirect(`/shared/${linkId}/guides`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-zinc-100">New Guide</h1>
      <GuideEditor documentId={link.document_id} mode="create" linkId={linkId} />
    </div>
  )
}
