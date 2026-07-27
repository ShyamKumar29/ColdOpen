import type { MusicState } from '@engines/bus'
import type { Mood, MusicDirection, MusicStinger } from '@schema'

export type { MusicDirection, Mood, MusicStinger, MusicState }

/**
 * The Music Engine's own audio-graph boundary (mirrors `SpeechAdapter` in
 * `engines/speech/types.ts`): every real `Tone.js`/`AudioContext` call lives
 * behind this interface, in `toneAdapter.ts`, so `musicEngine.ts`'s cue
 * handling, ducking math, and volume/mute logic unit-test with a fake
 * adapter and no real audio graph (docs/DECISIONS.md ADR-030).
 */
export interface ToneMusicAdapter {
  isUnlocked(): boolean
  /** Resumes the shared `AudioContext` and starts the transport clock. Safe to call more than once. */
  unlock(): Promise<void>
  /** Sets the arrangement immediately, with no crossfade — used only for the scene's opening `music:start`. */
  setArrangement(mood: Mood, state: MusicState, intensity: number): void
  /** Crossfades from whatever is currently playing to the new arrangement over `durationMs`. */
  crossfadeTo(mood: Mood, state: MusicState, intensity: number, durationMs: number): void
  /** Ramps the duck/user gain stage to `to` (a 0..1 linear fraction) over `durationMs`. Independent of the arrangement's own state-driven loudness. */
  rampVolume(to: number, durationMs: number): void
  /** Fires a one-shot stinger voice, layered over the ongoing pad — never interrupts it. */
  sting(stinger: MusicStinger): void
  /** Freezes the transport clock (the bass loop stops advancing) for `transport:pause`. The held pad chord keeps ringing — silencing it is `MusicEngine`'s gain-ramp job, not this adapter's. */
  pause(): void
  /** Restarts the transport clock from where `pause()` left it. */
  resume(): void
  /** Ramps the arrangement to silence over `durationMs`, then performs a full `stop()` — used only for `transport:complete`, so the score winds down instead of cutting off. */
  fadeOutAndStop(durationMs: number): void
  /** Stops all playback and ramps to silence. Safe to call repeatedly (CLAUDE.md — "no clicks/pops," always ramp). */
  stop(): void
  dispose(): void
}
