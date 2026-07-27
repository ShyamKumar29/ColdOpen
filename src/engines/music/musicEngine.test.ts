import { describe, expect, it, vi } from 'vitest'
import {
  musicCrossfadeMs,
  musicDuckRampMs,
  musicUnduckRampMs,
  musicCompleteFadeMs,
  reducedMusicCrossfadeMs,
  reducedMusicCompleteFadeMs,
} from '@design'
import { createMusicEngine } from './musicEngine'
import type { ToneMusicAdapter } from './types'

function createFakeAdapter(): ToneMusicAdapter & {
  calls: {
    rampVolume: [number, number][]
    crossfadeTo: unknown[][]
    setArrangement: unknown[][]
    fadeOutAndStop: number[]
  }
} {
  const calls = {
    rampVolume: [] as [number, number][],
    crossfadeTo: [] as unknown[][],
    setArrangement: [] as unknown[][],
    fadeOutAndStop: [] as number[],
  }
  return {
    calls,
    isUnlocked: vi.fn(() => true),
    unlock: vi.fn(async () => {}),
    setArrangement: vi.fn((mood, state, intensity) => {
      calls.setArrangement.push([mood, state, intensity])
    }),
    crossfadeTo: vi.fn((mood, state, intensity, durationMs) => {
      calls.crossfadeTo.push([mood, state, intensity, durationMs])
    }),
    rampVolume: vi.fn((to, durationMs) => {
      calls.rampVolume.push([to, durationMs])
    }),
    sting: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    fadeOutAndStop: vi.fn((durationMs) => {
      calls.fadeOutAndStop.push(durationMs)
    }),
    stop: vi.fn(),
    dispose: vi.fn(),
  }
}

describe('createMusicEngine', () => {
  it('applies the opening cue with no crossfade, at full effective gain by default', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.applyStart({ state: 'intro', mood: 'tense', intensity: 0.25 }, false)

    expect(adapter.setArrangement).toHaveBeenCalledWith('tense', 'intro', 0.25)
    expect(adapter.crossfadeTo).not.toHaveBeenCalled()
    const [to] = adapter.calls.rampVolume.at(-1)!
    expect(to).toBe(1)
  })

  it('crossfades on a later music:mood cue, honouring the full crossfade duration', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.applyStart({ state: 'intro', mood: 'tense', intensity: 0.25 }, false)
    music.applyMood({ state: 'climax', mood: 'tense', intensity: 0.9 }, false)

    expect(adapter.crossfadeTo).toHaveBeenCalledWith('tense', 'climax', 0.9, musicCrossfadeMs)
  })

  it('shortens the crossfade under reduced motion', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.applyStart({ state: 'intro', mood: 'tense', intensity: 0.25 }, false)
    music.applyMood({ state: 'climax', mood: 'tense', intensity: 0.9 }, true)

    expect(adapter.crossfadeTo).toHaveBeenCalledWith(
      'tense',
      'climax',
      0.9,
      reducedMusicCrossfadeMs,
    )
  })

  it('is idempotent: re-applying an identical mood cue is a no-op', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.applyStart({ state: 'ambient', mood: 'tense', intensity: 0.4 }, false)
    music.applyMood({ state: 'ambient', mood: 'tense', intensity: 0.4 }, false)

    expect(adapter.crossfadeTo).not.toHaveBeenCalled()
  })

  it('ducks to the requested fraction and unducks back to full volume', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.duck(0.35, false)
    expect(adapter.rampVolume).toHaveBeenLastCalledWith(0.35, musicDuckRampMs)

    music.unduck(false)
    expect(adapter.rampVolume).toHaveBeenLastCalledWith(1, musicUnduckRampMs)
  })

  it('is idempotent: ducking twice to the same level only ramps once', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.duck(0.35, false)
    music.duck(0.35, false)

    expect(adapter.rampVolume).toHaveBeenCalledTimes(1)
  })

  it('combines dialogue ducking with a lower user volume multiplicatively', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.setUserVolume(0.5)
    music.duck(0.35, false)

    const [to] = adapter.calls.rampVolume.at(-1)!
    expect(to).toBeCloseTo(0.5 * 0.35)
  })

  it('mutes to zero gain regardless of volume or duck state', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.setUserVolume(0.8)
    music.setMuted(true)

    const [to] = adapter.calls.rampVolume.at(-1)!
    expect(to).toBe(0)
  })

  it('clamps volume to the 0..1 range', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.setUserVolume(0.5) // establish a non-default baseline first
    music.setUserVolume(1.5)
    expect(adapter.calls.rampVolume.at(-1)![0]).toBe(1)

    music.setUserVolume(-1)
    expect(adapter.calls.rampVolume.at(-1)![0]).toBe(0)
  })

  it('delegates a sting cue straight to the adapter', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.sting('hit')

    expect(adapter.sting).toHaveBeenCalledWith('hit')
  })

  it('stops the adapter and resets ducking so a later restart starts clean', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.duck(0.35, false)
    music.stop()

    expect(adapter.stop).toHaveBeenCalledOnce()
    // A fresh music:start after stop() should apply without a stale duck level.
    music.applyStart({ state: 'intro', mood: 'tense', intensity: 0.25 }, false)
    expect(adapter.calls.rampVolume.at(-1)![0]).toBe(1)
  })

  it('pause silences the score and freezes the transport; resume restores both', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.applyStart({ state: 'ambient', mood: 'tense', intensity: 0.4 }, false)
    music.pause()

    expect(adapter.pause).toHaveBeenCalledOnce()
    expect(adapter.calls.rampVolume.at(-1)![0]).toBe(0)

    music.resume()

    expect(adapter.resume).toHaveBeenCalledOnce()
    expect(adapter.calls.rampVolume.at(-1)![0]).toBe(1)
  })

  it('is idempotent: pausing or resuming twice only acts once', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.pause()
    music.pause()
    expect(adapter.pause).toHaveBeenCalledOnce()

    music.resume()
    music.resume()
    expect(adapter.resume).toHaveBeenCalledOnce()
  })

  it('pause ignores duck/mute state — paused is always silent regardless of what resume restores', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.setUserVolume(0.5)
    music.duck(0.35, false)
    music.pause()

    expect(adapter.calls.rampVolume.at(-1)![0]).toBe(0)

    music.resume()
    expect(adapter.calls.rampVolume.at(-1)![0]).toBeCloseTo(0.5 * 0.35)
  })

  it('fades out and stops on scene completion, honouring reduced motion', () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    music.applyStart({ state: 'climax', mood: 'tense', intensity: 0.9 }, false)
    music.fadeOutAndStop(false)
    expect(adapter.calls.fadeOutAndStop.at(-1)).toBe(musicCompleteFadeMs)

    music.applyStart({ state: 'climax', mood: 'tense', intensity: 0.9 }, false)
    music.fadeOutAndStop(true)
    expect(adapter.calls.fadeOutAndStop.at(-1)).toBe(reducedMusicCompleteFadeMs)
  })

  it('unlock/isUnlocked delegate to the adapter', async () => {
    const adapter = createFakeAdapter()
    const music = createMusicEngine(adapter)

    expect(music.isUnlocked()).toBe(true)
    await music.unlock()
    expect(adapter.unlock).toHaveBeenCalledOnce()
  })
})
