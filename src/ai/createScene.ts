import { validateSceneScript } from '@schema'
import type { SceneScript, SceneScriptValidationResult } from '@schema'
import { heistLibrary } from '@scenes'
import { extractJsonCandidate } from './jsonExtract'
import { requestSceneStream } from './groqStream'
import type { CreateSceneOptions, CreateSceneResult, SceneStreamFn } from './types'

const DEFAULT_TIMEOUT_MS = 20_000
const MAX_ATTEMPTS = 2

/**
 * Turns a premise into a `SceneScript`, following the chain described in
 * docs/ARCHITECTURE.md section 3 and docs/ROADMAP.md's Milestone 6 brief:
 * stream from Groq -> validate -> repair (tolerant re-extraction) -> retry
 * once (a fresh generation) -> fall back to the `heist-library` seed
 * script. Never rejects (ADR-015): every path resolves to a playable
 * `SceneScript`, so a caller can always render whatever it returns.
 */
export async function createScene(
  premise: string,
  options: CreateSceneOptions = {},
): Promise<CreateSceneResult> {
  const {
    streamScene = requestSceneStream,
    onChunk,
    onStatusChange,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options

  onStatusChange?.('generating')

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) break

    const rawText = await collectStream(premise, streamScene, onChunk, timeoutMs, signal)
    const script = parseAndValidate(rawText)
    if (script) {
      return { script, source: 'groq' }
    }
  }

  return { script: heistLibrary, source: 'seed' }
}

async function collectStream(
  premise: string,
  streamScene: SceneStreamFn,
  onChunk: ((accumulatedRawText: string) => void) | undefined,
  timeoutMs: number,
  externalSignal: AbortSignal | undefined,
): Promise<string> {
  const controller = new AbortController()
  const onExternalAbort = () => controller.abort()
  externalSignal?.addEventListener('abort', onExternalAbort)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let accumulated = ''
  try {
    for await (const chunk of streamScene(premise, { signal: controller.signal })) {
      accumulated += chunk
      onChunk?.(accumulated)
    }
  } catch {
    // Network error, timeout, or abort — return whatever text arrived
    // before the failure; the caller's repair pass may still recover it.
  } finally {
    clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }

  return accumulated
}

/**
 * Validation, then repair (docs/ARCHITECTURE.md's `G -->|fail| H[Repair]`
 * step): a direct `JSON.parse` first, and only if that fails, a tolerant
 * re-extraction (fence-strip + brace-balance) before giving up on this
 * attempt.
 */
function parseAndValidate(rawText: string): SceneScript | null {
  if (!rawText.trim()) return null

  const direct = tryParseAndValidate(rawText)
  if (direct) return direct

  const candidate = extractJsonCandidate(rawText)
  if (!candidate) return null

  return tryParseAndValidate(candidate)
}

function tryParseAndValidate(text: string): SceneScript | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  const result = validateSceneScript(parsed)
  reportCoercions(result)
  return result.success ? result.data : null
}

/**
 * ADR-015's stated trade-off is that silent normalization can hide AI output
 * quality problems from developers. Surfacing what the coercion pass had to
 * change (ADR-029) is what pays that off — in development only, since a
 * coerced value is a completely normal outcome for a user.
 */
function reportCoercions(result: SceneScriptValidationResult): void {
  if (!import.meta.env.DEV || result.coercions.length === 0) return

  console.groupCollapsed(`[cold-open] normalized ${result.coercions.length} scene script value(s)`)
  for (const note of result.coercions) {
    console.log(`${note.path}: ${note.from} -> ${note.to} (${note.reason})`)
  }
  console.groupEnd()
}
