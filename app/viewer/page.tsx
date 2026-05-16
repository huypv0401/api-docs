'use client'

import { useRef, useState, useEffect } from 'react'
import { detectFormat } from '@/lib/format-detector'

type Renderer = 'redoc' | 'swagger'

const RENDERER_LABELS: Record<Renderer, string> = { redoc: 'Redoc', swagger: 'Swagger UI' }

async function parseFile(file: File): Promise<unknown> {
  const text = await file.text()
  if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
    const yaml = (await import('js-yaml')).default
    return yaml.load(text)
  }
  return JSON.parse(text)
}

// Preprocess spec: use operationId as summary so Redoc sidebar shows operationId
function applyOperationIdAsSummary(spec: Record<string, unknown>): Record<string, unknown> {
  const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>
  const newPaths: Record<string, Record<string, unknown>> = {}
  for (const [path, pathItem] of Object.entries(paths)) {
    newPaths[path] = { ...pathItem }
    for (const method of HTTP_METHODS) {
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
    let cancelled = false
    el.innerHTML = ''
    const processedSpec = applyOperationIdAsSummary(spec)

    const init = () => {
      if (cancelled || !containerRef.current) return
      // @ts-expect-error Redoc is loaded from CDN
      window.Redoc.init(processedSpec, { scrollYOffset: 64, theme: { typography: { fontSize: '13px', lineHeight: '1.6' } } }, containerRef.current)
    }

    // @ts-expect-error Redoc is loaded from CDN
    if (window.Redoc) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js'
      script.onload = init
      document.head.appendChild(script)
    }

    return () => { cancelled = true; if (containerRef.current) containerRef.current.innerHTML = '' }
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
      // @ts-expect-error SwaggerUIBundle is loaded from CDN
      window.SwaggerUIBundle({ spec: processedSpec, domNode: el, presets: [window.SwaggerUIBundle.presets.apis], layout: 'BaseLayout', docExpansion: 'list' })
    }
    document.head.appendChild(script)
    return () => { script.remove(); link.remove() }
  }, [spec])

  return <div ref={containerRef} />
}

export default function ViewerPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null)
  const [renderer, setRenderer] = useState<Renderer>('redoc')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null); setSpec(null)
    try {
      let parsed: unknown
      try { parsed = await parseFile(file) } catch { throw new Error('File could not be parsed as JSON or YAML') }
      const fmt = detectFormat(parsed)
      if (fmt !== 'openapi') throw new Error('Only OpenAPI 3.x files are supported in the viewer')
      setSpec(parsed as Record<string, unknown>)
      setFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="inline-flex cursor-pointer items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          {fileName ? 'Change file' : 'Open file'}
          <input ref={fileRef} type="file" accept=".json,.yaml,.yml,application/json" onChange={handleFile} className="sr-only" />
        </label>

        {fileName && <span className="text-sm text-gray-600 dark:text-zinc-400 truncate max-w-xs">{fileName}</span>}

        {spec && (
          <div className="ml-auto flex items-center gap-1 rounded border border-gray-200 p-0.5 dark:border-zinc-700">
            {(Object.keys(RENDERER_LABELS) as Renderer[]).map((r) => (
              <button
                key={r}
                onClick={() => setRenderer(r)}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  renderer === r
                    ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {RENDERER_LABELS[r]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {error && (
          <div className="mx-auto max-w-xl mt-12 rounded bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
            {error}
          </div>
        )}

        {!spec && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Open an OpenAPI 3.x file (JSON or YAML) to preview it</p>
          </div>
        )}

        {spec && renderer === 'redoc' && <RedocViewer key={`redoc-${fileName}`} spec={spec} />}
        {spec && renderer === 'swagger' && <SwaggerViewer key={`swagger-${fileName}`} spec={spec} />}
      </div>
    </div>
  )
}
