import type { Setting } from '@schema'

/**
 * Art direction for every `Setting` enum value — the backdrop's horizon
 * color pair and a repeating-pattern "motif" the Backdrop component turns
 * into a CSS background (no images, per CLAUDE.md's SVG + CSS constraint).
 */
export type EnvironmentMotif =
  | 'shelves'
  | 'booths'
  | 'brick'
  | 'grid'
  | 'trunks'
  | 'skyline'
  | 'beams'
  | 'cubicles'
  | 'dunes'
  | 'windows'
  | 'tiles'
  | 'flat'

export interface EnvironmentToken {
  label: string
  horizonTop: string
  horizonBottom: string
  motif: EnvironmentMotif
}

export const environmentTokens: Record<Setting, EnvironmentToken> = {
  library: { label: 'Library', horizonTop: '#0f0d09', horizonBottom: '#050403', motif: 'shelves' },
  diner: { label: 'Diner', horizonTop: '#160f08', horizonBottom: '#050302', motif: 'booths' },
  alley: { label: 'Alley', horizonTop: '#0d0d0c', horizonBottom: '#040404', motif: 'brick' },
  spaceship: { label: 'Spaceship', horizonTop: '#0a0e12', horizonBottom: '#030405', motif: 'grid' },
  forest: { label: 'Forest', horizonTop: '#0b0f0a', horizonBottom: '#030402', motif: 'trunks' },
  rooftop: { label: 'Rooftop', horizonTop: '#0c0f14', horizonBottom: '#040405', motif: 'skyline' },
  warehouse: {
    label: 'Warehouse',
    horizonTop: '#0e0c09',
    horizonBottom: '#040302',
    motif: 'beams',
  },
  office: { label: 'Office', horizonTop: '#0d0e10', horizonBottom: '#040405', motif: 'cubicles' },
  desert: { label: 'Desert', horizonTop: '#161009', horizonBottom: '#050402', motif: 'dunes' },
  apartment: {
    label: 'Apartment',
    horizonTop: '#100d0a',
    horizonBottom: '#040302',
    motif: 'windows',
  },
  subway: { label: 'Subway', horizonTop: '#0b0c0d', horizonBottom: '#040405', motif: 'tiles' },
  void: { label: 'Void', horizonTop: '#050505', horizonBottom: '#000000', motif: 'flat' },
}

/**
 * Ambient brightness multiplier applied to the lighting overlay by time of
 * day — night and dusk lean into the vignette, day pulls it back.
 */
export const timeOfDayBrightness: Record<'dawn' | 'day' | 'dusk' | 'night', number> = {
  dawn: 0.85,
  day: 1,
  dusk: 0.8,
  night: 0.65,
}
