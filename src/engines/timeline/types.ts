import type { ColdOpenEventMap, ColdOpenEventName } from '@engines/bus'

/**
 * The subset of the event taxonomy a compiled timeline can produce.
 * Deliberately a subset, not the full `ColdOpenEventName` union — the
 * compiler only emits playback-data cues; particle directions are read
 * straight off the `SceneScript` by their own engine starting a later
 * milestone. Music cues (ADR-030) follow the same pattern `camera:move`
 * already established in Milestone 5: fully resolved by the compiler's
 * music plan, never requiring the Music Engine to reason about beats.
 */
export type CueKind =
  | 'subtitle:show'
  | 'subtitle:hide'
  | 'subtitle:slugline'
  | 'light:change'
  | 'character:enter'
  | 'character:exit'
  | 'character:pose'
  | 'speech:request'
  | 'camera:move'
  | 'music:start'
  | 'music:mood'
  | 'music:duck'
  | 'music:unduck'
  | 'music:sting'

export interface Cue<TKind extends ColdOpenEventName = CueKind> {
  readonly id: string
  readonly beatIndex: number
  readonly kind: TKind
  readonly payload: ColdOpenEventMap[TKind]
}

export type AnyCue = { [K in CueKind]: Cue<K> }[CueKind]

/** One beat, flattened and timed: how long it holds the stage, and what fires the instant it starts. */
export interface CompiledBeat {
  readonly index: number
  readonly id: string
  readonly durationMs: number
  readonly cues: readonly AnyCue[]
  /** Set only for a dialogue beat: who the Scene Controller awaits `speech:end`/`speech:error` from when the speech clock is active (ADR-005). */
  readonly speechCharacterId?: string
}

/** The Timeline Compiler's frozen, ordered output — the single source of truth for scene playback. */
export type CueList = readonly CompiledBeat[]
