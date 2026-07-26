/**
 * A best-effort, display-only snapshot of an in-progress Groq stream, for
 * the "writing room" typewriter (docs/ARCHITECTURE.md section 3: "display
 * only, best effort"). Never used for validation — `schema/` is the only
 * authority on whether a completed script is well-formed.
 */
export interface ScenePreview {
  title?: string
  genre?: string
  slugline?: string
  /** Number of beats that have appeared in the stream so far. */
  beatCount: number
}

/**
 * Pulls out whatever partial fields are legible from accumulated raw text,
 * without requiring the JSON to be complete or even balanced. Pure and safe
 * to call on every chunk of a growing string.
 */
export function parseScenePreview(accumulatedRawText: string): ScenePreview {
  return {
    title: extractStringField(accumulatedRawText, 'title'),
    genre: extractStringField(accumulatedRawText, 'genre'),
    slugline: extractStringField(accumulatedRawText, 'slugline'),
    beatCount: countMatches(
      accumulatedRawText,
      /"type"\s*:\s*"(?:title|slugline|action|dialogue|beat|reveal)"/g,
    ),
  }
}

function extractStringField(text: string, field: string): string | undefined {
  const pattern = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  const match = pattern.exec(text)
  return match?.[1]
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0
}
