import type { StateCreator } from 'zustand'
import type { SceneScript } from '@schema'
import type { ColdOpenStore } from './types'

export interface SceneSlice {
  script: SceneScript | null
  /**
   * Lifecycle of acquiring and validating scene *data* (Groq / seed / repair
   * pipeline outcome). Distinct from `PlaybackSlice.phase`, which tracks the
   * Scene Controller's transport state for a script that is already `ready`.
   * `DirectorRoom` (docs/ARCHITECTURE.md section 6) branches on this alone:
   * `idle` -> PremiseScreen, `generating` -> WritingRoom, `ready` -> Stage.
   */
  status: 'idle' | 'generating' | 'ready' | 'failed'
  /**
   * The premise the user submitted, handed from `PremiseScreen` (local
   * input state) to `WritingRoom` (which owns the streaming preview) via
   * the store — the one piece of that handoff more than one component
   * needs to read.
   */
  premise: string | null
  setScript: (script: SceneScript | null) => void
  setStatus: (status: SceneSlice['status']) => void
  setPremise: (premise: string | null) => void
}

export const createSceneSlice: StateCreator<ColdOpenStore, [], [], SceneSlice> = (set) => ({
  script: null,
  status: 'idle',
  premise: null,
  setScript: (script) => set({ script }),
  setStatus: (status) => set({ status }),
  setPremise: (premise) => set({ premise }),
})
