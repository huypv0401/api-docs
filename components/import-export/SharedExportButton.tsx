'use client'

import { useRef, useState } from 'react'

const FORMATS = [
  { label: 'Export Postman', format: 'postman', ext: 'postman_collection.json' },
  { label: 'Export OpenAPI', format: 'openapi', ext: 'openapi.json' },
]

export function SharedExportButton({ linkId, title }: { linkId: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const handleExport = async (fmt: (typeof FORMATS)[number]) => {
    setOpen(false); setIsLoading(true); setError(null)
    try {
      const res = await fetch(`/api/shared/${linkId}/export?format=${fmt.format}`)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Export failed') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fmt.ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {isLoading ? 'Exporting…' : 'Export'}
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded border border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            {FORMATS.map((fmt) => (
              <button
                key={fmt.format}
                onClick={() => handleExport(fmt)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
