'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400 text-sm">
        {alt || src}
      </a>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ''} className="my-2 max-w-full rounded" onError={() => setFailed(true)} />
  )
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-zinc-100">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => <h1 className="mb-2 text-lg font-bold text-gray-900 dark:text-zinc-100">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-zinc-100">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-zinc-100">{children}</h3>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-5 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        hr: () => <hr className="my-3 border-gray-200 dark:border-zinc-700" />,
        code: ({ children }) => <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-700">{children}</code>,
        pre: ({ children }) => <pre className="mb-2 overflow-auto rounded bg-gray-100 p-3 font-mono text-xs dark:bg-zinc-800">{children}</pre>,
        a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">{children}</a>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3 text-gray-600 dark:border-zinc-600 dark:text-zinc-400">{children}</blockquote>,
        img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
