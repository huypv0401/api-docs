/**
 * Format an API error response consistently.
 */
export function errorResponse(message: string, status: number, detail?: unknown) {
  return Response.json(
    { error: message, ...(detail !== undefined ? { detail } : {}) },
    { status }
  )
}

/**
 * Log an error with context for server-side debugging.
 */
export function logError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${context}] ${message}`, error)
}

/**
 * Safely parse a request body as JSON, returning null on failure.
 */
export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T
  } catch {
    return null
  }
}
