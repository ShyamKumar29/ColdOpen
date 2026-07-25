import type { Character } from '@schema'
import type { CastMember, StageSlot } from './types'

export interface CharacterEngine {
  register(cast: readonly Character[]): CastMember[]
  assignSlot(characterId: string): StageSlot | null
}

/**
 * Owns the cast as data: registry, stage slot assignment, and the
 * entrance/exit lifecycle (docs/ARCHITECTURE.md section 4).
 *
 * Slot assignment and collision resolution are implemented in
 * Milestone 1 alongside the static stage.
 */
export function createCharacterEngine(): CharacterEngine {
  return {
    register: (cast) => cast.map((character) => ({ character, slot: null, pose: 'idle' })),
    assignSlot: () => null,
  }
}
