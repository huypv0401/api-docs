'use client'

import { useState } from 'react'

export function SharedExportButton({ linkId, title }: { linkId: string; title: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/shared/${linkId}/export`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.postman_collection.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button onClick={handleExport} disabled={isLoading}
      className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
      {isLoading ? 'Exporting...' : 'Export Postman'}
    </button>
  )
}
