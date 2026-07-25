import { palette, fontFamily, typeScale, spacing, stage as stageTokens } from '@design'
import type { SceneScript } from '@schema'
import { useSceneController } from '@hooks'
import { useColdOpenStore } from '@store'
import { TransportControls } from '@features/transport'
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
  const controller = useSceneController(script)
  const phase = useColdOpenStore((state) => state.phase)

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

      <Stage script={script} />

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
        <TransportControls phase={phase} controller={controller} />
      </footer>
    </div>
  )
}
