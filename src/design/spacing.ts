import { poseTokens } from './pose'
import { silhouetteTokens } from './silhouette'

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

// `Actor` grows a character's silhouette box in two ways: build
// (`silhouetteTokens[...].scaleY`, e.g. 'tall') stretches leg length only,
// anchored at the floor (see `Silhouette`'s `heightScale`, docs/DECISIONS.md
// ADR-026), while pose (`poseTokens[...].scale`, e.g. 'surprised') scales the
// whole assembled figure from a bottom-center transform origin.
//
// Leg-only stretch raises the head by less than a full `scaleY` would — the
// actual worst-case headroom need is smaller than what this formula budgets
// for. Multiplying by the raw `scaleY` here is therefore a deliberately
// conservative safe upper bound, not a tight/exact geometric limit: it
// slightly over-reserves headroom (characters render a touch smaller than
// the tightest possible safe size) in exchange for staying correct if either
// token table's values change without anyone re-deriving the exact
// leg-translation headroom by hand. The actor's allotted height must leave
// enough headroom above an unscaled silhouette that even the largest
// build+pose combination never paints past the stage's `overflow-hidden` top
// edge. Computed from the actual token values, not a hand-tuned guess, so it
// can't silently go stale if either token table changes.
const maxCombinedVerticalScale =
  Math.max(...Object.values(silhouetteTokens).map((token) => token.scaleY)) *
  Math.max(...Object.values(poseTokens).map((token) => token.scale))
const ACTOR_TOP_MARGIN_FRACTION = 0.03

export const stage = {
  /** Cinematic widescreen aspect ratio for the stage viewport. */
  aspectRatio: '2.35 / 1',
  /** Letterbox bar height as a fraction of the viewport height. */
  letterboxFraction: 0.09,
  maxWidth: '72rem',
  /** Fraction of stage height allotted to an actor's silhouette box, bottom-anchored (see the comment above). */
  actorHeightFraction: (1 - ACTOR_TOP_MARGIN_FRACTION) / maxCombinedVerticalScale,
} as const
