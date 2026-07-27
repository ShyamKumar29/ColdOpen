import { palette, typeScale, spacing, fontFamily } from '@design'

export interface MusicControlsProps {
  muted: boolean
  volume: number
  onToggleMuted: () => void
  onVolumeChange: (volume: number) => void
}

/**
 * The music HUD (Milestone 7's "User Controls" requirement: mute toggle +
 * volume slider). Stateless — reads/writes nothing itself; `StageScreen`
 * wires it to `settingsSlice`, the same way `TransportControls` is wired to
 * the Scene Controller rather than owning state of its own.
 */
export function MusicControls({
  muted,
  volume,
  onToggleMuted,
  onVolumeChange,
}: MusicControlsProps) {
  return (
    <div className="flex items-center" style={{ gap: spacing.sm }}>
      <button
        type="button"
        aria-label={muted ? 'Unmute music' : 'Mute music'}
        aria-pressed={muted}
        onClick={onToggleMuted}
        style={{
          ...typeScale.label,
          fontFamily: fontFamily.mono,
          background: 'transparent',
          border: `1px solid ${palette.border.faint}`,
          color: muted ? palette.text.muted : palette.text.heading,
          padding: `${spacing.xs} ${spacing.md}`,
          textTransform: 'uppercase' as const,
          cursor: 'pointer' as const,
        }}
      >
        {muted ? '♯ Muted' : '♪ Music'}
      </button>
      <input
        type="range"
        aria-label="Music volume"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        disabled={muted}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        style={{ accentColor: palette.amber.base, cursor: muted ? 'not-allowed' : 'pointer' }}
      />
    </div>
  )
}
