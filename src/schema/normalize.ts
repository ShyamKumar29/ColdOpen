import { coerceSceneScriptCandidate, type CoercionNote } from './coerce'
import { sceneScriptSchema } from './sceneScript.schema'
import type { SceneScript } from './types'

export type SceneScriptValidationResult =
  | { success: true; data: SceneScript; coercions: CoercionNote[] }
  | { success: false; error: string; coercions: CoercionNote[] }

/**
 * Validates unknown input against the SceneScript contract (ADR-015 in
 * docs/DECISIONS.md — the renderer never accepts invalid JSON), including
 * referential integrity Zod's shape-only parse can't express (Milestone 6):
 * dangling `characterId`s, an unresolvable `camera.target`, and out-of-range
 * entrance/exit beat indices. A script that is shape-valid but referentially
 * broken is treated the same as a shape-invalid one — the `ai/` ingestion
 * layer's repair/retry/seed-fallback chain is what recovers from either.
 *
 * The candidate first passes through `coerceSceneScriptCandidate`, which
 * resolves out-of-vocabulary enum values and fills in derivable bookkeeping
 * (ADR-029). That step only decides what an unrecognized value *means*;
 * the document it produces still has to satisfy this same Zod parse, so no
 * source — Groq, seed script, or future editor — skips the contract.
 * `coercions` reports everything it changed, for development logging.
 */
export function validateSceneScript(candidate: unknown): SceneScriptValidationResult {
  const { value, notes } = coerceSceneScriptCandidate(candidate)
  const result = sceneScriptSchema.safeParse(value)

  if (!result.success) {
    return { success: false, error: result.error.message, coercions: notes }
  }

  const issues = validateReferentialIntegrity(result.data)
  if (issues.length > 0) {
    return { success: false, error: issues.join('; '), coercions: notes }
  }

  return { success: true, data: normalizeSceneScript(result.data), coercions: notes }
}

/**
 * Checks the cross-field references a single-object Zod parse can't see:
 * every cast `id` must be unique, every `characterId` (dialogue, movement)
 * must name a real cast member, every `camera.target` must be a cast id or
 * the `center`/`wide` presets, and every entrance/exit `beat` index must
 * fall within the beat list. Returns a list of human-readable issues, empty
 * when the script is sound.
 */
export function validateReferentialIntegrity(script: SceneScript): string[] {
  const issues: string[] = []
  const castIds = new Set(script.cast.map((character) => character.id))
  const beatCount = script.beats.length

  const seenIds = new Set<string>()
  for (const character of script.cast) {
    if (seenIds.has(character.id)) {
      issues.push(`Cast id "${character.id}" is used by more than one character.`)
    }
    seenIds.add(character.id)
  }

  for (const character of script.cast) {
    if (character.entrance.beat >= beatCount) {
      issues.push(
        `Character "${character.id}" entrance.beat (${character.entrance.beat}) is out of range for ${beatCount} beats.`,
      )
    }
    if (character.exit && character.exit.beat >= beatCount) {
      issues.push(
        `Character "${character.id}" exit.beat (${character.exit.beat}) is out of range for ${beatCount} beats.`,
      )
    }
  }

  script.beats.forEach((beat, index) => {
    if (beat.type === 'dialogue' && !castIds.has(beat.characterId)) {
      issues.push(
        `Beat ${index} ("${beat.id}") dialogue.characterId "${beat.characterId}" does not match any cast member.`,
      )
    }

    for (const movement of beat.movements ?? []) {
      if (!castIds.has(movement.characterId)) {
        issues.push(
          `Beat ${index} ("${beat.id}") movement.characterId "${movement.characterId}" does not match any cast member.`,
        )
      }
    }

    const target = beat.camera?.target
    if (target !== undefined && target !== 'center' && target !== 'wide' && !castIds.has(target)) {
      issues.push(
        `Beat ${index} ("${beat.id}") camera.target "${target}" is not a cast id, "center", or "wide".`,
      )
    }
  })

  return issues
}

/**
 * Applies schema-declared defaults to an already-valid SceneScript.
 */
export function normalizeSceneScript(script: SceneScript): SceneScript {
  return {
    ...script,
    meta: script.meta ?? {},
  }
}
