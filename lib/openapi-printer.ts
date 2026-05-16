import type { Document, Endpoint } from '@/lib/types'

export class OpenApiPrinter {
  print(document: Document): Record<string, unknown> {
    const paths: Record<string, unknown> = {}

    for (const ep of document.endpoints) {
      if (!paths[ep.url]) paths[ep.url] = {}
      const pathItem = paths[ep.url] as Record<string, unknown>
      pathItem[ep.method.toLowerCase()] = this.buildOperation(ep)
    }

    return {
      openapi: '3.0.3',
      info: {
        title: document.title,
        ...(document.description ? { description: document.description } : {}),
        version: '1.0.0',
      },
      paths,
    }
  }

  private buildOperation(ep: Endpoint): Record<string, unknown> {
    const parameters: unknown[] = [
      ...Object.entries(ep.queryParams).map(([name, example]) => ({
        name, in: 'query', schema: { type: 'string' }, ...(example ? { example } : {}),
      })),
      ...Object.entries(ep.headers).map(([name, example]) => ({
        name, in: 'header', schema: { type: 'string' }, ...(example ? { example } : {}),
      })),
    ]

    const responses: Record<string, unknown> = {}
    for (const ex of ep.examples.filter((e) => e.type === 'response')) {
      const code = ex.statusCode ?? 200
      responses[String(code)] = {
        description: ex.name,
        content: { 'application/json': { example: ex.jsonContent } },
      }
    }
    if (Object.keys(responses).length === 0) responses['200'] = { description: 'OK' }

    const op: Record<string, unknown> = {
      operationId: ep.name,
      ...(ep.description ? { summary: ep.description } : {}),
      ...(parameters.length ? { parameters } : {}),
      responses,
    }

    if (ep.body) {
      let schema: unknown
      try { schema = JSON.parse(ep.body) } catch { schema = { type: 'string' } }
      op.requestBody = { content: { 'application/json': { schema } } }
    }

    return op
  }
}
