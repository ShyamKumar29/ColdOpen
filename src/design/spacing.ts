/**
 * Spacing scale, border treatment, and stage proportions. Centralized so
 * layout numbers never get hand-typed into components (CLAUDE.md Code
 * Style).
 */
export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2.5rem',
} as const

export const borders = {
  width: '1px',
  radius: '2px',
} as const

export const stage = {
  /** Cinematic widescreen aspect ratio for the stage viewport. */
  aspectRatio: '2.35 / 1',
  /** Letterbox bar height as a fraction of the viewport height. */
  letterboxFraction: 0.09,
  maxWidth: '72rem',
} as const
