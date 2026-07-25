import { useEffect, useState } from 'react'
import { createEventBus } from '@engines/bus'
import { createSceneController } from '@engines/controller'
import type { SceneController } from '@engines/controller'
import type { SceneScript } from '@schema'
import { useColdOpenStore } from '@store'

/**
 * Bridges the Scene Controller to the store (CLAUDE.md React Rules — "Hooks
 * are the only bridge between React and engines"). The bus and controller
 * are constructed once via lazy `useState` initializers and never
 * recreated on render.
 *
 * Transport controls call the returned `SceneController` directly; this
 * hook's only job is keeping the store's playback/presentation slices in
 * sync with what the controller emits on the bus.
 */
export function useSceneController(script: SceneScript | null): SceneController {
  const [bus] = useState(() => createEventBus())
  const [controller] = useState(() => createSceneController(bus))

  const setPhase = useColdOpenStore((state) => state.setPhase)
  const setBeatIndex = useColdOpenStore((state) => state.setBeatIndex)
  const setElapsedMs = useColdOpenStore((state) => state.setElapsedMs)
  const setActiveCharacters = useColdOpenStore((state) => state.setActiveCharacters)
  const setCurrentSubtitle = useColdOpenStore((state) => state.setCurrentSubtitle)
  const setCurrentLighting = useColdOpenStore((state) => state.setCurrentLighting)

  useEffect(() => {
    const syncPhase = (): void => setPhase(controller.getPhase())

    const unsubscribers = [
      bus.on('beat:enter', ({ index }) => {
        setBeatIndex(index)
        setElapsedMs(controller.getElapsedMs())
      }),
      bus.on('subtitle:show', ({ characterId, text, parenthetical }) =>
        setCurrentSubtitle({ kind: 'line', characterId, text, parenthetical }),
      ),
      bus.on('subtitle:hide', () => setCurrentSubtitle(null)),
      bus.on('subtitle:slugline', ({ text }) => setCurrentSubtitle({ kind: 'slugline', text })),
      bus.on('light:change', ({ preset }) => setCurrentLighting(preset)),
      bus.on('character:enter', ({ characterId }) => {
        const active = useColdOpenStore.getState().activeCharacters
        if (!active.includes(characterId)) setActiveCharacters([...active, characterId])
      }),
      bus.on('character:exit', ({ characterId }) => {
        const active = useColdOpenStore.getState().activeCharacters
        setActiveCharacters(active.filter((id) => id !== characterId))
      }),
      bus.on('transport:play', syncPhase),
      bus.on('transport:pause', syncPhase),
      bus.on('transport:stop', syncPhase),
      bus.on('transport:restart', syncPhase),
      bus.on('transport:complete', syncPhase),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [
    bus,
    controller,
    setPhase,
    setBeatIndex,
    setElapsedMs,
    setActiveCharacters,
    setCurrentSubtitle,
    setCurrentLighting,
  ])

  useEffect(() => {
    if (!script) return
    controller.load(script)
    setPhase(controller.getPhase())
    setActiveCharacters([])
  }, [script, controller, setPhase, setActiveCharacters])

  useEffect(() => () => controller.destroy(), [controller])

  return controller
}
