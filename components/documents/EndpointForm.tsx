'use client'

import { useState } from 'react'
import type { HTTPMethod, Endpoint } from '@/lib/types'
import { HTTP_METHODS } from '@/lib/types'
import { validateJSON } from '@/lib/validate-json'

interface KeyValuePair {
  key: string
  value: string
}

interface EndpointFormData {
  name: string
  method: HTTPMethod
  url: string
  headers: KeyValuePair[]
  queryParams: KeyValuePair[]
  body: string
  description: string
}

interface EndpointFormProps {
  initial?: Partial<Endpoint>
  onSubmit: (data: EndpointFormData) => Promise<void>
  onCancel: () => void
}

function KVEditor({
  label,
  pairs,
  onChange,
}: {
  label: string
  pairs: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
}) {
  const add = () => onChange([...pairs, { key: '', value: '' }])
  const remove = (i: number) => onChange(pairs.filter((_, idx) => idx !== i))
  const update = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...pairs]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">{label}</label>
        <button type="button" onClick={add} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          + Add
        </button>
      </div>
      {pairs.map((pair, i) => (
        <div key={i} className="mb-1 flex gap-2">
          <input
            value={pair.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            placeholder="Key"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label={`${label} key ${i + 1}`}
          />
          <input
            value={pair.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label={`${label} value ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs text-red-500 hover:text-red-700"
            aria-label={`Remove ${label} ${i + 1}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function toKV(obj: Record<string, string>): KeyValuePair[] {
  return Object.entries(obj).map(([key, value]) => ({ key, value }))
}

function fromKV(pairs: KeyValuePair[]): Record<string, string> {
  return Object.fromEntries(pairs.filter((p) => p.key).map((p) => [p.key, p.value]))
}

export function EndpointForm({ initial, onSubmit, onCancel }: EndpointFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [method, setMethod] = useState<HTTPMethod>(initial?.method ?? 'GET')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [headers, setHeaders] = useState<KeyValuePair[]>(toKV(initial?.headers ?? {}))
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>(toKV(initial?.queryParams ?? {}))
  const [body, setBody] = useState(initial?.body ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [bodyError, setBodyError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBodyChange = (val: string) => {
    setBody(val)
    if (val && !validateJSON(val).isValid) {
      setBodyError('Invalid JSON')
    } else {
      setBodyError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !url) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name, method, url, headers, queryParams, body, description })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save endpoint')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="ep-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
          Name *
        </label>
        <input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
      </div>

      <div className="flex gap-3">
        <div className="w-32">
          <label htmlFor="ep-method" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
            Method *
          </label>
          <select
            id="ep-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as HTTPMethod)}
            className={inputClass}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="ep-url" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
            URL *
          </label>
          <input
            id="ep-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://api.example.com/endpoint"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ep-desc" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
          Description
        </label>
        <textarea
          id="ep-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <KVEditor label="Headers" pairs={headers} onChange={setHeaders} />
      <KVEditor label="Query Parameters" pairs={queryParams} onChange={setQueryParams} />

      <div>
        <label htmlFor="ep-body" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">
          Body (JSON)
        </label>
        <textarea
          id="ep-body"
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={4}
          placeholder='{"key": "value"}'
          className={`${inputClass} font-mono`}
          aria-describedby={bodyError ? 'body-error' : undefined}
        />
        {bodyError && (
          <p id="body-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
            {bodyError}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !!bodyError}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Endpoint'}
        </button>
      </div>
    </form>
  )
}
