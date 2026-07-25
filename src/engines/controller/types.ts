/**
 * The playback phase machine (docs/ARCHITECTURE.md section 4, "Scene
 * Controller"). Implemented as a discriminated union per CLAUDE.md
 * TypeScript Rules rather than optional-field soup.
 */
export type Phase = 'idle' | 'writing' | 'ready' | 'playing' | 'paused' | 'complete' | 'error'

/** Which subsystem is currently driving beat advancement (ADR-005). */
export type ClockSource = 'speech' | 'timer'
