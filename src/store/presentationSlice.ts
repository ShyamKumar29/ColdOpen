import type { StateCreator } from 'zustand'
import type { LightingPreset } from '@schema'
import type { ColdOpenStore } from './types'

/** The subtitle currently on screen — a dialogue/title line or a slugline card, never both. */
export type CurrentSubtitle =
  | { kind: 'line'; text: string; characterId?: string; parenthetical?: string }
  | { kind: 'slugline'; text: string }

export interface PresentationSlice {
  currentSubtitle: CurrentSubtitle | null
  currentLighting: LightingPreset | null
  particleEffect: string | null
  setCurrentSubtitle: (subtitle: CurrentSubtitle | null) => void
  setCurrentLighting: (preset: LightingPreset | null) => void
}

export const createPresentationSlice: StateCreator<ColdOpenStore, [], [], PresentationSlice> = (
  set,
) => ({
  currentSubtitle: null,
  currentLighting: null,
  particleEffect: null,
  setCurrentSubtitle: (currentSubtitle) => set({ currentSubtitle }),
  setCurrentLighting: (currentLighting) => set({ currentLighting }),
})
