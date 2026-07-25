import { silhouetteTokens, stageSlotPositions, DEFAULT_BUILD } from '@design'
import type { CastMember } from '@engines/character'
import { Silhouette } from './Silhouette'

export interface ActorProps {
  member: CastMember
}

/**
 * A single cast member on stage: slot position, facing, and build-driven
 * scale, all derived from the `SceneScript` — no pixel coordinates, no
 * hardcoded scene data (CLAUDE.md Milestone 1 scope).
 */
export function Actor({ member }: ActorProps) {
  const token = silhouetteTokens[member.character.build ?? DEFAULT_BUILD]
  const leftPercent = stageSlotPositions[member.slot ?? 'center']
  const flip = member.facing === 'left' ? -1 : 1

  return (
    <div
      className="absolute bottom-0 flex h-full items-end justify-center"
      style={{ left: `${leftPercent}%`, width: '16%', transform: 'translateX(-50%)' }}
    >
      <div
        style={{
          width: '100%',
          height: '88%',
          transform: `scale(${token.scaleX * flip}, ${token.scaleY})`,
          transformOrigin: 'bottom center',
        }}
      >
        <Silhouette shape={token.shape} className="h-full w-full" />
      </div>
    </div>
  )
}
