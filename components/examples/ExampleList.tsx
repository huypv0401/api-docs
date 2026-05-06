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

// Group examples by name: { name -> { request?, response? } }
function groupByName(examples: Example[]) {
  const map = new Map<string, { request?: Example; response?: Example }>()
  for (const ex of examples) {
    const entry = map.get(ex.name) ?? {}
    entry[ex.type] = ex
    map.set(ex.name, entry)
  }
  return map
}

function formatJson(content: unknown): string {
  return JSON.stringify(content, null, 2).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
      aria-label="Copy"
      title="Copy"
    >
      {copied ? '✓' : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  )
}

function CodeBlock({ content, onViewMore }: { content: string; onViewMore: () => void }) {
  return (
    <div className="relative">
      <pre className="max-h-48 overflow-hidden rounded bg-gray-50 p-3 font-mono text-xs text-gray-900 dark:bg-zinc-800/60 dark:text-zinc-100">
        {content}
      </pre>
      {/* fade overlay + View More */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center rounded-b bg-gradient-to-t from-gray-50 pb-2 pt-6 dark:from-zinc-800/60">
        <button
          onClick={onViewMore}
          className="rounded bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-600"
        >
          View More
        </button>
      </div>
    </div>
  )
}

function Modal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-zinc-700">
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{title}</span>
          <div className="flex items-center gap-2">
            <CopyButton text={content} />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <pre className="overflow-auto p-4 font-mono text-xs text-gray-900 dark:text-zinc-100">
          {content}
        </pre>
      </div>
    </div>
  )
}

export function ExampleList({ examples, endpointId, documentId, isOwner }: ExampleListProps) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)
  const [modal, setModal] = useState<{ title: string; content: string } | null>(null)

  const grouped = groupByName(examples)
  const names = Array.from(grouped.keys())
  const [selected, setSelected] = useState(names[0] ?? '')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Keep selected in sync if examples change
  const currentName = names.includes(selected) ? selected : (names[0] ?? '')
  const current = grouped.get(currentName)

  const handleDelete = async (exampleId: string) => {
    if (!confirm('Delete this example?')) return
    await fetch(`/api/documents/${documentId}/endpoints/${endpointId}/examples/${exampleId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Example</h4>
        <div className="flex items-center gap-2">
          {/* Dropdown */}
          {names.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {currentName}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {names.map((name) => (
                    <button
                      key={name}
                      onClick={() => { setSelected(name); setDropdownOpen(false) }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-zinc-700 ${
                        name === currentName ? 'font-medium text-gray-900 dark:text-zinc-100' : 'text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      {name === currentName && <span>✓</span>}
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {isOwner && (
            <button onClick={() => setShowEditor(true)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
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

      {names.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">No examples yet.</p>
      ) : current && (
        <div className="space-y-4">
          {/* Request */}
          {current.request && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Request</span>
                <div className="flex items-center gap-1">
                  <CopyButton text={formatJson(current.request.jsonContent)} />
                  {isOwner && (
                    <button onClick={() => handleDelete(current.request!.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  )}
                </div>
              </div>
              <CodeBlock
                content={formatJson(current.request.jsonContent)}
                onViewMore={() => setModal({ title: `${currentName} — Request`, content: formatJson(current.request!.jsonContent) })}
              />
            </div>
          )}

          {/* Response */}
          {current.response && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">Response</span>
                  {current.response.statusCode && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {current.response.statusCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <CopyButton text={formatJson(current.response.jsonContent)} />
                  {isOwner && (
                    <button onClick={() => handleDelete(current.response!.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  )}
                </div>
              </div>
              <CodeBlock
                content={formatJson(current.response.jsonContent)}
                onViewMore={() => setModal({ title: `${currentName} — Response ${current.response!.statusCode ?? ''}`, content: formatJson(current.response!.jsonContent) })}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}
    </div>
  )
}
