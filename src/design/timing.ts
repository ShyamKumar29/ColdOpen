/**
 * Transition timing values, defined once and referenced everywhere
 * (CLAUDE.md Animation Rules). Milestone 1 is static, but lighting-preset
 * CSS transitions already use these so later milestones don't invent a
 * second set of numbers.
 */
export const durations = {
  fast: 150,
  normal: 400,
  slow: 900,
} as const

/**
 * Canonical control points, so CSS transitions and numerically-interpolated
 * `MotionValue`s (engines/animation) always trace the same curve instead of
 * two hand-tuned approximations of "the same" easing drifting apart.
 */
export const easingCurves = {
  standard: [0.4, 0, 0.2, 1],
  decelerate: [0, 0, 0.2, 1],
} as const

export const easings = {
  standard: `cubic-bezier(${easingCurves.standard.join(', ')})`,
  decelerate: `cubic-bezier(${easingCurves.decelerate.join(', ')})`,
} as const
