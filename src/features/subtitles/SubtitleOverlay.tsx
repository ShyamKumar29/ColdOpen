import { palette, typeScale, fontFamily, spacing, layers } from '@design'
import type { Character } from '@schema'
import { useColdOpenStore } from '@store'

export interface SubtitleOverlayProps {
  cast: readonly Character[]
}

/**
 * Screenplay caption overlay (docs/ARCHITECTURE.md section 6). Reads the
 * current subtitle directly from the store — it is the one "current
 * caption only" piece of state the diagram calls out for this component —
 * and renders nothing when captions are off or there's nothing to show.
 */
export function SubtitleOverlay({ cast }: SubtitleOverlayProps) {
  const subtitle = useColdOpenStore((state) => state.currentSubtitle)
  const captionsOn = useColdOpenStore((state) => state.captionsOn)

  if (!captionsOn || !subtitle) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center text-center"
      style={{ zIndex: layers.overlayText, padding: spacing.lg, gap: spacing.xs }}
    >
      {subtitle.kind === 'slugline' ? (
        <p
          style={{
            ...typeScale.slugline,
            fontFamily: fontFamily.mono,
            color: palette.text.heading,
            textTransform: 'uppercase',
          }}
        >
          {subtitle.text}
        </p>
      ) : (
        <>
          {subtitle.characterId && (
            <span
              style={{
                ...typeScale.label,
                fontFamily: fontFamily.mono,
                color: palette.text.heading,
                textTransform: 'uppercase',
              }}
            >
              {cast.find((character) => character.id === subtitle.characterId)?.name ??
                subtitle.characterId}
              {subtitle.parenthetical ? ` (${subtitle.parenthetical})` : ''}
            </span>
          )}
          <p
            style={{
              ...typeScale.body,
              fontFamily: fontFamily.mono,
              color: palette.text.body,
              maxWidth: '32rem',
            }}
          >
            {subtitle.text}
          </p>
        </>
      )}
    </div>
  )
}
