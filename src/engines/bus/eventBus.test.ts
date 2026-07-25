import { describe, expect, it, vi } from 'vitest'
import { createEventBus } from './eventBus'

describe('EventBus', () => {
  it('round-trips a typed event to its subscriber', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.on('beat:enter', handler)
    bus.emit('beat:enter', { index: 3 })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ index: 3 })
  })

  it('stops delivering events after unsubscribe', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    const unsubscribe = bus.on('transport:play', handler)
    unsubscribe()
    bus.emit('transport:play', {})

    expect(handler).not.toHaveBeenCalled()
  })

  it('delivers a once() handler exactly one time', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.once('speech:end', handler)
    bus.emit('speech:end', { characterId: 'vera' })
    bus.emit('speech:end', { characterId: 'vera' })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('surfaces every emission to the wildcard tap', () => {
    const bus = createEventBus()
    const tapped: string[] = []

    bus.tap((event) => tapped.push(event.name))
    bus.emit('beat:enter', { index: 0 })
    bus.emit('beat:complete', { index: 0 })

    expect(tapped).toEqual(['beat:enter', 'beat:complete'])
  })
})
