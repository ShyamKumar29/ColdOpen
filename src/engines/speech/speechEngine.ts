import type { EventBus } from '@engines/bus'
import { splitIntoSentences } from './sentenceSplit'
import type { SpeechAdapter } from './types'
import type { Character, SpeechCapability, SpeechEngineState, VoiceCasting } from './types'
import { castVoicesForCast } from './voiceCasting'
import { createWebSpeechAdapter } from './webSpeechAdapter'

const MS_PER_CHAR = 55
const MIN_CHUNK_ESTIMATE_MS = 500
const WATCHDOG_MULTIPLIER = 2

export interface SpeechEngine {
  probeCapability(): SpeechCapability
  /** Loads the voice list and assigns each cast member a voice/pitch/rate. Safe to call once per scene load; no-ops when speech is unsupported. */
  castVoices(cast: readonly Character[]): Promise<void>
  /** Queues a line for speech, splitting it into sentence-sized chunks. A new call supersedes whatever is currently speaking. */
  speak(characterId: string, line: string): void
  /** Stops whatever is speaking or queued. Does not emit `speech:end` — an explicit interruption is not a completion. */
  cancel(): void
  getState(): SpeechEngineState
}

/**
 * Wraps the Web Speech API behind the `SpeechAdapter` boundary
 * (docs/ARCHITECTURE.md section 4, "Speech Engine"). Emits `speech:start` /
 * `speech:boundary` / `speech:end` / `speech:error` / `speech:unavailable`,
 * which the Scene Controller listens for to drive the speech clock
 * (ADR-005).
 *
 * Deliberately does not subscribe itself to `speech:request` (or anything
 * else) on `bus` — construction must stay a pure, side-effect-free call.
 * `useSceneController` is the only place that turns a `speech:request` cue
 * into a `speak()` call, in its bus-subscribing `useEffect`, the same
 * pattern every other cue in this codebase already follows (ADR-022): a
 * `bus.on(...)` performed directly inside a factory function runs during
 * the React render phase (`useState`'s lazy initializer), which React
 * StrictMode's dev-mode double-invoke calls twice, permanently registering
 * two live handlers on the one shared bus.
 */
export function createSpeechEngine(
  bus: EventBus,
  adapter: SpeechAdapter = createWebSpeechAdapter(),
): SpeechEngine {
  let state: SpeechEngineState = 'idle'
  let castByCharacter = new Map<string, VoiceCasting>()
  let unavailableReported = false

  let activeCharacterId: string | null = null
  let queue: string[] = []
  let queueOffset = 0
  let watchdog: ReturnType<typeof setTimeout> | null = null

  function clearWatchdog(): void {
    if (watchdog !== null) {
      clearTimeout(watchdog)
      watchdog = null
    }
  }

  function reportUnavailable(): void {
    if (unavailableReported) return
    unavailableReported = true
    bus.emit('speech:unavailable', {})
  }

  function finishLine(characterId: string): void {
    clearWatchdog()
    state = 'idle'
    activeCharacterId = null
    queue = []
    bus.emit('speech:end', { characterId })
  }

  function failLine(characterId: string, message: string): void {
    clearWatchdog()
    state = 'idle'
    activeCharacterId = null
    queue = []
    bus.emit('speech:error', { characterId, message })
  }

  function onChunkSettled(characterId: string, consumedLength: number): void {
    clearWatchdog()
    if (activeCharacterId !== characterId) return // stale callback from a superseded/cancelled line
    queueOffset += consumedLength + 1
    speakNextChunk(characterId)
  }

  function speakNextChunk(characterId: string): void {
    const chunk = queue.shift()
    if (chunk === undefined) {
      finishLine(characterId)
      return
    }

    const casting = castByCharacter.get(characterId)
    const estimateMs = Math.max(MIN_CHUNK_ESTIMATE_MS, chunk.length * MS_PER_CHAR)
    watchdog = setTimeout(() => {
      watchdog = null
      onChunkSettled(characterId, chunk.length)
    }, estimateMs * WATCHDOG_MULTIPLIER)

    adapter.speak(
      {
        text: chunk,
        voiceId: casting?.voiceId ?? null,
        pitch: casting?.pitch ?? 1,
        rate: casting?.rate ?? 1,
      },
      {
        onStart: () => {
          if (state !== 'speaking') {
            state = 'speaking'
            bus.emit('speech:start', { characterId })
          }
        },
        onBoundary: (charIndex) =>
          bus.emit('speech:boundary', { characterId, charIndex: queueOffset + charIndex }),
        onEnd: () => onChunkSettled(characterId, chunk.length),
        onError: (message) => {
          clearWatchdog()
          failLine(characterId, message)
        },
      },
    )
  }

  function speak(characterId: string, line: string): void {
    if (!adapter.isSupported()) {
      reportUnavailable()
      bus.emit('speech:error', { characterId, message: 'speech unavailable' })
      return
    }

    if (activeCharacterId) {
      adapter.cancel()
      clearWatchdog()
    }

    activeCharacterId = characterId
    queue = splitIntoSentences(line)
    queueOffset = 0

    if (queue.length === 0) {
      finishLine(characterId)
      return
    }

    speakNextChunk(characterId)
  }

  function cancel(): void {
    adapter.cancel()
    clearWatchdog()
    activeCharacterId = null
    queue = []
    state = 'idle'
  }

  function probeCapability(): SpeechCapability {
    const capability = adapter.isSupported() ? 'available' : 'unavailable'
    if (capability === 'unavailable') reportUnavailable()
    return capability
  }

  async function castVoices(cast: readonly Character[]): Promise<void> {
    if (!adapter.isSupported()) return
    const voices = await adapter.loadVoices()
    castByCharacter = new Map(
      castVoicesForCast(cast, voices).map((casting) => [casting.characterId, casting]),
    )
  }

  return {
    probeCapability,
    castVoices,
    speak,
    cancel,
    getState: () => state,
  }
}
