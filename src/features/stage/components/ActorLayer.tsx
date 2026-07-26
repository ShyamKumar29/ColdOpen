import { useColdOpenStore } from '@store'
import { layers } from '@design'
import type { AnimationEngine } from '@engines/animation'
import { Actor } from './Actor'

export interface ActorLayerProps {
  animations: AnimationEngine
}

/**
 * Renders the current cast roster from the store — stable `character.id`
 * keys, always mounted (CLAUDE.md's remount-thrash note in
 * docs/DECISIONS.md's Animation risks table). Presence is opacity, not
 * mount/unmount: a character who hasn't entered yet (or has already exited)
 * simply has `animations` holding their opacity at 0.
 */
export function ActorLayer({ animations }: ActorLayerProps) {
  const roster = useColdOpenStore((state) => state.roster)

  return (
    <div className="absolute inset-0" style={{ zIndex: layers.actors }}>
      {roster.map((member) => (
        <Actor key={member.character.id} member={member} animations={animations} />
      ))}
    </div>
  )
}
