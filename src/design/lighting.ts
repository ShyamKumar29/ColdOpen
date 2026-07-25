import type { LightingPreset } from '@schema'

/**
 * Art direction for every `LightingPreset` enum value (CLAUDE.md JSON
 * Schema Rules — "the single source of truth for how enum values map to
 * visuals"). `ambient` tints the whole stage interior; `glow` is the center
 * highlight color; `vignette` scales how hard the edges fall to black;
 * `contrast` feeds subtitle/UI contrast checks (CLAUDE.md Accessibility
 * Rules).
 */
export interface LightingToken {
  label: string
  ambient: string
  glow: string
  vignette: number
  contrast: 'low' | 'normal' | 'high'
}

export const lightingTokens: Record<LightingPreset, LightingToken> = {
  warmInterior: {
    label: 'Warm Interior',
    ambient: '#3a2a15',
    glow: '#e8b169',
    vignette: 0.55,
    contrast: 'normal',
  },
  coldMoonlight: {
    label: 'Cold Moonlight',
    ambient: '#131c29',
    glow: '#9fb6d6',
    vignette: 0.6,
    contrast: 'normal',
  },
  singleSpot: {
    label: 'Single Spot',
    ambient: '#0a0806',
    glow: '#f5c98a',
    vignette: 0.82,
    contrast: 'high',
  },
  silhouetteBacklight: {
    label: 'Silhouette Backlight',
    ambient: '#180f08',
    glow: '#ff9a4d',
    vignette: 0.7,
    contrast: 'high',
  },
  neonWash: {
    label: 'Neon Wash',
    ambient: '#160a20',
    glow: '#c869e8',
    vignette: 0.5,
    contrast: 'normal',
  },
  firelight: {
    label: 'Firelight',
    ambient: '#26130a',
    glow: '#ff7a2e',
    vignette: 0.6,
    contrast: 'normal',
  },
  blackout: {
    label: 'Blackout',
    ambient: '#000000',
    glow: '#000000',
    vignette: 0.97,
    contrast: 'low',
  },
  harshFluorescent: {
    label: 'Harsh Fluorescent',
    ambient: '#1d2119',
    glow: '#e4efd8',
    vignette: 0.32,
    contrast: 'high',
  },
}

export const DEFAULT_LIGHTING_PRESET: LightingPreset = 'warmInterior'
