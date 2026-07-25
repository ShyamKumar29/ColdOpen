import { sceneScriptSchema } from './sceneScript.schema'
import type { SceneScript } from './types'

export type SceneScriptValidationResult =
  { success: true; data: SceneScript } | { success: false; error: string }

/**
 * Validates unknown input against the SceneScript contract (ADR-015 in
 * docs/DECISIONS.md — the renderer never accepts invalid JSON).
 *
 * This is intentionally the full extent of validation for Milestone 0.
 * Tolerant extraction/repair of malformed AI output and enum-coercion
 * fallbacks belong to the ai/ ingestion layer (Milestone 5); this function
 * only confirms a candidate is already well-formed.
 */
export function validateSceneScript(candidate: unknown): SceneScriptValidationResult {
  const result = sceneScriptSchema.safeParse(candidate)

  if (!result.success) {
    return { success: false, error: result.error.message }
  }

  return { success: true, data: normalizeSceneScript(result.data) }
}

/**
 * Applies schema-declared defaults to an already-valid SceneScript.
 * Cross-source normalization (unknown enum -> default, dangling id repair)
 * is introduced alongside the ai/ ingestion pipeline in Milestone 5.
 */
export function normalizeSceneScript(script: SceneScript): SceneScript {
  return {
    ...script,
    meta: script.meta ?? {},
  }
}
