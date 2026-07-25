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
  'transport:restart': Record<string, never>
  'transport:skip': Record<string, never>
  'transport:complete': Record<string, never>

  'beat:enter': { index: number }
  'beat:cues-fired': { index: number }
  'beat:complete': { index: number }
  'beat:exit': { index: number }

  'speech:start': { characterId: string }
  'speech:boundary': { characterId: string; charIndex: number }
  'speech:end': { characterId: string }
  'speech:error': { characterId: string; message: string }
  'speech:unavailable': Record<string, never>

  'camera:move': { move: string; target?: string }
  'camera:shake': { intensity: number }
  'camera:reset': Record<string, never>

  'light:change': { preset: string; transition: string }
  'light:flicker': { preset: string }

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

  'subtitle:show': { characterId?: string; text: string }
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
