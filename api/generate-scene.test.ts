import { describe, expect, it } from 'vitest'
import { extractDelta, toPlainTextStream } from './generate-scene'

describe('extractDelta', () => {
  it('extracts content from a well-formed SSE data line', () => {
    const line = 'data: {"choices":[{"delta":{"content":"Hello"}}]}'
    expect(extractDelta(line)).toBe('Hello')
  })

  it('returns null for the terminal [DONE] line', () => {
    expect(extractDelta('data: [DONE]')).toBeNull()
  })

  it('returns null for a non-data line', () => {
    expect(extractDelta('event: ping')).toBeNull()
  })

  it('returns null for a malformed/truncated JSON payload without throwing', () => {
    expect(extractDelta('data: {"choices":[{"delta":{"content":"Hel')).toBeNull()
  })

  it('returns null when a chunk has no delta content (e.g. a role-only chunk)', () => {
    const line = 'data: {"choices":[{"delta":{"role":"assistant"}}]}'
    expect(extractDelta(line)).toBeNull()
  })
})

describe('toPlainTextStream', () => {
  async function collect(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let out = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) return out
      out += decoder.decode(value, { stream: true })
    }
  }

  function upstreamOf(...lines: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    let index = 0
    return new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index >= lines.length) {
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(lines[index]))
        index++
      },
    })
  }

  it('re-emits delta content as plain decoded text', async () => {
    const upstream = upstreamOf(
      'data: {"choices":[{"delta":{"content":"Hello "}}]}\n',
      'data: {"choices":[{"delta":{"content":"world"}}]}\n',
      'data: [DONE]\n',
    )

    const text = await collect(toPlainTextStream(upstream))
    expect(text).toBe('Hello world')
  })

  it('buffers a data line split across two upstream reads', async () => {
    const upstream = upstreamOf('data: {"choices":[{"delta":{"content":"Hel', 'lo"}}]}\n')

    const text = await collect(toPlainTextStream(upstream))
    expect(text).toBe('Hello')
  })

  it('does not stall on an upstream chunk that yields no delta (e.g. a role-only opening chunk)', async () => {
    const upstream = upstreamOf(
      'data: {"choices":[{"delta":{"role":"assistant"}}]}\n',
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
      'data: [DONE]\n',
    )

    const text = await collect(toPlainTextStream(upstream))
    expect(text).toBe('Hello')
  })
})
