const NEWTON_ITERATIONS = 8
const NEWTON_MIN_SLOPE = 0.001

function bezierComponent(t: number, a1: number, a2: number): number {
  const c = 3 * a1
  const b = 3 * a2 - 2 * c
  const a = 1 - c - b
  return ((a * t + b) * t + c) * t
}

function bezierSlope(t: number, a1: number, a2: number): number {
  const c = 3 * a1
  const b = 3 * a2 - 2 * c
  const a = 1 - c - b
  return (3 * a * t + 2 * b) * t + c
}

/**
 * Builds an easing function tracing the same curve as CSS's
 * `cubic-bezier(x1, y1, x2, y2)`, so a numerically-interpolated
 * `MotionValue` (engines/animation) and a CSS transition sharing the same
 * design-token control points move identically. Generic math, no domain
 * knowledge (CLAUDE.md lib/ rules).
 */
export function createCubicBezierEasing(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  if (x1 === y1 && x2 === y2) return (t) => t

  function xForT(t: number): number {
    let guess = t
    for (let i = 0; i < NEWTON_ITERATIONS; i += 1) {
      const slope = bezierSlope(guess, x1, x2)
      if (Math.abs(slope) < NEWTON_MIN_SLOPE) break
      guess -= (bezierComponent(guess, x1, x2) - t) / slope
    }
    return guess
  }

  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return bezierComponent(xForT(t), y1, y2)
  }
}
