import { layers, palette } from '@design'

/** The stage floor plane: a subtle horizon line actors stand on. */
export function StageFloor() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0"
      style={{
        zIndex: layers.floor,
        height: '22%',
        borderTop: `1px solid ${palette.border.strong}`,
        background: `linear-gradient(180deg, transparent 0%, ${palette.background.app} 100%)`,
      }}
    />
  )
}
