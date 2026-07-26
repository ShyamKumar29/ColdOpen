import { motionValue, type MotionValue } from 'framer-motion'
import { createCubicBezierEasing } from '@lib'
import { presets, reducedMotionPresets } from './presets'
import type { AnimationPreset, AnimationPresetName, PoseName } from './types'

export interface PoseTarget {
  scale: number
  translateY: number
}

export interface CharacterAnimationHandle {
  readonly opacity: MotionValue<number>
  readonly poseScale: MotionValue<number>
  readonly poseTranslateY: MotionValue<number>
  readonly pose: PoseName
}

/**
 * Every `now`/`startedAt` timestamp in this engine — the defaults below and
 * whatever `tick()` is called with — must come from the same clock:
 * `performance.now()`, not `Date.now()`. The React bridge hook drives
 * `tick()` off `requestAnimationFrame`, whose callback receives a
 * `performance.now()`-relative `DOMHighResTimeStamp` (small, since-navigation);
 * `Date.now()` is Unix-epoch-relative (13 digits). Mixing the two makes
 * `now - startedAt` permanently negative, which `Math.max(0, …)` silently
 * clamps to zero — every transition looks like it never started, with no
 * error anywhere (this is exactly what happened before it was caught: opacity
 * stuck at 0 forever, i.e. characters invisible, despite cues firing
 * correctly end to end).
 */
export interface AnimationEngine {
  /** Returns this character's animation handle, creating it (opacity 0, identity pose transform) on first use. */
  ensure(characterId: string): CharacterAnimationHandle
  /** Retargets the pose transition. No-op if already the current pose (CLAUDE.md — one active animation per property). */
  setPose(
    characterId: string,
    pose: PoseName,
    target: PoseTarget,
    reducedMotion: boolean,
    now?: number,
  ): void
  enter(characterId: string, reducedMotion: boolean, now?: number): void
  exit(characterId: string, reducedMotion: boolean, now?: number): void
  /**
   * Forgets a character's handle outright. Kept for API completeness and
   * exercised by `animationEngine.test.ts`, but nothing in production calls
   * it yet — `ActorLayer` keeps every roster member permanently mounted for
   * the lifetime of a scene (presence is opacity, not mount/unmount), so
   * there's currently no point at which a character needs to be forgotten.
   * A future milestone doing dynamic cast management (recasting mid-session,
   * a multi-scene queue) would call this to release a handle that will
   * never be `ensure()`d again.
   */
  remove(characterId: string): void
  /** Advances every in-flight transition to `now`. Call once per animation frame from the React bridge hook, passing its `requestAnimationFrame` timestamp directly. */
  tick(now: number): void
}

type Channel = 'opacity' | 'poseScale' | 'poseTranslateY'

interface Transition {
  readonly motion: MotionValue<number>
  readonly from: number
  readonly to: number
  readonly startedAt: number
  readonly durationMs: number
  readonly ease: (t: number) => number
}

interface CharacterHandle extends CharacterAnimationHandle {
  pose: PoseName
  readonly transitions: Partial<Record<Channel, Transition>>
}

// Module-level, not per-engine: an easing curve is pure math derived only
// from its control points (design/timing.ts's `easingCurves`), so caching it
// once and sharing across every `createAnimationEngine()` instance is safe —
// there is no per-instance state to leak between engines, only a handful of
// curves ever get cached, and today only one engine is ever constructed per
// session anyway.
const easingCache = new Map<string, (t: number) => number>()

function easingFor(preset: AnimationPreset): (t: number) => number {
  const key = preset.easing.join(',')
  const cached = easingCache.get(key)
  if (cached) return cached

  const ease = createCubicBezierEasing(...preset.easing)
  easingCache.set(key, ease)
  return ease
}

function presetFor(name: AnimationPresetName, reducedMotion: boolean): AnimationPreset {
  return reducedMotion ? reducedMotionPresets[name] : presets[name]
}

/**
 * Interpolates cast members between derived poses and enter/exit opacity
 * (docs/ARCHITECTURE.md section 4). Owns its `MotionValue`s directly, the
 * same ownership pattern ADR-017 established for the Camera Engine —
 * `MotionValue` has no React dependency, so this stays framework-independent.
 *
 * Deliberately driven by an explicit `tick(now)` rather than Framer's
 * imperative `animate()`: progress is a pure function of the timestamp it's
 * given, so the same sequence of `setPose`/`enter`/`exit` calls always
 * produces the same interpolation, and the engine is unit-testable in plain
 * Node with synthetic timestamps — no real animation frame required.
 */
export function createAnimationEngine(): AnimationEngine {
  const handles = new Map<string, CharacterHandle>()

  function ensure(characterId: string): CharacterHandle {
    const existing = handles.get(characterId)
    if (existing) return existing

    const handle: CharacterHandle = {
      opacity: motionValue(0),
      poseScale: motionValue(1),
      poseTranslateY: motionValue(0),
      pose: 'idle',
      transitions: {},
    }
    handles.set(characterId, handle)
    return handle
  }

  function startTransition(
    handle: CharacterHandle,
    channel: Channel,
    to: number,
    preset: AnimationPreset,
    now: number,
  ): void {
    const motion = handle[channel]
    handle.transitions[channel] = {
      motion,
      from: motion.get(),
      to,
      startedAt: now,
      durationMs: Math.max(preset.durationMs, 1),
      ease: easingFor(preset),
    }
  }

  function setPose(
    characterId: string,
    pose: PoseName,
    target: PoseTarget,
    reducedMotion: boolean,
    now = performance.now(),
  ): void {
    const handle = ensure(characterId)
    if (handle.pose === pose) return
    handle.pose = pose

    const preset = presetFor(`pose.${pose}`, reducedMotion)
    startTransition(handle, 'poseScale', target.scale, preset, now)
    startTransition(handle, 'poseTranslateY', target.translateY, preset, now)
  }

  function enter(characterId: string, reducedMotion: boolean, now = performance.now()): void {
    const handle = ensure(characterId)
    startTransition(handle, 'opacity', 1, presetFor('entrance.fadeIn', reducedMotion), now)
  }

  function exit(characterId: string, reducedMotion: boolean, now = performance.now()): void {
    const handle = ensure(characterId)
    startTransition(handle, 'opacity', 0, presetFor('exit.fadeOut', reducedMotion), now)
  }

  function remove(characterId: string): void {
    handles.delete(characterId)
  }

  function tick(now: number): void {
    // Walks every handle unconditionally rather than tracking a separate
    // "active" set — intentional, not an oversight. Cast size is capped at
    // three (ADR-012), so this is a handful of iterations per frame at most.
    // Revisit with an active-transition index only if that cap is ever
    // lifted.
    for (const handle of handles.values()) {
      for (const channel of ['opacity', 'poseScale', 'poseTranslateY'] as const) {
        const transition = handle.transitions[channel]
        if (!transition) continue

        const progress = Math.min(
          1,
          Math.max(0, (now - transition.startedAt) / transition.durationMs),
        )
        transition.motion.set(
          transition.from + (transition.to - transition.from) * transition.ease(progress),
        )

        if (progress >= 1) delete handle.transitions[channel]
      }
    }
  }

  return { ensure, setPose, enter, exit, remove, tick }
}
