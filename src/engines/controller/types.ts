/**
 * The playback phase machine (docs/ARCHITECTURE.md section 4, "Scene
 * Controller"). Implemented as a discriminated union per CLAUDE.md
 * TypeScript Rules rather than optional-field soup.
 */
export type Phase = 'idle' | 'writing' | 'ready' | 'playing' | 'paused' | 'complete' | 'error'

/** Which subsystem is currently driving beat advancement (ADR-005). */
export type ClockSource = 'speech' | 'timer'

/**
 * The minimal, provider-agnostic surface the Scene Controller needs from
 * the Speech Engine to decide and manage the speech clock (ADR-021). Kept
 * intentionally small and locally typed here — rather than importing
 * `engines/speech` — so the Controller and Speech Engine stay decoupled;
 * any object with this shape (real or a test double) satisfies it.
 */
export interface SpeechClockAdapter {
  probeCapability(): 'available' | 'unavailable'
  /** Stops in-flight speech without emitting a completion event — used on pause/stop/seek/restart. */
  cancel(): void
}
