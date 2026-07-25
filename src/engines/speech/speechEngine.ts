import type { EventBus } from '@engines/bus'
import type { SpeechCapability } from './types'

export interface SpeechEngine {
  probeCapability(): SpeechCapability
  speak(characterId: string, line: string): void
  cancel(): void
}

/**
 * Wraps the Web Speech API (docs/ARCHITECTURE.md section 4 and the Speech
 * API risk table). Not implemented in Milestone 0 — voice casting, the
 * utterance queue, and the onend/onboundary clock handoff arrive in
 * Milestone 3.
 */
export function createSpeechEngine(_bus: EventBus): SpeechEngine {
  return {
    probeCapability: () =>
      typeof window !== 'undefined' && 'speechSynthesis' in window ? 'available' : 'unavailable',
    speak: () => {
      /* implemented in Milestone 3 */
    },
    cancel: () => {
      /* implemented in Milestone 3 */
    },
  }
}
