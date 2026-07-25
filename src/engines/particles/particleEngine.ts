import type { ParticleDirection, Particle } from './types'

export const MAX_PARTICLES = 60

export interface ParticleEngine {
  getPool(): readonly Particle[]
  apply(direction: ParticleDirection): void
}

/**
 * Fixed-capacity particle pool (docs/ARCHITECTURE.md Performance Rules —
 * particle counts are bounded, never scale with unbounded input).
 *
 * The RAF loop and emitters are implemented in Milestone 7.
 */
export function createParticleEngine(): ParticleEngine {
  const pool: Particle[] = []

  return {
    getPool: () => pool,
    apply: () => {
      /* implemented in Milestone 7 */
    },
  }
}
