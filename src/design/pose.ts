import type { CharacterPose } from '@engines/bus'

/**
 * Art direction for every derived `CharacterPose` value (CLAUDE.md JSON
 * Schema Rules — "the single source of truth for how enum values map to
 * visuals"). Silhouette actors have no rigged limbs yet, so a pose reads as
 * a restrained scale/vertical-settle rather than a literal gesture — subtle
 * by design (CLAUDE.md Animation Rules).
 */
export interface PoseToken {
  scale: number
  translateY: number
}

export const poseTokens: Record<CharacterPose, PoseToken> = {
  idle: { scale: 1, translateY: 0 },
  speaking: { scale: 1.02, translateY: 0 },
  listening: { scale: 0.99, translateY: 0 },
  surprised: { scale: 1.05, translateY: -3 },
  thinking: { scale: 0.98, translateY: 1 },
}
