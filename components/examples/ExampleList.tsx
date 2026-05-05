'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Example } from '@/lib/types'
import { ExampleEditor } from './ExampleEditor'

interface ExampleListProps {
  examples: Example[]
  endpointId: string
  documentId: string
  isOwner: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
      aria-label="Copy to clipboard"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export function ExampleList({ examples, endpointId, documentId, isOwner }: ExampleListProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('response')
  const [showEditor, setShowEditor] = useState(false)
  const router = useRouter()

  const filtered = examples.filter((e) => e.type === activeTab)

  const handleDelete = async (exampleId: string) => {
    if (!confirm('Delete this example?')) return
    await fetch(`/api/documents/${documentId}/endpoints/${endpointId}/examples/${exampleId}`, {
      method: 'DELETE',
    })
    router.refresh()
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1" role="tablist" aria-label="Example type">
          {(['request', 'response'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {tab} ({examples.filter((e) => e.type === tab).length})
            </button>
          ))}
        </div>
        {isOwner && (
          <button
            onClick={() => setShowEditor(true)}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            + Add Example
          </button>
        )}
      </div>

      {showEditor && (
        <div className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-700">
          <ExampleEditor
            endpointId={endpointId}
            documentId={documentId}
            onSaved={() => { setShowEditor(false); router.refresh() }}
            onCancel={() => setShowEditor(false)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">No {activeTab} examples.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((example) => (
            <div key={example.id} className="rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{example.name}</span>
                  {example.statusCode && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-zinc-700 dark:text-zinc-400">
                      {example.statusCode}
                    </span>
                  )}
                  {example.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{example.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <CopyButton text={JSON.stringify(example.jsonContent, null, 2)} />
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(example.id)}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label="Delete example"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <pre className="overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-900 dark:bg-zinc-800 dark:text-zinc-100">
                {JSON.stringify(example.jsonContent, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
