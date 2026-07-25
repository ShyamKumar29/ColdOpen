import type { Character } from '@schema'

export type SpeechCapability = 'available' | 'unavailable'

export interface VoiceCasting {
  characterId: string
  voice: SpeechSynthesisVoice | null
  pitch: number
  rate: number
}

export type { Character }
