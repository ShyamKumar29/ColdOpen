import { canonicalToken, clampText } from '@lib'
import type { Vocabulary } from './vocabularies'

/** Why a value in the candidate document differs from what the source sent. */
export type CoercionReason = 'alias' | 'default' | 'derived' | 'clamped' | 'dropped'

export interface CoercionNote {
  /** Dotted path into the candidate document, e.g. `beats.3.camera.move`. */
  path: string
  from: string
  to: string
  reason: CoercionReason
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Rewrites `null` to "absent" throughout the document.
 *
 * Models routinely emit `null` for an optional field they chose not to use
 * (`"weather": null`, `"exit": null`). Zod's `.optional()` accepts
 * `undefined`, not `null`, so every one of those is a hard validation
 * failure. Handling it here — rather than making 20 schema fields
 * `.nullable()` — keeps `| null` out of every downstream inferred type.
 */
export function stripNulls(value: unknown, path: string, notes: CoercionNote[]): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== null)
      .map((entry, index) => stripNulls(entry, `${path}${path ? '.' : ''}${index}`, notes))
  }

  if (!isRecord(value)) return value

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    const childPath = `${path}${path ? '.' : ''}${key}`
    if (entry === null) {
      notes.push({ path: childPath, from: 'null', to: '(absent)', reason: 'dropped' })
      continue
    }
    result[key] = stripNulls(entry, childPath, notes)
  }
  return result
}

/**
 * Resolves a raw value against a closed vocabulary, in order of how much
 * intent each step preserves:
 *
 * 1. exact member — untouched
 * 2. canonical member match — casing/spacing/punctuation variant
 * 3. curated alias — a genuine synonym or nearest renderable neighbour
 * 4. longest embedded member or alias — a qualified phrase such as
 *    "abandoned warehouse" or "cocktail bar"
 * 5. the vocabulary's fallback, when it has one
 *
 * Returns `undefined` when nothing matched and there is no fallback; the
 * caller decides whether that means dropping an optional field or leaving
 * the original value in place for Zod to reject.
 */
export function resolveEnum<T extends string>(
  raw: unknown,
  vocabulary: Vocabulary<T>,
  path: string,
  notes: CoercionNote[],
): T | undefined {
  const options = vocabulary.options
  if (typeof raw === 'string') {
    if ((options as readonly string[]).includes(raw)) return raw as T

    const token = canonicalToken(raw)
    const canonicalMatch = options.find((option) => canonicalToken(option) === token)
    if (canonicalMatch) {
      notes.push({ path, from: raw, to: canonicalMatch, reason: 'alias' })
      return canonicalMatch
    }

    const aliased = vocabulary.aliases[token]
    if (aliased !== undefined) {
      notes.push({ path, from: raw, to: aliased, reason: 'alias' })
      return aliased
    }

    const embedded = findEmbedded(token, vocabulary)
    if (embedded !== undefined) {
      notes.push({ path, from: raw, to: embedded, reason: 'alias' })
      return embedded
    }
  }

  if (vocabulary.fallback === undefined) return undefined

  notes.push({
    path,
    from: describe(raw),
    to: vocabulary.fallback,
    reason: 'default',
  })
  return vocabulary.fallback
}

/** Shorter than this, an embedded match is more likely coincidence than intent. */
const MIN_EMBEDDED_LENGTH = 4

/**
 * Finds a known member or alias spelled out inside a longer phrase, which
 * is how models write a qualified location ("abandoned warehouse", "the
 * old cocktail bar"). The longest match wins so a compound like
 * "starship bridge" resolves on `starship` rather than `bridge`.
 */
function findEmbedded<T extends string>(token: string, vocabulary: Vocabulary<T>): T | undefined {
  let best: T | undefined
  let bestLength = 0

  const consider = (key: string, target: T): void => {
    if (key.length < MIN_EMBEDDED_LENGTH || key.length <= bestLength) return
    if (!token.includes(key)) return
    best = target
    bestLength = key.length
  }

  for (const option of vocabulary.options) consider(canonicalToken(option), option)
  for (const [key, target] of Object.entries(vocabulary.aliases)) consider(key, target)

  return best
}

/**
 * Applies `resolveEnum` to `record[key]` in place. A field that resolves to
 * nothing is deleted when `optional`, and left untouched otherwise so Zod
 * reports the original offending value.
 */
export function coerceEnumField<T extends string>(
  record: Record<string, unknown>,
  key: string,
  vocabulary: Vocabulary<T>,
  path: string,
  notes: CoercionNote[],
  optional = false,
): void {
  if (!(key in record) && optional) return

  const resolved = resolveEnum(record[key], vocabulary, path, notes)
  if (resolved !== undefined) {
    record[key] = resolved
    return
  }
  if (optional) delete record[key]
}

/** Shortens an over-long string field to the schema's maximum, if present. */
export function clampStringField(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
  path: string,
  notes: CoercionNote[],
): void {
  const value = record[key]
  if (typeof value !== 'string' || value.length <= maxLength) return

  const clamped = clampText(value, maxLength)
  notes.push({
    path,
    from: `${value.length} chars`,
    to: `${clamped.length} chars`,
    reason: 'clamped',
  })
  record[key] = clamped
}

/**
 * Normalizes a numeric field: accepts a numeric string, rounds to an
 * integer, and clamps into range. Leaves genuinely non-numeric values alone
 * for Zod to reject.
 */
export function coerceIntegerField(
  record: Record<string, unknown>,
  key: string,
  { min, max }: { min: number; max?: number },
  path: string,
  notes: CoercionNote[],
): void {
  const value = record[key]
  if (value === undefined) return

  const numeric = typeof value === 'number' ? value : Number(value)
  if (typeof value !== 'number' && (typeof value !== 'string' || !Number.isFinite(numeric))) return
  if (!Number.isFinite(numeric)) return

  let next = Math.round(numeric)
  if (next < min) next = min
  if (max !== undefined && next > max) next = max

  if (next !== value) {
    notes.push({ path, from: describe(value), to: String(next), reason: 'clamped' })
    record[key] = next
  }
}

/** Clamps a 0–1 ratio field, accepting numeric strings and out-of-range numbers. */
export function coerceRatioField(
  record: Record<string, unknown>,
  key: string,
  path: string,
  notes: CoercionNote[],
): void {
  const value = record[key]
  if (value === undefined) return

  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    delete record[key]
    notes.push({ path, from: describe(value), to: '(absent)', reason: 'dropped' })
    return
  }

  const next = Math.min(1, Math.max(0, numeric))
  if (next !== value) {
    notes.push({ path, from: describe(value), to: String(next), reason: 'clamped' })
    record[key] = next
  }
}

/** Accepts the string forms of a boolean that models sometimes emit. */
export function coerceBooleanField(record: Record<string, unknown>, key: string): void {
  const value = record[key]
  if (value === 'true') record[key] = true
  else if (value === 'false') record[key] = false
}

export function describe(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === undefined) return '(absent)'
  return JSON.stringify(value) ?? String(value)
}
