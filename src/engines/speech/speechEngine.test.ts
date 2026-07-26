import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEventBus } from '@engines/bus'
import { heistLibrary } from '@scenes'
import { createSpeechEngine } from './speechEngine'
import type { SpeechAdapter, SpeechAdapterHandlers, SpeechAdapterRequest } from './types'

interface RecordedCall {
  request: SpeechAdapterRequest
  handlers: SpeechAdapterHandlers
}

function createFakeAdapter(supported = true) {
  const calls: RecordedCall[] = []
  let cancelCount = 0

  const adapter: SpeechAdapter = {
    isSupported: () => supported,
    loadVoices: () =>
      Promise.resolve([
        { id: 'v1', name: 'Voice1', lang: 'en-US' },
        { id: 'v2', name: 'Voice2', lang: 'en-US' },
      ]),
    speak: (request, handlers) => {
      calls.push({ request, handlers })
    },
    cancel: () => {
      cancelCount += 1
    },
  }

  return { adapter, calls, getCancelCount: () => cancelCount }
}

describe('createSpeechEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits speech:start then speech:end for a single-sentence line', () => {
    const bus = createEventBus()
    const { adapter, calls } = createFakeAdapter()
    const engine = createSpeechEngine(bus, adapter)

    const onStart = vi.fn()
    const onEnd = vi.fn()
    bus.on('speech:start', onStart)
    bus.on('speech:end', onEnd)

    engine.speak('vera', 'Touch nothing else.')
    expect(calls).toHaveLength(1)
    expect(engine.getState()).toBe('idle')

    calls[0]?.handlers.onStart()
    expect(onStart).toHaveBeenCalledWith({ characterId: 'vera' })
    expect(engine.getState()).toBe('speaking')

    calls[0]?.handlers.onEnd()
    expect(onEnd).toHaveBeenCalledWith({ characterId: 'vera' })
    expect(engine.getState()).toBe('idle')
  })

  it('speaks a multi-sentence line as a queue, one chunk at a time', () => {
    const bus = createEventBus()
    const { adapter, calls } = createFakeAdapter()
    const engine = createSpeechEngine(bus, adapter)
    const onEnd = vi.fn()
    bus.on('speech:end', onEnd)

    engine.speak('vera', 'Wait here. Watch the door.')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.request.text).toBe('Wait here.')

    calls[0]?.handlers.onEnd()
    expect(onEnd).not.toHaveBeenCalled()
    expect(calls).toHaveLength(2)
    expect(calls[1]?.request.text).toBe('Watch the door.')

    calls[1]?.handlers.onEnd()
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('emits speech:error and stops the queue when a chunk errors', () => {
    const bus = createEventBus()
    const { adapter, calls } = createFakeAdapter()
    const engine = createSpeechEngine(bus, adapter)
    const onError = vi.fn()
    const onEnd = vi.fn()
    bus.on('speech:error', onError)
    bus.on('speech:end', onEnd)

    engine.speak('dez', 'What if someone hears us? Then we run.')
    calls[0]?.handlers.onError('boom')

    expect(onError).toHaveBeenCalledWith({ characterId: 'dez', message: 'boom' })
    expect(onEnd).not.toHaveBeenCalled()
    expect(calls).toHaveLength(1)
    expect(engine.getState()).toBe('idle')
  })

  it('cancel() stops speech without emitting speech:end', () => {
    const bus = createEventBus()
    const { adapter, calls, getCancelCount } = createFakeAdapter()
    const engine = createSpeechEngine(bus, adapter)
    const onEnd = vi.fn()
    bus.on('speech:end', onEnd)

    engine.speak('vera', 'Touch nothing else.')
    calls[0]?.handlers.onStart()
    engine.cancel()

    expect(getCancelCount()).toBe(1)
    expect(onEnd).not.toHaveBeenCalled()
    expect(engine.getState()).toBe('idle')
  })

  it('forces the chunk to settle via a watchdog if onEnd never fires', () => {
    const bus = createEventBus()
    const { adapter, calls } = createFakeAdapter()
    const engine = createSpeechEngine(bus, adapter)
    const onEnd = vi.fn()
    bus.on('speech:end', onEnd)

    engine.speak('vera', 'Touch nothing else.')
    calls[0]?.handlers.onStart()

    vi.runAllTimers()

    expect(onEnd).toHaveBeenCalledWith({ characterId: 'vera' })
  })

  it('reports unavailable and immediately errors when the adapter is unsupported', () => {
    const bus = createEventBus()
    const { adapter } = createFakeAdapter(false)
    const engine = createSpeechEngine(bus, adapter)
    const onUnavailable = vi.fn()
    const onError = vi.fn()
    bus.on('speech:unavailable', onUnavailable)
    bus.on('speech:error', onError)

    engine.speak('vera', 'Touch nothing else.')

    expect(onUnavailable).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith({ characterId: 'vera', message: 'speech unavailable' })
    expect(engine.probeCapability()).toBe('unavailable')
  })

  it('does not subscribe itself to the bus — construction has no side effects (ADR-022)', () => {
    const bus = createEventBus()
    const { adapter, calls } = createFakeAdapter()
    createSpeechEngine(bus, adapter)

    bus.emit('speech:request', { characterId: 'dez', line: 'What if someone hears us?' })

    expect(calls).toHaveLength(0)
  })

  it('castVoices assigns distinct pitch/rate per character to subsequent speak() calls', async () => {
    const bus = createEventBus()
    const { adapter, calls } = createFakeAdapter()
    const engine = createSpeechEngine(bus, adapter)

    await engine.castVoices(heistLibrary.cast)
    engine.speak('vera', 'Touch nothing else.')
    engine.speak('dez', 'What if someone hears us?')

    expect(calls[0]?.request.pitch).not.toBe(calls[1]?.request.pitch)
  })
})
