/**
 * Layer ordering (z-index) for the stage stack. One source of truth so
 * depth never drifts out of sync between components.
 */
export const layers = {
  backdrop: 0,
  floor: 10,
  actors: 20,
  foreground: 30,
  lighting: 40,
  vignette: 50,
  grain: 60,
  letterbox: 70,
  overlayText: 80,
} as const
