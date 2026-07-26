import { describe, expect, it } from 'vitest'
import { extractJsonCandidate } from './jsonExtract'

describe('extractJsonCandidate', () => {
  it('returns the object as-is when the text is already exactly JSON', () => {
    expect(extractJsonCandidate('{"a":1}')).toBe('{"a":1}')
  })

  it('strips markdown code fences', () => {
    expect(extractJsonCandidate('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })

  it('trims leading/trailing prose around the JSON object', () => {
    expect(extractJsonCandidate('Sure, here you go:\n{"a":1}\nHope that helps!')).toBe('{"a":1}')
  })

  it('ignores braces inside string literals when balancing', () => {
    const text = '{"line":"he said \\"{not json}\\" to her"}'
    expect(extractJsonCandidate(text)).toBe(text)
  })

  it('returns null when the object never balances (truncated stream)', () => {
    expect(extractJsonCandidate('{"a": {"b": 1')).toBeNull()
  })

  it('returns null when there is no opening brace at all', () => {
    expect(extractJsonCandidate('no json here')).toBeNull()
  })

  it('extracts only the outermost object when trailing garbage follows', () => {
    expect(extractJsonCandidate('{"a":{"b":1}} some trailing note')).toBe('{"a":{"b":1}}')
  })
})
