import { palette, typeScale, spacing, fontFamily } from '@design'
import type { ScenePreview } from '@ai'

export interface TypewriterScriptProps {
  preview: ScenePreview
  reducedMotion: boolean
}

/**
 * Renders whatever the tolerant preview parser could make out of the
 * in-progress stream — display-only, never validated
 * (docs/ARCHITECTURE.md section 3). The blinking cursor is the only
 * "continuous" motion here, so it's the only thing gated on
 * `prefers-reduced-motion` (CLAUDE.md Accessibility Rules).
 */
export function TypewriterScript({ preview, reducedMotion }: TypewriterScriptProps) {
  return (
    <div className="flex flex-col" style={{ gap: spacing.sm }}>
      <p
        style={{
          ...typeScale.eyebrow,
          color: palette.text.muted,
          fontFamily: fontFamily.mono,
          textTransform: 'uppercase',
        }}
      >
        Writing Room{!reducedMotion && <span className="animate-pulse">&#9608;</span>}
      </p>
      <h2 style={{ ...typeScale.title, color: palette.text.heading, fontFamily: fontFamily.mono }}>
        {preview.title ?? '...'}
      </h2>
      {preview.genre && (
        <p style={{ ...typeScale.label, color: palette.text.body, fontFamily: fontFamily.mono }}>
          {preview.genre}
        </p>
      )}
      {preview.slugline && (
        <p style={{ ...typeScale.slugline, color: palette.text.body, fontFamily: fontFamily.mono }}>
          {preview.slugline}
        </p>
      )}
      <p style={{ ...typeScale.label, color: palette.text.muted, fontFamily: fontFamily.mono }}>
        {preview.beatCount} beat{preview.beatCount === 1 ? '' : 's'} drafted&hellip;
      </p>
    </div>
  )
}
