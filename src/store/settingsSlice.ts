import type { StateCreator } from 'zustand'
import type { ColdOpenStore } from './types'

export interface SettingsSlice {
  muted: boolean
  captionsOn: boolean
  reducedMotion: boolean
  voiceEnabled: boolean
  setMuted: (muted: boolean) => void
  setCaptionsOn: (captionsOn: boolean) => void
  setReducedMotion: (reducedMotion: boolean) => void
}

export const createSettingsSlice: StateCreator<ColdOpenStore, [], [], SettingsSlice> = (set) => ({
  muted: false,
  captionsOn: true,
  reducedMotion: false,
  voiceEnabled: true,
  setMuted: (muted) => set({ muted }),
  setCaptionsOn: (captionsOn) => set({ captionsOn }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
})
