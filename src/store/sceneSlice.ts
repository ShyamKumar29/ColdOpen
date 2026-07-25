import type { StateCreator } from 'zustand'
import type { SceneScript } from '@schema'
import type { ColdOpenStore } from './types'

export interface SceneSlice {
  script: SceneScript | null
  /**
   * Lifecycle of acquiring and validating scene *data* (Groq / seed / repair
   * pipeline outcome). Distinct from `PlaybackSlice.phase`, which tracks the
   * Scene Controller's transport state for a script that is already `ready`.
   */
  status: 'idle' | 'generating' | 'validating' | 'ready' | 'failed'
  setScript: (script: SceneScript | null) => void
  setStatus: (status: SceneSlice['status']) => void
}

export const createSceneSlice: StateCreator<ColdOpenStore, [], [], SceneSlice> = (set) => ({
  script: null,
  status: 'idle',
  setScript: (script) => set({ script }),
  setStatus: (status) => set({ status }),
})
