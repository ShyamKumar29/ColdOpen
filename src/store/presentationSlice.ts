import type { StateCreator } from 'zustand'
import type { ColdOpenStore } from './types'

export interface PresentationSlice {
  caption: string | null
  lightingPreset: string | null
  particleEffect: string | null
  setCaption: (caption: string | null) => void
  setLightingPreset: (preset: string | null) => void
}

export const createPresentationSlice: StateCreator<ColdOpenStore, [], [], PresentationSlice> = (
  set,
) => ({
  caption: null,
  lightingPreset: null,
  particleEffect: null,
  setCaption: (caption) => set({ caption }),
  setLightingPreset: (lightingPreset) => set({ lightingPreset }),
})
