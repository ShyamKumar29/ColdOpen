import type { Character, Entrance } from '@schema'
import type { CastMember, StageSlot, Facing } from './types'

export interface CharacterEngine {
  register(cast: readonly Character[]): CastMember[]
  assignSlot(characterId: string): StageSlot | null
}

/**
 * Deterministic slot layouts by cast size, center-weighted so the stage
 * never looks lopsided with fewer than three characters (cast is capped at
 * three — ADR-012 in docs/DECISIONS.md).
 */
const SLOT_LAYOUTS: Record<number, readonly StageSlot[]> = {
  1: ['center'],
  2: ['left', 'right'],
  3: ['farLeft', 'center', 'farRight'],
}

function slotsForCastSize(size: number): readonly StageSlot[] {
  return SLOT_LAYOUTS[size] ?? SLOT_LAYOUTS[3]!
}

/**
 * A character entering from off-left or from the shadows reads as moving
 * rightward into the scene, so it faces right; the mirror holds for
 * off-right. Characters already present or descending face the audience.
 */
function facingForEntrance(from: Entrance['from']): Facing {
  switch (from) {
    case 'offLeft':
    case 'shadow':
      return 'right'
    case 'offRight':
      return 'left'
    case 'above':
    case 'already-present':
      return 'front'
  }
}

/**
 * Owns the cast as data: registry, stage slot assignment, and the
 * entrance/exit lifecycle (docs/ARCHITECTURE.md section 4).
 *
 * Slot order is stable and derived purely from cast order, so re-registering
 * the same script always produces the same layout. Movement between slots
 * (Milestone 4) will call `assignSlot` again as beats replace this initial
 * placement.
 */
export function createCharacterEngine(): CharacterEngine {
  const slotAssignments = new Map<string, StageSlot>()

  return {
    register(cast) {
      const slots = slotsForCastSize(cast.length)
      slotAssignments.clear()

      return cast.map((character, index) => {
        const slot = slots[index] ?? null
        if (slot) slotAssignments.set(character.id, slot)

        return {
          character,
          slot,
          facing: facingForEntrance(character.entrance.from),
        }
      })
    },
    assignSlot: (characterId) => slotAssignments.get(characterId) ?? null,
  }
}
