import type { SceneSlice } from './sceneSlice'
import type { PlaybackSlice } from './playbackSlice'
import type { CastSlice } from './castSlice'
import type { PresentationSlice } from './presentationSlice'
import type { SettingsSlice } from './settingsSlice'

/**
 * The full combined store shape. Slices reference this (rather than their
 * own interface alone) in their `StateCreator` generic so cross-slice
 * typing works under Zustand's slices pattern.
 */
export type ColdOpenStore = SceneSlice &
  PlaybackSlice &
  CastSlice &
  PresentationSlice &
  SettingsSlice
