import { useColdOpenStore } from '@store'
import { layers } from '@design'
import { Actor } from './Actor'

/** Renders the current cast roster from the store — stable `character.id` keys. */
export function ActorLayer() {
  const roster = useColdOpenStore((state) => state.roster)

  return (
    <div className="absolute inset-0" style={{ zIndex: layers.actors }}>
      {roster.map((member) => (
        <Actor key={member.character.id} member={member} />
      ))}
    </div>
  )
}
