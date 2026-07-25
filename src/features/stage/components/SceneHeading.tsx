import { fontFamily, typeScale, palette, layers, spacing } from '@design'

export interface SceneHeadingProps {
  slugline: string
}

/** Screenplay-style slugline card, pinned to the top-left of the stage. */
export function SceneHeading({ slugline }: SceneHeadingProps) {
  return (
    <div
      className="absolute left-0 top-0"
      style={{
        zIndex: layers.overlayText,
        padding: `${spacing.md} ${spacing.lg}`,
        fontFamily: fontFamily.mono,
        color: palette.text.body,
        textTransform: 'uppercase',
        ...typeScale.slugline,
      }}
    >
      {slugline}
    </div>
  )
}
