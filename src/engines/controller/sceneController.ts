import type { EventBus } from '@engines/bus'
import { compileTimeline } from '@engines/timeline'
import type { CueList } from '@engines/timeline'
import type { SceneScript } from '@schema'
import type { Phase, ClockSource } from './types'

export interface SceneController {
  getPhase(): Phase
  getClockSource(): ClockSource
  getBeatIndex(): number
  /** Cumulative duration of every beat fully played before the current one (ADR-004: discrete, not a 60Hz clock). */
  getElapsedMs(): number
  /** Compiles the timeline and enters beat 0 without starting the clock. */
  load(script: SceneScript): void
  /** Starts from the current position, or restarts from beat 0 if the scene already finished. */
  play(): void
  /** Continues from where `pause()` left off. No-op unless paused. */
  resume(): void
  pause(): void
  /** Halts and returns to beat 0 without playing. */
  stop(): void
  restart(): void
  /** Jumps to a beat, clamped to the timeline bounds, firing that beat's entry cues immediately. */
  seek(beatIndex: number): void
  /** Clears any pending timer. Call on unmount. */
  destroy(): void
}

/**
 * The Director (docs/ARCHITECTURE.md section 4). Owns the beat sequencer,
 * phase machine, and the timer clock (ADR-005 — speech becomes the clock
 * master in Milestone 3; this milestone is the timer-only foundation).
 *
 * Framework-independent: it only ever touches the compiled `CueList` and
 * the `EventBus`. It never renders anything and never reads or writes the
 * Zustand store directly (CLAUDE.md Event Bus Rules / State Management
 * Rules) — a hook bridges its emissions into the store.
 */
export function createSceneController(bus: EventBus): SceneController {
  let phase: Phase = 'idle'
  const clockSource: ClockSource = 'timer'
  let beats: CueList = []
  let beatIndex = 0
  let remainingMs = 0
  let beatEnteredAt = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function cumulativeMsBefore(index: number): number {
    let total = 0
    for (let i = 0; i < index; i += 1) total += beats[i]?.durationMs ?? 0
    return total
  }

  /** Fires a beat's entry cues and arms `remainingMs` for its full duration. Does not start the timer. */
  function enterBeat(index: number): void {
    beatIndex = index
    const beat = beats[beatIndex]
    if (!beat) return

    bus.emit('beat:enter', { index: beatIndex })
    for (const cue of beat.cues) {
      bus.emit(cue.kind, cue.payload)
    }
    bus.emit('beat:cues-fired', { index: beatIndex })

    remainingMs = beat.durationMs
    beatEnteredAt = Date.now()
  }

  function scheduleTimer(): void {
    clearTimer()
    beatEnteredAt = Date.now()
    timer = setTimeout(completeCurrentBeatAndAdvance, remainingMs)
  }

  function completeCurrentBeatAndAdvance(): void {
    timer = null
    const finishedIndex = beatIndex
    bus.emit('beat:complete', { index: finishedIndex })
    bus.emit('beat:exit', { index: finishedIndex })

    const nextIndex = finishedIndex + 1
    if (nextIndex >= beats.length) {
      phase = 'complete'
      bus.emit('transport:complete', {})
      return
    }

    enterBeat(nextIndex)
    if (phase === 'playing') scheduleTimer()
  }

  function load(script: SceneScript): void {
    clearTimer()
    beats = compileTimeline(script)
    phase = 'ready'
    beatIndex = 0
    if (beats.length > 0) enterBeat(0)
  }

  function play(): void {
    if (beats.length === 0 || phase === 'playing') return
    if (phase === 'complete') enterBeat(0)
    phase = 'playing'
    scheduleTimer()
    bus.emit('transport:play', {})
  }

  function resume(): void {
    if (phase !== 'paused') return
    phase = 'playing'
    scheduleTimer()
    bus.emit('transport:play', {})
  }

  function pause(): void {
    if (phase !== 'playing') return
    remainingMs = Math.max(0, remainingMs - (Date.now() - beatEnteredAt))
    clearTimer()
    phase = 'paused'
    bus.emit('transport:pause', {})
  }

  function stop(): void {
    clearTimer()
    if (beats.length > 0) {
      enterBeat(0)
      phase = 'ready'
    } else {
      phase = 'idle'
    }
    bus.emit('transport:stop', {})
  }

  function restart(): void {
    if (beats.length === 0) return
    clearTimer()
    enterBeat(0)
    phase = 'playing'
    scheduleTimer()
    bus.emit('transport:restart', {})
  }

  function seek(targetIndex: number): void {
    if (beats.length === 0) return
    const clamped = Math.max(0, Math.min(targetIndex, beats.length - 1))
    const wasPlaying = phase === 'playing'
    const wasComplete = phase === 'complete'

    clearTimer()
    enterBeat(clamped)

    if (wasPlaying) {
      phase = 'playing'
      scheduleTimer()
    } else if (wasComplete) {
      phase = 'paused'
    }
  }

  function destroy(): void {
    clearTimer()
  }

  return {
    getPhase: () => phase,
    getClockSource: () => clockSource,
    getBeatIndex: () => beatIndex,
    getElapsedMs: () => cumulativeMsBefore(beatIndex),
    load,
    play,
    resume,
    pause,
    stop,
    restart,
    seek,
    destroy,
  }
}
