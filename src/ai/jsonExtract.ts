/**
 * Best-effort extraction of a JSON object candidate from raw model output:
 * strips markdown code fences, then trims to the outermost balanced
 * `{...}` span (ignoring braces inside string literals). Returns `null`
 * when no plausible JSON object can be located — e.g. a stream truncated
 * mid-object never balances and correctly falls through to the caller's
 * next recovery step (docs/ARCHITECTURE.md section 3, the "Repair" stage).
 */
export function extractJsonCandidate(rawText: string): string | null {
  const stripped = stripCodeFences(rawText)
  const start = stripped.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escapeNext = false

  for (let i = start; i < stripped.length; i++) {
    const char = stripped[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }
    if (char === '\\') {
      escapeNext = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (char === '{') depth++
    if (char === '}') {
      depth--
      if (depth === 0) return stripped.slice(start, i + 1)
    }
  }

  return null
}

function stripCodeFences(text: string): string {
  return text.replace(/```(?:json)?/gi, '')
}
