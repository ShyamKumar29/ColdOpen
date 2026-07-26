import type { Character, StageSlot, Facing } from '@schema'

export interface CastMember {
  character: Character
  slot: StageSlot | null
  facing: Facing
}

export type { Character, StageSlot, Facing }
