import type { CameraIntensity, CameraMove, LightingPreset, LightingTransition } from '@schema'

/**
 * A character's derived, runtime-only performance state — never schema
 * data (docs/DECISIONS.md ADR-019). Owned here since the bus is the
 * taxonomy's single source of truth; `engines/character` and
 * `engines/animation` both import it rather than redeclaring it.
 */
export type CharacterPose = 'idle' | 'speaking' | 'listening' | 'surprised' | 'thinking'

/**
 * The camera's derived framing vocabulary — never schema data, same
 * reasoning as `CharacterPose` (docs/DECISIONS.md ADR-024). `CameraShot` is
 * how tight the frame is; `CameraFocus` is which side of the stage it's
 * centered on. Both are computed per beat by the Timeline Compiler from
 * scene state (active speaker, cast size, reveal moments) and consumed by
 * the Camera Engine, which never reasons about characters or beats itself.
 */
export type CameraShot = 'wide' | 'medium' | 'close' | 'twoShot' | 'overShoulder' | 'reveal'
export type CameraFocus = 'left' | 'center' | 'right' | 'wide'

/**
 * Event taxonomy for the Cold Open event bus (docs/ARCHITECTURE.md section 8).
 *
 * Naming convention is strictly `domain:verb` (CLAUDE.md Event Bus Rules).
 * Payloads below are the minimal shapes needed for the bus itself to
 * compile and be type-checked end-to-end; each engine refines its own
 * event payloads further as it is implemented in later milestones.
 */
export interface ColdOpenEventMap {
  'scene:requested': { premise: string }
  'scene:generated': { raw: unknown }
  'scene:validated': { sceneId: string }
  'scene:failed': { reason: string }
  'scene:compiled': { cueCount: number }
  'scene:ready': { sceneId: string }

  'transport:play': Record<string, never>
  'transport:pause': Record<string, never>
  'transport:stop': Record<string, never>
  'transport:restart': Record<string, never>
  'transport:complete': Record<string, never>

  'beat:enter': { index: number }
  'beat:cues-fired': { index: number }
  'beat:complete': { index: number }
  'beat:exit': { index: number }

  /** Controller -> Speech: the only cue that starts an utterance (docs/ARCHITECTURE.md section 8 sequence diagram). */
  'speech:request': { characterId: string; line: string }
  'speech:start': { characterId: string }
  'speech:boundary': { characterId: string; charIndex: number }
  'speech:end': { characterId: string }
  'speech:error': { characterId: string; message: string }
  'speech:unavailable': Record<string, never>

  /** The only cue that retargets the camera (one authoritative emitter, docs/ARCHITECTURE.md section 8). Fully resolved by the Timeline Compiler — the Camera Engine never looks up a character or beat itself. */
  'camera:move': {
    move: CameraMove
    shot: CameraShot
    focus: CameraFocus
    intensity: CameraIntensity
    durationMs?: number
  }
  'camera:shake': { intensity: number }
  'camera:reset': Record<string, never>

  'light:change': { preset: LightingPreset; transition: LightingTransition; durationMs?: number }
  'light:flicker': { preset: LightingPreset }

  'music:start': { mood: string }
  'music:mood': { mood: string }
  'music:duck': { to: number }
  'music:unduck': Record<string, never>
  'music:sting': { stinger: string }
  'music:stop': Record<string, never>

  'character:enter': { characterId: string }
  'character:move': { characterId: string; to: string }
  'character:gesture': { characterId: string; gesture: string }
  'character:exit': { characterId: string }
  'character:mouth': { characterId: string; open: boolean }
  'character:pose': { characterId: string; pose: CharacterPose }

  'subtitle:show': { characterId?: string; text: string; parenthetical?: string }
  'subtitle:hide': Record<string, never>
  'subtitle:slugline': { text: string }

  'particle:start': { effect: string; density?: number }
  'particle:stop': { effect: string }

  'fx:flash': Record<string, never>
  'fx:cut-to-black': Record<string, never>
  'fx:grain': { intensity: number }
}

export type ColdOpenEventName = keyof ColdOpenEventMap

export type ColdOpenEventHandler<TName extends ColdOpenEventName> = (
  payload: ColdOpenEventMap[TName],
) => void

/** A single recorded emission, as surfaced to the dev-mode cue log. */
export interface EmittedEvent<TName extends ColdOpenEventName = ColdOpenEventName> {
  name: TName
  payload: ColdOpenEventMap[TName]
}
