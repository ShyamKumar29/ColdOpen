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

  it('does not subscribe itself to the bus — construction has no side effects (ADR-022)', () => {
    const bus = createEventBus()
    const onSpy = vi.spyOn(bus, 'on')

    createSceneController(bus, { probeCapability: () => 'available', cancel: vi.fn() })

    expect(onSpy).not.toHaveBeenCalled()
  })

  it('stays on the timer clock when no speech adapter is supplied', () => {
    const bus = createEventBus()
    const controller = createSceneController(bus)
    controller.load(heistLibrary)
    controller.play()

    expect(controller.getClockSource()).toBe('timer')
  })

  it('stays on the timer clock when the speech adapter reports unavailable', () => {
    const bus = createEventBus()
    const speech = { probeCapability: () => 'unavailable' as const, cancel: vi.fn() }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()

    expect(controller.getClockSource()).toBe('timer')
  })

  it('waits for speech:end on a dialogue beat before advancing, when the speech clock is active', () => {
    const bus = createEventBus()
    const speech = { probeCapability: () => 'available' as const, cancel: vi.fn() }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()
    expect(controller.getClockSource()).toBe('speech')

    vi.runOnlyPendingTimers() // beat 0 (title) -> beat 1
    vi.runOnlyPendingTimers() // beat 1 (slugline) -> beat 2
    vi.runOnlyPendingTimers() // beat 2 (action) -> beat 3 (dialogue: vera)
    expect(controller.getBeatIndex()).toBe(3)

    vi.advanceTimersByTime(5000)
    expect(controller.getBeatIndex()).toBe(3)

    controller.notifySpeechEnd('someone-else')
    expect(controller.getBeatIndex()).toBe(3)

    controller.notifySpeechEnd('vera')
    expect(controller.getBeatIndex()).toBe(4)
  })

  it('advances a dialogue beat on speech:error too, without waiting for the watchdog', () => {
    const bus = createEventBus()
    const speech = { probeCapability: () => 'available' as const, cancel: vi.fn() }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()

    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    expect(controller.getBeatIndex()).toBe(3)

    controller.notifySpeechError('vera')
    expect(controller.getBeatIndex()).toBe(4)
  })

  it('completes the whole scene via the watchdog fallback when speech never responds', () => {
    const bus = createEventBus()
    const speech = { probeCapability: () => 'available' as const, cancel: vi.fn() }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()

    vi.runAllTimers()

    expect(controller.getPhase()).toBe('complete')
  })

  it('cancels stale speech when the watchdog force-advances a dialogue beat, so it cannot bleed into the next beat', () => {
    const bus = createEventBus()
    const cancel = vi.fn()
    const speech = { probeCapability: () => 'available' as const, cancel }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()

    vi.runOnlyPendingTimers() // beat 0 (title) -> beat 1
    vi.runOnlyPendingTimers() // beat 1 (slugline) -> beat 2
    vi.runOnlyPendingTimers() // beat 2 (action) -> beat 3 (dialogue: vera)
    expect(controller.getBeatIndex()).toBe(3)

    cancel.mockClear()
    vi.runOnlyPendingTimers() // speech never settles -> watchdog forces beat 3 -> beat 4 (dialogue: dez)
    expect(controller.getBeatIndex()).toBe(4)
    expect(cancel).toHaveBeenCalledTimes(1)

    // The abandoned beat's speaker settling late must not advance playback
    // again — the watchdog already cancelled it and moved on.
    controller.notifySpeechEnd('vera')
    expect(controller.getBeatIndex()).toBe(4)
  })

  it('falls back to the timer clock when speech:unavailable fires mid-scene', () => {
    const bus = createEventBus()
    const speech = { probeCapability: () => 'available' as const, cancel: vi.fn() }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()

    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    expect(controller.getBeatIndex()).toBe(3)
    expect(controller.getClockSource()).toBe('speech')

    controller.notifySpeechUnavailable()
    expect(controller.getClockSource()).toBe('timer')

    vi.runOnlyPendingTimers()
    expect(controller.getBeatIndex()).toBe(4)
  })

  it('pause() cancels in-flight speech when awaiting a dialogue beat', () => {
    const bus = createEventBus()
    const cancel = vi.fn()
    const speech = { probeCapability: () => 'available' as const, cancel }
    const controller = createSceneController(bus, speech)
    controller.load(heistLibrary)
    controller.play()

    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    expect(controller.getBeatIndex()).toBe(3)

    controller.pause()

    expect(cancel).toHaveBeenCalled()
    expect(controller.getPhase()).toBe('paused')
  })

  it('resume() re-fires only the speech:request cue for a paused dialogue beat, not the whole beat', () => {
    const bus = createEventBus()
    const speech = { probeCapability: () => 'available' as const, cancel: vi.fn() }
    const controller = createSceneController(bus, speech)
    const subtitleCalls = vi.fn()
    const speechRequests = vi.fn()
    bus.on('subtitle:show', subtitleCalls)
    bus.on('speech:request', speechRequests)

    controller.load(heistLibrary)
    controller.play()
    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    vi.runOnlyPendingTimers()
    expect(controller.getBeatIndex()).toBe(3)

    subtitleCalls.mockClear()
    speechRequests.mockClear()
    controller.pause()
    controller.resume()

    expect(speechRequests).toHaveBeenCalledTimes(1)
    expect(subtitleCalls).not.toHaveBeenCalled()
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
