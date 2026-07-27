import { useEffect, useRef, useState } from 'react'
import { createEventBus } from '@engines/bus'
import { createSceneController } from '@engines/controller'
import type { SceneController } from '@engines/controller'
import { createAnimationEngine } from '@engines/animation'
import type { AnimationEngine } from '@engines/animation'
import { createCameraEngine } from '@engines/camera'
import type { CameraRig } from '@engines/camera'
import { createSpeechEngine } from '@engines/speech'
import type { SpeechEngine } from '@engines/speech'
import { createMusicEngine } from '@engines/music'
import type { MusicCue, MusicEngine } from '@engines/music'
import { poseTokens } from '@design'
import type { SceneScript } from '@schema'
import { useColdOpenStore } from '@store'

export interface SceneControllerBridge {
  controller: SceneController
  animations: AnimationEngine
  camera: CameraRig
  speech: SpeechEngine
  music: MusicEngine
}

/**
 * Bridges the Scene Controller, Animation Engine, and Camera Engine to the
 * store and to `<Stage>` (CLAUDE.md React Rules — "Hooks are the only
 * bridge between React and engines"). All three are constructed once via
 * lazy `useState` initializers and never recreated on render.
 *
 * Transport controls call the returned `SceneController` directly. Neither
 * engine's `MotionValue`s ever touch the store (CLAUDE.md State Management
 * Rules) — this hook only relays discrete `character:*`/`camera:move` cues
 * into engine calls and drives both engines' `tick()` off one shared
 * `requestAnimationFrame` loop; `<Actor>`/`<CameraFrame>` read the resulting
 * `MotionValue`s directly.
 */
export function useSceneController(script: SceneScript | null): SceneControllerBridge {
  const [bus] = useState(() => createEventBus())
  const [speech] = useState(() => createSpeechEngine(bus))
  const [controller] = useState(() => createSceneController(bus, speech))
  const [animations] = useState(() => createAnimationEngine())
  const [camera] = useState(() => createCameraEngine())
  const [music] = useState(() => createMusicEngine())

  const setPhase = useColdOpenStore((state) => state.setPhase)
  const setBeatIndex = useColdOpenStore((state) => state.setBeatIndex)
  const setElapsedMs = useColdOpenStore((state) => state.setElapsedMs)
  const setActiveCharacters = useColdOpenStore((state) => state.setActiveCharacters)
  const setCurrentSubtitle = useColdOpenStore((state) => state.setCurrentSubtitle)
  const setCurrentLighting = useColdOpenStore((state) => state.setCurrentLighting)
  const setClockSource = useColdOpenStore((state) => state.setClockSource)
  const reducedMotion = useColdOpenStore((state) => state.reducedMotion)
  const muted = useColdOpenStore((state) => state.muted)
  const musicVolume = useColdOpenStore((state) => state.musicVolume)

  // `controller.load()` enters beat 0 to prime the stage's initial visual
  // state (lighting, camera, slugline) before Play is ever pressed (CLAUDE.md
  // "renderer consumes validated JSON only" doesn't cover transport timing,
  // but the Scene Controller's own contract does: "without starting the
  // clock"). Its opening `music:start` cue rides along on that same
  // `enterBeat`, so without this gate the Music Engine would produce audible
  // output the instant a scene loads. Stash the cue and apply it for real
  // only once `transport:play` actually fires — the Scene Controller remains
  // the sole authority that starts playback; this only delays when the
  // Music Engine is allowed to act on a cue it already received.
  const hasPlaybackStartedRef = useRef(false)
  const pendingStartCueRef = useRef<MusicCue | null>(null)

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
      bus.on('light:change', ({ preset, transition, durationMs }) =>
        setCurrentLighting(preset, transition, durationMs),
      ),
      bus.on('camera:move', (cue) => camera.applyMove(cue, reducedMotion)),
      bus.on('music:start', (cue) => {
        pendingStartCueRef.current = cue
        if (hasPlaybackStartedRef.current) music.applyStart(cue, reducedMotion)
      }),
      bus.on('music:mood', (cue) => music.applyMood(cue, reducedMotion)),
      bus.on('music:duck', ({ to }) => music.duck(to, reducedMotion)),
      bus.on('music:unduck', () => music.unduck(reducedMotion)),
      bus.on('music:sting', ({ stinger }) => music.sting(stinger)),
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
      bus.on('transport:play', () => {
        syncPhase()
        if (hasPlaybackStartedRef.current) {
          music.resume()
        } else {
          hasPlaybackStartedRef.current = true
          if (pendingStartCueRef.current) music.applyStart(pendingStartCueRef.current, reducedMotion)
        }
      }),
      bus.on('transport:pause', () => {
        syncPhase()
        music.pause()
      }),
      // The controller re-enters beat 0 (re-firing the `music:start` cue)
      // *before* emitting `transport:stop` — `music.stop()` here runs last
      // and wins, so playback stays silent. Rearming `hasPlaybackStartedRef`
      // makes the next `transport:play` treat this like a first play again,
      // reapplying that already-stashed `pendingStartCueRef` cue instead of
      // calling `music.resume()` on a transport that was fully stopped.
      bus.on('transport:stop', () => {
        syncPhase()
        music.stop()
        hasPlaybackStartedRef.current = false
      }),
      // `restart()` also re-enters beat 0 before emitting this event. When
      // playback had already started, that beat-0 `music:start` cue was
      // applied immediately (see the `music:start` handler below) and this
      // is a no-op; when it hadn't (e.g. restarting right after a Stop),
      // this is what actually (re)starts the score.
      bus.on('transport:restart', () => {
        syncPhase()
        if (!hasPlaybackStartedRef.current) {
          hasPlaybackStartedRef.current = true
          if (pendingStartCueRef.current) music.applyStart(pendingStartCueRef.current, reducedMotion)
        }
      }),
      bus.on('transport:complete', () => {
        syncPhase()
        music.fadeOutAndStop(reducedMotion)
        hasPlaybackStartedRef.current = false
      }),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [
    bus,
    controller,
    animations,
    camera,
    speech,
    music,
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
    hasPlaybackStartedRef.current = false
    pendingStartCueRef.current = null
    music.stop()
    controller.load(script)
    setPhase(controller.getPhase())
    setActiveCharacters([])
    // Fire-and-forget: `castVoices` resolves asynchronously (it awaits the
    // browser's voice list). If `play()` fires before it resolves, the
    // first line(s) speak with the Speech Engine's default pitch/rate/voice
    // instead of their cast-derived values — an acceptable, graceful
    // fallback (not a stall or an error), not something worth blocking on.
    void speech.castVoices(script.cast)
  }, [script, controller, speech, music, setPhase, setActiveCharacters])

  useEffect(() => {
    let frame = requestAnimationFrame(function step(now) {
      animations.tick(now)
      camera.tick(now)
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [animations, camera])

  useEffect(() => () => controller.destroy(), [controller])
  useEffect(() => () => music.stop(), [music])

  useEffect(() => {
    music.setMuted(muted)
  }, [music, muted])

  useEffect(() => {
    music.setUserVolume(musicVolume)
  }, [music, musicVolume])

  return { controller, animations, camera, speech, music }
}
