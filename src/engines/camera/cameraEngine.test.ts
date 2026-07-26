import { describe, expect, it } from 'vitest'
import { durations, shotFramingTokens, cameraFocusTokens } from '@design'
import type { CameraMoveCue } from './types'
import { createCameraEngine } from './cameraEngine'

const closeOnRight: CameraMoveCue = {
  move: 'pushIn',
  shot: 'close',
  focus: 'right',
  intensity: 'normal',
}

describe('createCameraEngine', () => {
  it('starts at a neutral wide framing', () => {
    const camera = createCameraEngine()

    expect(camera.x.get()).toBe(0)
    expect(camera.y.get()).toBe(0)
    expect(camera.zoom.get()).toBe(shotFramingTokens.wide.zoom)
  })

  it('interpolates zoom/x toward the cue target over the move preset duration, deterministically', () => {
    const camera = createCameraEngine()

    camera.applyMove(closeOnRight, false, 0)
    camera.tick(0)
    expect(camera.zoom.get()).toBe(shotFramingTokens.wide.zoom)

    camera.tick(durations.slow / 2)
    const midway = camera.zoom.get()
    expect(midway).toBeGreaterThan(shotFramingTokens.wide.zoom)
    expect(midway).toBeLessThan(shotFramingTokens.close.zoom)

    camera.tick(durations.slow)
    expect(camera.zoom.get()).toBe(shotFramingTokens.close.zoom)
    expect(camera.x.get()).toBe(cameraFocusTokens.right)
  })

  it('is a pure function of the timestamps given — replaying the same calls produces the same result', () => {
    const run = () => {
      const camera = createCameraEngine()
      camera.applyMove(closeOnRight, false, 0)
      camera.tick(400)
      return { x: camera.x.get(), zoom: camera.zoom.get() }
    }

    expect(run()).toEqual(run())
  })

  it('is a no-op when the cue is identical to the last one applied', () => {
    const camera = createCameraEngine()

    camera.applyMove(closeOnRight, false, 0)
    camera.tick(durations.slow)
    expect(camera.zoom.get()).toBe(shotFramingTokens.close.zoom)

    camera.applyMove(closeOnRight, false, durations.slow)
    camera.tick(durations.slow + 1)
    expect(camera.zoom.get()).toBe(shotFramingTokens.close.zoom)
  })

  it('reduced motion reaches the target framing sooner than full motion', () => {
    const full = createCameraEngine()
    const reduced = createCameraEngine()

    full.applyMove(closeOnRight, false, 0)
    reduced.applyMove(closeOnRight, true, 0)

    full.tick(2)
    reduced.tick(2)

    expect(reduced.zoom.get()).toBe(shotFramingTokens.close.zoom)
    expect(full.zoom.get()).toBeLessThan(shotFramingTokens.close.zoom)
  })

  it('honours an explicit durationMs over the move preset default', () => {
    const camera = createCameraEngine()

    camera.applyMove({ ...closeOnRight, durationMs: 40 }, false, 0)
    camera.tick(40)

    expect(camera.zoom.get()).toBe(shotFramingTokens.close.zoom)
  })
})
