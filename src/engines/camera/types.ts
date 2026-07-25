import type { CameraDirection } from '@schema'

export interface CameraState {
  x: number
  y: number
  zoom: number
  rotation: number
  focusTarget: string | null
}

export type { CameraDirection }
