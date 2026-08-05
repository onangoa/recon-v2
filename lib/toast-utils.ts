const TECHNICAL_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /socket hang up/i,
  /unexpected token/i,
  /is not valid json/i,
  /json/i,
  /prisma/i,
  /database/i,
  /sql/i,
  /internal server error/i,
  /cannot read prop/i,
  /is not a function/i,
  /is not defined/i,
  /typeerror/i,
  /syntaxerror/i,
  /referenceerror/i,
  /undefined is not/i,
  /cannot access/i,
  /at object\./i,
  /at async/i,
  /\.\w+\(\)/i,
  /stack/i,
  /callback/i,
  /handler/i,
]

function isUserFriendlyMessage(message: string): boolean {
  if (!message || message.trim().length === 0) return false
  if (message.length > 200) return false
  return !TECHNICAL_PATTERNS.some((p) => p.test(message))
}

export function getApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const d = data as Record<string, unknown>
  const msg = d.error ?? d.message ?? d.errors
  if (typeof msg === 'string' && msg.trim().length > 0) {
    return msg
  }
  return fallback
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return isUserFriendlyMessage(error.message) ? error.message : fallback
  }
  if (typeof error === 'string' && isUserFriendlyMessage(error)) {
    return error
  }
  return fallback
}
