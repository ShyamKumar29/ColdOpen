import { describe, expect, it } from 'vitest'
import { parseScenePreview } from './tolerantPreviewParser'

describe('parseScenePreview', () => {
  it('returns an empty preview for an empty or garbage string', () => {
    expect(parseScenePreview('')).toEqual({
      title: undefined,
      genre: undefined,
      slugline: undefined,
      beatCount: 0,
    })
  })

  it('extracts a title from a partial, unbalanced JSON stream', () => {
    const partial = '{"version":"1.0","title":"The Last Checkout","genre":"hei'
    expect(parseScenePreview(partial).title).toBe('The Last Checkout')
  })

  it('extracts genre and slugline once they appear', () => {
    const partial =
      '{"title":"X","genre":"noir","scene":{"slugline":"INT. DINER - NIGHT","setting":"dine'
    const preview = parseScenePreview(partial)
    expect(preview.genre).toBe('noir')
    expect(preview.slugline).toBe('INT. DINER - NIGHT')
  })

  it('counts beats as their "type" fields appear', () => {
    const partial =
      '{"beats":[{"id":"b0","type":"title"},{"id":"b1","type":"slugline"},{"id":"b2","type":"dialo'
    expect(parseScenePreview(partial).beatCount).toBe(2)
  })

  it('is monotonic as more text streams in (never regresses beatCount)', () => {
    const chunk1 = '{"beats":[{"id":"b0","type":"title"}'
    const chunk2 = chunk1 + ',{"id":"b1","type":"dialogue","characterId":"a","line":"hi"}'

    const first = parseScenePreview(chunk1).beatCount
    const second = parseScenePreview(chunk2).beatCount
    expect(second).toBeGreaterThanOrEqual(first)
  })
})
