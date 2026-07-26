import { coerceBeats } from './beats'
import { coerceCast } from './cast'
import {
  clampStringField,
  coerceEnumField,
  isRecord,
  stripNulls,
  type CoercionNote,
} from './primitives'
import { resolveReferences } from './references'
import { vocabularies } from './vocabularies'

export type { CoercionNote, CoercionReason } from './primitives'
export {
  vocabularies,
  findNonCanonicalAliasKeys,
  findUnresolvableAliasTargets,
} from './vocabularies'

export interface CoercionResult {
  /** The candidate document, ready to hand to Zod. */
  value: unknown
  /** Everything that had to be changed, for development logging. */
  notes: CoercionNote[]
}

/**
 * Normalizes an untrusted candidate document *before* Zod validation.
 *
 * CLAUDE.md's JSON Schema Rules require that unknown enum values normalize
 * to a defined default rather than being a fatal error in the render path,
 * and ADR-015 says the same. That can't happen after `safeParse` — Zod has
 * already rejected the document by then — so it happens here, on `unknown`,
 * and the result still goes through the exact same validation every
 * `SceneScript` does. Nothing bypasses the contract; this only decides what
 * an out-of-vocabulary value *means* before the contract is checked.
 *
 * Deliberately not repaired here: a missing dialogue `line`, an
 * unrecognizable beat `type`, a cast that references a character who
 * doesn't exist, or a beat list shorter than the schema's minimum. Those
 * are missing *content*, not miscoded content — guessing at them would
 * fabricate a scene rather than preserve one, so they fail validation and
 * the ingestion layer's retry/seed-fallback chain handles them.
 *
 * A well-formed `SceneScript` (every seed script) passes through unchanged
 * with an empty note list.
 */
export function coerceSceneScriptCandidate(input: unknown): CoercionResult {
  const notes: CoercionNote[] = []
  if (!isRecord(input)) return { value: input, notes }

  const stripped = stripNulls(input, '', notes)
  if (!isRecord(stripped)) return { value: stripped, notes }

  const draft: Record<string, unknown> = { ...stripped }

  coerceVersion(draft, notes)
  clampStringField(draft, 'title', 40, 'title', notes)
  coerceEnumField(draft, 'genre', vocabularies.genre, 'genre', notes)
  coerceEnumField(draft, 'mood', vocabularies.mood, 'mood', notes)
  coerceSceneHeader(draft, notes)

  const beats = coerceBeats(draft.beats, notes)
  if (beats) draft.beats = beats

  const cast = coerceCast(draft.cast, beats ?? [], notes)
  if (cast) draft.cast = cast

  if (beats && cast) resolveReferences(beats, cast, notes)

  coerceOutro(draft, notes)

  return { value: draft, notes }
}

/**
 * `version` is pure bookkeeping the model has no stake in, so the shapes it
 * confuses `"1.0"` with (the number `1`, the string `"1"`, omitting it) are
 * repaired. A genuine different major such as `"2.0"` is left alone —
 * ADR-016 requires the validator to reject unknown majors rather than
 * silently treat them as this one.
 */
function coerceVersion(draft: Record<string, unknown>, notes: CoercionNote[]): void {
  const version = draft.version
  if (version === '1.0') return
  if (version !== undefined && version !== 1 && version !== '1' && version !== 1.0) return

  notes.push({
    path: 'version',
    from: version === undefined ? '(absent)' : String(version),
    to: '1.0',
    reason: 'default',
  })
  draft.version = '1.0'
}

function coerceSceneHeader(draft: Record<string, unknown>, notes: CoercionNote[]): void {
  if (!isRecord(draft.scene)) return

  const scene = { ...draft.scene }
  clampStringField(scene, 'slugline', 80, 'scene.slugline', notes)
  clampStringField(scene, 'establishingText', 200, 'scene.establishingText', notes)
  coerceEnumField(scene, 'setting', vocabularies.setting, 'scene.setting', notes)
  coerceEnumField(scene, 'timeOfDay', vocabularies.timeOfDay, 'scene.timeOfDay', notes)
  coerceEnumField(scene, 'weather', vocabularies.weather, 'scene.weather', notes, true)
  draft.scene = scene
}

function coerceOutro(draft: Record<string, unknown>, notes: CoercionNote[]): void {
  if (draft.outro === undefined) return
  if (!isRecord(draft.outro)) {
    notes.push({ path: 'outro', from: '(invalid)', to: '(absent)', reason: 'dropped' })
    delete draft.outro
    return
  }

  const outro = { ...draft.outro }
  coerceEnumField(outro, 'style', vocabularies.outroStyle, 'outro.style', notes)
  clampStringField(outro, 'text', 80, 'outro.text', notes)
  draft.outro = outro
}
