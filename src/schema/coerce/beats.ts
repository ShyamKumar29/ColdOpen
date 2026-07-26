import {
  clampStringField,
  coerceBooleanField,
  coerceEnumField,
  coerceIntegerField,
  coerceRatioField,
  isRecord,
  resolveEnum,
  type CoercionNote,
} from './primitives'
import { vocabularies } from './vocabularies'

/** Mirrors `sceneScriptSchema.shape.beats`'s `.max(12)`. */
const MAX_BEATS = 12
/** Used when a pause beat arrives without the duration it requires. */
const DEFAULT_PAUSE_MS = 1200

/**
 * Normalizes the beat list ahead of Zod: resolves each beat's `type`,
 * assigns the `id` the renderer needs but the model has no reason to
 * author, coerces every direction sub-object's enums, and clamps the
 * over-long text and out-of-range numbers models routinely produce.
 */
export function coerceBeats(raw: unknown, notes: CoercionNote[]): Record<string, unknown>[] | null {
  if (!Array.isArray(raw)) return null

  let beats = raw.filter(isRecord).map((beat) => ({ ...beat }))

  if (beats.length > MAX_BEATS) {
    notes.push({
      path: 'beats',
      from: `${beats.length} beats`,
      to: `${MAX_BEATS} beats`,
      reason: 'clamped',
    })
    beats = beats.slice(0, MAX_BEATS)
  }

  const usedIds = new Set<string>()
  beats.forEach((beat, index) => coerceBeat(beat, index, usedIds, notes))
  return beats
}

function coerceBeat(
  beat: Record<string, unknown>,
  index: number,
  usedIds: Set<string>,
  notes: CoercionNote[],
): void {
  const path = `beats.${index}`

  const type = resolveEnum(beat.type, vocabularies.beatType, `${path}.type`, notes)
  if (type !== undefined) beat.type = type

  assignBeatId(beat, index, usedIds, notes)

  coerceIntegerField(beat, 'holdMs', { min: 0, max: 10_000 }, `${path}.holdMs`, notes)
  coerceTypeSpecificFields(beat, type, path, notes)
  coerceDirections(beat, path, notes)
}

/**
 * `beat.id` is renderer bookkeeping, not a creative decision — the model is
 * no longer asked for one (see `ai/prompt.ts`) and omits it in practice
 * anyway. Deriving it here keeps `id` a required, always-present field for
 * every downstream consumer while costing the data source nothing. A
 * hand-authored id (every seed script has one) is kept as written unless it
 * collides with one already used.
 */
function assignBeatId(
  beat: Record<string, unknown>,
  index: number,
  usedIds: Set<string>,
  notes: CoercionNote[],
): void {
  const authored = beat.id
  if (typeof authored === 'string' && authored.length > 0 && !usedIds.has(authored)) {
    usedIds.add(authored)
    return
  }

  const type = typeof beat.type === 'string' ? beat.type : 'beat'
  let derived = `${type}-${index}`
  while (usedIds.has(derived)) derived = `${derived}-x`

  usedIds.add(derived)
  notes.push({
    path: `beats.${index}.id`,
    from: typeof authored === 'string' ? authored : '(absent)',
    to: derived,
    reason: 'derived',
  })
  beat.id = derived
}

function coerceTypeSpecificFields(
  beat: Record<string, unknown>,
  type: string | undefined,
  path: string,
  notes: CoercionNote[],
): void {
  switch (type) {
    case 'title':
      clampStringField(beat, 'subtitle', 80, `${path}.subtitle`, notes)
      break
    case 'action':
      clampStringField(beat, 'text', 240, `${path}.text`, notes)
      coerceBooleanField(beat, 'narrate')
      break
    case 'dialogue':
      clampStringField(beat, 'line', 180, `${path}.line`, notes)
      clampStringField(beat, 'parenthetical', 40, `${path}.parenthetical`, notes)
      coerceEnumField(beat, 'delivery', vocabularies.delivery, `${path}.delivery`, notes, true)
      coerceEnumField(beat, 'gesture', vocabularies.gesture, `${path}.gesture`, notes, true)
      break
    case 'beat':
      if (beat.durationMs === undefined) {
        notes.push({
          path: `${path}.durationMs`,
          from: '(absent)',
          to: String(DEFAULT_PAUSE_MS),
          reason: 'default',
        })
        beat.durationMs = DEFAULT_PAUSE_MS
      }
      coerceIntegerField(beat, 'durationMs', { min: 1, max: 10_000 }, `${path}.durationMs`, notes)
      break
    case 'reveal':
      clampStringField(beat, 'text', 120, `${path}.text`, notes)
      break
    default:
      break
  }
}

/** The optional per-beat direction blocks every beat type may carry. */
function coerceDirections(
  beat: Record<string, unknown>,
  path: string,
  notes: CoercionNote[],
): void {
  const camera = beat.camera
  if (isRecord(camera)) {
    coerceEnumField(camera, 'move', vocabularies.cameraMove, `${path}.camera.move`, notes)
    coerceEnumField(
      camera,
      'intensity',
      vocabularies.cameraIntensity,
      `${path}.camera.intensity`,
      notes,
      true,
    )
    coerceIntegerField(
      camera,
      'durationMs',
      { min: 1, max: 10_000 },
      `${path}.camera.durationMs`,
      notes,
    )
  }

  const lighting = beat.lighting
  if (isRecord(lighting)) {
    coerceEnumField(
      lighting,
      'preset',
      vocabularies.lightingPreset,
      `${path}.lighting.preset`,
      notes,
    )
    coerceEnumField(
      lighting,
      'transition',
      vocabularies.lightingTransition,
      `${path}.lighting.transition`,
      notes,
    )
    coerceIntegerField(
      lighting,
      'durationMs',
      { min: 1, max: 10_000 },
      `${path}.lighting.durationMs`,
      notes,
    )
  }

  const music = beat.music
  if (isRecord(music)) {
    coerceEnumField(music, 'action', vocabularies.musicAction, `${path}.music.action`, notes)
    coerceEnumField(music, 'mood', vocabularies.mood, `${path}.music.mood`, notes, true)
    coerceEnumField(
      music,
      'stinger',
      vocabularies.musicStinger,
      `${path}.music.stinger`,
      notes,
      true,
    )
    coerceRatioField(music, 'intensity', `${path}.music.intensity`, notes)
  }

  const particles = beat.particles
  if (isRecord(particles)) {
    coerceEnumField(
      particles,
      'effect',
      vocabularies.particleEffect,
      `${path}.particles.effect`,
      notes,
    )
    coerceEnumField(
      particles,
      'action',
      vocabularies.particleAction,
      `${path}.particles.action`,
      notes,
    )
    coerceRatioField(particles, 'density', `${path}.particles.density`, notes)
  }

  if (Array.isArray(beat.movements)) {
    beat.movements = beat.movements.filter(isRecord).map((movement, movementIndex) => {
      const next = { ...movement }
      const movementPath = `${path}.movements.${movementIndex}`
      coerceEnumField(next, 'to', vocabularies.stageSlot, `${movementPath}.to`, notes)
      coerceEnumField(next, 'style', vocabularies.travelStyle, `${movementPath}.style`, notes)
      coerceEnumField(next, 'facing', vocabularies.facing, `${movementPath}.facing`, notes, true)
      return next
    })
  }
}
