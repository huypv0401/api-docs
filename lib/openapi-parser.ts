import type { HTTPMethod } from '@/lib/types'
import { HTTP_METHODS } from '@/lib/types'
import type { ParsedDocument } from '@/lib/postman-parser'

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const

export class OpenApiParser {
  parse(json: unknown): ParsedDocument {
    const doc = this.validate(json)
    const paths = (doc.paths ?? {}) as Record<string, Record<string, unknown>>
    const endpoints = []

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const method of METHODS) {
        const op = pathItem[method] as Record<string, unknown> | undefined
        if (!op) continue

        const params = (op.parameters ?? []) as Array<Record<string, unknown>>
        const headers: Record<string, string> = {}
        const queryParams: Record<string, string> = {}
        for (const p of params) {
          if (p.in === 'header' && p.name) headers[p.name as string] = ''
          if (p.in === 'query' && p.name) queryParams[p.name as string] = ''
        }

        let body: string | null = null
        const reqBody = op.requestBody as Record<string, unknown> | undefined
        if (reqBody) {
          const schema = (reqBody.content as Record<string, unknown>)?.['application/json']
          if (schema) body = JSON.stringify((schema as Record<string, unknown>).schema ?? schema, null, 2)
        }

        const responses = (op.responses ?? {}) as Record<string, Record<string, unknown>>
        const examples = []
        for (const [statusStr, resp] of Object.entries(responses)) {
          const statusCode = parseInt(statusStr, 10)
          if (isNaN(statusCode)) continue
          const content = resp.content as Record<string, unknown> | undefined
          const appJson = content?.['application/json'] as Record<string, unknown> | undefined
          const jsonContent = appJson?.example ?? (appJson?.schema) ?? {}
          examples.push({
            type: 'response' as const,
            name: (resp.description as string) || `${statusCode}`,
            description: null,
            jsonContent,
            statusCode,
            responseHeaders: null,
          })
        }

        const httpMethod = method.toUpperCase() as HTTPMethod
        endpoints.push({
          name: (op.operationId as string) || (op.summary as string) || `${method.toUpperCase()} ${path}`,
          method: HTTP_METHODS.includes(httpMethod) ? httpMethod : 'GET' as HTTPMethod,
          url: path,
          headers,
          queryParams,
          body,
          description: (op.description as string) || (op.summary as string) || null,
          examples,
        })
      }
    }

    const info = doc.info as Record<string, unknown>
    return {
      title: (info.title as string) || 'Untitled',
      description: (info.description as string) || null,
      endpoints,
    }
  }

  private validate(json: unknown): Record<string, unknown> {
    if (!json || typeof json !== 'object' || Array.isArray(json))
      throw new Error('Invalid OpenAPI document: must be an object')
    const doc = json as Record<string, unknown>
    if (typeof doc.openapi !== 'string' || !doc.openapi.startsWith('3.'))
      throw new Error('Invalid OpenAPI document: missing or unsupported openapi version (requires 3.x)')
    if (!doc.info || typeof doc.info !== 'object')
      throw new Error('Invalid OpenAPI document: missing info')
    return doc
  }
}
