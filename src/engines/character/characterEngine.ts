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
 * The same deterministic cast-order -> slot layout `register()` uses,
 * exposed as a standalone pure function so other engines that need to know
 * "which side of the stage is this character on" (the Timeline Compiler's
 * automatic camera framing, Milestone 5) can reuse it instead of
 * re-deriving slot assignment themselves.
 */
export function resolveInitialSlots(
  cast: readonly Character[],
): ReadonlyMap<string, StageSlot | null> {
  const slots = slotsForCastSize(cast.length)
  return new Map(cast.map((character, index) => [character.id, slots[index] ?? null]))
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
 * (`beat.movements`) is deferred past Milestone 5 (docs/DECISIONS.md
 * ADR-025) — `assignSlot` exists for that future work to call as beats
 * replace this initial placement.
 */
export function createCharacterEngine(): CharacterEngine {
  const slotAssignments = new Map<string, StageSlot>()

  return {
    register(cast) {
      const slots = resolveInitialSlots(cast)
      slotAssignments.clear()

      return cast.map((character) => {
        const slot = slots.get(character.id) ?? null
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
