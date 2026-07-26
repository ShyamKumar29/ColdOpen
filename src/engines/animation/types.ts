import type { CharacterPose } from '@engines/bus'

export type PoseName = CharacterPose

/**
 * Named motion preset identifiers, `category.name` per CLAUDE.md Animation
 * Rules. Pose presets share their name with the `CharacterPose` they
 * transition into; `entrance`/`exit` are the enter/leave opacity fade.
 */
export type AnimationPresetName = `pose.${PoseName}` | 'entrance.fadeIn' | 'exit.fadeOut'

export interface AnimationPreset {
  durationMs: number
  /** Cubic-bezier control points — shares its shape with `design/timing.ts`'s `easingCurves`. */
  easing: readonly [number, number, number, number]
}
