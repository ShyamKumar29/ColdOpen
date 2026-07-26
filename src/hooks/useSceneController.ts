import { useEffect, useState } from 'react'
import { createEventBus } from '@engines/bus'
import { createSceneController } from '@engines/controller'
import type { SceneController } from '@engines/controller'
import { createAnimationEngine } from '@engines/animation'
import type { AnimationEngine } from '@engines/animation'
import { createSpeechEngine } from '@engines/speech'
import type { SpeechEngine } from '@engines/speech'
import { poseTokens } from '@design'
import type { SceneScript } from '@schema'
import { useColdOpenStore } from '@store'

export interface SceneControllerBridge {
  controller: SceneController
  animations: AnimationEngine
  speech: SpeechEngine
}

/**
 * Bridges the Scene Controller and Animation Engine to the store and to
 * `<Stage>` (CLAUDE.md React Rules — "Hooks are the only bridge between
 * React and engines"). The bus, controller, and animation engine are
 * constructed once via lazy `useState` initializers and never recreated on
 * render.
 *
 * Transport controls call the returned `SceneController` directly. The
 * `AnimationEngine`'s `MotionValue`s never touch the store (CLAUDE.md State
 * Management Rules) — this hook only relays discrete `character:*` cues
 * into engine calls and drives its `tick()` off a `requestAnimationFrame`
 * loop; `<Actor>` reads the resulting `MotionValue`s directly.
 */
export function useSceneController(script: SceneScript | null): SceneControllerBridge {
  const [bus] = useState(() => createEventBus())
  const [speech] = useState(() => createSpeechEngine(bus))
  const [controller] = useState(() => createSceneController(bus, speech))
  const [animations] = useState(() => createAnimationEngine())

  const setPhase = useColdOpenStore((state) => state.setPhase)
  const setBeatIndex = useColdOpenStore((state) => state.setBeatIndex)
  const setElapsedMs = useColdOpenStore((state) => state.setElapsedMs)
  const setActiveCharacters = useColdOpenStore((state) => state.setActiveCharacters)
  const setCurrentSubtitle = useColdOpenStore((state) => state.setCurrentSubtitle)
  const setCurrentLighting = useColdOpenStore((state) => state.setCurrentLighting)
  const setClockSource = useColdOpenStore((state) => state.setClockSource)
  const reducedMotion = useColdOpenStore((state) => state.reducedMotion)

  useEffect(() => {
    const syncPhase = (): void => {
      setPhase(controller.getPhase())
      setClockSource(controller.getClockSource())
    }

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
        animations.enter(characterId, reducedMotion)
      }),
      bus.on('character:exit', ({ characterId }) => {
        const active = useColdOpenStore.getState().activeCharacters
        setActiveCharacters(active.filter((id) => id !== characterId))
        animations.exit(characterId, reducedMotion)
      }),
      bus.on('character:pose', ({ characterId, pose }) =>
        animations.setPose(characterId, pose, poseTokens[pose], reducedMotion),
      ),
      // Speech is triggered and settled here, not inside the Speech Engine
      // or Scene Controller themselves (ADR-022) — both engine factories are
      // called from a lazy `useState` initializer, which React StrictMode's
      // dev-mode double-invoke runs twice; a `bus.on(...)` performed inside
      // either factory would register two live handlers on the one shared
      // bus and speak every line twice. This `useEffect` already
      // subscribes/unsubscribes safely across StrictMode's mount → cleanup →
      // mount cycle, same as every cue above it.
      bus.on('speech:request', ({ characterId, line }) => speech.speak(characterId, line)),
      bus.on('speech:end', ({ characterId }) => controller.notifySpeechEnd(characterId)),
      bus.on('speech:error', ({ characterId }) => controller.notifySpeechError(characterId)),
      bus.on('speech:unavailable', () => {
        controller.notifySpeechUnavailable()
        syncPhase()
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
    animations,
    speech,
    reducedMotion,
    setPhase,
    setBeatIndex,
    setElapsedMs,
    setActiveCharacters,
    setCurrentSubtitle,
    setCurrentLighting,
    setClockSource,
  ])

  useEffect(() => {
    if (!script) return
    controller.load(script)
    setPhase(controller.getPhase())
    setActiveCharacters([])
    // Fire-and-forget: `castVoices` resolves asynchronously (it awaits the
    // browser's voice list). If `play()` fires before it resolves, the
    // first line(s) speak with the Speech Engine's default pitch/rate/voice
    // instead of their cast-derived values — an acceptable, graceful
    // fallback (not a stall or an error), not something worth blocking on.
    void speech.castVoices(script.cast)
  }, [script, controller, speech, setPhase, setActiveCharacters])

  useEffect(() => {
    let frame = requestAnimationFrame(function step(now) {
      animations.tick(now)
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [animations])

  useEffect(() => () => controller.destroy(), [controller])

  return { controller, animations, speech }
}
