/**
 * A single flattened, anchored instruction produced by the Timeline
 * Compiler (docs/ARCHITECTURE.md section 4 and 7). Anchored to a beat
 * index plus a relative offset — never an absolute timestamp (ADR-007).
 */
export interface Cue {
  id: string
  beatIndex: number
  offsetMs: number
  kind: string
  payload: unknown
}

export type CueList = readonly Cue[]
