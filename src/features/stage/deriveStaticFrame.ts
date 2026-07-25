import { DEFAULT_LIGHTING_PRESET } from '@design'
import type { LightingPreset, SceneScript } from '@schema'

/**
 * Milestone 1 has no Timeline Compiler or Controller yet, so the static
 * frame shows the scene's establishing lighting: the first beat that
 * specifies a `lighting` direction, falling back to the default preset.
 * Superseded by the real beat sequencer in Milestone 2.
 */
export function deriveInitialLighting(script: SceneScript): LightingPreset {
  const beatWithLighting = script.beats.find((beat) => beat.lighting)
  return beatWithLighting?.lighting?.preset ?? DEFAULT_LIGHTING_PRESET
}
