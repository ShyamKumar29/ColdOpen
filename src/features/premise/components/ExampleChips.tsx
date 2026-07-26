import { palette, typeScale, spacing, fontFamily, borders } from '@design'

export interface ExampleChipsProps {
  examples: readonly string[]
  onSelect: (example: string) => void
}

/**
 * Stateless row of premise suggestions. Selecting one fills the input; it
 * never submits on its own, so the user can still edit before directing.
 */
export function ExampleChips({ examples, onSelect }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap" style={{ gap: spacing.xs }}>
      {examples.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onSelect(example)}
          style={{
            ...typeScale.label,
            fontFamily: fontFamily.mono,
            color: palette.text.body,
            background: 'transparent',
            border: `${borders.width} solid ${palette.border.faint}`,
            borderRadius: borders.radius,
            padding: `${spacing.xs} ${spacing.sm}`,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {example}
        </button>
      ))}
    </div>
  )
}
