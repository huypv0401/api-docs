'use client'

import { useState } from 'react'
import type { HTTPMethod, CodeLanguage } from '@/lib/types'
import { CODE_LANGUAGES } from '@/lib/types'

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  curl: 'cURL',
  python: 'Python',
  csharp: 'C#',
  javascript: 'JavaScript',
  go: 'Go',
  ruby: 'Ruby',
}

interface CodeSnippetGeneratorProps {
  method: HTTPMethod
  url: string
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  body?: string
}

export function CodeSnippetGenerator({ method, url, headers, queryParams, body }: CodeSnippetGeneratorProps) {
  const [language, setLanguage] = useState<CodeLanguage>('curl')
  const [code, setCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = async (lang: CodeLanguage) => {
    setLanguage(lang)
    setIsLoading(true)
    setError(null)
    setCode(null)
    try {
      const res = await fetch('/api/codegen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, url, headers, queryParams, body, language: lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setCode(data.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Select language">
        {CODE_LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => generate(lang)}
            aria-pressed={language === lang && code !== null}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              language === lang && code !== null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500 dark:text-zinc-400" aria-live="polite">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </div>
      )}

      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {code && !isLoading && (
        <div className="relative">
          <div className="absolute right-2 top-2">
            <button
              onClick={handleCopy}
              className="rounded bg-white/80 px-2 py-1 text-xs text-gray-600 shadow-sm hover:bg-white dark:bg-zinc-700/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
              aria-label="Copy code to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-auto rounded bg-gray-50 p-4 font-mono text-xs text-gray-900 dark:bg-zinc-800 dark:text-zinc-100">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {!code && !isLoading && !error && (
        <p className="text-sm text-gray-500 dark:text-zinc-400">Select a language to generate code.</p>
      )}
    </div>
  )
}
