import { layers } from '@design'

/**
 * A static, pre-composed noise tile encoded once as a data URI. It never
 * regenerates or animates, so it stays a static-layer filter rather than a
 * live per-frame one (CLAUDE.md Performance Rules).
 */
const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>"

const GRAIN_DATA_URI = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`

export interface GrainVignetteProps {
  vignetteStrength: number
}

/** Vignette + film grain, layered above lighting and below the letterbox. */
export function GrainVignette({ vignetteStrength }: GrainVignetteProps) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: layers.vignette,
          background: `radial-gradient(ellipse 78% 78% at 50% 50%, transparent 42%, rgba(0,0,0,${vignetteStrength}) 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: layers.grain,
          backgroundImage: GRAIN_DATA_URI,
          backgroundSize: '120px 120px',
          opacity: 0.22,
          mixBlendMode: 'overlay',
        }}
      />
    </>
  )
}
