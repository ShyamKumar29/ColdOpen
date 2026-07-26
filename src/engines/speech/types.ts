import type { Character } from '@schema'

export type SpeechCapability = 'available' | 'unavailable'

/** What the Speech Engine is doing right now (task requirement: "expose speech state"). */
export type SpeechEngineState = 'idle' | 'speaking' | 'unavailable'

/** A browser voice, stripped down to what casting needs — never the raw `SpeechSynthesisVoice`, so the adapter stays the only DOM-aware file. */
export interface SpeechVoiceDescriptor {
  id: string
  name: string
  lang: string
}

export interface VoiceCasting {
  characterId: string
  voiceId: string | null
  pitch: number
  rate: number
}

export interface SpeechAdapterRequest {
  text: string
  voiceId: string | null
  pitch: number
  rate: number
}

export interface SpeechAdapterHandlers {
  onStart: () => void
  onBoundary: (charIndex: number) => void
  onEnd: () => void
  onError: (message: string) => void
}

/**
 * Hides the Web Speech API (or any future TTS provider) behind a small,
 * provider-agnostic surface. The Speech Engine only ever talks to this
 * interface, so swapping in cloud TTS later means writing a new adapter,
 * not touching the engine.
 */
export interface SpeechAdapter {
  isSupported(): boolean
  /** Resolves once the voice list is ready (handles the browser's async `voiceschanged` quirk internally). */
  loadVoices(): Promise<SpeechVoiceDescriptor[]>
  /** Speaks one chunk of text. Fires exactly one of `onEnd`/`onError`, plus zero or more `onBoundary`, plus `onStart`. */
  speak(request: SpeechAdapterRequest, handlers: SpeechAdapterHandlers): void
  /** Stops whatever is currently speaking or queued. Safe to call when nothing is speaking. */
  cancel(): void
}

export type { Character }
