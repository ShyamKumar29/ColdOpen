import { palette, typeScale, spacing, fontFamily, borders } from '@design'

export interface PremiseInputProps {
  value: string
  onChange: (value: string) => void
}

const MAX_LENGTH = 200

/**
 * Stateless textarea for the premise — the only state it holds is what its
 * parent (`PremiseScreen`) passes in and hands back (CLAUDE.md React
 * Rules: "props are the only way data enters a stateless component").
 */
export function PremiseInput({ value, onChange }: PremiseInputProps) {
  return (
    <label className="flex w-full flex-col" style={{ gap: spacing.xs }}>
      <span
        style={{
          ...typeScale.eyebrow,
          color: palette.text.muted,
          fontFamily: fontFamily.mono,
          textTransform: 'uppercase',
        }}
      >
        Premise
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_LENGTH}
        rows={3}
        placeholder="A thief returns to the museum she once robbed, now working security..."
        autoFocus
        style={{
          ...typeScale.body,
          fontFamily: fontFamily.mono,
          color: palette.text.heading,
          background: palette.background.panel,
          border: `${borders.width} solid ${palette.border.subtle}`,
          borderRadius: borders.radius,
          padding: spacing.md,
          resize: 'none',
        }}
      />
    </label>
  )
}
