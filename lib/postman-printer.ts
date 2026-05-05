import type { Document, Endpoint, PostmanCollection, PostmanItem, PostmanUrl, PostmanHeader } from '@/lib/types'

export class PostmanPrinter {
  print(document: Document): PostmanCollection {
    return {
      info: {
        name: document.title,
        description: document.description ?? undefined,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: document.endpoints.map((endpoint) => this.endpointToItem(endpoint)),
    }
  }

  private endpointToItem(endpoint: Endpoint): PostmanItem {
    const url = this.buildUrl(endpoint.url, endpoint.queryParams)
    const header = this.buildHeaders(endpoint.headers)

    const item: PostmanItem = {
      name: endpoint.name,
      request: {
        method: endpoint.method,
        url,
        header: header.length ? header : undefined,
        description: endpoint.description ?? undefined,
      },
      response: endpoint.examples
        .filter((e) => e.type === 'response')
        .map((e) => ({
          name: e.name,
          status: e.statusCode ? String(e.statusCode) : undefined,
          code: e.statusCode ?? undefined,
          body: JSON.stringify(e.jsonContent, null, 2),
          header: [],
        })),
    }

    if (endpoint.body) {
      item.request!.body = {
        mode: 'raw',
        raw: endpoint.body,
        options: { raw: { language: 'json' } },
      }
    }

    return item
  }

  private buildUrl(rawUrl: string, queryParams: Record<string, string>): PostmanUrl {
    const query = Object.entries(queryParams).map(([key, value]) => ({ key, value }))

    try {
      const parsed = new URL(rawUrl)
      return {
        raw: rawUrl,
        protocol: parsed.protocol.replace(':', ''),
        host: parsed.hostname.split('.'),
        path: parsed.pathname.split('/').filter(Boolean),
        query: query.length ? query : undefined,
      }
    } catch {
      return { raw: rawUrl, query: query.length ? query : undefined }
    }
  }

  private buildHeaders(headers: Record<string, string>): PostmanHeader[] {
    return Object.entries(headers).map(([key, value]) => ({ key, value }))
  }
}
