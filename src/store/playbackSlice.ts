import type { StateCreator } from 'zustand'
import type { Phase, ClockSource } from '@engines/controller'
import type { ColdOpenStore } from './types'

export interface PlaybackSlice {
  phase: Phase
  beatIndex: number
  isPlaying: boolean
  clockSource: ClockSource
  setPhase: (phase: Phase) => void
  setBeatIndex: (beatIndex: number) => void
}

export const createPlaybackSlice: StateCreator<ColdOpenStore, [], [], PlaybackSlice> = (set) => ({
  phase: 'idle',
  beatIndex: 0,
  isPlaying: false,
  clockSource: 'timer',
  setPhase: (phase) => set({ phase, isPlaying: phase === 'playing' }),
  setBeatIndex: (beatIndex) => set({ beatIndex }),
})
