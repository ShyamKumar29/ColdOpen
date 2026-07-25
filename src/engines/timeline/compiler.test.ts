import { describe, expect, it } from 'vitest'
import type { SceneScript } from '@schema'
import { heistLibrary } from '@scenes'
import { compileTimeline } from './compiler'

describe('compileTimeline', () => {
  it('produces one compiled beat per script beat, in order', () => {
    const timeline = compileTimeline(heistLibrary)

    expect(timeline).toHaveLength(heistLibrary.beats.length)
    expect(timeline.map((beat) => beat.id)).toEqual(heistLibrary.beats.map((beat) => beat.id))
    expect(timeline.map((beat) => beat.index)).toEqual(heistLibrary.beats.map((_, i) => i))
  })

  it('is deterministic — the same script compiles to the same timeline twice', () => {
    const first = compileTimeline(heistLibrary)
    const second = compileTimeline(heistLibrary)

    expect(second).toEqual(first)
  })

  it('gives every beat a positive duration', () => {
    const timeline = compileTimeline(heistLibrary)

    for (const beat of timeline) {
      expect(beat.durationMs).toBeGreaterThan(0)
    }
  })

  it('honours an explicit pause beat duration plus its holdMs', () => {
    const timeline = compileTimeline(heistLibrary)
    const pauseBeat = heistLibrary.beats.findIndex((beat) => beat.type === 'beat')
    const source = heistLibrary.beats[pauseBeat]
    const compiled = timeline[pauseBeat]
    if (!source || !compiled || source.type !== 'beat') throw new Error('expected a pause beat')

    expect(compiled.durationMs).toBe(source.durationMs + (source.holdMs ?? 0))
  })

  it('emits a subtitle:show cue carrying the speaker and line for a dialogue beat', () => {
    const timeline = compileTimeline(heistLibrary)
    const dialogueIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'dialogue')
    const cues = timeline[dialogueIndex]?.cues ?? []

    expect(cues).toContainEqual(
      expect.objectContaining({
        kind: 'subtitle:show',
        payload: expect.objectContaining({ characterId: 'vera' }),
      }),
    )
  })

  it('emits a light:change cue whenever a beat carries a lighting direction', () => {
    const timeline = compileTimeline(heistLibrary)

    heistLibrary.beats.forEach((beat, index) => {
      const hasLightCue = timeline[index]?.cues.some((cue) => cue.kind === 'light:change') ?? false
      expect(hasLightCue).toBe(Boolean(beat.lighting))
    })
  })

  it('emits character:enter on each character entrance beat', () => {
    const timeline = compileTimeline(heistLibrary)

    for (const character of heistLibrary.cast) {
      const cues = timeline[character.entrance.beat]?.cues ?? []
      expect(cues).toContainEqual(
        expect.objectContaining({
          kind: 'character:enter',
          payload: { characterId: character.id },
        }),
      )
    }
  })

  it('emits character:exit on a character exit beat', () => {
    const scriptWithExit: SceneScript = {
      ...heistLibrary,
      cast: heistLibrary.cast.map((character) =>
        character.id === 'dez'
          ? { ...character, exit: { beat: 2, to: 'offRight', style: 'walk' } }
          : character,
      ),
    }

    const timeline = compileTimeline(scriptWithExit)
    const cues = timeline[2]?.cues ?? []

    expect(cues).toContainEqual(
      expect.objectContaining({
        kind: 'character:exit',
        payload: { characterId: 'dez' },
      }),
    )
  })

  it('freezes the timeline and every compiled beat', () => {
    const timeline = compileTimeline(heistLibrary)

    expect(Object.isFrozen(timeline)).toBe(true)
    expect(Object.isFrozen(timeline[0])).toBe(true)
    expect(Object.isFrozen(timeline[0]?.cues)).toBe(true)
  })
})
