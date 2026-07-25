import { describe, expect, it } from 'vitest'
import type { Character } from '@schema'
import { createCharacterEngine } from './characterEngine'

function character(overrides: Partial<Character> & Pick<Character, 'id'>): Character {
  return {
    name: overrides.id,
    archetype: 'stranger',
    voice: { register: 'mid', rate: 'normal' },
    entrance: { beat: 0, from: 'already-present', style: 'walk' },
    ...overrides,
  }
}

describe('createCharacterEngine', () => {
  describe('slot assignment', () => {
    it('places a single character at center', () => {
      const engine = createCharacterEngine()
      const [member] = engine.register([character({ id: 'a' })])

      expect(member!.slot).toBe('center')
      expect(engine.assignSlot('a')).toBe('center')
    })

    it('places two characters at left and right, in cast order', () => {
      const engine = createCharacterEngine()
      const [first, second] = engine.register([character({ id: 'a' }), character({ id: 'b' })])

      expect(first!.slot).toBe('left')
      expect(second!.slot).toBe('right')
    })

    it('places three characters at farLeft, center, farRight, in cast order', () => {
      const engine = createCharacterEngine()
      const [first, second, third] = engine.register([
        character({ id: 'a' }),
        character({ id: 'b' }),
        character({ id: 'c' }),
      ])

      expect(first!.slot).toBe('farLeft')
      expect(second!.slot).toBe('center')
      expect(third!.slot).toBe('farRight')
    })

    it('clears previous assignments on re-registration', () => {
      const engine = createCharacterEngine()
      engine.register([character({ id: 'a' }), character({ id: 'b' })])

      engine.register([character({ id: 'c' })])

      expect(engine.assignSlot('a')).toBeNull()
      expect(engine.assignSlot('c')).toBe('center')
    })

    it('returns null for an unregistered character id', () => {
      const engine = createCharacterEngine()
      engine.register([character({ id: 'a' })])

      expect(engine.assignSlot('nobody')).toBeNull()
    })
  })

  describe('entrance → facing mapping', () => {
    it.each([
      ['offLeft', 'right'],
      ['shadow', 'right'],
      ['offRight', 'left'],
      ['above', 'front'],
      ['already-present', 'front'],
    ] as const)('entrance from %s faces %s', (from, expectedFacing) => {
      const engine = createCharacterEngine()
      const [member] = engine.register([
        character({ id: 'a', entrance: { beat: 0, from, style: 'walk' } }),
      ])

      expect(member!.facing).toBe(expectedFacing)
    })
  })
})
