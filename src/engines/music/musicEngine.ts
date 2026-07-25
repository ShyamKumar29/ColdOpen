import type { EventBus } from '@engines/bus'
import type { Mood } from './types'

export interface MusicEngine {
  isUnlocked(): boolean
  unlock(): Promise<void>
  setMood(mood: Mood): void
  duck(to: number): void
  stop(): void
}

/**
 * Tone.js wrapper, synthesis only (ADR-009 in docs/DECISIONS.md).
 *
 * No audio graph is constructed in Milestone 0 — mood arrangements,
 * ducking, and AudioContext unlock are implemented in Milestone 6.
 */
export function createMusicEngine(_bus: EventBus): MusicEngine {
  let unlocked = false

  return {
    isUnlocked: () => unlocked,
    unlock: async () => {
      unlocked = true
    },
    setMood: () => {
      /* implemented in Milestone 6 */
    },
    duck: () => {
      /* implemented in Milestone 6 */
    },
    stop: () => {
      /* implemented in Milestone 6 */
    },
  }
}
