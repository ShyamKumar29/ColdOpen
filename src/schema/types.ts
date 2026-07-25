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
  lightingDirectionSchema,
  musicDirectionSchema,
  particleDirectionSchema,
  movementSchema,
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
export type LightingDirection = z.infer<typeof lightingDirectionSchema>
export type MusicDirection = z.infer<typeof musicDirectionSchema>
export type ParticleDirection = z.infer<typeof particleDirectionSchema>
export type Movement = z.infer<typeof movementSchema>
