import { useEffect, useState } from 'react'
import { createScene, parseScenePreview } from '@ai'
import type { ScenePreview } from '@ai'
import { useColdOpenStore } from '@store'

const EMPTY_PREVIEW: ScenePreview = { beatCount: 0 }

/**
 * Bridges `WritingRoom` to the `ai/` ingestion pipeline: kicks off
 * `createScene` for the given premise once, feeds every chunk into a local
 * `ScenePreview` for the typewriter (display-only, per
 * docs/ARCHITECTURE.md section 3), and writes the finished script into the
 * store through `sceneSlice`'s explicit actions when it resolves. Aborts
 * the in-flight request on unmount, the standard effect-cleanup pattern for
 * cancelling a stale fetch.
 */
export function useSceneGeneration(premise: string): ScenePreview {
  const setScript = useColdOpenStore((state) => state.setScript)
  const setStatus = useColdOpenStore((state) => state.setStatus)
  const [preview, setPreview] = useState<ScenePreview>(EMPTY_PREVIEW)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    createScene(premise, {
      signal: controller.signal,
      onChunk: (accumulatedRawText) => {
        if (!cancelled) setPreview(parseScenePreview(accumulatedRawText))
      },
      onStatusChange: (status) => {
        if (!cancelled) setStatus(status)
      },
    }).then(({ script }) => {
      // Applied together, in one state update, so `DirectorRoom` never
      // observes `status: 'ready'` with the previous (or no) script — see
      // the caution on `CreateSceneOptions.onStatusChange`.
      if (!cancelled) {
        setScript(script)
        setStatus('ready')
      }
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [premise, setScript, setStatus])

  return preview
}
