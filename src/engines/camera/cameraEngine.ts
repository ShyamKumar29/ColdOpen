import { motionValue, type MotionValue } from 'framer-motion'
import {
  cameraFocusTokens,
  cameraIntensityTokens,
  cameraMoveTokens,
  reducedCameraMoveTokens,
  shotFramingTokens,
} from '@design'
import type { CameraMoveToken } from '@design'
import { createCubicBezierEasing } from '@lib'
import type { CameraMoveCue } from './types'

export interface CameraRig {
  readonly x: MotionValue<number>
  readonly y: MotionValue<number>
  readonly zoom: MotionValue<number>
  /** Retargets the camera at a resolved `camera:move` cue. No-op if the cue is identical to the last one applied (CLAUDE.md Event Bus Rules — idempotent handlers). */
  applyMove(cue: CameraMoveCue, reducedMotion: boolean, now?: number): void
  /** Advances every in-flight transition to `now`. Call once per animation frame. */
  tick(now: number): void
}

type Channel = 'x' | 'y' | 'zoom'

interface Transition {
  readonly motion: MotionValue<number>
  readonly from: number
  readonly to: number
  readonly startedAt: number
  readonly durationMs: number
  readonly ease: (t: number) => number
}

// Shared with the Animation Engine's identical cache-by-control-points
// strategy (engines/animation/animationEngine.ts) — an easing curve is pure
// math, safe to share across every engine instance in a session.
const easingCache = new Map<string, (t: number) => number>()

function easingFor(token: CameraMoveToken): (t: number) => number {
  const key = token.easing.join(',')
  const cached = easingCache.get(key)
  if (cached) return cached

  const ease = createCubicBezierEasing(...token.easing)
  easingCache.set(key, ease)
  return ease
}

function targetFor(cue: CameraMoveCue): { x: number; y: number; zoom: number } {
  const framing = shotFramingTokens[cue.shot]
  const magnitude = cameraIntensityTokens[cue.intensity]
  return {
    x: (cameraFocusTokens[cue.focus] + (framing.x ?? 0)) * magnitude,
    y: framing.y * magnitude,
    zoom: framing.zoom,
  }
}

/**
 * The virtual camera (docs/ARCHITECTURE.md section 4): `x`/`y`/`zoom` as
 * `MotionValue`s, retargeted by resolved `camera:move` cues rather than
 * reasoning about characters or beats itself — the Timeline Compiler has
 * already turned "push in on the speaker" into concrete framing (ADR-024).
 *
 * Owns its `MotionValue`s directly (ADR-017's ownership pattern) and is
 * driven by an explicit `tick(now)` step rather than Framer's imperative
 * `animate()`, the same reasoning and shape as the Milestone 3 Animation
 * Engine (ADR-020): progress is a pure function of the timestamp given, so
 * this stays unit-testable in plain Node with synthetic timestamps.
 */
export function createCameraEngine(): CameraRig {
  const x = motionValue(0)
  const y = motionValue(0)
  const zoom = motionValue(shotFramingTokens.wide.zoom)
  const transitions: Partial<Record<Channel, Transition>> = {}
  let lastCue: CameraMoveCue | null = null

  function startTransition(
    channel: Channel,
    motion: MotionValue<number>,
    to: number,
    token: CameraMoveToken,
    now: number,
  ): void {
    transitions[channel] = {
      motion,
      from: motion.get(),
      to,
      startedAt: now,
      durationMs: Math.max(token.durationMs, 1),
      ease: easingFor(token),
    }
  }

  function applyMove(cue: CameraMoveCue, reducedMotion: boolean, now = performance.now()): void {
    // Deliberately excludes `durationMs` from the equality check: no beat in
    // this codebase re-authors an identical move/shot/focus/intensity cue
    // with only a different explicit `durationMs`, and treating such a cue
    // as "the same move" is the correct behavior if one ever does (the
    // camera is already at the resolved framing; a second identical retarget
    // has nothing to animate regardless of the duration it's asked to take).
    if (
      lastCue &&
      lastCue.move === cue.move &&
      lastCue.shot === cue.shot &&
      lastCue.focus === cue.focus &&
      lastCue.intensity === cue.intensity
    ) {
      return
    }
    lastCue = cue

    const target = targetFor(cue)
    const tokenTable = reducedMotion ? reducedCameraMoveTokens : cameraMoveTokens
    const token: CameraMoveToken = {
      durationMs: cue.durationMs ?? tokenTable[cue.move].durationMs,
      easing: tokenTable[cue.move].easing,
    }

    startTransition('x', x, target.x, token, now)
    startTransition('y', y, target.y, token, now)
    startTransition('zoom', zoom, target.zoom, token, now)
  }

  function tick(now: number): void {
    for (const channel of ['x', 'y', 'zoom'] as const) {
      const transition = transitions[channel]
      if (!transition) continue

      const progress = Math.min(
        1,
        Math.max(0, (now - transition.startedAt) / transition.durationMs),
      )
      transition.motion.set(
        transition.from + (transition.to - transition.from) * transition.ease(progress),
      )

      if (progress >= 1) delete transitions[channel]
    }
  }

  return { x, y, zoom, applyMove, tick }
}
