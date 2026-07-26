import { canonicalToken, slugify } from '@lib'
import { isRecord, type CoercionNote } from './primitives'

/**
 * Reconnects the cross-field references Zod can't see, using only
 * unambiguous evidence. Anything that stays dangling afterwards is left
 * alone deliberately: `validateReferentialIntegrity` then fails the script
 * and the ingestion layer's retry/seed-fallback chain takes over, which is
 * the right outcome for a line of dialogue with no one to speak it.
 */
export function resolveReferences(
  beats: Record<string, unknown>[],
  cast: readonly Record<string, unknown>[],
  notes: CoercionNote[],
): void {
  const castIds = cast
    .map((character) => character.id)
    .filter((id): id is string => typeof id === 'string')
  const byName = new Map<string, string>()
  for (const character of cast) {
    if (typeof character.id !== 'string') continue
    if (typeof character.name === 'string') byName.set(canonicalToken(character.name), character.id)
    byName.set(canonicalToken(character.id), character.id)
  }

  beats.forEach((beat, index) => {
    const path = `beats.${index}`

    if (beat.type === 'dialogue') {
      resolveCharacterId(beat, 'characterId', castIds, byName, `${path}.characterId`, notes)
    }

    if (Array.isArray(beat.movements)) {
      beat.movements.forEach((movement, movementIndex) => {
        if (!isRecord(movement)) return
        resolveCharacterId(
          movement,
          'characterId',
          castIds,
          byName,
          `${path}.movements.${movementIndex}.characterId`,
          notes,
        )
      })
    }

    if (isRecord(beat.camera)) {
      resolveCameraTarget(beat.camera, castIds, byName, `${path}.camera.target`, notes)
    }
  })
}

function resolveCharacterId(
  record: Record<string, unknown>,
  key: string,
  castIds: readonly string[],
  byName: ReadonlyMap<string, string>,
  path: string,
  notes: CoercionNote[],
): void {
  const raw = record[key]
  if (typeof raw !== 'string') return
  if (castIds.includes(raw)) return

  const resolved = matchCastMember(raw, castIds, byName)
  if (resolved === undefined) return

  notes.push({ path, from: raw, to: resolved, reason: 'alias' })
  record[key] = resolved
}

/**
 * An unresolvable `camera.target` is dropped rather than pointed somewhere
 * arbitrary: the Timeline Compiler's automatic framing (ADR-024) then
 * derives the shot from scene state, which is strictly better direction
 * than a guessed target.
 */
function resolveCameraTarget(
  camera: Record<string, unknown>,
  castIds: readonly string[],
  byName: ReadonlyMap<string, string>,
  path: string,
  notes: CoercionNote[],
): void {
  const raw = camera.target
  if (raw === undefined) return
  if (typeof raw === 'string' && (castIds.includes(raw) || raw === 'center' || raw === 'wide')) {
    return
  }

  if (typeof raw === 'string') {
    const token = canonicalToken(raw)
    if (token === 'center' || token === 'centre' || token === 'middle') {
      notes.push({ path, from: raw, to: 'center', reason: 'alias' })
      camera.target = 'center'
      return
    }
    if (token === 'wide' || token === 'all' || token === 'everyone' || token === 'both') {
      notes.push({ path, from: raw, to: 'wide', reason: 'alias' })
      camera.target = 'wide'
      return
    }

    const resolved = matchCastMember(raw, castIds, byName)
    if (resolved !== undefined) {
      notes.push({ path, from: raw, to: resolved, reason: 'alias' })
      camera.target = resolved
      return
    }
  }

  notes.push({
    path,
    from: typeof raw === 'string' ? raw : '(invalid)',
    to: '(absent)',
    reason: 'dropped',
  })
  delete camera.target
}

/** Matches a reference by slug, then by canonical id or display name. */
function matchCastMember(
  raw: string,
  castIds: readonly string[],
  byName: ReadonlyMap<string, string>,
): string | undefined {
  const slug = slugify(raw)
  if (castIds.includes(slug)) return slug
  return byName.get(canonicalToken(raw))
}
