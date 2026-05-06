'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function PostmanOverwriteButton({ documentId }: { documentId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setError(null)
    try {
      const json = JSON.parse(await file.text())
      const res = await fetch(`/api/import/postman?documentId=${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
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
        {isLoading ? 'Importing...' : 'Import Postman'}
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="sr-only" />
      </label>
      {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </>
  )
}
