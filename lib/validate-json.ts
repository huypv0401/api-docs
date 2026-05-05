export interface JSONValidationResult {
  isValid: boolean
  error?: string
  parsed?: unknown
}

export function validateJSON(input: string): JSONValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a non-empty string' }
  }
  try {
    const parsed = JSON.parse(input)
    return { isValid: true, parsed }
  } catch (err) {
    return { isValid: false, error: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}
