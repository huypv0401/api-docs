import { HTTPSnippet } from '@hoppscotch/httpsnippet'
import type { HTTPRequest, CodeLanguage } from '@/lib/types'

// Map our language names to httpsnippet target/client pairs
const TARGET_MAP: Record<CodeLanguage, { target: string; client?: string }> = {
  curl: { target: 'shell', client: 'curl' },
  python: { target: 'python', client: 'requests' },
  csharp: { target: 'csharp' },
  javascript: { target: 'javascript', client: 'fetch' },
  go: { target: 'go' },
  ruby: { target: 'ruby' },
}

export class CodeGenerator {
  generate(request: HTTPRequest, language: CodeLanguage): string {
    const { target, client } = TARGET_MAP[language]
    if (!target) throw new Error(`Unsupported language: ${language}`)

    const headers = Object.entries(request.headers ?? {}).map(([name, value]) => ({ name, value }))
    const queryString = Object.entries(request.queryParams ?? {}).map(([name, value]) => ({ name, value }))

    const harRequest = {
      method: request.method,
      url: request.url,
      httpVersion: 'HTTP/1.1',
      headers,
      queryString,
      cookies: [] as never[],
      headersSize: -1,
      bodySize: -1,
      postData: request.body
        ? { mimeType: 'application/json', text: request.body }
        : { mimeType: 'application/octet-stream', text: '' },
    }

    const snippet = new HTTPSnippet(harRequest)
    const result = snippet.convert(target as Parameters<typeof snippet.convert>[0], client)

    if (result === false) throw new Error(`Failed to generate code for ${language}`)
    return Array.isArray(result) ? result.join('\n') : result
  }
}
