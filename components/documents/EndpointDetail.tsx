'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Endpoint } from '@/lib/types'
import { ExampleList } from '@/components/examples/ExampleList'
import { CodeSnippetGenerator } from '@/components/codegen/CodeSnippetGenerator'
import { Markdown } from '@/components/ui/Markdown'

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HEAD: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  OPTIONS: 'bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-zinc-300',
}

interface EndpointDetailProps {
  endpoint: Endpoint
  documentId: string
  isOwner: boolean
  initialExpanded?: boolean
}

export function EndpointDetail({ endpoint, documentId, isOwner, initialExpanded = true }: EndpointDetailProps) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const [activeTab, setActiveTab] = useState<'details' | 'examples' | 'codegen'>('details')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Delete this endpoint?')) return
    setIsDeleting(true)
    await fetch(`/api/documents/${documentId}/endpoints/${endpoint.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
        aria-expanded={expanded}
      >
        <span className={`shrink-0 self-start rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[endpoint.method] ?? METHOD_COLORS.OPTIONS}`}>
          {endpoint.method}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm text-gray-900 dark:text-zinc-100">{endpoint.url}</div>
          <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">{endpoint.name}</div>
        </div>
        <span className="shrink-0 text-gray-400" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-zinc-700">
          <div className="flex gap-1 border-b border-gray-200 px-4 dark:border-zinc-700" role="tablist">
            {(['details', 'examples', 'codegen'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'
                }`}
              >
                {tab === 'codegen' ? 'Code' : tab}
              </button>
            ))}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="ml-auto px-3 py-2 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                aria-label="Delete endpoint"
              >
                Delete
              </button>
            )}
          </div>

          <div className="p-4">
            {activeTab === 'details' && (
              <div className="space-y-3 text-sm">
                {endpoint.description && (
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    <Markdown>{endpoint.description}</Markdown>
                  </div>
                )}
                {Object.keys(endpoint.headers).length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-700 dark:text-zinc-300">Headers</h4>
                    <dl className="space-y-1">
                      {Object.entries(endpoint.headers).map(([k, v]) => (
                        <div key={k} className="flex gap-2 font-mono text-xs">
                          <dt className="text-gray-500 dark:text-zinc-400">{k}:</dt>
                          <dd className="text-gray-900 dark:text-zinc-100">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {Object.keys(endpoint.queryParams).length > 0 && (
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-700 dark:text-zinc-300">Query Parameters</h4>
                    <dl className="space-y-1">
                      {Object.entries(endpoint.queryParams).map(([k, v]) => (
                        <div key={k} className="flex gap-2 font-mono text-xs">
                          <dt className="text-gray-500 dark:text-zinc-400">{k}:</dt>
                          <dd className="text-gray-900 dark:text-zinc-100">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {endpoint.body && (
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-gray-700 dark:text-zinc-300">Body</h4>
                    <pre className="overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {endpoint.body}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'examples' && (
              <ExampleList
                examples={endpoint.examples}
                endpointId={endpoint.id}
                documentId={documentId}
                isOwner={isOwner}
                method={endpoint.method}
                url={endpoint.url}
                headers={endpoint.headers}
              />
            )}

            {activeTab === 'codegen' && (
              <CodeSnippetGenerator
                method={endpoint.method}
                url={endpoint.url}
                headers={endpoint.headers}
                queryParams={endpoint.queryParams}
                body={endpoint.body ?? undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
