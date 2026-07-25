/**
 * Named motion preset identifiers, `category.name` per CLAUDE.md
 * Animation Rules. Populated in Milestone 4; the union is intentionally
 * empty-shaped scaffolding until real presets exist.
 */
export type AnimationPresetName = never

export interface AnimationPreset {
  durationMs: number
  easing: string
}
