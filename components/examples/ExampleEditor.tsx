'use client'

import { useState } from 'react'
import { validateJSON } from '@/lib/validate-json'

interface ExampleEditorProps {
  endpointId: string
  documentId: string
  onSaved: () => void
  onCancel: () => void
}

function JsonField({
  id, label, value, onChange, error, placeholder, rows = 5,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; error: string | null
  placeholder?: string; rows?: number
}) {
  const base = 'w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder ?? '{"key": "value"}'} className={base} />
      {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function ExampleEditor({ endpointId, documentId, onSaved, onCancel }: ExampleEditorProps) {
  const [name, setName] = useState('')
  const [statusCode, setStatusCode] = useState('')
  const [requestJson, setRequestJson] = useState('')
  const [responseJson, setResponseJson] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [responseError, setResponseError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (val: string, setErr: (e: string | null) => void) => {
    if (!val) { setErr(null); return true }
    const r = validateJSON(val)
    setErr(r.isValid ? null : (r.error ?? 'Invalid JSON'))
    return r.isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    if (!requestJson && !responseJson) {
      setError('Provide at least a request or response JSON.')
      return
    }
    const reqOk = requestJson ? validate(requestJson, setRequestError) : true
    const resOk = responseJson ? validate(responseJson, setResponseError) : true
    if (!reqOk || !resOk) return

    setIsSubmitting(true)
    setError(null)
    try {
      const url = `/api/documents/${documentId}/endpoints/${endpointId}/examples`
      const saves = []
      if (requestJson) saves.push(fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'request', name, jsonContent: requestJson }),
      }))
      if (responseJson) saves.push(fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'response', name, jsonContent: responseJson, statusCode: statusCode ? parseInt(statusCode) : null }),
      }))
      const results = await Promise.all(saves)
      for (const res of results) {
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed to save') }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="ex-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">Name *</label>
          <input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. hotel" className={inputClass} />
        </div>
        <div className="w-24">
          <label htmlFor="ex-status" className="mb-1 block text-xs font-medium text-gray-700 dark:text-zinc-300">Status</label>
          <input id="ex-status" type="number" min={100} max={599} value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)} placeholder="200" className={inputClass} />
        </div>
      </div>

      <JsonField id="ex-req" label="Request JSON" value={requestJson}
        onChange={(v) => { setRequestJson(v); validate(v, setRequestError) }} error={requestError} />

      <JsonField id="ex-res" label="Response JSON" value={responseJson}
        onChange={(v) => { setResponseJson(v); validate(v, setResponseError) }} error={responseError} />

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !!requestError || !!responseError}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Example'}
        </button>
      </div>
    </form>
  )
}
