import { palette, fontFamily, typeScale, spacing, stage as stageTokens } from '@design'
import type { SceneScript } from '@schema'
import { useSceneController } from '@hooks'
import { useColdOpenStore } from '@store'
import { TransportControls, MusicControls } from '@features/transport'
import { Stage } from './Stage'

export interface StageScreenProps {
  script: SceneScript
}

/**
 * The screen-level composition around the stage viewport: title, the
 * cinematic frame itself, and the transport HUD. Owns the Scene Controller
 * for this playback session via `useSceneController`.
 */
export function StageScreen({ script }: StageScreenProps) {
  const { controller, animations, camera } = useSceneController(script)
  const phase = useColdOpenStore((state) => state.phase)
  const muted = useColdOpenStore((state) => state.muted)
  const musicVolume = useColdOpenStore((state) => state.musicVolume)
  const setMuted = useColdOpenStore((state) => state.setMuted)
  const setMusicVolume = useColdOpenStore((state) => state.setMusicVolume)

  return (
    <div
      className="flex min-h-screen flex-col items-center"
      style={{ background: palette.background.app, padding: spacing.xl, gap: spacing.lg }}
    >
      <header className="w-full" style={{ maxWidth: stageTokens.maxWidth }}>
        <p
          style={{
            ...typeScale.eyebrow,
            color: palette.text.muted,
            fontFamily: fontFamily.mono,
            textTransform: 'uppercase',
          }}
        >
          Cold Open
        </p>
        <h1
          style={{ ...typeScale.title, color: palette.text.heading, fontFamily: fontFamily.mono }}
        >
          {script.title}
        </h1>
      </header>

      <Stage script={script} animations={animations} camera={camera} />

      <footer
        className="flex w-full items-center justify-between"
        style={{ maxWidth: stageTokens.maxWidth }}
      >
        <span
          style={{
            ...typeScale.label,
            color: palette.text.muted,
            fontFamily: fontFamily.mono,
            textTransform: 'uppercase',
          }}
        >
          {script.genre} &middot; {script.mood}
        </span>
        <div className="flex items-center" style={{ gap: spacing.lg }}>
          <MusicControls
            muted={muted}
            volume={musicVolume}
            onToggleMuted={() => setMuted(!muted)}
            onVolumeChange={setMusicVolume}
          />
          <TransportControls phase={phase} controller={controller} />
        </div>
      </footer>
    </div>
  )
}
