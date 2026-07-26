import { z } from 'zod'

/**
 * The SceneScript schema — the single contract between scene data sources
 * (Groq, seed scripts, future editors) and the rendering engines.
 * See docs/ARCHITECTURE.md section 7 for the full field-by-field design.
 *
 * Enums are closed vocabularies by design (ADR-006 in docs/DECISIONS.md):
 * the AI never emits colors, coordinates, or free-form presentation values,
 * only named values from the sets defined here.
 */

export const genreSchema = z.enum([
  'heist',
  'noir',
  'scifi',
  'horror',
  'romance',
  'western',
  'thriller',
  'comedy',
  'fantasy',
  'drama',
])

export const moodSchema = z.enum([
  'tense',
  'melancholy',
  'playful',
  'ominous',
  'triumphant',
  'mysterious',
  'frantic',
  'tender',
])

export const settingSchema = z.enum([
  'library',
  'diner',
  'alley',
  'spaceship',
  'forest',
  'rooftop',
  'warehouse',
  'office',
  'desert',
  'apartment',
  'subway',
  'void',
])

export const timeOfDaySchema = z.enum(['dawn', 'day', 'dusk', 'night'])

export const weatherSchema = z.enum(['clear', 'rain', 'fog', 'snow', 'storm'])

export const sceneHeaderSchema = z.object({
  slugline: z.string().min(1).max(80),
  setting: settingSchema,
  timeOfDay: timeOfDaySchema,
  weather: weatherSchema.optional(),
  establishingText: z.string().max(200).optional(),
})

export const archetypeSchema = z.enum([
  'leader',
  'rookie',
  'mastermind',
  'guard',
  'stranger',
  'rival',
  'mentor',
  'ghost',
])

export const buildSchema = z.enum(['slight', 'average', 'heavy', 'tall'])

export const voiceRegisterSchema = z.enum(['low', 'mid', 'high'])
export const voiceRateSchema = z.enum(['slow', 'normal', 'fast'])

export const voiceSchema = z.object({
  register: voiceRegisterSchema,
  rate: voiceRateSchema,
  accentHint: z.string().max(40).optional(),
})

export const entranceFromSchema = z.enum([
  'offLeft',
  'offRight',
  'shadow',
  'above',
  'already-present',
])

export const exitToSchema = z.enum(['offLeft', 'offRight', 'shadow', 'above'])

export const movementStyleSchema = z.enum(['walk', 'stride', 'creep', 'burst', 'fade'])

export const entranceSchema = z.object({
  beat: z.number().int().nonnegative(),
  from: entranceFromSchema,
  style: movementStyleSchema,
})

export const exitSchema = z.object({
  beat: z.number().int().nonnegative(),
  to: exitToSchema,
  style: movementStyleSchema,
})

export const silhouetteAccentSchema = z.enum(['hat', 'coat', 'briefcase', 'cane', 'cape', 'none'])

/**
 * Shared by every field that references a `Character.id`: `character.id`
 * itself, `dialogueBeat.characterId`, and `movement.characterId`. A single
 * schema keeps the slug format consistent everywhere instead of three
 * independently hand-typed string schemas drifting apart.
 */
export const characterIdSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'characterId must be a lowercase slug')

export const characterSchema = z.object({
  id: characterIdSchema,
  name: z.string().min(1).max(40),
  archetype: archetypeSchema,
  build: buildSchema.optional(),
  voice: voiceSchema,
  entrance: entranceSchema,
  exit: exitSchema.optional(),
  silhouetteAccent: silhouetteAccentSchema.optional(),
})

export const cameraMoveSchema = z.enum([
  'pushIn',
  'pullBack',
  'panLeft',
  'panRight',
  'whipPan',
  'craneUp',
  'dollyIn',
  'handheld',
  'static',
])

export const cameraIntensitySchema = z.enum(['subtle', 'normal', 'dramatic'])

export const cameraDirectionSchema = z.object({
  move: cameraMoveSchema,
  target: z.string().max(40).optional(),
  intensity: cameraIntensitySchema.optional(),
  durationMs: z.number().int().positive().optional(),
})

export const lightingPresetSchema = z.enum([
  'warmInterior',
  'coldMoonlight',
  'singleSpot',
  'silhouetteBacklight',
  'neonWash',
  'firelight',
  'blackout',
  'harshFluorescent',
])

export const lightingTransitionSchema = z.enum(['cut', 'fade', 'flicker'])

export const lightingDirectionSchema = z.object({
  preset: lightingPresetSchema,
  transition: lightingTransitionSchema,
  durationMs: z.number().int().positive().optional(),
})

export const musicActionSchema = z.enum(['start', 'swell', 'duck', 'stop', 'sting'])
export const musicStingerSchema = z.enum(['hit', 'riser', 'boom', 'chime', 'drone'])

export const musicDirectionSchema = z.object({
  action: musicActionSchema,
  mood: moodSchema.optional(),
  intensity: z.number().min(0).max(1).optional(),
  stinger: musicStingerSchema.optional(),
})

export const particleEffectSchema = z.enum([
  'dust',
  'rain',
  'embers',
  'smoke',
  'sparks',
  'snow',
  'none',
])

export const particleActionSchema = z.enum(['start', 'stop'])

export const particleDirectionSchema = z.object({
  effect: particleEffectSchema,
  density: z.number().min(0).max(1).optional(),
  action: particleActionSchema,
})

export const stageSlotSchema = z.enum(['farLeft', 'left', 'center', 'right', 'farRight'])
export const facingSchema = z.enum(['left', 'right', 'front'])
export const travelStyleSchema = z.enum(['walk', 'rush', 'creep', 'drift'])

export const movementSchema = z.object({
  characterId: characterIdSchema,
  to: stageSlotSchema,
  style: travelStyleSchema,
  facing: facingSchema.optional(),
})

/** Fields shared by every beat, regardless of type. */
const beatBaseSchema = z.object({
  id: z.string().min(1).max(40),
  holdMs: z.number().int().nonnegative().optional(),
  camera: cameraDirectionSchema.optional(),
  lighting: lightingDirectionSchema.optional(),
  music: musicDirectionSchema.optional(),
  particles: particleDirectionSchema.optional(),
  movements: z.array(movementSchema).optional(),
})

export const deliverySchema = z.enum(['flat', 'urgent', 'whisper', 'shout', 'wry', 'trembling'])

export const gestureSchema = z.enum([
  'point',
  'shrug',
  'step-forward',
  'recoil',
  'nod',
  'reach',
  'turn-away',
  'none',
])

export const titleBeatSchema = beatBaseSchema.extend({
  type: z.literal('title'),
  subtitle: z.string().max(80).optional(),
})

export const sluglineBeatSchema = beatBaseSchema.extend({
  type: z.literal('slugline'),
})

export const actionBeatSchema = beatBaseSchema.extend({
  type: z.literal('action'),
  text: z.string().min(1).max(240),
  narrate: z.boolean().optional(),
})

export const dialogueBeatSchema = beatBaseSchema.extend({
  type: z.literal('dialogue'),
  characterId: characterIdSchema,
  line: z.string().min(1).max(180),
  parenthetical: z.string().max(40).optional(),
  delivery: deliverySchema.optional(),
  gesture: gestureSchema.optional(),
})

export const pauseBeatSchema = beatBaseSchema.extend({
  type: z.literal('beat'),
  durationMs: z.number().int().positive(),
})

export const revealBeatSchema = beatBaseSchema.extend({
  type: z.literal('reveal'),
  text: z.string().max(120).optional(),
})

export const beatSchema = z.discriminatedUnion('type', [
  titleBeatSchema,
  sluglineBeatSchema,
  actionBeatSchema,
  dialogueBeatSchema,
  pauseBeatSchema,
  revealBeatSchema,
])

export const outroStyleSchema = z.enum(['cutToBlack', 'titleSlam', 'fadeOut', 'holdOnActor'])

export const outroSchema = z.object({
  style: outroStyleSchema,
  text: z.string().max(80).optional(),
})

export const sceneScriptSchema = z.object({
  version: z.literal('1.0'),
  title: z.string().min(1).max(40),
  genre: genreSchema,
  mood: moodSchema,
  scene: sceneHeaderSchema,
  cast: z.array(characterSchema).min(1).max(3),
  beats: z.array(beatSchema).min(4).max(12),
  outro: outroSchema.optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
