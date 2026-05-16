'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { detectFormat } from '@/lib/format-detector'

async function parseFile(file: File): Promise<unknown> {
  const text = await file.text()
  if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
    const yaml = (await import('js-yaml')).default
    return yaml.load(text)
  }
  return JSON.parse(text)
}

const FORMAT_ENDPOINTS: Record<string, string> = {
  postman: '/api/import/postman',
  openapi: '/api/import/openapi',
}

export function PostmanOverwriteButton({ documentId }: { documentId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true); setError(null)
    try {
      let parsed: unknown
      try { parsed = await parseFile(file) } catch { throw new Error('File could not be parsed as JSON or YAML') }

      const format = detectFormat(parsed)
      const endpoint = FORMAT_ENDPOINTS[format]
      if (!endpoint) throw new Error('Unrecognized format. Upload a Postman Collection v2.1 or OpenAPI 3.x file.')

      const res = await fetch(`${endpoint}?documentId=${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? data.detail ?? 'Import failed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <label className={`inline-flex cursor-pointer items-center rounded bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
        {isLoading ? 'Importing...' : 'Import'}
        <input ref={fileRef} type="file" accept=".json,.yaml,.yml,application/json" onChange={handleFile} className="sr-only" />
      </label>
      {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </>
  )
}
