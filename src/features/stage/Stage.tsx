import { palette, lightingTokens, stage as stageTokens } from '@design'
import type { AnimationEngine } from '@engines/animation'
import type { CameraRig } from '@engines/camera'
import type { SceneScript } from '@schema'
import { useCastRoster } from '@hooks'
import { useColdOpenStore } from '@store'
import { SubtitleOverlay } from '@features/subtitles'
import { Backdrop } from './components/Backdrop'
import { StageFloor } from './components/StageFloor'
import { ActorLayer } from './components/ActorLayer'
import { LightingRig } from './components/LightingRig'
import { CameraFrame } from './components/CameraFrame'
import { GrainVignette } from './components/GrainVignette'
import { Letterbox } from './components/Letterbox'
import { SceneHeading } from './components/SceneHeading'
import { deriveInitialLighting } from './deriveStaticFrame'

export interface StageProps {
  script: SceneScript
  animations: AnimationEngine
  camera: CameraRig
}

/**
 * The cinematic viewport: a still frame composed from a validated
 * `SceneScript`. Owns no data — every visual is derived from `script`
 * (CLAUDE.md's "renderer consumes validated JSON only" rule) or the
 * playback state the Scene Controller writes into the store. Every
 * in-scene layer (backdrop, floor, actors, lighting) mounts inside
 * `<CameraFrame>` so a camera move carries them together (ADR-013);
 * non-diegetic chrome (heading, grain/vignette, subtitles, letterbox)
 * stays outside it.
 */
export function Stage({ script, animations, camera }: StageProps) {
  useCastRoster(script)

  const currentLighting = useColdOpenStore((state) => state.currentLighting)
  const currentLightingTransition = useColdOpenStore((state) => state.currentLightingTransition)
  const currentLightingDurationMs = useColdOpenStore((state) => state.currentLightingDurationMs)
  const preset = currentLighting ?? deriveInitialLighting(script)
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
      <CameraFrame camera={camera}>
        <Backdrop
          setting={script.scene.setting}
          timeOfDay={script.scene.timeOfDay}
          weather={script.scene.weather}
        />
        <StageFloor />
        <ActorLayer animations={animations} />
        <LightingRig
          preset={preset}
          transition={currentLightingTransition}
          durationMs={currentLightingDurationMs}
        />
      </CameraFrame>
      <GrainVignette vignetteStrength={vignetteStrength} />
      <SubtitleOverlay cast={script.cast} />
      <Letterbox />
    </div>
  )
}
