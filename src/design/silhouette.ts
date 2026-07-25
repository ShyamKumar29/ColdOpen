import type { Build } from '@schema'

/**
 * Silhouette geometry: which of the three base SVG shapes a `Build` maps
 * to, plus a uniform scale multiplier so `tall` and `slight` read as
 * distinct without needing bespoke artwork for every combination.
 */
export type SilhouetteShape = 'slim' | 'regular' | 'broad'

export interface SilhouetteToken {
  shape: SilhouetteShape
  scaleX: number
  scaleY: number
}

export const silhouetteTokens: Record<Build, SilhouetteToken> = {
  slight: { shape: 'slim', scaleX: 1, scaleY: 1 },
  average: { shape: 'regular', scaleX: 1, scaleY: 1 },
  tall: { shape: 'regular', scaleX: 1, scaleY: 1.08 },
  heavy: { shape: 'broad', scaleX: 1, scaleY: 0.98 },
}

export const DEFAULT_BUILD: Build = 'average'

/** Base silhouette footprint, in viewBox units, shared by all three shapes. */
export const silhouetteViewBox = { width: 120, height: 320 } as const
