'use client'

import { useState } from 'react'
import type { Endpoint } from '@/lib/types'
import { EndpointDetail } from './EndpointDetail'

interface EndpointListProps {
  endpoints: Endpoint[]
  documentId: string
  isOwner: boolean
}

export function EndpointList({ endpoints, documentId, isOwner }: EndpointListProps) {
  const [allExpanded, setAllExpanded] = useState(true)
  const [key, setKey] = useState(0) // force remount on toggle to reset individual states

  const toggle = (expand: boolean) => {
    setAllExpanded(expand)
    setKey((k) => k + 1)
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button onClick={() => toggle(true)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          Expand all
        </button>
        <span className="text-xs text-gray-300 dark:text-zinc-600">|</span>
        <button onClick={() => toggle(false)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          Collapse all
        </button>
      </div>
      <div className="space-y-4">
        {endpoints.map((endpoint) => (
          <EndpointDetail
            key={`${endpoint.id}-${key}`}
            endpoint={endpoint}
            documentId={documentId}
            isOwner={isOwner}
            initialExpanded={allExpanded}
          />
        ))}
      </div>
    </div>
  )
}
