import type { EventBus } from '@engines/bus'
import { compileTimeline } from '@engines/timeline'
import type { CueList } from '@engines/timeline'
import type { SceneScript } from '@schema'
import type { Phase, ClockSource, SpeechClockAdapter } from './types'

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
  /** Call when the Speech Engine reports `speech:end` for a character. No-op unless the controller is actively waiting on that character (ADR-022). */
  notifySpeechEnd(characterId: string): void
  /** Same handling as `notifySpeechEnd` — an error still counts as the utterance settling, so playback advances rather than stalling. */
  notifySpeechError(characterId: string): void
  /** Call when the Speech Engine reports `speech:unavailable`. Falls back to the timer clock, arming it immediately if a beat was mid-wait. */
  notifySpeechUnavailable(): void
}

const SPEECH_WATCHDOG_MULTIPLIER = 2

/**
 * The Director (docs/ARCHITECTURE.md section 4). Owns the beat sequencer,
 * phase machine, and the clock-source handoff (ADR-005): when speech is
 * available, a dialogue beat is held open until the Speech Engine reports
 * `speech:end`/`speech:error` for its speaker, instead of the estimated
 * timer duration; every other beat, and every beat when speech is
 * unavailable, still advances on the Milestone 2 timer.
 *
 * `speech` is an optional minimal adapter (ADR-021) — omitting it (as the
 * existing test suite does) keeps the controller purely timer-driven,
 * identical to its Milestone 2 behavior.
 *
 * `notifySpeechEnd`/`notifySpeechError`/`notifySpeechUnavailable` exist
 * instead of the controller subscribing to `speech:*` on `bus` itself
 * (ADR-022): a `bus.on(...)` call performed directly inside this factory
 * function would run during `useState`'s lazy initializer in the React
 * render phase, which StrictMode's dev-mode double-invoke calls twice,
 * permanently registering two live handlers on the one shared bus.
 * `useSceneController` calls these methods from its bus-subscribing
 * `useEffect` instead — the same safe, cleanup-on-unmount pattern every
 * other cue in this codebase already uses.
 *
 * Framework-independent: it only ever touches the compiled `CueList`, the
 * `EventBus`, and this narrow speech adapter. It never renders anything and
 * never reads or writes the Zustand store directly (CLAUDE.md Event Bus
 * Rules / State Management Rules) — a hook bridges its emissions into the
 * store.
 */
export function createSceneController(bus: EventBus, speech?: SpeechClockAdapter): SceneController {
  let phase: Phase = 'idle'
  let clockSource: ClockSource = 'timer'
  let beats: CueList = []
  let beatIndex = 0
  let remainingMs = 0
  let beatEnteredAt = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  /** The character the current beat is waiting on `speech:end`/`speech:error` from, or null when the timer is authoritative. */
  let awaitingSpeechFor: string | null = null

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

  /** Fires a beat's entry cues and arms `remainingMs` for its full duration. Does not start the clock. */
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

  /** Arms the clock for the current beat: waits on speech when it's a dialogue beat and the speech clock is active, otherwise the timer. A watchdog always backs the speech wait (ADR-005's "onend sometimes never fires" mitigation). */
  function scheduleAdvance(): void {
    clearTimer()
    beatEnteredAt = Date.now()
    const beat = beats[beatIndex]
    const speechCharacterId = beat?.speechCharacterId

    if (clockSource === 'speech' && speechCharacterId) {
      awaitingSpeechFor = speechCharacterId
      timer = setTimeout(completeCurrentBeatAndAdvance, remainingMs * SPEECH_WATCHDOG_MULTIPLIER)
    } else {
      awaitingSpeechFor = null
      timer = setTimeout(completeCurrentBeatAndAdvance, remainingMs)
    }
  }

  function completeCurrentBeatAndAdvance(): void {
    clearTimer()
    // `awaitingSpeechFor` is still set here only when this call came from
    // the speech-watchdog timer firing (`scheduleAdvance`'s speech-clock
    // branch) rather than a genuine `notifySpeechEnd`/`notifySpeechError`
    // settlement — `onSpeechSettled` clears it before calling this function.
    // A forced advance must stop the still-in-flight utterance itself, the
    // same as pause/stop/seek/restart already do, or the abandoned line
    // keeps playing audibly over the next beat's cues.
    const forcedByWatchdog = awaitingSpeechFor !== null
    awaitingSpeechFor = null
    if (forcedByWatchdog) speech?.cancel()
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
    if (phase === 'playing') scheduleAdvance()
  }

  function onSpeechSettled(characterId: string): void {
    if (phase === 'playing' && awaitingSpeechFor === characterId) {
      awaitingSpeechFor = null
      completeCurrentBeatAndAdvance()
    }
  }

  function notifySpeechUnavailable(): void {
    // Speech dropped out mid-scene: fall back to the timer from here on. If
    // a beat is actively waiting on speech, arm the timer immediately for
    // its remaining estimate so playback doesn't stall.
    clockSource = 'timer'
    if (phase === 'playing' && awaitingSpeechFor) scheduleAdvance()
  }

  function load(script: SceneScript): void {
    clearTimer()
    awaitingSpeechFor = null
    beats = compileTimeline(script)
    phase = 'ready'
    beatIndex = 0
    if (beats.length > 0) enterBeat(0)
  }

  function play(): void {
    if (beats.length === 0 || phase === 'playing') return
    if (phase === 'complete') enterBeat(0)
    clockSource = speech && speech.probeCapability() === 'available' ? 'speech' : 'timer'
    phase = 'playing'
    scheduleAdvance()
    bus.emit('transport:play', {})
  }

  function resume(): void {
    if (phase !== 'paused') return
    phase = 'playing'

    const beat = beats[beatIndex]
    const speechCue = beat?.cues.find((cue) => cue.kind === 'speech:request')
    // Web Speech can't reliably resume mid-utterance (ADR-021), so a
    // dialogue beat's line restarts from the top rather than pretending to
    // continue where it left off. Only the speech cue re-fires — not the
    // whole beat's entry cues — so subtitle/light/character state (already
    // correct from when the beat was first entered) isn't visibly redone.
    if (clockSource === 'speech' && speechCue) bus.emit(speechCue.kind, speechCue.payload)

    scheduleAdvance()
    bus.emit('transport:play', {})
  }

  function pause(): void {
    if (phase !== 'playing') return
    remainingMs = Math.max(0, remainingMs - (Date.now() - beatEnteredAt))
    clearTimer()
    if (awaitingSpeechFor) {
      speech?.cancel()
      awaitingSpeechFor = null
    }
    phase = 'paused'
    bus.emit('transport:pause', {})
  }

  function stop(): void {
    clearTimer()
    awaitingSpeechFor = null
    speech?.cancel()
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
    awaitingSpeechFor = null
    speech?.cancel()
    enterBeat(0)
    phase = 'playing'
    scheduleAdvance()
    bus.emit('transport:restart', {})
  }

  function seek(targetIndex: number): void {
    if (beats.length === 0) return
    const clamped = Math.max(0, Math.min(targetIndex, beats.length - 1))
    const wasPlaying = phase === 'playing'
    const wasComplete = phase === 'complete'

    clearTimer()
    awaitingSpeechFor = null
    speech?.cancel()
    enterBeat(clamped)

    if (wasPlaying) {
      phase = 'playing'
      scheduleAdvance()
    } else if (wasComplete) {
      phase = 'paused'
    }
  }

  function destroy(): void {
    clearTimer()
    speech?.cancel()
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
    notifySpeechEnd: onSpeechSettled,
    notifySpeechError: onSpeechSettled,
    notifySpeechUnavailable,
  }
}
