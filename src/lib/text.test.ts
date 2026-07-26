import { describe, expect, it } from 'vitest'
import { canonicalToken, clampText, slugify } from './text'

describe('canonicalToken', () => {
  it('collapses casing, spacing, and punctuation differences', () => {
    expect(canonicalToken('Cold Moonlight')).toBe('coldmoonlight')
    expect(canonicalToken('cold_moonlight')).toBe('coldmoonlight')
    expect(canonicalToken('coldMoonlight')).toBe('coldmoonlight')
    expect(canonicalToken('Sci-Fi')).toBe('scifi')
  })

  it('preserves digits', () => {
    expect(canonicalToken('Studio 54')).toBe('studio54')
  })
})

describe('slugify', () => {
  it('turns a display name into a lowercase hyphenated slug', () => {
    expect(slugify('Mara Vane')).toBe('mara-vane')
    expect(slugify('mara_vane')).toBe('mara-vane')
    expect(slugify('  Mara  ')).toBe('mara')
  })

  it('leaves an already-valid slug unchanged', () => {
    expect(slugify('mara-vane')).toBe('mara-vane')
  })

  it('returns an empty string when there is nothing sluggable', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('clampText', () => {
  it('returns short text unchanged', () => {
    expect(clampText('Who is out there?', 180)).toBe('Who is out there?')
  })

  it('prefers to end on a sentence boundary', () => {
    const text = 'First sentence here. Second sentence runs past the limit entirely.'

    expect(clampText(text, 40)).toBe('First sentence here.')
  })

  it('falls back to a word boundary when there is no usable sentence end', () => {
    const text = 'one two three four five six seven eight nine ten'

    const clamped = clampText(text, 20)

    expect(clamped.length).toBeLessThanOrEqual(20)
    expect(clamped.endsWith(' ')).toBe(false)
    expect(text.startsWith(clamped)).toBe(true)
  })

  it('hard-cuts a single unbroken run rather than returning almost nothing', () => {
    const clamped = clampText('a'.repeat(50), 10)

    expect(clamped).toBe('a'.repeat(10))
  })
})
