'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Example, HTTPMethod } from '@/lib/types'
import { ExampleEditor } from './ExampleEditor'
import { CodeHighlight } from '@/components/ui/CodeHighlight'

interface ExampleListProps {
  examples: Example[]
  endpointId: string
  documentId: string
  isOwner: boolean
  // endpoint context for cURL generation
  method?: HTTPMethod
  url?: string
  headers?: Record<string, string>
}

function groupByName(examples: Example[]) {
  const map = new Map<string, { request?: Example; response?: Example }>()
  for (const ex of examples) {
    const entry = map.get(ex.name) ?? {}
    entry[ex.type] = ex
    map.set(ex.name, entry)
  }
  return map
}

function unwrapContent(content: unknown): unknown {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const keys = Object.keys(content as object)
    if (keys.length === 1 && keys[0] === 'raw') {
      const raw = (content as { raw: string }).raw
      try { return JSON.parse(raw) } catch { return raw }
    }
  }
  return content
}

function formatContent(content: unknown): string {
  const unwrapped = unwrapContent(content)
  if (typeof unwrapped === 'string') return unwrapped.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return JSON.stringify(unwrapped, null, 2)
}

function buildCurl(method: string, url: string, headers: Record<string, string>, body: unknown): string {
  const lines: string[] = [`curl --location --globoff '${url}' \\`]
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`--header '${k}: ${v}' \\`)
  }
  const bodyStr = formatContent(body)
  if (bodyStr && method !== 'GET' && method !== 'HEAD') {
    lines.push(`--data '${bodyStr}'`)
  } else {
    // remove trailing backslash from last line
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, '')
  }
  return lines.join('\n')
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200" aria-label="Copy" title="Copy">
      {copied ? '✓' : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  )
}

function CodeBlock({ content, label, language = 'json', onViewMore }: { content: string; label?: string; language?: 'json' | 'bash'; onViewMore: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700">
      {label && (
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-zinc-700">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-zinc-700 dark:text-zinc-300">{label}</span>
          <CopyButton text={content} />
        </div>
      )}
      <div className="relative bg-gray-50 dark:bg-zinc-800/60 rounded-b-lg">
        <div className="max-h-52 overflow-hidden p-3 font-mono text-xs">
          <CodeHighlight code={content} language={language} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-gradient-to-t from-gray-50 pb-2 pt-8 dark:from-zinc-800/60 rounded-b-lg">
          <button onClick={onViewMore}
            className="rounded bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600">
            View More
          </button>
        </div>
      </div>
    </div>
  )
}

function Modal({ title, content, language = 'json', onClose }: { title: string; content: string; language?: 'json' | 'bash'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-zinc-700">
          <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{title}</span>
          <div className="flex items-center gap-2">
            <CopyButton text={content} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200">✕</button>
          </div>
        </div>
        <div className="overflow-auto p-4 font-mono text-xs">
          <CodeHighlight code={content} language={language} />
        </div>
      </div>
    </div>
  )
}

export function ExampleList({ examples, endpointId, documentId, isOwner, method = 'GET', url = '', headers = {} }: ExampleListProps) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)
  const [modal, setModal] = useState<{ title: string; content: string; language?: 'json' | 'bash' } | null>(null)
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')

  const grouped = groupByName(examples)
  const names = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b))
  const [selected, setSelected] = useState(names[0] ?? '')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const currentName = names.includes(selected) ? selected : (names[0] ?? '')
  const current = grouped.get(currentName)

  const handleDelete = async (exampleId: string) => {
    if (!confirm('Delete this example?')) return
    await fetch(`/api/documents/${documentId}/endpoints/${endpointId}/examples/${exampleId}`, { method: 'DELETE' })
    router.refresh()
  }

  // Build cURL from endpoint + request example body
  const curlContent = current?.request
    ? buildCurl(method, url, headers, current.request.jsonContent)
    : null

  const responseBody = current?.response ? formatContent(current.response.jsonContent) : null
  const responseHeaders = current?.response?.responseHeaders
    ? Object.entries(current.response.responseHeaders).map(([k, v]) => `${k}: ${v}`).join('\n')
    : null
  const headerCount = current?.response?.responseHeaders ? Object.keys(current.response.responseHeaders).length : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-zinc-700">
        <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Example</h4>
        <div className="flex items-center gap-2">
          {names.length > 0 && (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {currentName}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {names.map((name) => (
                    <button key={name} onClick={() => { setSelected(name); setDropdownOpen(false) }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-zinc-700 ${name === currentName ? 'font-medium text-gray-900 dark:text-zinc-100' : 'text-gray-600 dark:text-zinc-400'}`}>
                      {name === currentName && <span className="text-blue-600">✓</span>}
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {isOwner && (
            <button onClick={() => setShowEditor(true)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">+ Add</button>
          )}
        </div>
      </div>

      {showEditor && (
        <div className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-zinc-700">
          <ExampleEditor endpointId={endpointId} documentId={documentId}
            onSaved={() => { setShowEditor(false); router.refresh() }} onCancel={() => setShowEditor(false)} />
        </div>
      )}

      {names.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-zinc-400">No examples yet.</p>
      ) : current && (
        <div className="space-y-5">
          {/* Request — cURL */}
          {curlContent && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Request</span>
                {isOwner && current.request && (
                  <button onClick={() => handleDelete(current.request!.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                )}
              </div>
              <CodeBlock content={curlContent} label="cURL" language="bash"
                onViewMore={() => setModal({ title: `${currentName} — Request (cURL)`, content: curlContent, language: 'bash' })} />
            </div>
          )}

          {/* Response — Body / Headers tabs */}
          {current.response && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Response</span>
                  <div className="flex gap-1">
                    {(['body', 'headers'] as const).map((tab) => (
                      <button key={tab} onClick={() => setResponseTab(tab)}
                        className={`rounded px-2 py-0.5 text-xs capitalize ${responseTab === tab ? 'bg-gray-200 font-medium text-gray-900 dark:bg-zinc-600 dark:text-zinc-100' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'}`}>
                        {tab === 'headers' ? `Headers (${headerCount})` : 'Body'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {current.response.statusCode && (
                    <span className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:border-zinc-600 dark:text-zinc-400">
                      {current.response.statusCode} OK
                    </span>
                  )}
                  {isOwner && (
                    <button onClick={() => handleDelete(current.response!.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  )}
                </div>
              </div>
              {responseTab === 'body' && responseBody && (
                <CodeBlock content={responseBody} language="json"
                  onViewMore={() => setModal({ title: `${currentName} — Response Body`, content: responseBody, language: 'json' })} />
              )}
              {responseTab === 'headers' && responseHeaders && (
                <CodeBlock content={responseHeaders} language="bash"
                  onViewMore={() => setModal({ title: `${currentName} — Response Headers`, content: responseHeaders, language: 'bash' })} />
              )}
            </div>
          )}
        </div>
      )}

      {modal && <Modal title={modal.title} content={modal.content} language={modal.language} onClose={() => setModal(null)} />}
    </div>
  )
}
