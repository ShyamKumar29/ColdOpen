import { describe, expect, it, vi } from 'vitest'
import { createScene } from './createScene'
import { heistLibrary } from '@scenes'
import type { SceneStreamFn } from './types'

const validScript = {
  version: '1.0',
  title: 'Test Scene',
  genre: 'noir',
  mood: 'tense',
  scene: { slugline: 'INT. OFFICE - NIGHT', setting: 'office', timeOfDay: 'night' },
  cast: [
    {
      id: 'ada',
      name: 'Ada',
      archetype: 'stranger',
      voice: { register: 'mid', rate: 'normal' },
      entrance: { beat: 0, from: 'shadow', style: 'creep' },
    },
  ],
  beats: [
    { id: 'b0', type: 'title' },
    { id: 'b1', type: 'slugline' },
    { id: 'b2', type: 'dialogue', characterId: 'ada', line: 'Hello.' },
    { id: 'b3', type: 'reveal' },
  ],
}

/** Splits a string into a few chunks so onChunk accumulation is exercised. */
async function* chunked(text: string): AsyncGenerator<string> {
  const size = Math.max(1, Math.ceil(text.length / 3))
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size)
  }
}

function streamOf(...texts: string[]): SceneStreamFn {
  let call = 0
  return () => {
    const text = texts[Math.min(call, texts.length - 1)]
    call++
    return chunked(text ?? '')
  }
}

describe('createScene', () => {
  it('resolves with the streamed script on the first valid attempt', async () => {
    const streamScene = streamOf(JSON.stringify(validScript))

    const result = await createScene('a premise', { streamScene })

    expect(result.source).toBe('groq')
    expect(result.script.title).toBe('Test Scene')
  })

  it('repairs a fenced, prose-wrapped response before giving up on an attempt', async () => {
    const streamScene = streamOf(
      'Sure, here you go:\n```json\n' + JSON.stringify(validScript) + '\n```\nEnjoy!',
    )

    const result = await createScene('a premise', { streamScene })

    expect(result.source).toBe('groq')
    expect(result.script.title).toBe('Test Scene')
  })

  it('retries once on a first attempt that never produces valid JSON', async () => {
    const streamScene = streamOf('not json at all', JSON.stringify(validScript))
    const streamSpy = vi.fn(streamScene)

    const result = await createScene('a premise', { streamScene: streamSpy })

    expect(result.source).toBe('groq')
    expect(streamSpy).toHaveBeenCalledTimes(2)
  })

  it('falls back to the seed script after two failed attempts', async () => {
    const streamScene = streamOf('garbage', 'still garbage')

    const result = await createScene('a premise', { streamScene })

    expect(result.source).toBe('seed')
    expect(result.script).toBe(heistLibrary)
  })

  it('falls back to the seed script when the stream throws', async () => {
    // eslint-disable-next-line require-yield -- deliberately throws before any yield, to simulate a request that fails before the stream opens
    const streamScene: SceneStreamFn = async function* () {
      throw new Error('network down')
    }

    const result = await createScene('a premise', { streamScene })

    expect(result.source).toBe('seed')
  })

  it('reports accumulated text through onChunk and fires onStatusChange once, at the start', async () => {
    const streamScene = streamOf(JSON.stringify(validScript))
    const onChunk = vi.fn()
    const onStatusChange = vi.fn()

    await createScene('a premise', { streamScene, onChunk, onStatusChange })

    expect(onChunk).toHaveBeenCalled()
    const lastChunkCall = onChunk.mock.calls.at(-1)
    expect(lastChunkCall?.[0]).toBe(JSON.stringify(validScript))
    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(onStatusChange).toHaveBeenCalledWith('generating')
  })

  it('retries when the streamed script has duplicate cast ids, then succeeds', async () => {
    const duplicateIdScript = {
      ...validScript,
      cast: [validScript.cast[0], { ...validScript.cast[0], name: 'Ada Two' }],
    }
    const streamScene = streamOf(JSON.stringify(duplicateIdScript), JSON.stringify(validScript))
    const streamSpy = vi.fn(streamScene)

    const result = await createScene('a premise', { streamScene: streamSpy })

    expect(result.source).toBe('groq')
    expect(streamSpy).toHaveBeenCalledTimes(2)
  })

  it('falls back to the seed script when duplicate cast ids persist across both attempts', async () => {
    const duplicateIdScript = {
      ...validScript,
      cast: [validScript.cast[0], { ...validScript.cast[0], name: 'Ada Two' }],
    }
    const streamScene = streamOf(JSON.stringify(duplicateIdScript))

    const result = await createScene('a premise', { streamScene })

    expect(result.source).toBe('seed')
  })

  it('aborts a hung attempt via the per-attempt timeout and falls back to the seed script', async () => {
    vi.useFakeTimers()
    try {
      // eslint-disable-next-line require-yield -- deliberately never yields, to simulate a stream that hangs until the per-attempt timeout aborts it
      const hangingStream: SceneStreamFn = async function* (_premise, options) {
        await new Promise<void>((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
      }

      const resultPromise = createScene('a premise', {
        streamScene: hangingStream,
        timeoutMs: 1000,
      })

      // Two attempts, each guarded by its own 1000ms timeout.
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(1000)

      const result = await resultPromise
      expect(result.source).toBe('seed')
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops retrying once the caller aborts', async () => {
    const streamScene = streamOf('garbage', JSON.stringify(validScript))
    const streamSpy = vi.fn(streamScene)
    const controller = new AbortController()
    controller.abort()

    const result = await createScene('a premise', {
      streamScene: streamSpy,
      signal: controller.signal,
    })

    expect(result.source).toBe('seed')
    expect(streamSpy).not.toHaveBeenCalled()
  })
})
