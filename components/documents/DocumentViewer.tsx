'use client'

import { useState, useEffect, useRef } from 'react'
import type { Endpoint } from '@/lib/types'
import { EndpointList } from '@/components/documents/EndpointList'

type ViewMode = 'default' | 'redoc' | 'swagger'

const VIEW_LABELS: Record<ViewMode, string> = { default: 'Default', redoc: 'Redoc', swagger: 'Swagger UI' }

// Shared preprocessing from viewer page
function applyOperationIdAsSummary(spec: Record<string, unknown>): Record<string, unknown> {
  const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>
  const newPaths: Record<string, Record<string, unknown>> = {}
  for (const [path, pathItem] of Object.entries(paths)) {
    newPaths[path] = { ...pathItem }
    for (const method of METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined
      if (op?.operationId) {
        const originalSummary = op.summary as string | undefined
        const existingDesc = op.description as string | undefined
        const description = originalSummary
          ? originalSummary + (existingDesc ? '\n\n' + existingDesc : '')
          : existingDesc
        newPaths[path][method] = { ...op, summary: op.operationId as string, ...(description !== undefined ? { description } : {}) }
      }
    }
  }
  return { ...spec, paths: newPaths }
}

function RedocViewer({ spec }: { spec: Record<string, unknown> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''
    const processedSpec = applyOperationIdAsSummary(spec)
    const script = document.createElement('script')
    script.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js'
    script.onload = () => {
      // @ts-expect-error Redoc loaded from CDN
      window.Redoc.init(processedSpec, { scrollYOffset: 64, theme: { typography: { fontSize: '13px', lineHeight: '1.6' } } }, el)
    }
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [spec])
  return <div ref={containerRef} />
}

function SwaggerViewer({ spec }: { spec: Record<string, unknown> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/swagger-ui-dist/swagger-ui.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js'
    script.onload = () => {
      const processedSpec = applyOperationIdAsSummary(spec)
      // @ts-expect-error SwaggerUIBundle loaded from CDN
      window.SwaggerUIBundle({ spec: processedSpec, domNode: el, presets: [window.SwaggerUIBundle.presets.apis], layout: 'BaseLayout', docExpansion: 'list' })
    }
    document.head.appendChild(script)
    return () => { script.remove(); link.remove() }
  }, [spec])
  return <div ref={containerRef} />
}

interface DocumentViewerProps {
  documentId: string
  endpoints: Endpoint[]
  isOwner: boolean
}

export function DocumentViewer({ documentId, endpoints, isOwner }: DocumentViewerProps) {
  const [mode, setMode] = useState<ViewMode>('default')
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null)
  const [loadingSpec, setLoadingSpec] = useState(false)
  const [specError, setSpecError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'default') return
    if (spec) return
    setLoadingSpec(true); setSpecError(null)
    fetch(`/api/export/openapi/${documentId}`)
      .then((r) => r.json())
      .then((data) => setSpec(data))
      .catch(() => setSpecError('Failed to load OpenAPI spec'))
      .finally(() => setLoadingSpec(false))
  }, [mode, documentId, spec])

  return (
    <div>
      {/* View mode switcher — centered sticky bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex justify-center border-b border-gray-200 bg-white/90 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 sm:-mx-6 lg:-mx-8">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-zinc-700">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {VIEW_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {mode === 'default' && (
        endpoints.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-zinc-400">No endpoints yet.</p>
          </div>
        ) : (
          <EndpointList endpoints={endpoints} documentId={documentId} isOwner={isOwner} />
        )
      )}

      {/* Full-width breakout for redoc/swagger */}
      {mode !== 'default' && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          {loadingSpec && <p className="px-8 text-sm text-gray-500 dark:text-zinc-400">Loading…</p>}
          {specError && <p role="alert" className="px-8 text-sm text-red-600 dark:text-red-400">{specError}</p>}
          {mode === 'redoc' && spec && <RedocViewer key="doc-redoc" spec={spec} />}
          {mode === 'swagger' && spec && <SwaggerViewer key="doc-swagger" spec={spec} />}
        </div>
      )}
    </div>
  )
}
