'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function PostmanImport() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ id: string; title: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error('File is not valid JSON')
      }

      const res = await fetch('/api/import/postman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? data.detail ?? 'Import failed')
      setSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="postman-file"
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isLoading
              ? 'border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800/50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10'
          }`}
        >
          <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            {isLoading ? 'Importing...' : 'Click to upload Postman collection'}
          </span>
          <span className="mt-1 text-xs text-gray-500 dark:text-zinc-400">JSON file (Postman v2.1)</span>
          <input
            id="postman-file"
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFile}
            disabled={isLoading}
            className="sr-only"
            aria-label="Upload Postman collection file"
          />
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <strong>Import failed:</strong> {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            Successfully imported "{success.title}".{' '}
            <a
              href={`/documents/${success.id}`}
              className="font-medium underline hover:no-underline"
              onClick={() => router.push(`/documents/${success.id}`)}
            >
              View document →
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
