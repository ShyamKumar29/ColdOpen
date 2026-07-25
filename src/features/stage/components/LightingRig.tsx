import { lightingTokens, layers } from '@design'
import type { LightingPreset } from '@schema'

export interface LightingRigProps {
  preset: LightingPreset
}

/** Lighting overlay: center glow + ambient tint, art-directed per preset (design/lighting.ts). */
export function LightingRig({ preset }: LightingRigProps) {
  const token = lightingTokens[preset]

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex: layers.lighting,
        background: [
          `radial-gradient(ellipse 60% 55% at 50% 40%, ${token.glow}3d 0%, transparent 62%)`,
          `linear-gradient(${token.ambient}59, ${token.ambient}59)`,
        ].join(', '),
        mixBlendMode: 'screen',
      }}
    />
  )
}
