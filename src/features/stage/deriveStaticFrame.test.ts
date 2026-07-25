import { describe, expect, it } from 'vitest'
import { DEFAULT_LIGHTING_PRESET } from '@design'
import type { Beat, SceneScript } from '@schema'
import { deriveInitialLighting } from './deriveStaticFrame'

function script(beats: Beat[]): SceneScript {
  return {
    version: '1.0',
    title: 'Test Scene',
    genre: 'noir',
    mood: 'tense',
    scene: {
      slugline: 'INT. TEST - NIGHT',
      setting: 'diner',
      timeOfDay: 'night',
    },
    cast: [
      {
        id: 'a',
        name: 'A',
        archetype: 'stranger',
        voice: { register: 'mid', rate: 'normal' },
        entrance: { beat: 0, from: 'already-present', style: 'walk' },
      },
    ],
    beats,
  }
}

function beat(overrides: Partial<Beat> & Pick<Beat, 'id'>): Beat {
  return { type: 'action', text: 'Something happens.', ...overrides } as Beat
}

describe('deriveInitialLighting', () => {
  it('picks the preset of the first beat carrying a lighting direction', () => {
    const s = script([
      beat({ id: 'b0' }),
      beat({ id: 'b1', lighting: { preset: 'singleSpot', transition: 'fade' } }),
      beat({ id: 'b2', lighting: { preset: 'blackout', transition: 'cut' } }),
    ])

    expect(deriveInitialLighting(s)).toBe('singleSpot')
  })

  it('falls back to the default preset when no beat specifies lighting', () => {
    const s = script([beat({ id: 'b0' }), beat({ id: 'b1' })])

    expect(deriveInitialLighting(s)).toBe(DEFAULT_LIGHTING_PRESET)
  })

  it('falls back to the default preset for a scene with no beats', () => {
    const s = script([])

    expect(deriveInitialLighting(s)).toBe(DEFAULT_LIGHTING_PRESET)
  })
})
