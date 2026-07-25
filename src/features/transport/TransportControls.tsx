import { palette, typeScale, spacing, fontFamily } from '@design'
import type { Phase } from '@engines/controller'
import type { SceneController } from '@engines/controller'

export interface TransportControlsProps {
  phase: Phase
  controller: SceneController
}

const baseButtonStyle = {
  ...typeScale.label,
  fontFamily: fontFamily.mono,
  background: 'transparent',
  border: `1px solid ${palette.border.faint}`,
  padding: `${spacing.xs} ${spacing.md}`,
  textTransform: 'uppercase' as const,
}

const enabledButtonStyle = {
  ...baseButtonStyle,
  color: palette.text.heading,
  cursor: 'pointer' as const,
}
const disabledButtonStyle = {
  ...baseButtonStyle,
  color: palette.text.muted,
  cursor: 'not-allowed' as const,
}

/**
 * The transport HUD (docs/ARCHITECTURE.md section 6 — "TransportBar,
 * dispatches to controller, stateless"). Every button calls the
 * `SceneController` directly; it never touches renderer state or the store.
 */
export function TransportControls({ phase, controller }: TransportControlsProps) {
  const isIdle = phase === 'idle'
  const isPlaying = phase === 'playing'
  const isPaused = phase === 'paused'

  return (
    <div className="flex items-center" style={{ gap: spacing.sm }}>
      {isPaused ? (
        <button type="button" style={enabledButtonStyle} onClick={() => controller.resume()}>
          &#9654; Resume
        </button>
      ) : (
        <button
          type="button"
          style={isIdle ? disabledButtonStyle : enabledButtonStyle}
          disabled={isIdle}
          onClick={() => controller.play()}
        >
          &#9654; Play
        </button>
      )}
      <button
        type="button"
        style={isPlaying ? enabledButtonStyle : disabledButtonStyle}
        disabled={!isPlaying}
        onClick={() => controller.pause()}
      >
        &#10073;&#10073; Pause
      </button>
      <button
        type="button"
        style={isIdle ? disabledButtonStyle : enabledButtonStyle}
        disabled={isIdle}
        onClick={() => controller.stop()}
      >
        &#9632; Stop
      </button>
      <button
        type="button"
        style={isIdle ? disabledButtonStyle : enabledButtonStyle}
        disabled={isIdle}
        onClick={() => controller.restart()}
      >
        &#8635; Restart
      </button>
    </div>
  )
}
