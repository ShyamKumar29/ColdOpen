import { palette, typeScale, spacing, fontFamily } from '@design'

export interface DirectButtonProps {
  disabled?: boolean
}

/**
 * The submit gesture (docs/ARCHITECTURE.md section 3: "AudioContext + TTS
 * unlock gesture"). A plain `<button type="submit">` inside `PremiseScreen`'s
 * `<form>` — this click is also the designated user gesture a future
 * Milestone 7 `Tone.start()` call hangs off, kept minimal here since no
 * audio engine exists yet (CLAUDE.md: stay within milestone scope).
 */
export function DirectButton({ disabled }: DirectButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        ...typeScale.label,
        fontFamily: fontFamily.mono,
        color: disabled ? palette.text.muted : palette.background.app,
        background: disabled ? 'transparent' : palette.amber.base,
        border: `1px solid ${disabled ? palette.border.faint : palette.amber.base}`,
        padding: `${spacing.sm} ${spacing.xl}`,
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Direct
    </button>
  )
}
