import type { EventBus } from '@engines/bus'
import type { Phase, ClockSource } from './types'

export interface SceneController {
  getPhase(): Phase
  getClockSource(): ClockSource
  play(): void
  pause(): void
  restart(): void
  skip(): void
}

/**
 * The Director (docs/ARCHITECTURE.md section 4). Owns the beat sequencer,
 * phase machine, and clock-source strategy.
 *
 * Scaffolding only for Milestone 0 — sequencing, cue firing, and the
 * speech/timer clock handoff are implemented in Milestones 2 and 3.
 */
export function createSceneController(_bus: EventBus): SceneController {
  let phase: Phase = 'idle'
  const clockSource: ClockSource = 'timer'

  return {
    getPhase: () => phase,
    getClockSource: () => clockSource,
    play: () => {
      phase = 'playing'
    },
    pause: () => {
      phase = 'paused'
    },
    restart: () => {
      phase = 'idle'
    },
    skip: () => {
      /* implemented in Milestone 2 */
    },
  }
}
