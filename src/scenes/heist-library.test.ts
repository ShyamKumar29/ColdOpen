import { describe, expect, it } from 'vitest'
import { validateSceneScript } from '@schema'
import { heistLibrary } from './heist-library'

describe('heist-library seed script', () => {
  it('validates successfully against the SceneScript schema', () => {
    const result = validateSceneScript(heistLibrary)

    expect(result.success).toBe(true)
  })

  it('rejects a candidate with an invalid enum value', () => {
    const invalid = { ...heistLibrary, genre: 'not-a-real-genre' }

    const result = validateSceneScript(invalid)

    expect(result.success).toBe(false)
  })
})
