import { buildSystemPrompt, buildUserPrompt } from '../src/ai/prompt'

/**
 * Vercel Edge Function — the only place the Groq API key exists (ADR-014
 * in docs/DECISIONS.md). Proxies a chat-completion stream from Groq,
 * re-emitting just the generated text as plain decoded chunks so the
 * browser client never has to parse SSE framing or know which provider
 * is behind it.
 */
export const config = { runtime: 'edge' }

interface GroqStreamChunk {
  choices?: { delta?: { content?: string } }[]
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const MAX_PREMISE_LENGTH = 300

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response('Server misconfigured: missing GROQ_API_KEY', { status: 500 })
  }

  let premise: string
  try {
    const body = (await request.json()) as { premise?: unknown }
    if (typeof body.premise !== 'string' || body.premise.trim().length === 0) {
      return new Response('Invalid request: "premise" is required', { status: 400 })
    }
    premise = body.premise.slice(0, MAX_PREMISE_LENGTH)
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const groqResponse = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
      stream: true,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(premise) },
      ],
    }),
  })

  if (!groqResponse.ok || !groqResponse.body) {
    return new Response('Upstream scene generation failed', { status: 502 })
  }

  return new Response(toPlainTextStream(groqResponse.body), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

/** Re-frames an upstream OpenAI-style SSE byte stream as plain text deltas. */
export function toPlainTextStream(sseBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const upstreamReader = sseBody.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream<Uint8Array>({
    // A single upstream chunk can decode to zero delta-bearing lines (e.g.
    // OpenAI-compatible APIs typically open the stream with a bare
    // `{"role":"assistant"}` chunk, and `[DONE]`/keep-alive lines never
    // carry a delta either). A ReadableStream's `pull()` is not
    // automatically re-invoked just because it resolved without enqueueing
    // anything, so this loops across upstream reads until it can enqueue
    // at least one delta or the upstream closes — otherwise the very first
    // pull on a real Groq stream stalls the consumer indefinitely.
    async pull(controller) {
      while (true) {
        const { done, value } = await upstreamReader.read()
        if (done) {
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let enqueuedAny = false
        for (const line of lines) {
          const delta = extractDelta(line)
          if (delta) {
            controller.enqueue(encoder.encode(delta))
            enqueuedAny = true
          }
        }
        if (enqueuedAny) return
      }
    },
    cancel() {
      void upstreamReader.cancel()
    },
  })
}

export function extractDelta(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null

  const payload = trimmed.slice('data:'.length).trim()
  if (payload === '[DONE]') return null

  try {
    const parsed = JSON.parse(payload) as GroqStreamChunk
    return parsed.choices?.[0]?.delta?.content ?? null
  } catch {
    // A line split across two upstream reads before buffering caught up,
    // or a genuinely malformed fragment — safe to drop either way; the
    // client's own repair pass tolerates a slightly incomplete stream.
    return null
  }
}
