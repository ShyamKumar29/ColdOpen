import { durations, easingCurves } from '@design'
import type { AnimationPreset, AnimationPresetName } from './types'

function preset(durationMs: number, easing: AnimationPreset['easing']): AnimationPreset {
  return { durationMs, easing }
}

/**
 * The animation preset table (docs/ARCHITECTURE.md section 4). Every
 * animatable transition looks up its timing here rather than inlining a
 * duration/easing pair per call site.
 */
export const presets: Record<AnimationPresetName, AnimationPreset> = {
  'pose.idle': preset(durations.slow, easingCurves.standard),
  'pose.speaking': preset(durations.normal, easingCurves.standard),
  'pose.listening': preset(durations.normal, easingCurves.standard),
  'pose.surprised': preset(durations.fast, easingCurves.decelerate),
  'pose.thinking': preset(durations.slow, easingCurves.standard),
  'entrance.fadeIn': preset(durations.normal, easingCurves.decelerate),
  'exit.fadeOut': preset(durations.normal, easingCurves.standard),
}

/**
 * `prefers-reduced-motion` degradation table, defined alongside the presets
 * it replaces (CLAUDE.md Animation Rules). Every transition shortens to the
 * fastest defined duration rather than disabling outright — a pose/opacity
 * change carries meaning (who's speaking, who just left), not just
 * decoration, so it must still resolve, just quickly.
 */
export const reducedMotionPresets: Record<AnimationPresetName, AnimationPreset> = {
  'pose.idle': preset(durations.fast, easingCurves.standard),
  'pose.speaking': preset(durations.fast, easingCurves.standard),
  'pose.listening': preset(durations.fast, easingCurves.standard),
  'pose.surprised': preset(durations.fast, easingCurves.standard),
  'pose.thinking': preset(durations.fast, easingCurves.standard),
  'entrance.fadeIn': preset(durations.fast, easingCurves.standard),
  'exit.fadeOut': preset(durations.fast, easingCurves.standard),
}
