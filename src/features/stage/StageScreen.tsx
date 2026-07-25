import { palette, fontFamily, typeScale, spacing, stage as stageTokens } from '@design'
import type { SceneScript } from '@schema'
import { Stage } from './Stage'

export interface StageScreenProps {
  script: SceneScript
}

/**
 * The screen-level composition around the stage viewport: title, the
 * cinematic frame itself, and a minimal (non-functional) control area.
 * Real transport lands in `features/transport` starting Milestone 2.
 */
export function StageScreen({ script }: StageScreenProps) {
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
        <button
          type="button"
          disabled
          style={{
            ...typeScale.label,
            fontFamily: fontFamily.mono,
            color: palette.text.muted,
            border: `1px solid ${palette.border.faint}`,
            padding: `${spacing.xs} ${spacing.md}`,
            textTransform: 'uppercase',
            cursor: 'not-allowed',
          }}
        >
          &#9654; Play &mdash; Milestone 2
        </button>
      </footer>
    </div>
  )
}
