import type { z } from 'zod'
import type {
  sceneScriptSchema,
  sceneHeaderSchema,
  characterSchema,
  genreSchema,
  moodSchema,
  beatSchema,
  titleBeatSchema,
  sluglineBeatSchema,
  actionBeatSchema,
  dialogueBeatSchema,
  pauseBeatSchema,
  revealBeatSchema,
  cameraDirectionSchema,
  cameraMoveSchema,
  cameraIntensitySchema,
  lightingDirectionSchema,
  lightingTransitionSchema,
  musicDirectionSchema,
  particleDirectionSchema,
  movementSchema,
  settingSchema,
  timeOfDaySchema,
  weatherSchema,
  lightingPresetSchema,
  stageSlotSchema,
  facingSchema,
  buildSchema,
  silhouetteAccentSchema,
  entranceSchema,
  characterIdSchema,
} from './sceneScript.schema'

export type SceneScript = z.infer<typeof sceneScriptSchema>
export type SceneHeader = z.infer<typeof sceneHeaderSchema>
export type Character = z.infer<typeof characterSchema>
export type Genre = z.infer<typeof genreSchema>
export type Mood = z.infer<typeof moodSchema>

export type Beat = z.infer<typeof beatSchema>
export type TitleBeat = z.infer<typeof titleBeatSchema>
export type SluglineBeat = z.infer<typeof sluglineBeatSchema>
export type ActionBeat = z.infer<typeof actionBeatSchema>
export type DialogueBeat = z.infer<typeof dialogueBeatSchema>
export type PauseBeat = z.infer<typeof pauseBeatSchema>
export type RevealBeat = z.infer<typeof revealBeatSchema>

export type CameraDirection = z.infer<typeof cameraDirectionSchema>
export type CameraMove = z.infer<typeof cameraMoveSchema>
export type CameraIntensity = z.infer<typeof cameraIntensitySchema>
export type LightingDirection = z.infer<typeof lightingDirectionSchema>
export type LightingTransition = z.infer<typeof lightingTransitionSchema>
export type MusicDirection = z.infer<typeof musicDirectionSchema>
export type ParticleDirection = z.infer<typeof particleDirectionSchema>
export type Movement = z.infer<typeof movementSchema>

export type Setting = z.infer<typeof settingSchema>
export type TimeOfDay = z.infer<typeof timeOfDaySchema>
export type Weather = z.infer<typeof weatherSchema>
export type LightingPreset = z.infer<typeof lightingPresetSchema>
export type StageSlot = z.infer<typeof stageSlotSchema>
export type Facing = z.infer<typeof facingSchema>
export type Build = z.infer<typeof buildSchema>
export type SilhouetteAccent = z.infer<typeof silhouetteAccentSchema>
export type Entrance = z.infer<typeof entranceSchema>
export type CharacterId = z.infer<typeof characterIdSchema>
