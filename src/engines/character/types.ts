import type { Character, StageSlot, Facing } from '@schema'

export interface CastMember {
  character: Character
  slot: StageSlot | null
  facing: Facing
  pose: 'idle' | 'gesture'
}

export type { Character, StageSlot, Facing }
