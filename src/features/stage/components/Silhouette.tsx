import { palette } from '@design'
import type { SilhouetteShape } from '@design'

interface ShapeGeometry {
  headR: number
  headCy: number
  torsoPoints: string
  armStrokeWidth: number
  armLeft: [number, number, number, number]
  armRight: [number, number, number, number]
  legStrokeWidth: number
  legLeft: [number, number, number, number]
  legRight: [number, number, number, number]
  footRx: number
  footRy: number
}

/**
 * The three placeholder silhouette shapes (CLAUDE.md Milestone 1 scope).
 * Built from primitives (circle, polygon, rounded strokes) rather than one
 * hand-drawn path so limbs stay independently addressable for future pose
 * animation (CLAUDE.md Animation Rules).
 */
const SHAPES: Record<SilhouetteShape, ShapeGeometry> = {
  slim: {
    headR: 20,
    headCy: 30,
    torsoPoints: '42,60 78,60 72,175 48,175',
    armStrokeWidth: 12,
    armLeft: [44, 66, 30, 170],
    armRight: [76, 66, 90, 170],
    legStrokeWidth: 14,
    legLeft: [54, 175, 50, 300],
    legRight: [66, 175, 70, 300],
    footRx: 10,
    footRy: 5,
  },
  regular: {
    headR: 23,
    headCy: 32,
    torsoPoints: '36,64 84,64 76,178 44,178',
    armStrokeWidth: 15,
    armLeft: [38, 70, 26, 172],
    armRight: [82, 70, 94, 172],
    legStrokeWidth: 17,
    legLeft: [52, 178, 48, 300],
    legRight: [68, 178, 72, 300],
    footRx: 11,
    footRy: 5.5,
  },
  broad: {
    headR: 25,
    headCy: 34,
    torsoPoints: '30,66 90,66 80,180 40,180',
    armStrokeWidth: 19,
    armLeft: [32, 72, 20, 172],
    armRight: [88, 72, 100, 172],
    legStrokeWidth: 21,
    legLeft: [50, 180, 46, 300],
    legRight: [70, 180, 74, 300],
    footRx: 13,
    footRy: 6,
  },
}

export interface SilhouetteProps {
  shape: SilhouetteShape
  className?: string
}

/**
 * Rim width added around every filled/stroked edge, in viewBox units. Reads
 * as a thin edge-light on the silhouette itself, so actors stay legible
 * against a dark backdrop regardless of the active lighting preset's
 * ambient level (see the Milestone 1 closeout review — actors were nearly
 * invisible under `coldMoonlight`/`singleSpot`/`blackout` before this).
 */
const RIM_WIDTH = 3

/** A single limb: a rim-colored line, slightly wider, behind the fill line — the rim shows as a border on both edges. */
function Limb({
  coords: [x1, y1, x2, y2],
  strokeWidth,
  fill,
  rim,
}: {
  coords: readonly [number, number, number, number]
  strokeWidth: number
  fill: string
  rim: string
}) {
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={rim}
        strokeWidth={strokeWidth + RIM_WIDTH * 2}
        strokeLinecap="round"
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={fill}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </>
  )
}

/**
 * A minimal, faceless human silhouette (ADR-010 in docs/DECISIONS.md).
 * Purely presentational: geometry only, no scene data, no pose logic. Every
 * shape carries a thin `silhouette.rim` edge (`design/palette.ts`) so the
 * figure separates from the backdrop without brightening the scene itself.
 */
export function Silhouette({ shape, className }: SilhouetteProps) {
  const g = SHAPES[shape]
  const fill = palette.silhouette.fill
  const rim = palette.silhouette.rim

  return (
    <svg
      viewBox="0 0 120 320"
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <Limb coords={g.legLeft} strokeWidth={g.legStrokeWidth} fill={fill} rim={rim} />
      <Limb coords={g.legRight} strokeWidth={g.legStrokeWidth} fill={fill} rim={rim} />
      <ellipse
        cx={g.legLeft[2]}
        cy={g.legLeft[3] + 2}
        rx={g.footRx}
        ry={g.footRy}
        fill={fill}
        stroke={rim}
        strokeWidth={RIM_WIDTH}
      />
      <ellipse
        cx={g.legRight[2]}
        cy={g.legRight[3] + 2}
        rx={g.footRx}
        ry={g.footRy}
        fill={fill}
        stroke={rim}
        strokeWidth={RIM_WIDTH}
      />
      <Limb coords={g.armLeft} strokeWidth={g.armStrokeWidth} fill={fill} rim={rim} />
      <Limb coords={g.armRight} strokeWidth={g.armStrokeWidth} fill={fill} rim={rim} />
      <polygon
        points={g.torsoPoints}
        fill={fill}
        stroke={rim}
        strokeWidth={RIM_WIDTH}
        strokeLinejoin="round"
      />
      <circle cx={60} cy={g.headCy} r={g.headR} fill={fill} stroke={rim} strokeWidth={RIM_WIDTH} />
    </svg>
  )
}
