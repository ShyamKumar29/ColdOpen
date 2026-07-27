import type { MusicState } from '@engines/bus'
import type { Beat, Mood, MusicStinger, SceneScript } from '@schema'

/**
 * One beat's resolved music direction — the Music Engine's counterpart to
 * `cameraForBeat`'s resolved `camera:move` cue and `poseForBeat`'s
 * `character:pose` (ADR-019/ADR-024). Computed once per beat, purely from
 * scene content, so the same `SceneScript` always produces the same score
 * (Milestone 7's determinism requirement, docs/DECISIONS.md ADR-030).
 */
export interface MusicPlanBeat {
  readonly beatIndex: number
  readonly state: MusicState
  readonly mood: Mood
  readonly intensity: number
  readonly stinger?: MusicStinger
}

const STATE_BASE_INTENSITY: Record<MusicState, number> = {
  intro: 0.25,
  ambient: 0.4,
  tension: 0.6,
  climax: 0.9,
  resolution: 0.35,
  silence: 0,
}

/**
 * The default `MusicState` for a beat, purely from its type and position —
 * before any authored `beat.music` override is applied. The scene's opening
 * and closing beats are a stronger signal than any per-beat content (the
 * same precedence `cameraForBeat` gives a `reveal` beat's shot over its
 * authored move): a scene always opens on `intro` and always closes on
 * `resolution` (or `silence` for a `cutToBlack` outro), regardless of what
 * that particular beat's type or authored music direction says.
 */
function baseStateForBeat(beat: Beat, beatIndex: number, script: SceneScript): MusicState {
  const lastIndex = script.beats.length - 1
  if (beatIndex === 0) return 'intro'
  if (beatIndex === lastIndex)
    return script.outro?.style === 'cutToBlack' ? 'silence' : 'resolution'

  switch (beat.type) {
    case 'reveal':
      return 'climax'
    case 'beat':
      return 'tension'
    default:
      return 'ambient'
  }
}

/**
 * Applies an authored `beat.music.action` on top of the base state. Never
 * overrides the scene-boundary states (`intro`/`resolution`/`silence` on the
 * first/last beat) — those are the scene's shape, not a single beat's
 * request — but does let a mid-scene beat explicitly swell to `climax` or
 * cut to `silence` ahead of schedule.
 */
function applyAuthoredAction(baseState: MusicState, beat: Beat): MusicState {
  if (beat.music === undefined) return baseState
  if (baseState === 'intro' || baseState === 'resolution' || baseState === 'silence') {
    return baseState
  }

  switch (beat.music.action) {
    case 'swell':
      return 'climax'
    case 'stop':
      return 'silence'
    default:
      return baseState
  }
}

function stingerForBeat(beat: Beat, state: MusicState): MusicStinger | undefined {
  if (beat.music?.stinger) return beat.music.stinger
  if (state === 'climax' && beat.type === 'reveal') return 'hit'
  return undefined
}

/**
 * Pure function: `SceneScript -> MusicPlanBeat[]`, one entry per beat in
 * schema order. Never reads wall-clock time or randomness, so calling this
 * twice on the same script always returns the same plan (unit-tested in
 * `musicPlan.test.ts`). The Timeline Compiler turns adjacent plan entries
 * into `music:start`/`music:mood`/`music:sting` cues; the Music Engine never
 * sees a `SceneScript` or a `Beat` at all.
 */
export function deriveMusicPlan(script: SceneScript): readonly MusicPlanBeat[] {
  return script.beats.map((beat, beatIndex) => {
    const baseState = baseStateForBeat(beat, beatIndex, script)
    const state = applyAuthoredAction(baseState, beat)
    const mood = beat.music?.mood ?? script.mood
    const intensity = beat.music?.intensity ?? STATE_BASE_INTENSITY[state]
    const stinger = stingerForBeat(beat, state)

    return Object.freeze({ beatIndex, state, mood, intensity, stinger })
  })
}
