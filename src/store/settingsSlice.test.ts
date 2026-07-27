import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The test environment runs with `environment: 'node'` (no jsdom, no global
 * `window`), same as every other suite in this project — `settingsSlice.ts`
 * already guards every `window` access for exactly this reason. To exercise
 * the localStorage persistence path itself, each test stubs a minimal
 * `window.localStorage` before dynamically re-importing the store module
 * (`vi.resetModules()` first, since `createSettingsSlice` reads storage once
 * at module-load time via `create()`'s initializer).
 */
function stubWindow(initial: Record<string, string> = {}): void {
  const store = new Map(Object.entries(initial))
  ;(globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
    },
  }
}

function unstubWindow(): void {
  delete (globalThis as { window?: unknown }).window
}

describe('settingsSlice localStorage persistence', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    unstubWindow()
  })

  it('defaults muted/musicVolume when nothing is stored', async () => {
    stubWindow()
    const { useColdOpenStore } = await import('./store')

    expect(useColdOpenStore.getState().muted).toBe(false)
    expect(useColdOpenStore.getState().musicVolume).toBeCloseTo(0.7)
  })

  it('restores a previously stored muted/musicVolume on load', async () => {
    stubWindow({ 'coldopen:settings': JSON.stringify({ muted: true, musicVolume: 0.2 }) })
    const { useColdOpenStore } = await import('./store')

    expect(useColdOpenStore.getState().muted).toBe(true)
    expect(useColdOpenStore.getState().musicVolume).toBeCloseTo(0.2)
  })

  it('persists setMuted/setMusicVolume so a later reload sees them', async () => {
    stubWindow()
    const { useColdOpenStore } = await import('./store')

    useColdOpenStore.getState().setMuted(true)
    useColdOpenStore.getState().setMusicVolume(0.3)

    const raw = (globalThis as { window: { localStorage: Storage } }).window.localStorage.getItem(
      'coldopen:settings',
    )
    expect(JSON.parse(raw!)).toEqual({ muted: true, musicVolume: 0.3 })
  })

  it('clamps a persisted or newly set volume to the 0..1 range', async () => {
    stubWindow()
    const { useColdOpenStore } = await import('./store')

    useColdOpenStore.getState().setMusicVolume(5)
    expect(useColdOpenStore.getState().musicVolume).toBe(1)

    useColdOpenStore.getState().setMusicVolume(-2)
    expect(useColdOpenStore.getState().musicVolume).toBe(0)
  })

  it('ignores malformed stored JSON and falls back to defaults', async () => {
    stubWindow({ 'coldopen:settings': 'not json' })
    const { useColdOpenStore } = await import('./store')

    expect(useColdOpenStore.getState().muted).toBe(false)
    expect(useColdOpenStore.getState().musicVolume).toBeCloseTo(0.7)
  })
})
