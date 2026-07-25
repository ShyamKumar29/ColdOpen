import type { StageSlot } from '@schema'

/**
 * Horizontal position (percent of stage width) for each stage slot. The
 * renderer derives all character placement from these slots — never
 * arbitrary pixel coordinates (CLAUDE.md Milestone 1 scope).
 */
export const stageSlotPositions: Record<StageSlot, number> = {
  farLeft: 12,
  left: 31,
  center: 50,
  right: 69,
  farRight: 88,
}
