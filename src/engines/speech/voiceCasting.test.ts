import { describe, expect, it } from 'vitest'
import { heistLibrary } from '@scenes'
import { castVoicesForCast } from './voiceCasting'
import type { SpeechVoiceDescriptor } from './types'

const voices: SpeechVoiceDescriptor[] = [
  { id: 'a', name: 'Alpha', lang: 'en-US' },
  { id: 'b', name: 'Beta', lang: 'en-GB' },
  { id: 'c', name: 'Gamma', lang: 'fr-FR' },
]

describe('castVoicesForCast', () => {
  it('assigns one casting per cast member', () => {
    const casting = castVoicesForCast(heistLibrary.cast, voices)
    expect(casting.map((c) => c.characterId)).toEqual(heistLibrary.cast.map((c) => c.id))
  })

  it('gives two characters with different registers a different pitch', () => {
    const casting = castVoicesForCast(heistLibrary.cast, voices)
    const [first, second] = casting
    expect(first?.pitch).not.toBe(second?.pitch)
  })

  it('prefers English voices and assigns distinct voice ids when more than one is available', () => {
    const casting = castVoicesForCast(heistLibrary.cast, voices)
    const voiceIds = casting.map((c) => c.voiceId)
    expect(voiceIds).toEqual(['a', 'b'])
  })

  it('falls back to any available voice when no English voice exists', () => {
    const nonEnglish: SpeechVoiceDescriptor[] = [{ id: 'x', name: 'Xi', lang: 'fr-FR' }]
    const casting = castVoicesForCast(heistLibrary.cast, nonEnglish)
    expect(casting.every((c) => c.voiceId === 'x')).toBe(true)
  })

  it('assigns a null voice id when no voices are available at all', () => {
    const casting = castVoicesForCast(heistLibrary.cast, [])
    expect(casting.every((c) => c.voiceId === null)).toBe(true)
  })

  it('is deterministic for the same inputs', () => {
    expect(castVoicesForCast(heistLibrary.cast, voices)).toEqual(
      castVoicesForCast(heistLibrary.cast, voices),
    )
  })
})
