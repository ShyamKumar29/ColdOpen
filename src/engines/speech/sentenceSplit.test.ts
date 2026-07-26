import { describe, expect, it } from 'vitest'
import { splitIntoSentences } from './sentenceSplit'

describe('splitIntoSentences', () => {
  it('returns a single chunk for a one-sentence line', () => {
    expect(splitIntoSentences('Touch nothing else.')).toEqual(['Touch nothing else.'])
  })

  it('splits on sentence-ending punctuation', () => {
    expect(splitIntoSentences('Wait here. Watch the door.')).toEqual([
      'Wait here.',
      'Watch the door.',
    ])
  })

  it('preserves question and exclamation boundaries', () => {
    expect(splitIntoSentences('What if someone hears us? Then we run!')).toEqual([
      'What if someone hears us?',
      'Then we run!',
    ])
  })

  it('returns an empty array for an empty line', () => {
    expect(splitIntoSentences('   ')).toEqual([])
  })

  it('caps the number of chunks, merging the remainder into the last one', () => {
    const manySentences = Array.from({ length: 12 }, (_, i) => `Sentence ${i}.`).join(' ')
    const chunks = splitIntoSentences(manySentences)

    expect(chunks.length).toBeLessThanOrEqual(8)
    expect(chunks.join(' ')).toContain('Sentence 11.')
  })
})
