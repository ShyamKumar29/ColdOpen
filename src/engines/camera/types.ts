import type { CameraFocus, CameraShot, ColdOpenEventMap } from '@engines/bus'

export interface CameraState {
  x: number
  y: number
  zoom: number
}

export type { CameraFocus, CameraShot }

/** The resolved shape of a `camera:move` cue — everything the Camera Engine needs, nothing it has to look up itself. */
export type CameraMoveCue = ColdOpenEventMap['camera:move']
