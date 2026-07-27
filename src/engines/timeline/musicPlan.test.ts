import { describe, expect, it } from 'vitest'
import type { SceneScript } from '@schema'
import { heistLibrary } from '@scenes'
import { deriveMusicPlan } from './musicPlan'

describe('deriveMusicPlan', () => {
  it('is deterministic — the same script derives the same plan twice', () => {
    const first = deriveMusicPlan(heistLibrary)
    const second = deriveMusicPlan(heistLibrary)

    expect(second).toEqual(first)
  })

  it('produces one plan entry per beat, in order', () => {
    const plan = deriveMusicPlan(heistLibrary)

    expect(plan).toHaveLength(heistLibrary.beats.length)
    plan.forEach((entry, index) => expect(entry.beatIndex).toBe(index))
  })

  it("always opens the scene on intro, regardless of the first beat's type", () => {
    const plan = deriveMusicPlan(heistLibrary)

    expect(plan[0]?.state).toBe('intro')
  })

  it('resolves to resolution on the closing beat when the outro is not cutToBlack', () => {
    const script: SceneScript = { ...heistLibrary, outro: { style: 'fadeOut' } }
    const plan = deriveMusicPlan(script)

    expect(plan[plan.length - 1]?.state).toBe('resolution')
  })

  it('resolves to silence on the closing beat when the outro cuts to black', () => {
    const plan = deriveMusicPlan(heistLibrary) // heistLibrary's outro.style is 'cutToBlack'

    expect(heistLibrary.outro?.style).toBe('cutToBlack')
    expect(plan[plan.length - 1]?.state).toBe('silence')
  })

  it('derives tension for a mid-scene pause beat', () => {
    const plan = deriveMusicPlan(heistLibrary)
    const pauseIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'beat')

    expect(plan[pauseIndex]?.state).toBe('tension')
  })

  it('derives climax for a mid-scene reveal beat, with a default hit stinger', () => {
    const script: SceneScript = {
      ...heistLibrary,
      outro: { style: 'fadeOut' },
      beats: [
        ...heistLibrary.beats.slice(0, -1),
        { ...heistLibrary.beats[heistLibrary.beats.length - 1]!, music: undefined },
        { id: 'b8-action', type: 'action', text: 'The room settles.' },
      ],
    }
    const revealIndex = script.beats.findIndex((beat) => beat.type === 'reveal')
    const plan = deriveMusicPlan(script)

    expect(plan[revealIndex]?.state).toBe('climax')
    expect(plan[revealIndex]?.stinger).toBe('hit')
  })

  it('honours an authored swell as climax on a non-boundary beat', () => {
    const swellIndex = heistLibrary.beats.findIndex((beat) => beat.music?.action === 'swell')
    const plan = deriveMusicPlan(heistLibrary)

    expect(swellIndex).toBeGreaterThan(0)
    expect(plan[swellIndex]?.state).toBe('climax')
    expect(plan[swellIndex]?.intensity).toBe(heistLibrary.beats[swellIndex]?.music?.intensity)
  })

  it('never lets an authored action override the opening or closing boundary state', () => {
    const script: SceneScript = {
      ...heistLibrary,
      beats: heistLibrary.beats.map((beat, index) =>
        index === 0 ? { ...beat, music: { action: 'swell' } } : beat,
      ),
    }
    const plan = deriveMusicPlan(script)

    expect(plan[0]?.state).toBe('intro')
  })

  it('honours an authored mood override independent of the scene mood', () => {
    const script: SceneScript = {
      ...heistLibrary,
      beats: heistLibrary.beats.map((beat, index) =>
        index === 2 ? { ...beat, music: { action: 'start', mood: 'triumphant' } } : beat,
      ),
    }
    const plan = deriveMusicPlan(script)

    expect(plan[2]?.mood).toBe('triumphant')
    expect(plan[0]?.mood).toBe(heistLibrary.mood)
  })

  it('falls back to the scene mood when a beat authors no music direction', () => {
    const plan = deriveMusicPlan(heistLibrary)

    expect(plan[1]?.mood).toBe(heistLibrary.mood)
  })
})
