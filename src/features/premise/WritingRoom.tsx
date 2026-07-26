import { palette, spacing, stage as stageTokens } from '@design'
import { useSceneGeneration } from '@hooks'
import { useColdOpenStore } from '@store'
import { TypewriterScript } from './components/TypewriterScript'

export interface WritingRoomProps {
  premise: string
}

/**
 * Stateful orchestrator owning the streaming preview
 * (docs/ARCHITECTURE.md section 6). `useSceneGeneration` runs `createScene`
 * for `premise` exactly once per mount and returns the latest tolerant
 * preview; when generation resolves, the store's `script`/`status` update
 * and `DirectorRoom` swaps this out for the Stage.
 */
export function WritingRoom({ premise }: WritingRoomProps) {
  const preview = useSceneGeneration(premise)
  const reducedMotion = useColdOpenStore((state) => state.reducedMotion)

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: palette.background.app, padding: spacing.xl }}
    >
      <div className="w-full" style={{ maxWidth: stageTokens.maxWidth }}>
        <TypewriterScript preview={preview} reducedMotion={reducedMotion} />
      </div>
    </div>
  )
}
