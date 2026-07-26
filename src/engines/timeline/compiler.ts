import type { CharacterPose, ColdOpenEventMap } from '@engines/bus'
import type { Beat, SceneScript } from '@schema'
import type { AnyCue, CompiledBeat, CueKind, CueList } from './types'

/**
 * Beat-duration heuristics for the Milestone 2 timer clock (ADR-005: timer
 * is the fallback/foundation clock, speech takes over in Milestone 3).
 * Deterministic and content-derived only — never wall-clock or random —
 * so the same `SceneScript` always compiles to the same timeline.
 */
const MIN_DIALOGUE_MS = 1600
const MAX_DIALOGUE_MS = 6000
const MS_PER_DIALOGUE_CHAR = 55
const FIXED_BEAT_DURATION_MS: Record<'title' | 'slugline' | 'action' | 'reveal', number> = {
  title: 2200,
  slugline: 1800,
  action: 2000,
  reveal: 2500,
}

function estimateBeatDurationMs(beat: Beat): number {
  const holdMs = beat.holdMs ?? 0

  if (beat.type === 'dialogue') {
    const reading = beat.line.length * MS_PER_DIALOGUE_CHAR
    return Math.min(MAX_DIALOGUE_MS, Math.max(MIN_DIALOGUE_MS, reading)) + holdMs
  }

  if (beat.type === 'beat') {
    return beat.durationMs + holdMs
  }

  return FIXED_BEAT_DURATION_MS[beat.type] + holdMs
}

/**
 * Derives a character's performance pose from beat content — never
 * hardcoded UI behavior, always a pure function of the `SceneScript`
 * (docs/DECISIONS.md ADR-019). The speaker in a dialogue beat speaks;
 * everyone else present listens; a pause beat reads as a held, thinking
 * silence; a reveal is the "oh shit" beat, so everyone present is surprised.
 */
function poseForBeat(beat: Beat, characterId: string): CharacterPose {
  switch (beat.type) {
    case 'dialogue':
      return beat.characterId === characterId ? 'speaking' : 'listening'
    case 'reveal':
      return 'surprised'
    case 'beat':
      return 'thinking'
    default:
      return 'idle'
  }
}

function makeCue<TKind extends CueKind>(
  beatIndex: number,
  sequence: number,
  kind: TKind,
  payload: ColdOpenEventMap[TKind],
): AnyCue {
  return Object.freeze({
    id: `${beatIndex}:${kind}:${sequence}`,
    beatIndex,
    kind,
    payload,
  }) as AnyCue
}

/** The subtitle/light/character cues that fire the instant a beat starts. */
function cuesForBeat(beat: Beat, beatIndex: number, script: SceneScript): readonly AnyCue[] {
  const cues: AnyCue[] = []
  let sequence = 0
  const push = <TKind extends CueKind>(kind: TKind, payload: ColdOpenEventMap[TKind]): void => {
    cues.push(makeCue(beatIndex, sequence, kind, payload))
    sequence += 1
  }

  switch (beat.type) {
    case 'title':
      if (beat.subtitle) push('subtitle:show', { text: beat.subtitle })
      else push('subtitle:hide', {})
      break
    case 'slugline':
      push('subtitle:slugline', { text: script.scene.slugline })
      break
    case 'action':
      if (beat.narrate) push('subtitle:show', { text: beat.text })
      else push('subtitle:hide', {})
      break
    case 'dialogue':
      push('subtitle:show', {
        characterId: beat.characterId,
        text: beat.line,
        parenthetical: beat.parenthetical,
      })
      push('speech:request', { characterId: beat.characterId, line: beat.line })
      break
    case 'beat':
      push('subtitle:hide', {})
      break
    case 'reveal':
      if (beat.text) push('subtitle:show', { text: beat.text })
      else push('subtitle:hide', {})
      break
  }

  if (beat.lighting) {
    push('light:change', { preset: beat.lighting.preset, transition: beat.lighting.transition })
  }

  for (const character of script.cast) {
    if (character.entrance.beat === beatIndex) {
      push('character:enter', { characterId: character.id })
    }
    if (character.exit?.beat === beatIndex) {
      push('character:exit', { characterId: character.id })
    }

    const hasEntered = character.entrance.beat <= beatIndex
    const stillOnStage = character.exit === undefined || beatIndex <= character.exit.beat
    if (hasEntered && stillOnStage) {
      push('character:pose', { characterId: character.id, pose: poseForBeat(beat, character.id) })
    }
  }

  return Object.freeze(cues)
}

/**
 * Pure function: SceneScript -> CueList (docs/ARCHITECTURE.md section 4).
 *
 * Flattens beats in schema order, computes a deterministic duration and
 * entry cues for each, and freezes the result. The Scene Controller treats
 * this as immutable — it walks the list, it never mutates it.
 */
export function compileTimeline(script: SceneScript): CueList {
  const compiled = script.beats.map<CompiledBeat>((beat, index) =>
    Object.freeze({
      index,
      id: beat.id,
      durationMs: estimateBeatDurationMs(beat),
      cues: cuesForBeat(beat, index, script),
      speechCharacterId: beat.type === 'dialogue' ? beat.characterId : undefined,
    }),
  )

  return Object.freeze(compiled)
}
