import type { Character, SpeechVoiceDescriptor, VoiceCasting } from './types'

/**
 * Register/rate -> pitch/rate mapping (docs/ARCHITECTURE.md section 7,
 * `Character.voice`). Deliberately hand-tuned constants, not derived —
 * there is no acoustic model here, just enough spread that two characters
 * with different registers sound different even when the browser only
 * exposes one system voice (Milestone 4's "two distinguishable voices"
 * requirement must hold regardless of voice-list availability).
 */
const PITCH_BY_REGISTER: Record<Character['voice']['register'], number> = {
  low: 0.75,
  mid: 1.0,
  high: 1.3,
}

const RATE_BY_SPEED: Record<Character['voice']['rate'], number> = {
  slow: 0.85,
  normal: 1.0,
  fast: 1.15,
}

/**
 * Deterministically assigns each cast member a distinct system voice (when
 * more than one is available) plus a pitch/rate derived from their schema
 * `voice` direction. Pure function of its inputs so casting is stable across
 * runs of the same `SceneScript`.
 */
export function castVoicesForCast(
  cast: readonly Character[],
  voices: readonly SpeechVoiceDescriptor[],
): VoiceCasting[] {
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  const pool = englishVoices.length > 0 ? englishVoices : voices

  return cast.map((character, index) => ({
    characterId: character.id,
    voiceId: pool.length > 0 ? (pool[index % pool.length]?.id ?? null) : null,
    pitch: PITCH_BY_REGISTER[character.voice.register],
    rate: RATE_BY_SPEED[character.voice.rate],
  }))
}
