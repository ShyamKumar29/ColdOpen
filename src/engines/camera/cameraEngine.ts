import { motionValue, type MotionValue } from 'framer-motion'
import type { EventBus } from '@engines/bus'
import type { CameraDirection } from './types'

export interface CameraRig {
  x: MotionValue<number>
  y: MotionValue<number>
  zoom: MotionValue<number>
  rotation: MotionValue<number>
  applyMove(direction: CameraDirection): void
}

/**
 * The virtual camera (docs/ARCHITECTURE.md section 4). MotionValues are
 * constructed and owned here, not by the `<Stage>` component — components
 * obtain a reference via a hook and never construct their own (resolves
 * the ownership ambiguity flagged in the Milestone 0 design review).
 *
 * Named moves are not implemented until Milestone 4.
 */
export function createCameraEngine(_bus: EventBus): CameraRig {
  return {
    x: motionValue(0),
    y: motionValue(0),
    zoom: motionValue(1),
    rotation: motionValue(0),
    applyMove: () => {
      /* implemented in Milestone 4 */
    },
  }
}
