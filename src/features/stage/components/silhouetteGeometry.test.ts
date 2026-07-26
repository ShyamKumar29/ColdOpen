import { describe, expect, it } from 'vitest'
import { computeRaisedHipY } from './silhouetteGeometry'

describe('computeRaisedHipY', () => {
  const hipY = 175
  const floorY = 300
  const legLength = floorY - hipY

  it('leaves the hip unchanged at heightScale 1 (average build)', () => {
    expect(computeRaisedHipY(hipY, floorY, 1)).toBe(hipY)
  })

  it('raises the hip so the leg segment scales by heightScale (tall build)', () => {
    const heightScale = 1.08
    const raisedHipY = computeRaisedHipY(hipY, floorY, heightScale)

    expect(raisedHipY).toBeLessThan(hipY)
    expect(floorY - raisedHipY).toBeCloseTo(legLength * heightScale)
  })

  it('lowers the hip so the leg segment shrinks by heightScale (heavy build)', () => {
    const heightScale = 0.98
    const raisedHipY = computeRaisedHipY(hipY, floorY, heightScale)

    expect(raisedHipY).toBeGreaterThan(hipY)
    expect(floorY - raisedHipY).toBeCloseTo(legLength * heightScale)
  })

  it('moves the head by less than a whole-figure scale from the floor would (the ADR-026 regression)', () => {
    // The bug this guards against: `Actor.tsx` used to apply heightScale as
    // a whole-figure `scale()` anchored at the floor, which stretches every
    // point's distance from the floor by the same factor, head included.
    // Leg-only translation instead moves the head by the fixed hip offset
    // only — strictly less displacement for any heightScale > 1, since the
    // head starts further from the floor than the hip does.
    const heightScale = 1.08
    const headY = 30 // an arbitrary unscaled head position, well above the hip

    const raisedHipY = computeRaisedHipY(hipY, floorY, heightScale)
    const translatedHeadDisplacement = Math.abs(raisedHipY - hipY)

    const wholeScaleHeadY = floorY - (floorY - headY) * heightScale
    const wholeScaleHeadDisplacement = Math.abs(wholeScaleHeadY - headY)

    expect(translatedHeadDisplacement).toBeLessThan(wholeScaleHeadDisplacement)
  })
})
