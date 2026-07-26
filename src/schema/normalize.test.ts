import { describe, expect, it } from 'vitest'
import { validateSceneScript, validateReferentialIntegrity } from './normalize'
import type { SceneScript } from './types'

const adaCharacter: SceneScript['cast'][number] = {
  id: 'ada',
  name: 'Ada',
  archetype: 'stranger',
  voice: { register: 'mid', rate: 'normal' },
  entrance: { beat: 0, from: 'shadow', style: 'creep' },
}

const baseScript: SceneScript = {
  version: '1.0',
  title: 'Test Scene',
  genre: 'noir',
  mood: 'tense',
  scene: { slugline: 'INT. OFFICE - NIGHT', setting: 'office', timeOfDay: 'night' },
  cast: [adaCharacter],
  beats: [
    { id: 'b0', type: 'title' },
    { id: 'b1', type: 'slugline' },
    { id: 'b2', type: 'dialogue', characterId: 'ada', line: 'Hello.' },
    { id: 'b3', type: 'reveal' },
  ],
}

describe('validateReferentialIntegrity', () => {
  it('returns no issues for a sound script', () => {
    expect(validateReferentialIntegrity(baseScript)).toEqual([])
  })

  it('flags a dialogue beat referencing an unknown character', () => {
    const broken: SceneScript = {
      ...baseScript,
      beats: baseScript.beats.map((beat) =>
        beat.type === 'dialogue' ? { ...beat, characterId: 'nobody' } : beat,
      ),
    }

    const issues = validateReferentialIntegrity(broken)
    expect(issues.some((issue) => issue.includes('nobody'))).toBe(true)
  })

  it('flags a movement referencing an unknown character', () => {
    const broken: SceneScript = {
      ...baseScript,
      beats: baseScript.beats.map((beat, index) =>
        index === 0
          ? { ...beat, movements: [{ characterId: 'ghost', to: 'center', style: 'walk' }] }
          : beat,
      ),
    }

    const issues = validateReferentialIntegrity(broken)
    expect(issues.some((issue) => issue.includes('ghost'))).toBe(true)
  })

  it('flags a camera target that is not a cast id, "center", or "wide"', () => {
    const broken: SceneScript = {
      ...baseScript,
      beats: baseScript.beats.map((beat, index) =>
        index === 0 ? { ...beat, camera: { move: 'static', target: 'someone-else' } } : beat,
      ),
    }

    const issues = validateReferentialIntegrity(broken)
    expect(issues.some((issue) => issue.includes('someone-else'))).toBe(true)
  })

  it('allows camera targets of "center" and "wide"', () => {
    const ok: SceneScript = {
      ...baseScript,
      beats: baseScript.beats.map((beat, index) =>
        index === 0 ? { ...beat, camera: { move: 'static', target: 'wide' } } : beat,
      ),
    }

    expect(validateReferentialIntegrity(ok)).toEqual([])
  })

  it('flags duplicate cast ids', () => {
    const broken: SceneScript = {
      ...baseScript,
      cast: [...baseScript.cast, { ...adaCharacter, name: 'Ada Two' }],
    }

    const issues = validateReferentialIntegrity(broken)
    expect(issues.some((issue) => issue.includes('used by more than one character'))).toBe(true)
  })

  it('flags an entrance beat index out of range', () => {
    const broken: SceneScript = {
      ...baseScript,
      cast: baseScript.cast.map((character) => ({
        ...character,
        entrance: { ...character.entrance, beat: 99 },
      })),
    }

    const issues = validateReferentialIntegrity(broken)
    expect(issues.some((issue) => issue.includes('entrance.beat'))).toBe(true)
  })

  it('flags an exit beat index out of range', () => {
    const broken: SceneScript = {
      ...baseScript,
      cast: baseScript.cast.map((character) => ({
        ...character,
        exit: { beat: 99, to: 'offLeft', style: 'walk' },
      })),
    }

    const issues = validateReferentialIntegrity(broken)
    expect(issues.some((issue) => issue.includes('exit.beat'))).toBe(true)
  })
})

describe('validateSceneScript referential integrity wiring', () => {
  it('passes a shape-valid, referentially sound script', () => {
    expect(validateSceneScript(baseScript).success).toBe(true)
  })

  it('fails validation for a script with duplicate cast ids', () => {
    const broken = {
      ...baseScript,
      cast: [...baseScript.cast, { ...adaCharacter, name: 'Ada Two' }],
    }

    expect(validateSceneScript(broken).success).toBe(false)
  })

  it('fails validation for a shape-valid but referentially broken script', () => {
    const broken = {
      ...baseScript,
      beats: baseScript.beats.map((beat) =>
        beat.type === 'dialogue' ? { ...beat, characterId: 'nobody' } : beat,
      ),
    }

    expect(validateSceneScript(broken).success).toBe(false)
  })
})
