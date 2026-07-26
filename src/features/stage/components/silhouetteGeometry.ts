/**
 * The pure math behind build-driven height (docs/DECISIONS.md ADR-026):
 * the foot stays fixed at `floorY`, the hip moves to a new y that makes the
 * leg segment (`floorY - hipY`) exactly `heightScale` times its original
 * length, and the torso/arms/head group above the hip translates rigidly by
 * the same offset (`raisedHipY - hipY`) rather than scaling — so a taller
 * build gets longer legs and a correspondingly higher head, never a larger
 * one. Kept in its own module (no SVG/React involved) so it's unit-testable
 * without rendering anything, guarding against whole-figure `scale()`
 * regressing back in.
 */
export function computeRaisedHipY(hipY: number, floorY: number, heightScale: number): number {
  return hipY - (floorY - hipY) * (heightScale - 1)
}
