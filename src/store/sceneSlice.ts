import type { StateCreator } from 'zustand'
import type { SceneScript } from '@schema'
import type { ColdOpenStore } from './types'

export interface SceneSlice {
  script: SceneScript | null
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
