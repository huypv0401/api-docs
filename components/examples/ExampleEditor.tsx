'use client'

import { useState } from 'react'
import { validateJSON } from '@/lib/validate-json'

interface ExampleEditorProps {
  endpointId: string
  documentId: string
  onSaved: () => void
  onCancel: () => void
}

export function ExampleEditor({ endpointId, documentId, onSaved, onCancel }: ExampleEditorProps) {
  const [type, setType] = useState<'request' | 'response'>('response')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jsonContent, setJsonContent] = useState('')
  const [statusCode, setStatusCode] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJsonChange = (val: string) => {
    setJsonContent(val)
    if (val) {
      const result = validateJSON(val)
      setJsonError(result.isValid ? null : result.error ?? 'Invalid JSON')
    } else {
      setJsonError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !jsonContent) return
    const validation = validateJSON(jsonContent)
    if (!validation.isValid) {
      setJsonError(validation.error ?? 'Invalid JSON')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/documents/${documentId}/endpoints/${endpointId}/examples`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            name,
            description: description || null,
            jsonContent,
            statusCode: statusCode ? parseInt(statusCode) : null,
          }),
        }
      )
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save example')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="ex-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
            Name *
          </label>
          <input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div className="w-32">
          <label htmlFor="ex-type" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
            Type
          </label>
          <select id="ex-type" value={type} onChange={(e) => setType(e.target.value as 'request' | 'response')} className={inputClass}>
            <option value="request">Request</option>
            <option value="response">Response</option>
          </select>
        </div>
        {type === 'response' && (
          <div className="w-24">
            <label htmlFor="ex-status" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
              Status
            </label>
            <input
              id="ex-status"
              type="number"
              min={100}
              max={599}
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              placeholder="200"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="ex-desc" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
          Description
        </label>
        <input id="ex-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="ex-json" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
          JSON Content *
        </label>
        <textarea
          id="ex-json"
          value={jsonContent}
          onChange={(e) => handleJsonChange(e.target.value)}
          required
          rows={6}
          placeholder='{"key": "value"}'
          className={`${inputClass} font-mono`}
          aria-describedby={jsonError ? 'json-error' : undefined}
        />
        {jsonError && (
          <p id="json-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {jsonError}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !!jsonError}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Example'}
        </button>
      </div>
    </form>
  )
}
