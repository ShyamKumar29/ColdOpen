import { useEffect, useState } from 'react'
import { createCharacterEngine } from '@engines/character'
import type { SceneScript } from '@schema'
import { useColdOpenStore } from '@store'

/**
 * Bridges the Character Engine to the store (CLAUDE.md React Rules — "Hooks
 * are the only bridge between React and engines"). The lazy `useState`
 * initializer constructs the engine exactly once; it is never recreated on
 * render.
 */
export function useCastRoster(script: SceneScript | null): void {
  const [engine] = useState(() => createCharacterEngine())
  const setRoster = useColdOpenStore((state) => state.setRoster)

  useEffect(() => {
    setRoster(script ? engine.register(script.cast) : [])
  }, [script, engine, setRoster])
}
