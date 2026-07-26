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

  it('emits a speech:request cue carrying the speaker and full line for a dialogue beat', () => {
    const timeline = compileTimeline(heistLibrary)
    const dialogueIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'dialogue')
    const dialogueBeat = heistLibrary.beats[dialogueIndex]
    if (!dialogueBeat || dialogueBeat.type !== 'dialogue')
      throw new Error('expected a dialogue beat')
    const cues = timeline[dialogueIndex]?.cues ?? []

    expect(cues).toContainEqual(
      expect.objectContaining({
        kind: 'speech:request',
        payload: { characterId: dialogueBeat.characterId, line: dialogueBeat.line },
      }),
    )
  })

  it('sets speechCharacterId only on dialogue beats', () => {
    const timeline = compileTimeline(heistLibrary)

    heistLibrary.beats.forEach((beat, index) => {
      const compiled = timeline[index]
      if (beat.type === 'dialogue') {
        expect(compiled?.speechCharacterId).toBe(beat.characterId)
      } else {
        expect(compiled?.speechCharacterId).toBeUndefined()
      }
    })
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

  it('emits character:pose speaking for the speaker and listening for the rest, on a dialogue beat', () => {
    const timeline = compileTimeline(heistLibrary)
    const dialogueIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'dialogue')
    const dialogueBeat = heistLibrary.beats[dialogueIndex]
    if (!dialogueBeat || dialogueBeat.type !== 'dialogue')
      throw new Error('expected a dialogue beat')
    const cues = timeline[dialogueIndex]?.cues ?? []

    for (const character of heistLibrary.cast) {
      const hasEntered = character.entrance.beat <= dialogueIndex
      if (!hasEntered) continue

      const expectedPose = character.id === dialogueBeat.characterId ? 'speaking' : 'listening'
      expect(cues).toContainEqual(
        expect.objectContaining({
          kind: 'character:pose',
          payload: { characterId: character.id, pose: expectedPose },
        }),
      )
    }
  })

  it('emits character:pose thinking on a pause beat and surprised on a reveal beat, for present characters', () => {
    const timeline = compileTimeline(heistLibrary)

    const pauseIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'beat')
    const revealIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'reveal')

    if (pauseIndex >= 0) {
      const cues = timeline[pauseIndex]?.cues ?? []
      const poseCues = cues.filter((cue) => cue.kind === 'character:pose')
      expect(poseCues.length).toBeGreaterThan(0)
      for (const cue of poseCues) {
        expect(cue.payload).toMatchObject({ pose: 'thinking' })
      }
    }

    if (revealIndex >= 0) {
      const cues = timeline[revealIndex]?.cues ?? []
      const poseCues = cues.filter((cue) => cue.kind === 'character:pose')
      expect(poseCues.length).toBeGreaterThan(0)
      for (const cue of poseCues) {
        expect(cue.payload).toMatchObject({ pose: 'surprised' })
      }
    }
  })

  it('does not emit character:pose for a character who has not entered yet', () => {
    const scriptWithLateEntrance: SceneScript = {
      ...heistLibrary,
      cast: heistLibrary.cast.map((character, index) =>
        index === 0 ? { ...character, entrance: { ...character.entrance, beat: 5 } } : character,
      ),
    }

    const timeline = compileTimeline(scriptWithLateEntrance)
    const lateCharacter = scriptWithLateEntrance.cast[0]!
    const cuesBeforeEntrance = timeline[0]?.cues ?? []

    expect(cuesBeforeEntrance).not.toContainEqual(
      expect.objectContaining({
        kind: 'character:pose',
        payload: expect.objectContaining({ characterId: lateCharacter.id }),
      }),
    )
  })

  it('emits exactly one camera:move cue per beat, with all four fields resolved', () => {
    const timeline = compileTimeline(heistLibrary)

    timeline.forEach((beat) => {
      const cameraCues = beat.cues.filter((cue) => cue.kind === 'camera:move')
      expect(cameraCues).toHaveLength(1)
      const payload = cameraCues[0]?.payload
      expect(payload).toMatchObject({
        move: expect.any(String),
        shot: expect.any(String),
        focus: expect.any(String),
        intensity: expect.any(String),
      })
    })
  })

  it('is deterministic in its camera derivation — the same script compiles to the same camera path twice', () => {
    const first = compileTimeline(heistLibrary).map(
      (beat) => beat.cues.find((cue) => cue.kind === 'camera:move')?.payload,
    )
    const second = compileTimeline(heistLibrary).map(
      (beat) => beat.cues.find((cue) => cue.kind === 'camera:move')?.payload,
    )

    expect(second).toEqual(first)
  })

  it('frames a single active speaker close and centered when no camera direction is authored', () => {
    const script: SceneScript = {
      ...heistLibrary,
      cast: [heistLibrary.cast[0]!],
      beats: heistLibrary.beats.map((beat) =>
        beat.type === 'dialogue'
          ? { ...beat, characterId: heistLibrary.cast[0]!.id, camera: undefined }
          : beat,
      ),
    }

    const timeline = compileTimeline(script)
    const dialogueIndex = script.beats.findIndex((beat) => beat.type === 'dialogue')
    const payload = timeline[dialogueIndex]?.cues.find((cue) => cue.kind === 'camera:move')?.payload

    expect(payload).toMatchObject({ shot: 'close', focus: 'center' })
  })

  it('frames a reveal beat with a dramatic, wide-focus shot when no camera direction is authored', () => {
    const script: SceneScript = {
      ...heistLibrary,
      beats: heistLibrary.beats.map((beat) =>
        beat.type === 'reveal' ? { ...beat, camera: undefined } : beat,
      ),
    }

    const timeline = compileTimeline(script)
    const revealIndex = script.beats.findIndex((beat) => beat.type === 'reveal')
    const payload = timeline[revealIndex]?.cues.find((cue) => cue.kind === 'camera:move')?.payload

    expect(payload).toMatchObject({ shot: 'reveal', focus: 'wide', intensity: 'dramatic' })
  })

  it('keeps the dramatic reveal shot even when the beat authors its own camera move', () => {
    const timeline = compileTimeline(heistLibrary)
    const revealIndex = heistLibrary.beats.findIndex((beat) => beat.type === 'reveal')
    const revealBeat = heistLibrary.beats[revealIndex]
    if (!revealBeat || revealBeat.type !== 'reveal' || !revealBeat.camera) {
      throw new Error('expected the seed script reveal beat to author a camera direction')
    }
    const payload = timeline[revealIndex]?.cues.find((cue) => cue.kind === 'camera:move')?.payload

    expect(payload).toMatchObject({ move: revealBeat.camera.move, shot: 'reveal' })
  })

  it('respects an authored camera direction, filling in shot/focus rather than overriding move/intensity', () => {
    const timeline = compileTimeline(heistLibrary)
    const authoredIndex = heistLibrary.beats.findIndex(
      (beat) => beat.camera?.move === 'pushIn' && beat.camera.target === 'vera',
    )
    const payload = timeline[authoredIndex]?.cues.find((cue) => cue.kind === 'camera:move')?.payload

    expect(payload).toMatchObject({ move: 'pushIn', shot: 'close' })
  })

  it('freezes the timeline and every compiled beat', () => {
    const timeline = compileTimeline(heistLibrary)

    expect(Object.isFrozen(timeline)).toBe(true)
    expect(Object.isFrozen(timeline[0])).toBe(true)
    expect(Object.isFrozen(timeline[0]?.cues)).toBe(true)
  })
})
