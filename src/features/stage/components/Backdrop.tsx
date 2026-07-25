import type { CSSProperties } from 'react'
import { environmentTokens, timeOfDayBrightness, layers } from '@design'
import type { EnvironmentMotif } from '@design'
import type { Setting, TimeOfDay, Weather } from '@schema'

/**
 * Repeating CSS patterns standing in for each environment's motif — no
 * image assets, per CLAUDE.md's SVG + CSS constraint. Grouped by visual
 * family rather than one bespoke pattern per setting.
 */
function motifStyle(motif: EnvironmentMotif): CSSProperties {
  switch (motif) {
    case 'shelves':
    case 'trunks':
    case 'brick':
      return {
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0 2px, transparent 2px 40px)',
      }
    case 'booths':
    case 'beams':
      return {
        backgroundImage:
          'repeating-linear-gradient(35deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 46px)',
      }
    case 'grid':
    case 'cubicles':
    case 'windows':
    case 'tiles':
      return {
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 48px), ' +
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 48px)',
      }
    case 'skyline':
      return {
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 18px, transparent 18px 34px)',
        backgroundPosition: 'bottom',
        backgroundSize: '100% 45%',
        backgroundRepeat: 'repeat-x',
      }
    case 'dunes':
      return {
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.3), transparent 70%)',
      }
    case 'flat':
    default:
      return {}
  }
}

const WEATHER_OVERLAY: Record<Weather, CSSProperties> = {
  clear: {},
  fog: {
    backgroundImage:
      'linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.06) 55%, transparent 100%)',
  },
  rain: {
    backgroundImage:
      'repeating-linear-gradient(100deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 10px)',
  },
  snow: {
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
  },
  storm: {
    backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.35), transparent 60%)',
  },
}

export interface BackdropProps {
  setting: Setting
  timeOfDay: TimeOfDay
  weather?: Weather
}

/** Static environment layer: horizon gradient, motif pattern, weather overlay. */
export function Backdrop({ setting, timeOfDay, weather }: BackdropProps) {
  const env = environmentTokens[setting]
  const brightness = timeOfDayBrightness[timeOfDay]

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: layers.backdrop,
        background: `linear-gradient(180deg, ${env.horizonTop} 0%, ${env.horizonBottom} 100%)`,
        filter: `brightness(${brightness})`,
      }}
    >
      <div className="absolute inset-0" style={motifStyle(env.motif)} />
      {weather && <div className="absolute inset-0" style={WEATHER_OVERLAY[weather]} />}
    </div>
  )
}
