import { layers, palette, stage as stageTokens } from '@design'

/** Cinematic letterbox bars, framing the stage top and bottom. */
export function Letterbox() {
  const barStyle = {
    zIndex: layers.letterbox,
    height: `${stageTokens.letterboxFraction * 100}%`,
    background: palette.background.app,
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0" style={barStyle} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={barStyle} />
    </>
  )
}
