import type { DialogueBeat, DialoguePlan } from './types'

/**
 * Turns a dialogue beat into an ordered speaking plan: who speaks,
 * parenthetical -> gesture mapping, pacing between speakers.
 *
 * Note: this engine is named in docs/ARCHITECTURE.md section 4 but was
 * missing from the section 5 folder listing — added here during
 * Milestone 0 implementation to close that documentation gap (see the
 * Milestone 0 design review). Speaking/displaying stay owned by the
 * Speech and Subtitle engines respectively.
 *
 * Scaffolding only for Milestone 0 — real planning logic arrives with the
 * Speech Engine in Milestone 3.
 */
export function planDialogue(beat: DialogueBeat): DialoguePlan {
  return {
    characterId: beat.characterId,
    line: beat.line,
    gesture: beat.gesture,
  }
}
