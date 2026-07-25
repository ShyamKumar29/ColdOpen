import { create } from 'zustand'
import { createSceneSlice } from './sceneSlice'
import { createPlaybackSlice } from './playbackSlice'
import { createCastSlice } from './castSlice'
import { createPresentationSlice } from './presentationSlice'
import { createSettingsSlice } from './settingsSlice'
import type { ColdOpenStore } from './types'

/**
 * The single Zustand store, sliced by domain (docs/ARCHITECTURE.md
 * section 9). Readable outside React via `useColdOpenStore.getState()` so
 * engines can write through explicit actions without importing React
 * (ADR-008 in docs/DECISIONS.md).
 *
 * Settings persistence (localStorage) is added when Milestone 8 needs it —
 * out of scope for Milestone 0's empty-slice structure.
 */
export const useColdOpenStore = create<ColdOpenStore>()((...args) => ({
  ...createSceneSlice(...args),
  ...createPlaybackSlice(...args),
  ...createCastSlice(...args),
  ...createPresentationSlice(...args),
  ...createSettingsSlice(...args),
}))
