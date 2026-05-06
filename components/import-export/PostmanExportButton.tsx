'use client'

import { useState } from 'react'

interface PostmanExportButtonProps {
  documentId: string
  title: string
}

export function PostmanExportButton({ documentId, title }: PostmanExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/export/postman/${documentId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.postman_collection.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        aria-label="Export as Postman collection"
      >
        {isLoading ? 'Exporting...' : 'Export Postman'}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
