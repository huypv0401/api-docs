'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Markdown } from '@/components/ui/Markdown'
import type { Guide } from '@/lib/types'

interface GuideEditorProps {
  guide?: Guide
  documentId: string
  mode: 'create' | 'edit'
  linkId?: string // present when editing via shared link
}

export function GuideEditor({ guide, documentId, mode, linkId }: GuideEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(guide?.title ?? '')
  const [content, setContent] = useState(guide?.content ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(guide?.coverImageUrl ?? '')
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/guides/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      return url as string
    } finally {
      setUploading(false)
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setCoverImageUrl(await uploadImage(file)) }
    catch { setError('Failed to upload cover image') }
  }

  const handleContentImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadImage(file)
      setContent((prev) => prev + `\n![image](${url})\n`)
    } catch { setError('Failed to upload image') }
    e.target.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const apiUrl = mode === 'create'
        ? `/api/documents/${documentId}/guides`
        : `/api/documents/${documentId}/guides/${guide!.id}`
      const res = await fetch(apiUrl, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content, coverImageUrl: coverImageUrl.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      const saved = await res.json()
      const savedId = mode === 'create' ? saved.id : guide!.id
      const redirectTo = linkId
        ? `/shared/${linkId}/guides/${savedId}`
        : `/documents/${documentId}/guides/${savedId}`
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="guide-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Title *</label>
        <input id="guide-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Guide title" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">Cover Image</label>
        {linkId ? (
          // Shared context: URL input only, no upload
          <input type="text" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." className={inputClass} />
        ) : (
          <div className="flex items-center gap-2">
            <input type="text" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." className={`${inputClass} flex-1`} />
            <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>
        )}
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="Cover preview" className="mt-2 h-24 rounded object-cover" />
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="guide-content" className="text-sm font-medium text-gray-700 dark:text-zinc-300">Content (Markdown)</label>
          <div className="flex gap-2">
            {!linkId && (
              <label className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800">
                + Image
                <input type="file" accept="image/*" className="hidden" onChange={handleContentImage} />
              </label>
            )}
            <button type="button" onClick={() => setPreview((p) => !p)}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800">
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>
        {preview ? (
          <div className="min-h-48 rounded border border-gray-300 p-3 text-sm dark:border-zinc-600 dark:text-zinc-100">
            {content ? <Markdown>{content}</Markdown> : <span className="text-gray-400">Nothing to preview</span>}
          </div>
        ) : (
          <textarea id="guide-content" value={content} onChange={(e) => setContent(e.target.value)}
            rows={16} placeholder="Write your guide in Markdown…" className={`${inputClass} font-mono text-xs`} />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Guide' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
