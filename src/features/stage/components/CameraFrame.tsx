import type { ReactNode } from 'react'
import { motion, useTransform } from 'framer-motion'
import type { CameraRig } from '@engines/camera'

export interface CameraFrameProps {
  camera: CameraRig
  children: ReactNode
}

/**
 * The single composited transform wrapper (ADR-013, docs/ARCHITECTURE.md
 * section 6): every in-scene layer (backdrop, floor, actors, lighting)
 * mounts inside here so a camera move always moves them together, in sync,
 * on one GPU-compositable `transform` — never per-child transforms.
 * Non-diegetic chrome (slugline card, subtitles, letterbox, grain/vignette)
 * stays outside, siblings of this frame in `<Stage>`.
 */
export function CameraFrame({ camera, children }: CameraFrameProps) {
  const xPercent = useTransform(camera.x, (value) => `${value}%`)
  const yPercent = useTransform(camera.y, (value) => `${value}%`)

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x: xPercent, y: yPercent, scale: camera.zoom }}
    >
      {children}
    </motion.div>
  )
}
