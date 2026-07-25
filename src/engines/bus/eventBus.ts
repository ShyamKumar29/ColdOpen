import type {
  ColdOpenEventHandler,
  ColdOpenEventMap,
  ColdOpenEventName,
  EmittedEvent,
} from './types'

export type WildcardHandler = (event: EmittedEvent) => void

/**
 * Typed pub/sub event bus (docs/ARCHITECTURE.md section 4).
 *
 * Fire-and-forget only: handlers never return a value to the emitter
 * (CLAUDE.md Event Bus Rules). Framework-independent — no React import.
 */
export interface EventBus {
  emit<TName extends ColdOpenEventName>(name: TName, payload: ColdOpenEventMap[TName]): void
  on<TName extends ColdOpenEventName>(name: TName, handler: ColdOpenEventHandler<TName>): () => void
  once<TName extends ColdOpenEventName>(
    name: TName,
    handler: ColdOpenEventHandler<TName>,
  ): () => void
  off<TName extends ColdOpenEventName>(name: TName, handler: ColdOpenEventHandler<TName>): void
  /** Wildcard tap for the dev-mode cue log — observes every emission. */
  tap(handler: WildcardHandler): () => void
}

export function createEventBus(): EventBus {
  const handlers = new Map<ColdOpenEventName, Set<ColdOpenEventHandler<ColdOpenEventName>>>()
  const wildcardHandlers = new Set<WildcardHandler>()

  function on<TName extends ColdOpenEventName>(
    name: TName,
    handler: ColdOpenEventHandler<TName>,
  ): () => void {
    const set = handlers.get(name) ?? new Set()
    set.add(handler as ColdOpenEventHandler<ColdOpenEventName>)
    handlers.set(name, set)
    return () => off(name, handler)
  }

  function once<TName extends ColdOpenEventName>(
    name: TName,
    handler: ColdOpenEventHandler<TName>,
  ): () => void {
    const unsubscribe = on(name, (payload) => {
      unsubscribe()
      handler(payload)
    })
    return unsubscribe
  }

  function off<TName extends ColdOpenEventName>(
    name: TName,
    handler: ColdOpenEventHandler<TName>,
  ): void {
    handlers.get(name)?.delete(handler as ColdOpenEventHandler<ColdOpenEventName>)
  }

  function emit<TName extends ColdOpenEventName>(
    name: TName,
    payload: ColdOpenEventMap[TName],
  ): void {
    handlers.get(name)?.forEach((handler) => handler(payload))
    wildcardHandlers.forEach((handler) => handler({ name, payload }))
  }

  function tap(handler: WildcardHandler): () => void {
    wildcardHandlers.add(handler)
    return () => wildcardHandlers.delete(handler)
  }

  return { emit, on, once, off, tap }
}
