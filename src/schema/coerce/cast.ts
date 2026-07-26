import { slugify } from '@lib'
import {
  clampStringField,
  coerceEnumField,
  coerceIntegerField,
  isRecord,
  type CoercionNote,
} from './primitives'
import { vocabularies } from './vocabularies'

/** Mirrors `sceneScriptSchema.shape.cast`'s `.max(3)` (ADR-012). */
const MAX_CAST = 3

/**
 * Normalizes the cast ahead of Zod: slugifies ids into the format
 * `characterIdSchema` requires, fills in the structural fields a character
 * can't render without, keeps entrance/exit beat references inside the beat
 * list, and trims an over-large cast down to the three most-spoken
 * characters rather than the arbitrary first three.
 */
export function coerceCast(
  raw: unknown,
  beats: readonly Record<string, unknown>[],
  notes: CoercionNote[],
): Record<string, unknown>[] | null {
  if (!Array.isArray(raw)) return null

  const cast = raw.filter(isRecord).map((character) => ({ ...character }))
  const trimmed = trimToStageCapacity(cast, beats, notes)

  trimmed.forEach((character, index) => coerceCharacter(character, index, beats.length, notes))
  return trimmed
}

/**
 * ADR-012 caps the stage at three actors. When a model writes a fourth, the
 * least destructive repair is to keep whoever carries the scene — dropping
 * a silent extra loses nothing, while dropping the character with the most
 * lines guarantees the dialogue that references them dangles.
 */
function trimToStageCapacity(
  cast: Record<string, unknown>[],
  beats: readonly Record<string, unknown>[],
  notes: CoercionNote[],
): Record<string, unknown>[] {
  if (cast.length <= MAX_CAST) return cast

  const lineCounts = new Map<string, number>()
  for (const beat of beats) {
    if (beat.type !== 'dialogue' || typeof beat.characterId !== 'string') continue
    const id = slugify(beat.characterId)
    lineCounts.set(id, (lineCounts.get(id) ?? 0) + 1)
  }

  const ranked = cast
    .map((character, index) => ({
      character,
      index,
      lines: lineCounts.get(slugify(String(character.id ?? ''))) ?? 0,
    }))
    .sort((a, b) => b.lines - a.lines || a.index - b.index)
    .slice(0, MAX_CAST)
    .sort((a, b) => a.index - b.index)

  notes.push({
    path: 'cast',
    from: `${cast.length} characters`,
    to: `${MAX_CAST} characters`,
    reason: 'clamped',
  })
  return ranked.map((entry) => entry.character)
}

function coerceCharacter(
  character: Record<string, unknown>,
  index: number,
  beatCount: number,
  notes: CoercionNote[],
): void {
  const path = `cast.${index}`

  coerceCharacterId(character, index, notes)
  clampStringField(character, 'name', 40, `${path}.name`, notes)
  coerceEnumField(character, 'archetype', vocabularies.archetype, `${path}.archetype`, notes)
  coerceEnumField(character, 'build', vocabularies.build, `${path}.build`, notes, true)
  coerceEnumField(
    character,
    'silhouetteAccent',
    vocabularies.silhouetteAccent,
    `${path}.silhouetteAccent`,
    notes,
    true,
  )
  coerceVoice(character, path, notes)
  coerceEntrance(character, path, beatCount, notes)
  coerceExit(character, path, beatCount, notes)
}

/**
 * `characterIdSchema` requires a lowercase slug, but models write display
 * names ("Mara Vane") and snake_case just as readily. Slugifying here means
 * the id and every `characterId` that references it (slugified the same way
 * in `references.ts`) still line up afterwards.
 *
 * Colliding ids are deliberately *not* disambiguated. Unlike a beat id
 * (bookkeeping nothing points at), a cast id is the target of a reference
 * graph: if two characters share one, every dialogue line naming it is
 * genuinely ambiguous, and silently renaming the second character would
 * bind half the scene's dialogue to the wrong actor. Duplicates survive to
 * `validateReferentialIntegrity`, which rejects them so the script is
 * regenerated instead of quietly miscast.
 */
function coerceCharacterId(
  character: Record<string, unknown>,
  index: number,
  notes: CoercionNote[],
): void {
  const path = `cast.${index}.id`
  const authored = character.id
  const source =
    typeof authored === 'string' && authored.trim().length > 0
      ? authored
      : typeof character.name === 'string'
        ? character.name
        : `character-${index}`

  const slug = slugify(source) || `character-${index}`

  if (slug !== authored) {
    notes.push({
      path,
      from: typeof authored === 'string' ? authored : '(absent)',
      to: slug,
      reason: typeof authored === 'string' ? 'alias' : 'derived',
    })
    character.id = slug
  }
}

function coerceVoice(
  character: Record<string, unknown>,
  path: string,
  notes: CoercionNote[],
): void {
  if (!isRecord(character.voice)) {
    notes.push({ path: `${path}.voice`, from: '(absent)', to: 'mid/normal', reason: 'default' })
    character.voice = { register: 'mid', rate: 'normal' }
    return
  }

  const voice = { ...character.voice }
  coerceEnumField(voice, 'register', vocabularies.voiceRegister, `${path}.voice.register`, notes)
  coerceEnumField(voice, 'rate', vocabularies.voiceRate, `${path}.voice.rate`, notes)
  clampStringField(voice, 'accentHint', 40, `${path}.voice.accentHint`, notes)
  character.voice = voice
}

/**
 * A character with no entrance can never be placed on stage, so an absent
 * one defaults to "already there from the first beat" — the reading that
 * adds the least invented staging.
 */
function coerceEntrance(
  character: Record<string, unknown>,
  path: string,
  beatCount: number,
  notes: CoercionNote[],
): void {
  if (!isRecord(character.entrance)) {
    notes.push({
      path: `${path}.entrance`,
      from: '(absent)',
      to: 'beat 0, already-present',
      reason: 'default',
    })
    character.entrance = { beat: 0, from: 'already-present', style: 'walk' }
    return
  }

  const entrance = { ...character.entrance }
  coerceEnumField(entrance, 'from', vocabularies.entranceFrom, `${path}.entrance.from`, notes)
  coerceEnumField(entrance, 'style', vocabularies.movementStyle, `${path}.entrance.style`, notes)
  coerceBeatIndex(entrance, 'beat', beatCount, `${path}.entrance.beat`, notes)
  character.entrance = entrance
}

function coerceExit(
  character: Record<string, unknown>,
  path: string,
  beatCount: number,
  notes: CoercionNote[],
): void {
  if (character.exit === undefined) return
  if (!isRecord(character.exit)) {
    notes.push({ path: `${path}.exit`, from: '(invalid)', to: '(absent)', reason: 'dropped' })
    delete character.exit
    return
  }

  const exit = { ...character.exit }
  coerceEnumField(exit, 'to', vocabularies.exitTo, `${path}.exit.to`, notes)
  coerceEnumField(exit, 'style', vocabularies.movementStyle, `${path}.exit.style`, notes)
  coerceBeatIndex(exit, 'beat', beatCount, `${path}.exit.beat`, notes)
  character.exit = exit
}

/**
 * Keeps an entrance/exit pointing at a beat that exists. Clamping preserves
 * the ordering the model intended (enter early / leave late) where dropping
 * the reference would strand the character off stage for the whole scene.
 */
function coerceBeatIndex(
  record: Record<string, unknown>,
  key: string,
  beatCount: number,
  path: string,
  notes: CoercionNote[],
): void {
  if (record[key] === undefined) {
    notes.push({ path, from: '(absent)', to: '0', reason: 'default' })
    record[key] = 0
    return
  }

  const lastBeat = Math.max(0, beatCount - 1)
  coerceIntegerField(record, key, { min: 0, max: lastBeat }, path, notes)
}
