import type { SceneScript } from '@schema'
import type { CueList } from './types'

/**
 * Pure function: SceneScript -> CueList (docs/ARCHITECTURE.md section 4).
 *
 * Flattening, sugar expansion, and sorting are implemented in Milestone 2
 * alongside the timer-clock sequencer. This stub only fixes the function's
 * public shape so the Scene Controller can be wired against it later.
 */
export function compileTimeline(_script: SceneScript): CueList {
  return []
}
