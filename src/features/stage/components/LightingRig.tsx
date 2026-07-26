import { AnimatePresence, motion } from 'framer-motion'
import {
  lightingTokens,
  lightingTransitionTokens,
  reducedLightingTransitionTokens,
  layers,
} from '@design'
import type { LightingPreset, LightingTransition } from '@schema'
import { useColdOpenStore } from '@store'

export interface LightingRigProps {
  preset: LightingPreset
  transition: LightingTransition
  durationMs?: number
}

function backgroundFor(preset: LightingPreset): string {
  const token = lightingTokens[preset]
  return [
    `radial-gradient(ellipse 60% 55% at 50% 40%, ${token.glow}3d 0%, transparent 62%)`,
    `linear-gradient(${token.ambient}59, ${token.ambient}59)`,
  ].join(', ')
}

// `mixBlendMode: 'screen'` only ever lightens what's beneath it — painting
// black through `screen` is a no-op (`screen(base, black) === base`), so the
// `blackout` preset's near-black ambient/glow tokens never actually darken
// the stage under the blend mode every other preset uses. `blackout` alone
// renders as an opaque, normally-blended layer instead, so "cut-to-black"
// and blackout transitions actually read as black; every other preset's
// existing screen-blended look (Milestone 1) is untouched.
const BLACKOUT_STYLE = { background: '#000', mixBlendMode: 'normal' } as const

/**
 * Lighting overlay: center glow + ambient tint, art-directed per preset
 * (design/lighting.ts). Extended in Milestone 5 to crossfade between
 * presets rather than swap instantly — `preset` changing key triggers
 * Framer's mount/exit crossfade, animating only `opacity` (CLAUDE.md
 * Animation Rules) so the transition itself never touches a layout or
 * paint-heavy property beyond the two stacked layers' fade.
 */
export function LightingRig({ preset, transition, durationMs }: LightingRigProps) {
  const reducedMotion = useColdOpenStore((state) => state.reducedMotion)
  const tokens = reducedMotion ? reducedLightingTransitionTokens : lightingTransitionTokens
  const seconds = (durationMs ?? tokens[transition].durationMs) / 1000

  const flicker = transition === 'flicker' && !reducedMotion

  return (
    <AnimatePresence>
      <motion.div
        key={preset}
        className="pointer-events-none absolute inset-0"
        style={
          preset === 'blackout'
            ? { zIndex: layers.lighting, ...BLACKOUT_STYLE }
            : { zIndex: layers.lighting, background: backgroundFor(preset), mixBlendMode: 'screen' }
        }
        initial={{ opacity: transition === 'cut' ? 1 : 0 }}
        animate={{ opacity: flicker ? [0, 1, 0.4, 1] : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: seconds, ease: 'linear' }}
      />
    </AnimatePresence>
  )
}
