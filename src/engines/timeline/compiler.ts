import type { CameraFocus, CameraShot, CharacterPose, ColdOpenEventMap } from '@engines/bus'
import { resolveInitialSlots } from '@engines/character'
import type {
  Beat,
  CameraDirection,
  CameraIntensity,
  CameraMove,
  SceneScript,
  StageSlot,
} from '@schema'
import { musicDuckLevel } from '@design'
import { deriveMusicPlan } from './musicPlan'
import type { MusicPlanBeat } from './musicPlan'
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

/** `CameraDirection.move` -> the shot it reads as, when the move alone implies one. Moves absent here (pans, handheld, static) keep whatever shot scene context already derived. */
const SHOT_FOR_MOVE: Partial<Record<CameraMove, CameraShot>> = {
  pushIn: 'close',
  dollyIn: 'close',
  pullBack: 'wide',
  whipPan: 'wide',
}

function focusForSlot(slot: StageSlot | null): CameraFocus {
  switch (slot) {
    case 'farLeft':
    case 'left':
      return 'left'
    case 'farRight':
    case 'right':
      return 'right'
    default:
      return 'center'
  }
}

/** Resolves a `CameraDirection.target` (a characterId, `'center'`, or `'wide'`) into a stage-side focus, falling back when the target is missing or unrecognized. */
function resolveFocus(
  target: string | undefined,
  characterSlots: ReadonlyMap<string, StageSlot | null>,
  fallback: CameraFocus,
): CameraFocus {
  if (!target) return fallback
  if (target === 'wide') return 'wide'
  if (target === 'center') return 'center'
  return characterSlots.has(target) ? focusForSlot(characterSlots.get(target)!) : fallback
}

interface AutoFraming {
  move: CameraMove
  shot: CameraShot
  focus: CameraFocus
  intensity: CameraIntensity
}

/**
 * The automatic-framing half of the "virtual cinematographer" (Milestone 5):
 * a pure function of beat type, who's speaking, how many characters are on
 * stage, and where the speaker stands — never wall-clock or random, so the
 * same `SceneScript` always compiles to the same camera path. Every decision
 * here is explainable from scene state (CLAUDE.md — "the renderer never
 * accepts... hardcoded UI behavior"), mirroring how `poseForBeat` derives
 * `CharacterPose` (ADR-019) rather than reading it from the schema.
 */
function autoFraming(
  beat: Beat,
  activeCount: number,
  characterSlots: ReadonlyMap<string, StageSlot | null>,
): AutoFraming {
  switch (beat.type) {
    case 'title':
    case 'slugline':
      return { move: 'static', shot: 'wide', focus: 'wide', intensity: 'subtle' }
    case 'action':
      return { move: 'pushIn', shot: 'medium', focus: 'center', intensity: 'subtle' }
    case 'dialogue': {
      const focus = resolveFocus(beat.characterId, characterSlots, 'center')
      if (activeCount <= 1) return { move: 'pushIn', shot: 'close', focus, intensity: 'normal' }
      if (activeCount === 2) {
        return { move: 'pushIn', shot: 'overShoulder', focus, intensity: 'subtle' }
      }
      const move = focus === 'left' ? 'panLeft' : focus === 'right' ? 'panRight' : 'static'
      return { move, shot: 'medium', focus, intensity: 'subtle' }
    }
    case 'beat':
      return { move: 'pullBack', shot: 'wide', focus: 'wide', intensity: 'subtle' }
    case 'reveal':
      return { move: 'whipPan', shot: 'reveal', focus: 'wide', intensity: 'dramatic' }
  }
}

/**
 * Resolves a beat's `camera:move` cue payload: automatic framing filled in
 * from scene state, with any authored `beat.camera` (move/target/intensity/
 * durationMs) taking precedence field-by-field (CLAUDE.md — "do not require
 * camera data in SceneScript," so a script with none still gets a fully
 * directed camera path).
 */
function cameraForBeat(
  beat: Beat,
  activeCount: number,
  characterSlots: ReadonlyMap<string, StageSlot | null>,
): ColdOpenEventMap['camera:move'] {
  const auto = autoFraming(beat, activeCount, characterSlots)
  const camera: CameraDirection | undefined = beat.camera
  if (!camera) return auto

  // A reveal beat's framing comes from the beat type, not the authored
  // move — "the oh-shit moment" should always read as the tightest,
  // most dramatic shot regardless of which camera move got it there.
  const shot = beat.type === 'reveal' ? auto.shot : (SHOT_FOR_MOVE[camera.move] ?? auto.shot)

  return {
    move: camera.move,
    shot,
    focus: resolveFocus(camera.target, characterSlots, auto.focus),
    intensity: camera.intensity ?? auto.intensity,
    durationMs: camera.durationMs,
  }
}

/**
 * Resolves a beat's music cues from the precomputed `MusicPlanBeat` (never
 * re-deriving state itself — `deriveMusicPlan` already did that once for the
 * whole script). `music:start` fires exactly once, on the opening beat;
 * every later beat fires `music:mood` only when the plan's state/mood/
 * intensity actually changed from the previous beat, so re-entering the same
 * arrangement (e.g. two consecutive `ambient` beats) is a no-op cue-wise,
 * matching the idempotent-handler rule every other cue in this file follows.
 * Dialogue ducking is derived independently of the music plan, straight from
 * the beat's own type — it observes "is this beat spoken dialogue," the same
 * signal `subtitle:show`'s `characterId` already carries, not the music
 * plan's dramatic-arc state.
 */
function musicCuesForBeat(
  beat: Beat,
  entry: MusicPlanBeat,
  previous: MusicPlanBeat | undefined,
  push: <TKind extends CueKind>(kind: TKind, payload: ColdOpenEventMap[TKind]) => void,
): void {
  const payload = { state: entry.state, mood: entry.mood, intensity: entry.intensity }

  if (!previous) {
    push('music:start', payload)
  } else if (
    previous.state !== entry.state ||
    previous.mood !== entry.mood ||
    previous.intensity !== entry.intensity
  ) {
    push('music:mood', payload)
  }

  if (entry.stinger) push('music:sting', { stinger: entry.stinger })

  if (beat.type === 'dialogue') {
    push('music:duck', { to: musicDuckLevel })
  } else {
    push('music:unduck', {})
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

/** The subtitle/light/character/camera cues that fire the instant a beat starts. */
function cuesForBeat(
  beat: Beat,
  beatIndex: number,
  script: SceneScript,
  characterSlots: ReadonlyMap<string, StageSlot | null>,
  musicEntry: MusicPlanBeat,
  previousMusicEntry: MusicPlanBeat | undefined,
): readonly AnyCue[] {
  const cues: AnyCue[] = []
  let sequence = 0
  const push = <TKind extends CueKind>(kind: TKind, payload: ColdOpenEventMap[TKind]): void => {
    cues.push(makeCue(beatIndex, sequence, kind, payload))
    sequence += 1
  }

  const activeCharacterIds = script.cast
    .filter((character) => {
      const hasEntered = character.entrance.beat <= beatIndex
      const stillOnStage = character.exit === undefined || beatIndex <= character.exit.beat
      return hasEntered && stillOnStage
    })
    .map((character) => character.id)

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
    push('light:change', {
      preset: beat.lighting.preset,
      transition: beat.lighting.transition,
      durationMs: beat.lighting.durationMs,
    })
  }

  push('camera:move', cameraForBeat(beat, activeCharacterIds.length, characterSlots))
  musicCuesForBeat(beat, musicEntry, previousMusicEntry, push)

  for (const character of script.cast) {
    if (character.entrance.beat === beatIndex) {
      push('character:enter', { characterId: character.id })
    }
    if (character.exit?.beat === beatIndex) {
      push('character:exit', { characterId: character.id })
    }

    if (activeCharacterIds.includes(character.id)) {
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
  const characterSlots = resolveInitialSlots(script.cast)
  const musicPlan = deriveMusicPlan(script)

  const compiled = script.beats.map<CompiledBeat>((beat, index) =>
    Object.freeze({
      index,
      id: beat.id,
      durationMs: estimateBeatDurationMs(beat),
      cues: cuesForBeat(
        beat,
        index,
        script,
        characterSlots,
        musicPlan[index]!,
        musicPlan[index - 1],
      ),
      speechCharacterId: beat.type === 'dialogue' ? beat.characterId : undefined,
    }),
  )

  return Object.freeze(compiled)
}
