/**
 * Generic string helpers with no Cold Open domain knowledge, per CLAUDE.md's
 * `lib/` rules.
 */

/**
 * Reduces a string to lowercase letters and digits only, so values that
 * differ solely in casing, spacing, or punctuation compare equal
 * ("Cold Moonlight", "cold_moonlight", and "coldMoonlight" all collapse to
 * "coldmoonlight").
 */
export function canonicalToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Converts arbitrary text into a lowercase hyphen-separated slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Shortens text to at most `maxLength` characters, preferring to end on a
 * sentence terminator and falling back to a word boundary, so a clamped
 * line still reads as written rather than being cut mid-word. Only cuts at
 * a boundary past the halfway mark — otherwise a single long unbroken run
 * would collapse the text to almost nothing.
 */
export function clampText(value: string, maxLength: number): string {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) return trimmed

  const head = trimmed.slice(0, maxLength)
  const minimumKept = maxLength / 2

  const sentenceEnd = lastSentenceEnd(head)
  if (sentenceEnd >= minimumKept) return head.slice(0, sentenceEnd).trimEnd()

  const wordEnd = head.lastIndexOf(' ')
  if (wordEnd >= minimumKept) return head.slice(0, wordEnd).trimEnd()

  return head.trimEnd()
}

/** Index just past the last `.`/`!`/`?` in `text`, or -1 if there is none. */
function lastSentenceEnd(text: string): number {
  for (let index = text.length - 1; index >= 0; index--) {
    const character = text[index]
    if (character === '.' || character === '!' || character === '?') return index + 1
  }
  return -1
}
