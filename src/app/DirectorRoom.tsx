import { useColdOpenStore } from '@store'
import { PremiseScreen, WritingRoom } from '@features/premise'
import { StageScreen } from '@features/stage'

/**
 * The only phase-branching component (docs/ARCHITECTURE.md section 6, rule
 * 1). Branches purely on `SceneSlice.status`: `idle` shows the premise
 * input, `generating` shows the writing room, `ready` mounts the Stage.
 * `failed` also falls back to the premise screen so a genuinely
 * unrecoverable error (the seed script itself failing validation, which
 * should never happen) never leaves the app stuck rather than breaking the
 * demo (ADR-015 in docs/DECISIONS.md).
 */
export function DirectorRoom() {
  const script = useColdOpenStore((state) => state.script)
  const status = useColdOpenStore((state) => state.status)
  const premise = useColdOpenStore((state) => state.premise)

  if (status === 'ready' && script) {
    return <StageScreen script={script} />
  }

  if (status === 'generating' && premise) {
    return <WritingRoom premise={premise} />
  }

  return <PremiseScreen />
}
