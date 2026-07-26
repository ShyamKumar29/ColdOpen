import type { SceneStreamFn } from './types'

/**
 * The only place that talks to Cold Open's own `/api/generate-scene`
 * endpoint. The endpoint itself (a Vercel serverless function, ADR-014)
 * holds the Groq API key server-side and forwards Groq's SSE stream back
 * as plain decoded text deltas, so this function only has to read bytes —
 * no SSE framing, no upstream provider details leak into the browser.
 */
export const requestSceneStream: SceneStreamFn = async function* requestSceneStream(
  premise,
  options,
) {
  const response = await fetch('/api/generate-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ premise }),
    signal: options?.signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`Scene generation request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      yield decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }
}
