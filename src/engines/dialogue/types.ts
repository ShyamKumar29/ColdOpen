import type { DialogueBeat } from '@schema'

/**
 * An ordered speaking plan derived from a dialogue beat
 * (docs/ARCHITECTURE.md section 4, "Dialogue Engine").
 */
export interface DialoguePlan {
  characterId: string
  line: string
  gesture?: string
}

export type { DialogueBeat }
