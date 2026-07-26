import type { CameraShot, CameraFocus } from '@engines/bus'
import type { CameraIntensity, CameraMove } from '@schema'
import { durations, easingCurves } from './timing'

/**
 * Art direction for the camera's derived framing vocabulary (CLAUDE.md JSON
 * Schema Rules — "the single source of truth for how enum values map to
 * visuals," extended here to the Camera Engine's own derived enums, the same
 * way `design/pose.ts` art-directs `CharacterPose`). `zoom` is a scale
 * multiplier on the whole `CameraFrame`; `y` is a vertical bias in percent
 * that shifts the frame down as shots get tighter, preserving headroom above
 * a silhouette's head instead of letting a push-in crop it; `x` is an
 * optional bias intrinsic to the shot itself (layered under the
 * focus-driven pan in `cameraEngine`'s `targetFor`), used so two-character
 * framings never sit perfectly symmetrical even when focus resolves to
 * `center`.
 */
export interface ShotFramingToken {
  zoom: number
  y: number
  x?: number
}

export const shotFramingTokens: Record<CameraShot, ShotFramingToken> = {
  wide: { zoom: 1.0, y: 0 },
  medium: { zoom: 1.05, y: 1 },
  twoShot: { zoom: 1.04, y: 0.8, x: 1.5 },
  overShoulder: { zoom: 1.1, y: 1.8, x: 2 },
  close: { zoom: 1.15, y: 2.5 },
  reveal: { zoom: 1.2, y: -0.6 },
}

/** Horizontal bias in percent, applied before the intensity multiplier — a mild rule-of-thirds nudge that favors the active speaker's side without pushing the listener out of frame. */
export const cameraFocusTokens: Record<CameraFocus, number> = {
  left: -8,
  center: 0,
  right: 8,
  wide: 0,
}

/** Scales both the pan/zoom magnitude and how "committed" a move reads. */
export const cameraIntensityTokens: Record<CameraIntensity, number> = {
  subtle: 0.6,
  normal: 1,
  dramatic: 1.5,
}

export interface CameraMoveToken {
  durationMs: number
  easing: readonly [number, number, number, number]
}

/**
 * Camera-only easing curves, distinct from `design/timing.ts`'s shared
 * `easingCurves` (which lighting and the Animation Engine also key off of —
 * tuning those would change character poses and lighting transitions too,
 * outside this pass's scope). `glide` settles into rest more gradually than
 * the shared `decelerate` curve, reading as an operator easing off a push-in
 * rather than a mechanical stop. `drift` softens the shared `standard`
 * curve's accelerate/decelerate symmetry for pans, so a reframe feels like
 * weighted camera inertia rather than a UI transition.
 */
const cameraEasingCurves = {
  glide: [0.16, 0.6, 0.3, 1],
  drift: [0.38, 0.04, 0.2, 1],
} as const

/**
 * Transition timing per named camera move (CLAUDE.md Animation Rules —
 * "named presets," never inlined per component). `move` decides pacing and
 * feel; `design/camera.ts`'s shot/focus tokens decide where the camera ends
 * up. A `static` beat still gets a (fast, negligible) transition rather than
 * a hard branch, so retargeting the same `MotionValue`s never needs special
 * casing.
 */
export const cameraMoveTokens: Record<CameraMove, CameraMoveToken> = {
  pushIn: { durationMs: durations.slow, easing: cameraEasingCurves.glide },
  pullBack: { durationMs: durations.slow, easing: cameraEasingCurves.drift },
  panLeft: { durationMs: durations.normal, easing: cameraEasingCurves.drift },
  panRight: { durationMs: durations.normal, easing: cameraEasingCurves.drift },
  whipPan: { durationMs: durations.fast, easing: easingCurves.standard },
  craneUp: { durationMs: durations.slow, easing: cameraEasingCurves.glide },
  dollyIn: { durationMs: durations.slow, easing: cameraEasingCurves.glide },
  handheld: { durationMs: durations.normal, easing: cameraEasingCurves.drift },
  static: { durationMs: durations.fast, easing: easingCurves.standard },
}

/**
 * `prefers-reduced-motion` degradation (CLAUDE.md Animation Rules — "camera
 * moves degrade to cuts"). Every move collapses to a near-zero-duration cut;
 * framing still updates correctly on the next `tick`, just without an
 * animated pan/zoom.
 */
const CUT_MS = 1
export const reducedCameraMoveTokens: Record<CameraMove, CameraMoveToken> = Object.fromEntries(
  Object.keys(cameraMoveTokens).map((move) => [
    move,
    { durationMs: CUT_MS, easing: easingCurves.standard },
  ]),
) as Record<CameraMove, CameraMoveToken>
