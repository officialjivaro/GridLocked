const SUPPORTED_ANSWER_PATTERN = /^[A-Za-z\s'-]+$/

// Answer Normalization | Converts player-facing answers into A-Z grid strings
export function normalizeAnswer(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed || !SUPPORTED_ANSWER_PATTERN.test(trimmed)) {
    return ''
  }

  return trimmed.toUpperCase().replace(/[\s'-]/g, '')
}

export function isSupportedAnswer(value) {
  const normalized = normalizeAnswer(value)
  return normalized.length >= 3 && normalized.length <= 15
}

export function normalizePlayerLetter(value) {
  const letter = String(value ?? '').trim().toUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : ''
}
