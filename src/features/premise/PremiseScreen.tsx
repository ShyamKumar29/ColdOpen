import { useState } from 'react'
import type { FormEvent } from 'react'
import { palette, typeScale, spacing, fontFamily, stage as stageTokens } from '@design'
import { useColdOpenStore } from '@store'
import { PremiseInput } from './components/PremiseInput'
import { ExampleChips } from './components/ExampleChips'
import { DirectButton } from './components/DirectButton'

const EXAMPLE_PREMISES = [
  'A thief returns to the museum she once robbed, now working security.',
  'Two rival chefs are trapped in the same walk-in freezer during a blackout.',
  'A retired gunslinger is asked to take one last job by the town he swore off.',
] as const

/**
 * Stateful orchestrator owning the premise textarea's local input state
 * (docs/ARCHITECTURE.md section 6). Submitting hands the premise to the
 * store and flips `status` to `generating`, which is all `DirectorRoom`
 * needs to swap in `WritingRoom`.
 */
export function PremiseScreen() {
  const [premise, setPremiseInput] = useState('')
  const setPremise = useColdOpenStore((state) => state.setPremise)
  const setStatus = useColdOpenStore((state) => state.setStatus)

  const trimmed = premise.trim()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmed) return
    setPremise(trimmed)
    setStatus('generating')
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: palette.background.app, padding: spacing.xl }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col"
        style={{ maxWidth: stageTokens.maxWidth, gap: spacing.lg }}
      >
        <header>
          <p
            style={{
              ...typeScale.eyebrow,
              color: palette.text.muted,
              fontFamily: fontFamily.mono,
              textTransform: 'uppercase',
            }}
          >
            Cold Open
          </p>
          <h1
            style={{
              ...typeScale.title,
              color: palette.text.heading,
              fontFamily: fontFamily.mono,
            }}
          >
            One sentence. One scene.
          </h1>
        </header>

        <PremiseInput value={premise} onChange={setPremiseInput} />
        <ExampleChips examples={EXAMPLE_PREMISES} onSelect={setPremiseInput} />

        <div>
          <DirectButton disabled={!trimmed} />
        </div>
      </form>
    </div>
  )
}
