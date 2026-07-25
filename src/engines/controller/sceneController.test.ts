import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEventBus } from '@engines/bus'
import { heistLibrary } from '@scenes'
import { createSceneController } from './sceneController'

describe('SceneController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('enters beat 0 on load without starting playback', () => {
    const bus = createEventBus()
    const onBeatEnter = vi.fn()
    bus.on('beat:enter', onBeatEnter)

    const controller = createSceneController(bus)
    controller.load(heistLibrary)

    expect(controller.getPhase()).toBe('ready')
    expect(controller.getBeatIndex()).toBe(0)
    expect(onBeatEnter).toHaveBeenCalledWith({ index: 0 })
  })

  it('advances through every beat and reaches complete', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)

    controller.play()
    expect(controller.getPhase()).toBe('playing')

    for (let i = 0; i < heistLibrary.beats.length; i += 1) {
      vi.runOnlyPendingTimers()
    }

    expect(controller.getPhase()).toBe('complete')
    expect(controller.getBeatIndex()).toBe(heistLibrary.beats.length - 1)
  })

  it('pauses and resumes without skipping or repeating a beat', () => {
    const bus = createEventBus()
    const beatEnters: number[] = []
    bus.on('beat:enter', ({ index }) => beatEnters.push(index))

    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    beatEnters.length = 0
    controller.play()

    vi.advanceTimersByTime(500)
    controller.pause()
    expect(controller.getPhase()).toBe('paused')

    vi.advanceTimersByTime(10_000)
    expect(beatEnters).toEqual([])

    controller.resume()
    expect(controller.getPhase()).toBe('playing')
    vi.runOnlyPendingTimers()
    expect(beatEnters).toEqual([1])
  })

  it('stop() clears the timer and returns to beat 0 as ready', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    controller.play()
    vi.runOnlyPendingTimers()

    controller.stop()

    expect(controller.getPhase()).toBe('ready')
    expect(controller.getBeatIndex()).toBe(0)

    vi.advanceTimersByTime(60_000)
    expect(controller.getBeatIndex()).toBe(0)
  })

  it('restart() jumps to beat 0 and starts playing', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    controller.play()
    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()

    controller.restart()

    expect(controller.getPhase()).toBe('playing')
    expect(controller.getBeatIndex()).toBe(0)
  })

  it('seek() jumps directly to a beat and fires its cues', () => {
    const bus = createEventBus()
    const onSubtitle = vi.fn()
    bus.on('subtitle:show', onSubtitle)

    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    onSubtitle.mockClear()

    controller.seek(3)

    expect(controller.getBeatIndex()).toBe(3)
    expect(onSubtitle).toHaveBeenCalled()
  })

  it('seek() while paused jumps beats and stays paused without arming a timer', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    controller.play()
    vi.advanceTimersByTime(500)
    controller.pause()

    controller.seek(3)

    expect(controller.getPhase()).toBe('paused')
    expect(controller.getBeatIndex()).toBe(3)

    const beatEnters: number[] = []
    bus.on('beat:enter', ({ index }) => beatEnters.push(index))
    vi.advanceTimersByTime(60_000)
    expect(beatEnters).toEqual([])
  })

  it('pause() immediately followed by stop() returns to beat 0 as ready', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    controller.play()
    vi.advanceTimersByTime(500)

    controller.pause()
    controller.stop()

    expect(controller.getPhase()).toBe('ready')
    expect(controller.getBeatIndex()).toBe(0)

    const beatEnters: number[] = []
    bus.on('beat:enter', ({ index }) => beatEnters.push(index))
    vi.advanceTimersByTime(60_000)
    expect(beatEnters).toEqual([])
  })

  it('getElapsedMs() accumulates completed-beat durations only', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)

    expect(controller.getElapsedMs()).toBe(0)

    controller.play()
    vi.runOnlyPendingTimers()

    expect(controller.getElapsedMs()).toBeGreaterThan(0)
  })

  it('destroy() clears any pending timer', () => {
    const bus = createEventBus()
    const beatEnters: number[] = []
    bus.on('beat:enter', ({ index }) => beatEnters.push(index))

    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    beatEnters.length = 0
    controller.play()

    controller.destroy()
    vi.advanceTimersByTime(60_000)

    expect(beatEnters).toEqual([])
  })
})
