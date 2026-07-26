import type {
  SpeechAdapter,
  SpeechAdapterHandlers,
  SpeechAdapterRequest,
  SpeechVoiceDescriptor,
} from './types'

const VOICES_CHANGED_TIMEOUT_MS = 1500

function descriptorId(voice: SpeechSynthesisVoice): string {
  return `${voice.name}|${voice.lang}`
}

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Wraps `window.speechSynthesis` (docs/ARCHITECTURE.md section 4, "Speech
 * Engine", and the Speech API risk table in section 10). This is the only
 * file in the project allowed to touch `SpeechSynthesisUtterance`/
 * `speechSynthesis` directly — the Speech Engine only ever sees the
 * provider-agnostic `SpeechAdapter` interface.
 */
export function createWebSpeechAdapter(): SpeechAdapter {
  // Chromium garbage-collects an in-flight utterance if nothing holds a
  // reference to it, silently killing its callbacks mid-speech. Holding
  // every live utterance here until it settles is the documented mitigation.
  const liveUtterances = new Set<SpeechSynthesisUtterance>()
  let voiceCache: SpeechSynthesisVoice[] = []

  function loadVoices(): Promise<SpeechVoiceDescriptor[]> {
    if (!isSupported()) return Promise.resolve([])

    const synth = window.speechSynthesis
    const existing = synth.getVoices()
    if (existing.length > 0) {
      voiceCache = existing
      return Promise.resolve(
        existing.map((voice) => ({ id: descriptorId(voice), name: voice.name, lang: voice.lang })),
      )
    }

    return new Promise((resolve) => {
      let settled = false
      const finish = (): void => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        synth.removeEventListener('voiceschanged', onVoicesChanged)
        voiceCache = synth.getVoices()
        resolve(
          voiceCache.map((voice) => ({
            id: descriptorId(voice),
            name: voice.name,
            lang: voice.lang,
          })),
        )
      }
      const onVoicesChanged = (): void => finish()
      const timeoutId = setTimeout(finish, VOICES_CHANGED_TIMEOUT_MS)
      synth.addEventListener('voiceschanged', onVoicesChanged)
    })
  }

  function speak(request: SpeechAdapterRequest, handlers: SpeechAdapterHandlers): void {
    if (!isSupported()) {
      handlers.onError('speechSynthesis unavailable')
      return
    }

    const utterance = new SpeechSynthesisUtterance(request.text)
    utterance.pitch = request.pitch
    utterance.rate = request.rate
    if (request.voiceId) {
      const voice = voiceCache.find((candidate) => descriptorId(candidate) === request.voiceId)
      if (voice) utterance.voice = voice
    }

    const settle = (): void => {
      liveUtterances.delete(utterance)
    }

    utterance.onstart = () => handlers.onStart()
    utterance.onboundary = (event) => handlers.onBoundary(event.charIndex)
    utterance.onend = () => {
      settle()
      handlers.onEnd()
    }
    utterance.onerror = (event) => {
      settle()
      handlers.onError(event.error ?? 'speech synthesis error')
    }

    liveUtterances.add(utterance)
    window.speechSynthesis.speak(utterance)
  }

  function cancel(): void {
    if (!isSupported()) return
    window.speechSynthesis.cancel()
    liveUtterances.clear()
  }

  return { isSupported, loadVoices, speak, cancel }
}
