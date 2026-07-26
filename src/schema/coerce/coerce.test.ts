import { describe, expect, it } from 'vitest'
import { heistLibrary } from '@scenes'
import {
  coerceSceneScriptCandidate,
  findNonCanonicalAliasKeys,
  findUnresolvableAliasTargets,
  vocabularies,
} from './index'
import type { CoercionNote } from './primitives'

type Candidate = Record<string, unknown>

/** A minimal, fully-valid candidate each test bends in exactly one way. */
function candidate(overrides: Candidate = {}): Candidate {
  return {
    version: '1.0',
    title: 'Echoes at Sea',
    genre: 'drama',
    mood: 'melancholy',
    scene: { slugline: 'EXT. LIGHTHOUSE - NIGHT', setting: 'lighthouse', timeOfDay: 'night' },
    cast: [
      {
        id: 'mara',
        name: 'Mara',
        archetype: 'stranger',
        voice: { register: 'mid', rate: 'normal' },
        entrance: { beat: 0, from: 'already-present', style: 'walk' },
      },
    ],
    beats: [
      { id: 'b0', type: 'title' },
      { id: 'b1', type: 'slugline' },
      { id: 'b2', type: 'action', text: 'The beam sweeps the water.' },
      { id: 'b3', type: 'dialogue', characterId: 'mara', line: 'Who is out there?' },
    ],
    ...overrides,
  }
}

function coerce(input: Candidate): { value: Candidate; notes: CoercionNote[] } {
  const result = coerceSceneScriptCandidate(input)
  return { value: result.value as Candidate, notes: result.notes }
}

function beatsOf(value: Candidate): Candidate[] {
  return value.beats as Candidate[]
}

function castOf(value: Candidate): Candidate[] {
  return value.cast as Candidate[]
}

describe('vocabulary tables', () => {
  it('has every alias key in canonical form, so the matcher can reach it', () => {
    expect(findNonCanonicalAliasKeys()).toEqual([])
  })

  it('has every alias and fallback targeting a real member of its own vocabulary', () => {
    expect(findUnresolvableAliasTargets()).toEqual([])
  })

  it('reads its options from the live Zod schemas rather than a copy', () => {
    expect(vocabularies.setting.options).toContain('lighthouse')
    expect(vocabularies.beatType.options).toEqual([
      'title',
      'slugline',
      'action',
      'dialogue',
      'beat',
      'reveal',
    ])
  })
})

describe('coerceSceneScriptCandidate', () => {
  it('leaves an already-valid script untouched and reports no coercions', () => {
    const { value, notes } = coerce(heistLibrary as unknown as Candidate)

    expect(notes).toEqual([])
    expect(value).toEqual(heistLibrary)
  })

  it('returns non-object input unchanged instead of throwing', () => {
    expect(coerceSceneScriptCandidate('not json').value).toBe('not json')
    expect(coerceSceneScriptCandidate(null).value).toBe(null)
  })
})

describe('enum resolution', () => {
  it('accepts a casing/punctuation variant of a real member', () => {
    const { value, notes } = coerce(candidate({ genre: 'Sci-Fi' }))

    expect(value.genre).toBe('scifi')
    expect(notes).toContainEqual({ path: 'genre', from: 'Sci-Fi', to: 'scifi', reason: 'alias' })
  })

  it('maps a synonym to its nearest renderable neighbour', () => {
    const { value } = coerce(
      candidate({ scene: { slugline: 'INT. BAR', setting: 'tavern', timeOfDay: 'night' } }),
    )

    expect((value.scene as Candidate).setting).toBe('diner')
  })

  it('finds a known location spelled out inside a qualified phrase', () => {
    const { value } = coerce(
      candidate({
        scene: { slugline: 'INT. X', setting: 'abandoned warehouse', timeOfDay: 'night' },
      }),
    )

    expect((value.scene as Candidate).setting).toBe('warehouse')
  })

  it('prefers the longest embedded match in a compound phrase', () => {
    const { value } = coerce(
      candidate({ scene: { slugline: 'INT. X', setting: 'starship bridge', timeOfDay: 'night' } }),
    )

    expect((value.scene as Candidate).setting).toBe('spaceship')
  })

  it('preserves an expanded-vocabulary value that used to be out of range', () => {
    const { value, notes } = coerce(candidate())

    expect((value.scene as Candidate).setting).toBe('lighthouse')
    expect(notes.filter((note) => note.path === 'scene.setting')).toEqual([])
  })

  it('falls back to the least-committal member when nothing matches', () => {
    const { value, notes } = coerce(
      candidate({
        scene: { slugline: 'INT. SOMEWHERE', setting: 'quantum foam', timeOfDay: 'night' },
      }),
    )

    expect((value.scene as Candidate).setting).toBe('void')
    expect(notes).toContainEqual({
      path: 'scene.setting',
      from: 'quantum foam',
      to: 'void',
      reason: 'default',
    })
  })

  it('drops an unresolvable optional field rather than inventing a value', () => {
    const { value } = coerce(
      candidate({
        scene: {
          slugline: 'INT. SOMEWHERE',
          setting: 'library',
          timeOfDay: 'night',
          weather: 'volcanic ash',
        },
      }),
    )

    expect((value.scene as Candidate).weather).toBeUndefined()
  })

  it('resolves a value borrowed from a sibling enum', () => {
    const cast = [{ ...castOf(candidate())[0], entrance: { beat: 0, from: 'left', style: 'run' } }]
    const { value } = coerce(candidate({ cast }))

    expect(castOf(value)[0]!.entrance).toEqual({ beat: 0, from: 'offLeft', style: 'stride' })
  })
})

describe('null handling', () => {
  it('treats null as absent for optional fields', () => {
    const cast = [{ ...castOf(candidate())[0], exit: null, build: null }]
    const { value, notes } = coerce(
      candidate({
        cast,
        scene: {
          slugline: 'INT. X',
          setting: 'library',
          timeOfDay: 'night',
          weather: null,
        },
      }),
    )

    expect(castOf(value)[0]).not.toHaveProperty('exit')
    expect(castOf(value)[0]).not.toHaveProperty('build')
    expect(value.scene as Candidate).not.toHaveProperty('weather')
    expect(notes.some((note) => note.reason === 'dropped')).toBe(true)
  })

  it('removes null entries from arrays', () => {
    const beats = [...beatsOf(candidate()), null]
    const { value } = coerce(candidate({ beats }))

    expect(beatsOf(value)).toHaveLength(4)
  })
})

describe('derived beat ids', () => {
  it('assigns a stable id to every beat that lacks one', () => {
    const beats = beatsOf(candidate()).map(({ id: _id, ...rest }) => rest)
    const { value, notes } = coerce(candidate({ beats }))

    expect(beatsOf(value).map((beat) => beat.id)).toEqual([
      'title-0',
      'slugline-1',
      'action-2',
      'dialogue-3',
    ])
    expect(notes.filter((note) => note.reason === 'derived')).toHaveLength(4)
  })

  it('keeps hand-authored ids as written', () => {
    const { value, notes } = coerce(candidate())

    expect(beatsOf(value).map((beat) => beat.id)).toEqual(['b0', 'b1', 'b2', 'b3'])
    expect(notes).toEqual([])
  })

  it('disambiguates duplicate beat ids, since nothing references them', () => {
    const beats = beatsOf(candidate()).map((beat) => ({ ...beat, id: 'same' }))
    const { value } = coerce(candidate({ beats }))

    expect(new Set(beatsOf(value).map((beat) => beat.id)).size).toBe(4)
  })
})

describe('beat repair', () => {
  it('maps an invented beat type onto the closest real one', () => {
    const beats = [...beatsOf(candidate()), { id: 'b4', type: 'music' }]
    const { value } = coerce(candidate({ beats }))

    expect(beatsOf(value)[4]!.type).toBe('beat')
  })

  it('supplies a duration for a pause beat that omits one', () => {
    const beats = [...beatsOf(candidate()), { id: 'b4', type: 'beat' }]
    const { value } = coerce(candidate({ beats }))

    expect(beatsOf(value)[4]!.durationMs).toBe(1200)
  })

  it('leaves an unrecognizable beat type alone so validation rejects it', () => {
    const beats = [...beatsOf(candidate()), { id: 'b4', type: 'interpretive-dance' }]
    const { value } = coerce(candidate({ beats }))

    expect(beatsOf(value)[4]!.type).toBe('interpretive-dance')
  })

  it('clamps an over-long dialogue line at a sentence boundary', () => {
    const line = `${'Sentence one is here. '.repeat(9)}And this trailing clause overruns.`
    const beats = [
      ...beatsOf(candidate()).slice(0, 3),
      { id: 'b3', type: 'dialogue', characterId: 'mara', line },
    ]
    const { value } = coerce(candidate({ beats }))

    const clamped = beatsOf(value)[3]!.line as string
    expect(clamped.length).toBeLessThanOrEqual(180)
    expect(clamped.endsWith('.')).toBe(true)
  })

  it('truncates a beat list longer than the schema allows', () => {
    const beats = Array.from({ length: 16 }, (_unused, index) => ({
      id: `b${index}`,
      type: 'action',
      text: 'Something happens.',
    }))
    const { value, notes } = coerce(candidate({ beats }))

    expect(beatsOf(value)).toHaveLength(12)
    expect(notes).toContainEqual({
      path: 'beats',
      from: '16 beats',
      to: '12 beats',
      reason: 'clamped',
    })
  })
})

describe('cast repair', () => {
  it('slugifies a display-name id and the dialogue references that point at it', () => {
    const cast = [{ ...castOf(candidate())[0], id: 'Mara Vane', name: 'Mara Vane' }]
    const beats = beatsOf(candidate()).map((beat) =>
      beat.type === 'dialogue' ? { ...beat, characterId: 'Mara Vane' } : beat,
    )
    const { value } = coerce(candidate({ cast, beats }))

    expect(castOf(value)[0]!.id).toBe('mara-vane')
    expect(beatsOf(value)[3]!.characterId).toBe('mara-vane')
  })

  it('resolves a dialogue reference written as the character display name', () => {
    const beats = beatsOf(candidate()).map((beat) =>
      beat.type === 'dialogue' ? { ...beat, characterId: 'Mara' } : beat,
    )
    const { value } = coerce(candidate({ beats }))

    expect(beatsOf(value)[3]!.characterId).toBe('mara')
  })

  it('leaves colliding cast ids in place so validation can reject the ambiguity', () => {
    const base = castOf(candidate())[0]!
    const cast = [base, { ...base, name: 'Other' }]
    const { value } = coerce(candidate({ cast }))

    expect(castOf(value).map((character) => character.id)).toEqual(['mara', 'mara'])
  })

  it('supplies a default voice when the character has none', () => {
    const cast = [{ ...castOf(candidate())[0], voice: undefined }]
    const { value } = coerce(candidate({ cast }))

    expect(castOf(value)[0]!.voice).toEqual({ register: 'mid', rate: 'normal' })
  })

  it('supplies an entrance when the character has none', () => {
    const cast = [{ ...castOf(candidate())[0], entrance: undefined }]
    const { value } = coerce(candidate({ cast }))

    expect(castOf(value)[0]!.entrance).toEqual({
      beat: 0,
      from: 'already-present',
      style: 'walk',
    })
  })

  it('clamps an out-of-range entrance beat into the beat list', () => {
    const cast = [
      { ...castOf(candidate())[0], entrance: { beat: 9, from: 'offLeft', style: 'walk' } },
    ]
    const { value } = coerce(candidate({ cast }))

    expect((castOf(value)[0]!.entrance as Candidate).beat).toBe(3)
  })

  it('keeps the most-spoken characters when the cast exceeds the stage cap', () => {
    const base = castOf(candidate())[0]!
    const cast = [
      { ...base, id: 'silent-a', name: 'Silent A' },
      { ...base, id: 'talker', name: 'Talker' },
      { ...base, id: 'silent-b', name: 'Silent B' },
      { ...base, id: 'second-talker', name: 'Second Talker' },
    ]
    const beats = [
      ...beatsOf(candidate()).slice(0, 3),
      { id: 'b3', type: 'dialogue', characterId: 'talker', line: 'One.' },
      { id: 'b4', type: 'dialogue', characterId: 'talker', line: 'Two.' },
      { id: 'b5', type: 'dialogue', characterId: 'second-talker', line: 'Three.' },
    ]
    const { value } = coerce(candidate({ cast, beats }))

    expect(castOf(value).map((character) => character.id)).toEqual([
      'silent-a',
      'talker',
      'second-talker',
    ])
  })
})

describe('camera targets', () => {
  it('keeps a target that names a real cast member', () => {
    const beats = beatsOf(candidate()).map((beat) =>
      beat.type === 'dialogue' ? { ...beat, camera: { move: 'pushIn', target: 'mara' } } : beat,
    )
    const { value } = coerce(candidate({ beats }))

    expect((beatsOf(value)[3]!.camera as Candidate).target).toBe('mara')
  })

  it('drops an unresolvable target so automatic framing takes over', () => {
    const beats = beatsOf(candidate()).map((beat) =>
      beat.type === 'dialogue'
        ? { ...beat, camera: { move: 'pushIn', target: 'the lighthouse door' } }
        : beat,
    )
    const { value, notes } = coerce(candidate({ beats }))

    expect(beatsOf(value)[3]!.camera).toEqual({ move: 'pushIn' })
    expect(notes).toContainEqual({
      path: 'beats.3.camera.target',
      from: 'the lighthouse door',
      to: '(absent)',
      reason: 'dropped',
    })
  })
})

describe('version repair', () => {
  it('supplies the version when it is missing or written as a number', () => {
    expect(coerce(candidate({ version: undefined })).value.version).toBe('1.0')
    expect(coerce(candidate({ version: 1 })).value.version).toBe('1.0')
  })

  it('leaves a genuinely different major alone, per ADR-016', () => {
    expect(coerce(candidate({ version: '2.0' })).value.version).toBe('2.0')
  })
})
