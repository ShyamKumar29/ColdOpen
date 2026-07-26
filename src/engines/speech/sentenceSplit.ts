/**
 * Splits a dialogue line into speakable chunks (docs/ARCHITECTURE.md
 * section 4, "Speech Engine — ... utterance queue, sentence-splitting for
 * long lines"). Pure and deterministic. The schema already caps a dialogue
 * line at 180 chars, so `MAX_CHUNKS` is a defensive bound (CLAUDE.md
 * Performance Rules — "speech queue length" must be bounded), not something
 * ordinary content is expected to hit.
 */
const MAX_CHUNKS = 8

export function splitIntoSentences(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed) return []

  const matches = trimmed.match(/[^.!?]+[.!?]*(?:\s+|$)/g)
  const sentences = (matches ?? [trimmed]).map((sentence) => sentence.trim()).filter(Boolean)

  if (sentences.length <= MAX_CHUNKS) return sentences

  const head = sentences.slice(0, MAX_CHUNKS - 1)
  const tail = sentences.slice(MAX_CHUNKS - 1).join(' ')
  return [...head, tail]
}
