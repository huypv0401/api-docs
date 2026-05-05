'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Document, Endpoint } from '@/lib/types'
import { EndpointForm } from './EndpointForm'

interface DocumentEditorProps {
  document?: Document
  mode: 'create' | 'edit'
}

const DRAFT_KEY = 'api-docs-draft'

export function DocumentEditor({ document, mode }: DocumentEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(document?.title ?? '')
  const [description, setDescription] = useState(document?.description ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEndpointForm, setShowEndpointForm] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null)

  // Auto-save draft to localStorage for create mode
  useEffect(() => {
    if (mode === 'create') {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        try {
          const { title: t, description: d } = JSON.parse(draft)
          if (t) setTitle(t)
          if (d) setDescription(d)
        } catch {}
      }
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'create') {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description }))
    }
  }, [title, description, mode])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    setError(null)

    try {
      const url = mode === 'create' ? '/api/documents' : `/api/documents/${document!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }

      const saved = await res.json()
      if (mode === 'create') {
        localStorage.removeItem(DRAFT_KEY)
        router.push(`/documents/${saved.id}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddEndpoint = async (data: Parameters<React.ComponentProps<typeof EndpointForm>['onSubmit']>[0]) => {
    const docId = document?.id
    if (!docId) return

    const res = await fetch(`/api/documents/${docId}/endpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        method: data.method,
        url: data.url,
        headers: Object.fromEntries(data.headers.filter((h) => h.key).map((h) => [h.key, h.value])),
        queryParams: Object.fromEntries(data.queryParams.filter((q) => q.key).map((q) => [q.key, q.value])),
        body: data.body || null,
        description: data.description || null,
      }),
    })

    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error ?? 'Failed to add endpoint')
    }

    setShowEndpointForm(false)
    router.refresh()
  }

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="doc-title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Title *
          </label>
          <input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="My API Documentation"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="doc-desc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            id="doc-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe your API..."
            className={inputClass}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Document' : 'Save Changes'}
          </button>
        </div>
      </form>

      {mode === 'edit' && document && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              Endpoints ({document.endpoints.length})
            </h3>
            <button
              onClick={() => { setShowEndpointForm(true); setEditingEndpoint(null) }}
              className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              + Add Endpoint
            </button>
          </div>

          {showEndpointForm && (
            <div className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-700">
              <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-zinc-100">New Endpoint</h4>
              <EndpointForm
                initial={editingEndpoint ?? undefined}
                onSubmit={handleAddEndpoint}
                onCancel={() => setShowEndpointForm(false)}
              />
            </div>
          )}

          {document.endpoints.length === 0 && !showEndpointForm && (
            <p className="text-sm text-gray-500 dark:text-zinc-400">No endpoints yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
