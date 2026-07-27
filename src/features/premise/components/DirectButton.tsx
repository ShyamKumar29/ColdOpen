import { palette, typeScale, spacing, fontFamily } from '@design'

export interface DirectButtonProps {
  disabled?: boolean
}

/**
 * The submit gesture (docs/ARCHITECTURE.md section 3: "AudioContext + TTS
 * unlock gesture"). A plain `<button type="submit">` inside `PremiseScreen`'s
 * `<form>` — its click is what `PremiseScreen.handleSubmit` uses to call
 * `unlockAudio()`, since the Music Engine isn't constructed until later
 * (`StageScreen` mounts once the scene is ready), well outside this click's
 * own call stack.
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
