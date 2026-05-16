'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Document } from '@/lib/types'
import { EndpointList } from '@/components/documents/EndpointList'
import { SharedExportButton } from '@/components/import-export/SharedExportButton'
import { SharedImportButton } from '@/components/import-export/SharedImportButton'
import { Markdown } from '@/components/ui/Markdown'

type ViewMode = 'default' | 'redoc' | 'swagger'
const VIEW_LABELS: Record<ViewMode, string> = { default: 'Default', redoc: 'Redoc', swagger: 'Swagger UI' }

function applyOperationIdAsSummary(spec: Record<string, unknown>): Record<string, unknown> {
  const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>
  const newPaths: Record<string, Record<string, unknown>> = {}
  for (const [path, pathItem] of Object.entries(paths)) {
    newPaths[path] = { ...pathItem }
    for (const method of METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined
      if (op?.operationId) {
        const orig = op.summary as string | undefined
        const desc = op.description as string | undefined
        newPaths[path][method] = { ...op, summary: op.operationId as string, ...(orig || desc ? { description: orig ? orig + (desc ? '\n\n' + desc : '') : desc } : {}) }
      }
    }
  }
  return { ...spec, paths: newPaths }
}

function RedocViewer({ spec }: { spec: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let cancelled = false
    const mount = document.createElement('div')
    el.appendChild(mount)
    const processed = applyOperationIdAsSummary(spec)
    const init = () => {
      if (cancelled) return
      // @ts-expect-error CDN
      window.Redoc.init(processed, { scrollYOffset: 64, theme: { typography: { fontSize: '13px', lineHeight: '1.6' } } }, mount)
    }
    // @ts-expect-error CDN
    if (window.Redoc) { init() } else {
      const s = document.createElement('script')
      s.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js'
      s.onload = init; document.head.appendChild(s)
    }
    return () => { cancelled = true; mount.remove() }
  }, [spec])
  return <div ref={ref} />
}

function SwaggerViewer({ spec }: { spec: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return; el.innerHTML = ''
    const link = document.createElement('link')
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/swagger-ui-dist/swagger-ui.css'
    document.head.appendChild(link)
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js'
    s.onload = () => {
      const processed = applyOperationIdAsSummary(spec)
      // @ts-expect-error CDN
      window.SwaggerUIBundle({ spec: processed, domNode: el, presets: [window.SwaggerUIBundle.presets.apis], layout: 'BaseLayout', docExpansion: 'list' })
    }
    document.head.appendChild(s)
    return () => { s.remove(); link.remove() }
  }, [spec])
  return <div ref={ref} />
}

interface Props { doc: Document; linkId: string; canEdit: boolean }

export function SharedDocumentPageClient({ doc, linkId, canEdit }: Props) {
  const [mode, setMode] = useState<ViewMode>('default')
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null)
  const [loadingSpec, setLoadingSpec] = useState(false)
  const [specError, setSpecError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'default' || spec) return
    setLoadingSpec(true); setSpecError(null)
    fetch(`/api/shared/${linkId}/export?format=openapi`)
      .then((r) => r.json())
      .then(setSpec)
      .catch(() => setSpecError('Failed to load OpenAPI spec'))
      .finally(() => setLoadingSpec(false))
  }, [mode, linkId, spec])

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${canEdit ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300'}`}>
                {canEdit ? 'Can edit' : 'View only'}
              </span>
              <span className="text-xs text-gray-400 dark:text-zinc-500">Shared document</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{doc.title}</h1>
            {doc.description && (
              <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                <Markdown>{doc.description}</Markdown>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SharedExportButton linkId={linkId} title={doc.title} />
            {canEdit && <SharedImportButton linkId={linkId} />}
            <Link href={`/shared/${linkId}/guides`} className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              Guides
            </Link>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-zinc-700">
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'}`}>
                {VIEW_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'default' ? (
        <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8">
          {doc.endpoints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-zinc-700">
              <p className="text-sm text-gray-500 dark:text-zinc-400">No endpoints.</p>
            </div>
          ) : (
            <EndpointList endpoints={doc.endpoints} documentId={doc.id} isOwner={canEdit} />
          )}
        </div>
      ) : (
        <div className="w-full">
          {loadingSpec && <p className="px-8 text-sm text-gray-500 dark:text-zinc-400">Loading…</p>}
          {specError && <p role="alert" className="px-8 text-sm text-red-600 dark:text-red-400">{specError}</p>}
          {mode === 'redoc' && spec && <RedocViewer key="shared-redoc" spec={spec} />}
          {mode === 'swagger' && spec && <SwaggerViewer key="shared-swagger" spec={spec} />}
        </div>
      )}
    </div>
  )
}
