import * as Tone from 'tone'
import { moodArrangementTokens, musicStateTokens, musicStingerTokens } from '@design'
import type { MusicState } from '@engines/bus'
import type { Mood, MusicStinger } from '@schema'
import type { ToneMusicAdapter } from './types'

const MIN_RAMP_SECONDS = 0.02

function chordFrequencies(mood: Mood): number[] {
  const token = moodArrangementTokens[mood]
  return token.chordIntervals.map((interval) =>
    Tone.Frequency(token.rootMidi + interval, 'midi').toFrequency(),
  )
}

/**
 * The only file that touches `Tone.js`/`AudioContext` directly (mirrors
 * `webSpeechAdapter.ts`'s isolation of `window.speechSynthesis`). A fixed,
 * reused set of nodes — one `PolySynth` pad, one bass voice, one stinger
 * voice, one filter, two gain stages — created once and retargeted for
 * every mood/state change, never recreated (CLAUDE.md Tone.js risk table —
 * "reuse a fixed set of synths across mood changes," "always ramp gain over
 * >=20ms"). Synthesis only, no samples (ADR-009).
 *
 * Signal chain: `pad`/`bass` -> `filter` -> `stateGain` (the arrangement's
 * own state-driven loudness) -> `duckGain` (dialogue ducking + user
 * volume/mute, set by `musicEngine.ts`) -> destination. Two gain stages so
 * ducking never fights with the crossfade's own volume automation.
 */
export function createToneMusicAdapter(): ToneMusicAdapter {
  let unlocked = false
  let heldMood: Mood | null = null

  const filter = new Tone.Filter(800, 'lowpass')
  const stateGain = new Tone.Gain(0)
  const duckGain = new Tone.Gain(1)
  const destination = Tone.getDestination()

  const pad = new Tone.PolySynth(Tone.Synth, {
    envelope: { attack: 1.2, decay: 0.3, sustain: 0.85, release: 2.2 },
  })
  const bass = new Tone.Synth({
    envelope: { attack: 0.6, decay: 0.2, sustain: 0.9, release: 1.5 },
  })
  const stinger = new Tone.Synth()

  pad.chain(filter, stateGain, duckGain, destination)
  bass.chain(filter, stateGain, duckGain, destination)
  stinger.connect(duckGain)

  let loop: Tone.Loop | null = null
  let crossfadeTimer: ReturnType<typeof setTimeout> | null = null

  function clearCrossfadeTimer(): void {
    if (crossfadeTimer !== null) {
      clearTimeout(crossfadeTimer)
      crossfadeTimer = null
    }
  }

  function setLoop(mood: Mood): void {
    loop?.dispose()
    const token = moodArrangementTokens[mood]
    Tone.getTransport().bpm.value = token.tempoBpm
    const rootFreq = Tone.Frequency(token.rootMidi - 12, 'midi').toFrequency()
    loop = new Tone.Loop((time) => {
      bass.triggerAttackRelease(rootFreq, '2n', time)
    }, '1m').start(0)
  }

  function applyVoices(mood: Mood): void {
    const token = moodArrangementTokens[mood]
    pad.set({ oscillator: { type: token.waveform } })
    bass.set({ oscillator: { type: token.waveform } })
    if (heldMood !== null) pad.releaseAll()
    pad.triggerAttack(chordFrequencies(mood))
    heldMood = mood
    setLoop(mood)
  }

  function applyStateLevel(state: MusicState, intensity: number, seconds: number): void {
    const token = musicStateTokens[state]
    const rampSeconds = Math.max(seconds, MIN_RAMP_SECONDS)
    const targetGain =
      token.volumeDb === null ? 0 : Tone.dbToGain(token.volumeDb + (intensity - 0.5) * 4)
    stateGain.gain.rampTo(targetGain, rampSeconds)

    const baseCutoff = moodArrangementTokens[heldMood ?? 'tense'].filterCutoffHz
    filter.frequency.rampTo(baseCutoff * token.filterMultiplier, rampSeconds)
  }

  return {
    isUnlocked: () => unlocked,
    unlock: async () => {
      if (unlocked) return
      await Tone.start()
      Tone.getTransport().start()
      unlocked = true
    },
    setArrangement(mood, state, intensity) {
      applyVoices(mood)
      applyStateLevel(state, intensity, MIN_RAMP_SECONDS)
    },
    crossfadeTo(mood, state, intensity, durationMs) {
      clearCrossfadeTimer()
      const seconds = Math.max(durationMs, MIN_RAMP_SECONDS * 1000) / 1000

      if (mood !== heldMood) {
        const half = seconds / 2
        stateGain.gain.rampTo(0, half)
        crossfadeTimer = setTimeout(() => {
          crossfadeTimer = null
          applyVoices(mood)
          applyStateLevel(state, intensity, half)
        }, half * 1000)
        return
      }

      applyStateLevel(state, intensity, seconds)
    },
    rampVolume(to, durationMs) {
      const clamped = Math.max(0, Math.min(1, to))
      duckGain.gain.rampTo(clamped, Math.max(durationMs, MIN_RAMP_SECONDS * 1000) / 1000)
    },
    sting(stingerName: MusicStinger) {
      const token = musicStingerTokens[stingerName]
      stinger.set({ oscillator: { type: token.waveform } })
      stinger.triggerAttackRelease(token.frequencyHz, token.durationSec)
    },
    pause() {
      Tone.getTransport().pause()
    },
    resume() {
      Tone.getTransport().start()
    },
    fadeOutAndStop(durationMs) {
      clearCrossfadeTimer()
      const seconds = Math.max(durationMs, MIN_RAMP_SECONDS * 1000) / 1000
      stateGain.gain.rampTo(0, seconds)
      crossfadeTimer = setTimeout(() => {
        crossfadeTimer = null
        pad.releaseAll()
        Tone.getTransport().stop()
        heldMood = null
      }, seconds * 1000)
    },
    stop() {
      clearCrossfadeTimer()
      pad.releaseAll()
      stateGain.gain.rampTo(0, 0.2)
      Tone.getTransport().stop()
      heldMood = null
    },
    dispose() {
      clearCrossfadeTimer()
      loop?.dispose()
      pad.dispose()
      bass.dispose()
      stinger.dispose()
      filter.dispose()
      stateGain.dispose()
      duckGain.dispose()
    },
  }
}
