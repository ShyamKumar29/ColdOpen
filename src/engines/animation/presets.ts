import type { AnimationPresetName, AnimationPreset } from './types'

/**
 * The animation preset table (docs/ARCHITECTURE.md section 4). Every
 * animatable component looks up its motion here rather than inlining
 * springs/easings — populated starting in Milestone 4.
 */
export const presets: Record<AnimationPresetName, AnimationPreset> = {}

export const reducedMotionPresets: Record<AnimationPresetName, AnimationPreset> = {}
