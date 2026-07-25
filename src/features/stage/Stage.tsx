import { palette, lightingTokens, stage as stageTokens } from '@design'
import type { SceneScript } from '@schema'
import { useCastRoster } from '@hooks'
import { Backdrop } from './components/Backdrop'
import { StageFloor } from './components/StageFloor'
import { ActorLayer } from './components/ActorLayer'
import { LightingRig } from './components/LightingRig'
import { GrainVignette } from './components/GrainVignette'
import { Letterbox } from './components/Letterbox'
import { SceneHeading } from './components/SceneHeading'
import { deriveInitialLighting } from './deriveStaticFrame'

export interface StageProps {
  script: SceneScript
}

/**
 * The cinematic viewport: a still frame composed from a validated
 * `SceneScript`. Owns no data — every visual is derived from `script`
 * (CLAUDE.md's "renderer consumes validated JSON only" rule).
 */
export function Stage({ script }: StageProps) {
  useCastRoster(script)

  const preset = deriveInitialLighting(script)
  const vignetteStrength = lightingTokens[preset].vignette

  return (
    <div
      className="relative w-full overflow-hidden border"
      style={{
        aspectRatio: stageTokens.aspectRatio,
        maxWidth: stageTokens.maxWidth,
        borderColor: palette.border.subtle,
        background: palette.background.stage,
      }}
    >
      <SceneHeading slugline={script.scene.slugline} />
      <Backdrop
        setting={script.scene.setting}
        timeOfDay={script.scene.timeOfDay}
        weather={script.scene.weather}
      />
      <StageFloor />
      <ActorLayer />
      <LightingRig preset={preset} />
      <GrainVignette vignetteStrength={vignetteStrength} />
      <Letterbox />
    </div>
  )
}
