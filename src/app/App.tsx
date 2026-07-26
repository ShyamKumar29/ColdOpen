import { useReducedMotionPreference } from '@hooks'
import { DirectorRoom } from './DirectorRoom'

/**
 * App shell (docs/ARCHITECTURE.md section 5) — wiring only. `DirectorRoom`
 * owns every phase decision from premise entry through playback.
 */
function App() {
  useReducedMotionPreference()

  return <DirectorRoom />
}

export default App
