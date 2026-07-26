import { describe, expect, it } from 'vitest'
import { validateSceneScript } from '@schema'
import { heistLibrary } from './heist-library'

describe('heist-library seed script', () => {
  it('validates successfully against the SceneScript schema', () => {
    const result = validateSceneScript(heistLibrary)

    expect(result.success).toBe(true)
  })

  it('passes through the seed script untouched, with no coercions applied', () => {
    const result = validateSceneScript(heistLibrary)

    expect(result.coercions).toEqual([])
    expect(result.success && result.data.beats.map((beat) => beat.id)).toEqual(
      heistLibrary.beats.map((beat) => beat.id),
    )
  })

  it('normalizes an unrecognized enum value to a default rather than rejecting', () => {
    const invalid = { ...heistLibrary, genre: 'not-a-real-genre' }

    const result = validateSceneScript(invalid)

    expect(result.success).toBe(true)
    expect(result.success && result.data.genre).toBe('drama')
    expect(result.coercions).toContainEqual({
      path: 'genre',
      from: 'not-a-real-genre',
      to: 'drama',
      reason: 'default',
    })
  })

  it('still rejects a candidate whose content cannot be recovered', () => {
    const broken = { ...heistLibrary, beats: heistLibrary.beats.slice(0, 2) }

    const result = validateSceneScript(broken)

    expect(result.success).toBe(false)
  })
})
