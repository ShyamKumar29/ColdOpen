import { motion } from 'framer-motion'
import { silhouetteTokens, stageSlotPositions, DEFAULT_BUILD, stage as stageTokens } from '@design'
import type { CastMember } from '@engines/character'
import type { AnimationEngine } from '@engines/animation'
import { Silhouette } from './Silhouette'

export interface ActorProps {
  member: CastMember
  animations: AnimationEngine
}

/**
 * A single cast member on stage: slot position, facing, and build-driven
 * scale, all derived from the `SceneScript` (CLAUDE.md Milestone 1 scope) —
 * plus, as of Milestone 3, smooth entrance/exit opacity and a subtle
 * pose-driven scale/settle, both read from the Animation Engine's
 * `MotionValue`s rather than any local state. Only `transform`/`opacity`
 * are animated (CLAUDE.md Animation Rules); the build-derived flip/scale
 * stays a plain static transform on its own node so it never fights the
 * pose transition for the same CSS property.
 */
export function Actor({ member, animations }: ActorProps) {
  const token = silhouetteTokens[member.character.build ?? DEFAULT_BUILD]
  const leftPercent = stageSlotPositions[member.slot ?? 'center']
  const flip = member.facing === 'left' ? -1 : 1
  const handle = animations.ensure(member.character.id)

  return (
    <motion.div
      className="absolute bottom-0 flex h-full items-end justify-center"
      style={{
        left: `${leftPercent}%`,
        width: '16%',
        x: '-50%',
        y: handle.poseTranslateY,
        opacity: handle.opacity,
      }}
    >
      <div
        style={{
          width: '100%',
          height: `${stageTokens.actorHeightFraction * 100}%`,
          transform: `scale(${token.scaleX * flip}, 1)`,
          transformOrigin: 'bottom center',
        }}
      >
        <motion.div
          className="h-full w-full"
          style={{ scale: handle.poseScale, transformOrigin: 'bottom center' }}
        >
          <Silhouette shape={token.shape} heightScale={token.scaleY} className="h-full w-full" />
        </motion.div>
      </div>
    </motion.div>
  )
}
