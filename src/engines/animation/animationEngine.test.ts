import { describe, expect, it } from 'vitest'
import { durations } from '@design'
import { createAnimationEngine } from './animationEngine'

describe('createAnimationEngine', () => {
  it('creates a handle at identity/invisible on first use, idempotently', () => {
    const engine = createAnimationEngine()

    const first = engine.ensure('vera')
    expect(first.opacity.get()).toBe(0)
    expect(first.poseScale.get()).toBe(1)
    expect(first.poseTranslateY.get()).toBe(0)
    expect(first.pose).toBe('idle')

    expect(engine.ensure('vera')).toBe(first)
  })

  it('fades opacity from 0 to 1 over the entrance preset duration, deterministically', () => {
    const engine = createAnimationEngine()
    const handle = engine.ensure('vera')

    engine.enter('vera', false, 0)
    engine.tick(0)
    expect(handle.opacity.get()).toBe(0)

    engine.tick(durations.normal / 2)
    const midway = handle.opacity.get()
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(1)

    engine.tick(durations.normal)
    expect(handle.opacity.get()).toBe(1)
  })

  it('fades opacity from 1 to 0 on exit', () => {
    const engine = createAnimationEngine()
    const handle = engine.ensure('vera')
    engine.enter('vera', false, 0)
    engine.tick(durations.normal)
    expect(handle.opacity.get()).toBe(1)

    engine.exit('vera', false, durations.normal)
    engine.tick(durations.normal + durations.normal)
    expect(handle.opacity.get()).toBe(0)
  })

  it('is a pure function of the timestamps given — replaying the same calls produces the same result', () => {
    const run = () => {
      const engine = createAnimationEngine()
      engine.enter('vera', false, 0)
      engine.tick(120)
      return engine.ensure('vera').opacity.get()
    }

    expect(run()).toBe(run())
  })

  it('setPose transitions poseScale/poseTranslateY toward the given target', () => {
    const engine = createAnimationEngine()
    const handle = engine.ensure('vera')

    engine.setPose('vera', 'surprised', { scale: 1.05, translateY: -3 }, false, 0)
    engine.tick(durations.fast)

    expect(handle.poseScale.get()).toBe(1.05)
    expect(handle.poseTranslateY.get()).toBe(-3)
    expect(handle.pose).toBe('surprised')
  })

  it('is a no-op when the pose is already current', () => {
    const engine = createAnimationEngine()
    const handle = engine.ensure('vera')

    engine.setPose('vera', 'speaking', { scale: 1.02, translateY: 0 }, false, 0)
    engine.tick(durations.normal)
    expect(handle.poseScale.get()).toBe(1.02)

    engine.setPose('vera', 'speaking', { scale: 1.02, translateY: 0 }, false, durations.normal)
    engine.tick(durations.normal)
    expect(handle.poseScale.get()).toBe(1.02)
  })

  it('reduced motion reaches the target sooner than full motion', () => {
    const full = createAnimationEngine()
    const reduced = createAnimationEngine()

    full.enter('vera', false, 0)
    reduced.enter('vera', true, 0)

    full.tick(durations.fast)
    reduced.tick(durations.fast)

    expect(reduced.ensure('vera').opacity.get()).toBe(1)
    expect(full.ensure('vera').opacity.get()).toBeLessThan(1)
  })

  it('defaults startedAt to the same clock tick() is driven by (performance.now(), not Date.now())', () => {
    // Regression test: `tick()` is driven by `requestAnimationFrame`, whose
    // timestamp is `performance.now()`-relative (small, since page load) —
    // not `Date.now()` (Unix-epoch-relative, ~13 digits). If a default
    // `now` parameter anywhere in the engine ever used `Date.now()` again,
    // `now - startedAt` would be permanently, deeply negative, and
    // `Math.max(0, …)` would silently clamp progress to 0 forever: every
    // character would stay invisible with no error anywhere.
    const engine = createAnimationEngine()
    const handle = engine.ensure('vera')

    engine.enter('vera', false) // omits `now` — exercises the default
    engine.tick(performance.now() + durations.normal)

    expect(handle.opacity.get()).toBe(1)
  })

  it('forgets a character on remove, so a later ensure starts fresh', () => {
    const engine = createAnimationEngine()
    engine.enter('vera', false, 0)
    engine.tick(durations.normal)
    expect(engine.ensure('vera').opacity.get()).toBe(1)

    engine.remove('vera')

    expect(engine.ensure('vera').opacity.get()).toBe(0)
  })
})
