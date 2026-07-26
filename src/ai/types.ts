import type { SceneScript } from '@schema'

/** A source of raw scene-generation text, injectable for testing (mirrors ADR-021's `SpeechClockAdapter` pattern — depend on the narrow shape, not the concrete client). */
export type SceneStreamFn = (
  premise: string,
  options?: { signal?: AbortSignal },
) => AsyncGenerator<string>

export type CreateSceneStatus = 'generating'

export interface CreateSceneOptions {
  /** Defaults to `requestSceneStream` (the real Groq-via-proxy client). */
  streamScene?: SceneStreamFn
  /** Called with the full accumulated raw text on every chunk received. */
  onChunk?: (accumulatedRawText: string) => void
  /**
   * Fired once, when generation begins. There is no matching `'ready'`
   * event: `createScene` never resolves without a usable script (ADR-015),
   * so the caller should treat promise resolution itself as "ready" and
   * apply the result (e.g. `setScript`) and any "ready" status transition
   * together, in the same state update — never as two separate ones,
   * which can otherwise be observed a render apart.
   */
  onStatusChange?: (status: CreateSceneStatus) => void
  /** Per-attempt network timeout in ms before the attempt is abandoned. */
  timeoutMs?: number
  signal?: AbortSignal
}

export interface CreateSceneResult {
  script: SceneScript
  source: 'groq' | 'seed'
}
