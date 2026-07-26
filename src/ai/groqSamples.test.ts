import { describe, expect, it } from 'vitest'
import { validateSceneScript } from '@schema'
import { heistLibrary } from '@scenes'
import { compileTimeline } from '@engines/timeline'
import { groqSampleResponses } from './groqSamples.fixture'

/**
 * The end-to-end guard for ADR-029: every captured live-Groq response has to
 * reach a playable scene through the normal ingestion path, without the
 * seed-script fallback and without losing the model's stated intent.
 */
describe('live Groq sample responses', () => {
  it.each(groqSampleResponses.map((sample, index) => [index, sample.premise] as const))(
    'validates sample %i (%s)',
    (index) => {
      const result = validateSceneScript(groqSampleResponses[index]!.script)

      expect(result.success, result.success ? '' : result.error).toBe(true)
    },
  )

  it('produces a scene distinct from the seed fallback for every sample', () => {
    for (const sample of groqSampleResponses) {
      const result = validateSceneScript(sample.script)
      expect(result.success).toBe(true)
      if (!result.success) continue

      expect(result.data.title).not.toBe(heistLibrary.title)
    }
  })

  it('compiles every sample into a playable timeline', () => {
    for (const sample of groqSampleResponses) {
      const result = validateSceneScript(sample.script)
      if (!result.success) continue

      const timeline = compileTimeline(result.data)

      expect(timeline.length).toBe(result.data.beats.length)
      expect(timeline.every((beat) => beat.durationMs > 0)).toBe(true)
    }
  })

  /**
   * The failure this whole change exists to stop: a lighthouse premise whose
   * setting silently became something unrelated, or whose script was
   * discarded entirely in favour of the heist demo.
   */
  it('keeps the lighthouse premise set at the lighthouse', () => {
    const sample = groqSampleResponses.find((entry) => entry.premise.includes('lighthouse'))
    expect(sample).toBeDefined()

    const result = validateSceneScript(sample!.script)

    expect(result.success).toBe(true)
    expect(result.success && result.data.scene.setting).toBe('lighthouse')
    expect(result.success && result.data.scene.slugline).toMatch(/LIGHTHOUSE/i)
  })

  it('only ever coerces values the model got wrong, never a whole script', () => {
    for (const sample of groqSampleResponses) {
      const result = validateSceneScript(sample.script)
      if (!result.success) continue

      const script = sample.script as { title?: string; beats?: unknown[] }
      expect(result.data.title).toBe(script.title)
      expect(result.data.beats.length).toBe(script.beats?.length)
    }
  })
})
