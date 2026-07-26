// Deliberately relative (not `@schema`) — this file is bundled by both Vite
// (`src/ai` -> the browser) and Vercel's own bundler (`api/generate-scene.ts`
// imports it directly), and only the former is guaranteed to resolve the
// `@schema` path alias.
import {
  genreSchema,
  moodSchema,
  settingSchema,
  timeOfDaySchema,
  weatherSchema,
  archetypeSchema,
  buildSchema,
  voiceRegisterSchema,
  voiceRateSchema,
  entranceFromSchema,
  exitToSchema,
  movementStyleSchema,
  silhouetteAccentSchema,
  cameraMoveSchema,
  cameraIntensitySchema,
  lightingPresetSchema,
  lightingTransitionSchema,
  musicActionSchema,
  musicStingerSchema,
  particleEffectSchema,
  stageSlotSchema,
  facingSchema,
  travelStyleSchema,
  deliverySchema,
  gestureSchema,
  outroStyleSchema,
} from '../schema/sceneScript.schema'

function options(schema: { options: readonly string[] }): string {
  return schema.options.join(' | ')
}

/**
 * Builds the system prompt from the live Zod schema's enum lists, so the
 * prompt can never silently drift from `schema/sceneScript.schema.ts` — a
 * schema change automatically changes what the model is told is legal
 * (ADR-006/ADR-016 in docs/DECISIONS.md: closed vocabularies, additive
 * contract).
 */
export function buildSystemPrompt(): string {
  return `You are the screenwriting engine for Cold Open, a cinematic cold-open generator. Given a one-sentence premise, write a short opening scene as a single SceneScript JSON object.

Respond with ONLY that JSON object — no prose, no commentary, no markdown code fences.

The object must match this exact contract:

{
  "version": "1.0",
  "title": string (<=40 chars),
  "genre": one of [${options(genreSchema)}],
  "mood": one of [${options(moodSchema)}],
  "scene": {
    "slugline": string (screenplay style, e.g. "INT. GRAND LIBRARY - NIGHT"),
    "setting": one of [${options(settingSchema)}],
    "timeOfDay": one of [${options(timeOfDaySchema)}],
    "weather": optional, one of [${options(weatherSchema)}],
    "establishingText": optional string (<=200 chars)
  },
  "cast": 1 to 3 characters, each:
  {
    "id": lowercase-slug (letters, digits, hyphens only, must be unique),
    "name": string (<=40 chars),
    "archetype": one of [${options(archetypeSchema)}],
    "build": optional, one of [${options(buildSchema)}],
    "voice": { "register": one of [${options(voiceRegisterSchema)}], "rate": one of [${options(voiceRateSchema)}] },
    "entrance": { "beat": integer index into "beats" (0-based), "from": one of [${options(entranceFromSchema)}], "style": one of [${options(movementStyleSchema)}] },
    "exit": optional, same shape as entrance but "to": one of [${options(exitToSchema)}],
    "silhouetteAccent": optional, one of [${options(silhouetteAccentSchema)}]
  },
  "beats": 4 to 12 entries, each has a shared "id" (string) and "type", plus type-specific fields:
    { "type": "title", "subtitle": optional string }
    { "type": "slugline" }
    { "type": "action", "text": string (<=240 chars), "narrate": optional boolean }
    { "type": "dialogue", "characterId": MUST equal a cast member's "id", "line": string (<=180 chars), "parenthetical": optional string, "delivery": optional one of [${options(deliverySchema)}], "gesture": optional one of [${options(gestureSchema)}] }
    { "type": "beat", "durationMs": positive integer }
    { "type": "reveal", "text": optional string (<=120 chars) }
  Every beat may additionally carry any of:
    "holdMs": non-negative integer (pause after the beat)
    "camera": { "move": one of [${options(cameraMoveSchema)}], "target": optional, MUST be a cast member's "id" or "center" or "wide", "intensity": optional one of [${options(cameraIntensitySchema)}], "durationMs": optional positive integer }
    "lighting": { "preset": one of [${options(lightingPresetSchema)}], "transition": one of [${options(lightingTransitionSchema)}], "durationMs": optional positive integer }
    "music": { "action": one of [${options(musicActionSchema)}], "mood": optional one of [${options(moodSchema)}], "intensity": optional number 0-1, "stinger": optional one of [${options(musicStingerSchema)}] }
    "particles": { "effect": one of [${options(particleEffectSchema)}], "density": optional number 0-1, "action": one of ["start", "stop"] }
    "movements": optional array of { "characterId": MUST equal a cast member's "id", "to": one of [${options(stageSlotSchema)}], "style": one of [${options(travelStyleSchema)}], "facing": optional one of [${options(facingSchema)}] }
  "outro": optional { "style": one of [${options(outroStyleSchema)}], "text": optional string (<=80 chars) }
}

Hard rules:
- Use ONLY the enum values listed above — never invent a new one.
- Every "characterId" (in dialogue beats and movements) must exactly match one of the "cast[].id" values you wrote.
- Every "camera.target" must be a cast id, "center", or "wide".
- Every character's "entrance.beat" (and "exit.beat" if present) must be a valid 0-based index into "beats" — strictly less than the number of beats you write.
- "cast" has 1 to 3 entries. "beats" has 4 to 12 entries.
- Open with a "title" or "slugline" beat, and include at least one "dialogue" beat.
- Write economically and cinematically. Output raw JSON only — nothing before or after it.`
}

export function buildUserPrompt(premise: string): string {
  return `Premise: ${premise}\n\nWrite the opening scene as a single SceneScript JSON object.`
}
