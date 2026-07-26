import { useEffect } from 'react'
import { useColdOpenStore } from '@store'
import { useReducedMotionPreference } from '@hooks'
import { StageScreen } from '@features/stage'
import { heistLibrary } from '@scenes'

/**
 * App shell (docs/ARCHITECTURE.md section 5) — wiring only. Milestone 1
 * loads the seed script directly since Groq and the seed-fallback chain
 * are Milestone 6 scope; the store is still the single source of truth the
 * Stage renders from.
 */
function App() {
  const script = useColdOpenStore((state) => state.script)
  const setScript = useColdOpenStore((state) => state.setScript)
  const setStatus = useColdOpenStore((state) => state.setStatus)

  useReducedMotionPreference()

  useEffect(() => {
    setScript(heistLibrary)
    setStatus('ready')
  }, [setScript, setStatus])

  if (!script) return null

  return <StageScreen script={script} />
}

export default App
