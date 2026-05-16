export type ApiFormat = 'postman' | 'openapi' | 'unknown'

export function detectFormat(json: unknown): ApiFormat {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return 'unknown'
  const obj = json as Record<string, unknown>
  if (typeof obj.openapi === 'string' && obj.openapi.startsWith('3.')) return 'openapi'
  if (obj.info && typeof (obj.info as Record<string, unknown>).schema === 'string' &&
      ((obj.info as Record<string, unknown>).schema as string).includes('getpostman.com')) return 'postman'
  return 'unknown'
}
