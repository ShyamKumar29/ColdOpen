import type { StateCreator } from 'zustand'
import type { Phase, ClockSource } from '@engines/controller'
import type { ColdOpenStore } from './types'

export interface PlaybackSlice {
  /**
   * Scene Controller transport state (writing → ready → playing → …).
   * Distinct from `SceneSlice.status`, which tracks acquisition/validation
   * of the scene data itself, upstream of playback ever starting.
   */
  phase: Phase
  beatIndex: number
  isPlaying: boolean
  clockSource: ClockSource
  /** Cumulative ms of playback as of the current beat (discrete, not 60Hz — see ADR-004). */
  elapsedMs: number
  /** Character ids that have entered and not yet exited, per the compiled timeline. */
  activeCharacters: string[]
  setPhase: (phase: Phase) => void
  setBeatIndex: (beatIndex: number) => void
  setElapsedMs: (elapsedMs: number) => void
  setActiveCharacters: (activeCharacters: string[]) => void
}

export const createPlaybackSlice: StateCreator<ColdOpenStore, [], [], PlaybackSlice> = (set) => ({
  phase: 'idle',
  beatIndex: 0,
  isPlaying: false,
  clockSource: 'timer',
  elapsedMs: 0,
  activeCharacters: [],
  setPhase: (phase) => set({ phase, isPlaying: phase === 'playing' }),
  setBeatIndex: (beatIndex) => set({ beatIndex }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),
  setActiveCharacters: (activeCharacters) => set({ activeCharacters }),
})
