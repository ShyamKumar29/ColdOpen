import type { StateCreator } from 'zustand'
import type { LightingPreset, LightingTransition } from '@schema'
import type { ColdOpenStore } from './types'

/** The subtitle currently on screen — a dialogue/title line or a slugline card, never both. */
export type CurrentSubtitle =
  | { kind: 'line'; text: string; characterId?: string; parenthetical?: string }
  | { kind: 'slugline'; text: string }

export interface PresentationSlice {
  currentSubtitle: CurrentSubtitle | null
  currentLighting: LightingPreset | null
  /** How the current preset arrived (cut/fade/flicker) and, when authored, over what duration — read by `LightingRig` to crossfade correctly (Milestone 5). Defaults to `'cut'` so the very first frame never unwantedly fades in from black. */
  currentLightingTransition: LightingTransition
  currentLightingDurationMs: number | undefined
  particleEffect: string | null
  setCurrentSubtitle: (subtitle: CurrentSubtitle | null) => void
  setCurrentLighting: (
    preset: LightingPreset | null,
    transition?: LightingTransition,
    durationMs?: number,
  ) => void
}

export const createPresentationSlice: StateCreator<ColdOpenStore, [], [], PresentationSlice> = (
  set,
) => ({
  currentSubtitle: null,
  currentLighting: null,
  currentLightingTransition: 'cut',
  currentLightingDurationMs: undefined,
  particleEffect: null,
  setCurrentSubtitle: (currentSubtitle) => set({ currentSubtitle }),
  setCurrentLighting: (currentLighting, transition = 'cut', durationMs) =>
    set({
      currentLighting,
      currentLightingTransition: transition,
      currentLightingDurationMs: durationMs,
    }),
})
