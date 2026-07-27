import {
  musicCrossfadeMs,
  musicUnduckRampMs,
  musicDuckRampMs,
  musicCompleteFadeMs,
  reducedMusicCrossfadeMs,
  reducedMusicDuckRampMs,
  reducedMusicUnduckRampMs,
  reducedMusicCompleteFadeMs,
} from '@design'
import type { MusicState } from '@engines/bus'
import type { Mood, MusicStinger } from '@schema'
import { createToneMusicAdapter } from './toneAdapter'
import type { ToneMusicAdapter } from './types'

const VOLUME_RAMP_MS = 150

export interface MusicCue {
  state: MusicState
  mood: Mood
  intensity: number
}

export interface MusicEngine {
  isUnlocked(): boolean
  /** Resumes the shared AudioContext. Safe to call from anywhere, any number of times (`unlock.ts`'s `unlockAudio` already makes the underlying `Tone.start()` idempotent). */
  unlock(): Promise<void>
  /** The scene's opening `music:start` cue — sets the arrangement with no crossfade, since nothing was playing before it. */
  applyStart(cue: MusicCue, reducedMotion: boolean): void
  /** A later `music:mood` cue — crossfades. No-ops if identical to the last-applied cue (CLAUDE.md Event Bus Rules — idempotent handlers). */
  applyMood(cue: MusicCue, reducedMotion: boolean): void
  /** Ducks to a linear gain fraction of the current volume (docs/ARCHITECTURE.md section 8 — `music:duck { to: 0.35 }`). */
  duck(to: number, reducedMotion: boolean): void
  unduck(reducedMotion: boolean): void
  sting(stinger: MusicStinger): void
  /** User-controlled volume, 0..1. Independent of ducking and the arrangement's own state-driven loudness. */
  setUserVolume(volume: number): void
  setMuted(muted: boolean): void
  /** Silences the score and freezes its transport clock for `transport:pause`. Idempotent. */
  pause(): void
  /** Restores gain and the transport clock after `pause()`, for `transport:play` firing while paused. Idempotent. */
  resume(): void
  /** Stops all playback. Called on `transport:stop` and before a fresh `restart` replays the timeline from beat 0. */
  stop(): void
  /** Fades the score out and stops it for `transport:complete` — the scene ended, not the user hitting Stop. */
  fadeOutAndStop(reducedMotion: boolean): void
}

/**
 * Tone.js-backed score (docs/DECISIONS.md ADR-030): applies fully-resolved
 * `music:start`/`music:mood`/`music:duck`/`music:unduck`/`music:sting` cues
 * from the Timeline Compiler's music plan to an injectable `ToneMusicAdapter`
 * — the engine itself never touches `Tone.js`/`AudioContext` directly (same
 * boundary `createSpeechEngine` draws around `SpeechAdapter`), which is what
 * lets ducking/volume/mute math and cue-handling unit-test with a fake
 * adapter and no real audio graph.
 *
 * Never subscribes to the bus itself — `useSceneController`'s existing
 * bus-subscribing `useEffect` turns cues into calls on this engine, the same
 * pattern every other engine here follows (ADR-022).
 */
export function createMusicEngine(
  adapter: ToneMusicAdapter = createToneMusicAdapter(),
): MusicEngine {
  let lastCue: MusicCue | null = null
  let duckFraction = 1
  let userVolume = 1
  let muted = false
  let paused = false

  function effectiveGain(): number {
    if (paused) return 0
    return muted ? 0 : userVolume * duckFraction
  }

  function rampToEffectiveGain(durationMs: number): void {
    adapter.rampVolume(effectiveGain(), durationMs)
  }

  return {
    isUnlocked: () => adapter.isUnlocked(),
    unlock: () => adapter.unlock(),

    applyStart(cue, _reducedMotion) {
      lastCue = cue
      paused = false
      adapter.setArrangement(cue.mood, cue.state, cue.intensity)
      rampToEffectiveGain(VOLUME_RAMP_MS)
    },

    applyMood(cue, reducedMotion) {
      if (
        lastCue &&
        lastCue.state === cue.state &&
        lastCue.mood === cue.mood &&
        lastCue.intensity === cue.intensity
      ) {
        return
      }
      lastCue = cue
      adapter.crossfadeTo(
        cue.mood,
        cue.state,
        cue.intensity,
        reducedMotion ? reducedMusicCrossfadeMs : musicCrossfadeMs,
      )
    },

    duck(to, reducedMotion) {
      if (duckFraction === to) return
      duckFraction = to
      rampToEffectiveGain(reducedMotion ? reducedMusicDuckRampMs : musicDuckRampMs)
    },

    unduck(reducedMotion) {
      if (duckFraction === 1) return
      duckFraction = 1
      rampToEffectiveGain(reducedMotion ? reducedMusicUnduckRampMs : musicUnduckRampMs)
    },

    sting(stinger) {
      adapter.sting(stinger)
    },

    setUserVolume(volume) {
      const clamped = Math.max(0, Math.min(1, volume))
      if (userVolume === clamped) return
      userVolume = clamped
      rampToEffectiveGain(VOLUME_RAMP_MS)
    },

    setMuted(nextMuted) {
      if (muted === nextMuted) return
      muted = nextMuted
      rampToEffectiveGain(VOLUME_RAMP_MS)
    },

    pause() {
      if (paused) return
      paused = true
      adapter.pause()
      rampToEffectiveGain(VOLUME_RAMP_MS)
    },

    resume() {
      if (!paused) return
      paused = false
      adapter.resume()
      rampToEffectiveGain(VOLUME_RAMP_MS)
    },

    stop() {
      adapter.stop()
      lastCue = null
      duckFraction = 1
      paused = false
    },

    fadeOutAndStop(reducedMotion) {
      adapter.fadeOutAndStop(reducedMotion ? reducedMusicCompleteFadeMs : musicCompleteFadeMs)
      lastCue = null
      duckFraction = 1
      paused = false
    },
  }
}
