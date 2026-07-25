import type { Character } from '@schema'

export type StageSlot = 'farLeft' | 'left' | 'center' | 'right' | 'farRight'

export interface CastMember {
  character: Character
  slot: StageSlot | null
  pose: 'idle' | 'gesture'
}

export type { Character }
