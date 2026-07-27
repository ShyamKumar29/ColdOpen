import type { StateCreator } from 'zustand'
import type { ColdOpenStore } from './types'

const STORAGE_KEY = 'coldopen:settings'
const DEFAULT_MUSIC_VOLUME = 0.7

interface StoredSettings {
  muted?: boolean
  musicVolume?: number
}

/**
 * Milestone 7's "remember preference locally" requirement — the first
 * settings this project persists (`store/store.ts`'s prior comment scoped
 * persistence to a later milestone; the Music Engine's mute/volume controls
 * are the first setting that actually needs it). A plain `localStorage`
 * read/write rather than Zustand's `persist` middleware, since only these
 * two fields need to survive a reload — `reducedMotion`/`captionsOn` are
 * re-derived from the OS preference and a sensible default, respectively,
 * every session.
 */
function readStoredSettings(): StoredSettings {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const { muted, musicVolume } = parsed as StoredSettings
    return {
      muted: typeof muted === 'boolean' ? muted : undefined,
      musicVolume: typeof musicVolume === 'number' ? musicVolume : undefined,
    }
  } catch {
    return {}
  }
}

function writeStoredSettings(settings: StoredSettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can throw (private browsing, quota) — the setting still applies
    // for this session, it just won't survive a reload.
  }
}

export interface SettingsSlice {
  muted: boolean
  captionsOn: boolean
  reducedMotion: boolean
  voiceEnabled: boolean
  musicVolume: number
  setMuted: (muted: boolean) => void
  setCaptionsOn: (captionsOn: boolean) => void
  setReducedMotion: (reducedMotion: boolean) => void
  setMusicVolume: (musicVolume: number) => void
}

export const createSettingsSlice: StateCreator<ColdOpenStore, [], [], SettingsSlice> = (
  set,
  get,
) => {
  const stored = readStoredSettings()

  function persist(): void {
    const { muted, musicVolume } = get()
    writeStoredSettings({ muted, musicVolume })
  }

  return {
    muted: stored.muted ?? false,
    captionsOn: true,
    reducedMotion: false,
    voiceEnabled: true,
    musicVolume: stored.musicVolume ?? DEFAULT_MUSIC_VOLUME,
    setMuted: (muted) => {
      set({ muted })
      persist()
    },
    setCaptionsOn: (captionsOn) => set({ captionsOn }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setMusicVolume: (musicVolume) => {
      set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) })
      persist()
    },
  }
}
