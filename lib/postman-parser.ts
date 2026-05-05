import type {
  PostmanCollection,
  PostmanItem,
  PostmanUrl,
  PostmanHeader,
  HTTPMethod,
} from '@/lib/types'
import { HTTP_METHODS } from '@/lib/types'

interface ParsedExample {
  type: 'request' | 'response'
  name: string
  description: string | null
  jsonContent: unknown
  statusCode: number | null
}

interface ParsedEndpoint {
  name: string
  method: HTTPMethod
  url: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  body: string | null
  description: string | null
  examples: ParsedExample[]
}

export interface ParsedDocument {
  title: string
  description: string | null
  endpoints: ParsedEndpoint[]
}

function parseUrl(url: string | PostmanUrl): { raw: string; queryParams: Record<string, string> } {
  if (typeof url === 'string') {
    const [base, qs] = url.split('?')
    const queryParams: Record<string, string> = {}
    if (qs) {
      for (const part of qs.split('&')) {
        const [k, v] = part.split('=')
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
      }
    }
    return { raw: base, queryParams }
  }

  const queryParams: Record<string, string> = {}
  for (const q of url.query ?? []) {
    if (!q.disabled && q.key) queryParams[q.key] = q.value ?? ''
  }

  let raw = url.raw
  if (!raw) {
    const protocol = url.protocol ? `${url.protocol}://` : ''
    const host = (url.host ?? []).join('.')
    const path = (url.path ?? []).join('/')
    raw = `${protocol}${host}/${path}`
  }
  // Strip query string from raw
  raw = raw.split('?')[0]
  return { raw, queryParams }
}

function parseHeaders(headers: PostmanHeader[] | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  for (const h of headers ?? []) {
    if (!h.disabled && h.key) result[h.key] = h.value ?? ''
  }
  return result
}

function parseBody(item: PostmanItem): string | null {
  const body = item.request?.body
  if (!body) return null
  if (body.mode === 'raw') return body.raw ?? null
  if (body.mode === 'urlencoded') {
    return (body.urlencoded ?? [])
      .filter((f) => !f.disabled)
      .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value ?? '')}`)
      .join('&')
  }
  if (body.mode === 'formdata') {
    return JSON.stringify(
      Object.fromEntries(
        (body.formdata ?? []).filter((f) => !f.disabled).map((f) => [f.key, f.value])
      )
    )
  }
  return null
}

function flattenItems(items: PostmanItem[]): PostmanItem[] {
  const result: PostmanItem[] = []
  for (const item of items) {
    if (item.item) {
      result.push(...flattenItems(item.item))
    } else if (item.request) {
      result.push(item)
    }
  }
  return result
}

export class PostmanParser {
  parse(json: unknown): ParsedDocument {
    const collection = this.validate(json)

    const flatItems = flattenItems(collection.item)

    const endpoints = flatItems.map((item) => {
      const req = item.request!
      const method = (req.method?.toUpperCase() ?? 'GET') as HTTPMethod
      const validMethod = HTTP_METHODS.includes(method) ? method : 'GET'
      const { raw: url, queryParams } = parseUrl(req.url ?? '')
      const headers = parseHeaders(req.header)
      const body = parseBody(item)

      const examples: ParsedExample[] = []
      for (const resp of item.response ?? []) {
        if (resp.body) {
          try {
            JSON.parse(resp.body)
            examples.push({
              type: 'response',
              name: resp.name ?? 'Response',
              description: null,
              jsonContent: JSON.parse(resp.body),
              statusCode: resp.code ?? null,
            })
          } catch {
            // skip non-JSON response bodies
          }
        }
      }

      return {
        name: item.name,
        method: validMethod,
        url,
        headers,
        queryParams,
        body,
        description: typeof req.description === 'string' ? req.description : null,
        examples,
      }
    })

    return {
      title: collection.info.name,
      description: collection.info.description ?? null,
      endpoints,
    }
  }

  private validate(json: unknown): PostmanCollection {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid Postman collection: must be an object')
    }
    const obj = json as Record<string, unknown>
    if (!obj.info || typeof obj.info !== 'object') {
      throw new Error('Invalid Postman collection: missing info')
    }
    const info = obj.info as Record<string, unknown>
    if (!info.name || typeof info.name !== 'string') {
      throw new Error('Invalid Postman collection: missing info.name')
    }
    if (!Array.isArray(obj.item)) {
      throw new Error('Invalid Postman collection: missing item array')
    }
    return json as PostmanCollection
  }
}
