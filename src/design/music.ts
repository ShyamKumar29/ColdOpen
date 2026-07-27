import type { MusicState } from '@engines/bus'
import type { Mood, MusicStinger } from '@schema'

/**
 * Art direction for the Music Engine (docs/DECISIONS.md ADR-030), the same
 * pattern `design/camera.ts`/`design/pose.ts` already establish for their
 * engines' derived vocabularies: every enum value maps to a hand-tuned
 * value here, never inline in `engines/music`.
 *
 * `chordIntervals` are semitone offsets from `rootMidi` for a sustained pad
 * voicing (Tone.js resolves them to note names); `waveform` and
 * `filterCutoffHz` are the oscillator/filter starting point a `MusicState`
 * then scales. Values are deliberately restrained (a hackathon-lightweight
 * score, not a full orchestral arrangement) but distinct enough that two
 * moods are audibly different scenes.
 */
export interface MoodArrangementToken {
  rootMidi: number
  chordIntervals: readonly number[]
  tempoBpm: number
  filterCutoffHz: number
  waveform: OscillatorType
}

export const moodArrangementTokens: Record<Mood, MoodArrangementToken> = {
  tense: {
    rootMidi: 50,
    chordIntervals: [0, 3, 7, 10],
    tempoBpm: 100,
    filterCutoffHz: 800,
    waveform: 'sawtooth',
  },
  melancholy: {
    rootMidi: 45,
    chordIntervals: [0, 3, 7, 12],
    tempoBpm: 68,
    filterCutoffHz: 500,
    waveform: 'sine',
  },
  playful: {
    rootMidi: 60,
    chordIntervals: [0, 4, 7, 11],
    tempoBpm: 120,
    filterCutoffHz: 1800,
    waveform: 'triangle',
  },
  ominous: {
    rootMidi: 40,
    chordIntervals: [0, 1, 7, 10],
    tempoBpm: 58,
    filterCutoffHz: 350,
    waveform: 'sawtooth',
  },
  triumphant: {
    rootMidi: 48,
    chordIntervals: [0, 4, 7, 12],
    tempoBpm: 112,
    filterCutoffHz: 2000,
    waveform: 'sawtooth',
  },
  mysterious: {
    rootMidi: 42,
    chordIntervals: [0, 3, 6, 10],
    tempoBpm: 80,
    filterCutoffHz: 600,
    waveform: 'sine',
  },
  frantic: {
    rootMidi: 55,
    chordIntervals: [0, 3, 6, 9],
    tempoBpm: 142,
    filterCutoffHz: 1200,
    waveform: 'square',
  },
  tender: {
    rootMidi: 53,
    chordIntervals: [0, 4, 7, 11],
    tempoBpm: 74,
    filterCutoffHz: 700,
    waveform: 'sine',
  },
  hopeful: {
    rootMidi: 55,
    chordIntervals: [0, 4, 7, 12],
    tempoBpm: 96,
    filterCutoffHz: 1400,
    waveform: 'triangle',
  },
}

/**
 * How a `MusicState` modulates the current mood's arrangement — layered on
 * top of `moodArrangementTokens`, never replacing it, so "tense during the
 * climax" and "tense in the ambient stretch" share the same harmonic
 * identity at different intensities. `volumeDb` is attenuation relative to
 * the engine's full-scale master gain (0 = loudest this state gets); `null`
 * means fully silent (Tone.js `-Infinity` dB) rather than "very quiet."
 */
export interface MusicStateToken {
  volumeDb: number | null
  filterMultiplier: number
  tempoMultiplier: number
}

export const musicStateTokens: Record<MusicState, MusicStateToken> = {
  intro: { volumeDb: -10, filterMultiplier: 0.6, tempoMultiplier: 0.95 },
  ambient: { volumeDb: -6, filterMultiplier: 1, tempoMultiplier: 1 },
  tension: { volumeDb: -4, filterMultiplier: 1.2, tempoMultiplier: 1.05 },
  climax: { volumeDb: 0, filterMultiplier: 1.6, tempoMultiplier: 1.15 },
  resolution: { volumeDb: -8, filterMultiplier: 0.75, tempoMultiplier: 0.9 },
  silence: { volumeDb: null, filterMultiplier: 0.5, tempoMultiplier: 1 },
}

/** One-shot stinger voices (CLAUDE.md — Tone.js synthesis only, no samples). */
export interface MusicStingerToken {
  frequencyHz: number
  durationSec: number
  waveform: OscillatorType
}

export const musicStingerTokens: Record<MusicStinger, MusicStingerToken> = {
  hit: { frequencyHz: 65, durationSec: 0.25, waveform: 'square' },
  riser: { frequencyHz: 130, durationSec: 1.1, waveform: 'sawtooth' },
  boom: { frequencyHz: 45, durationSec: 0.6, waveform: 'sine' },
  chime: { frequencyHz: 660, durationSec: 0.8, waveform: 'triangle' },
  drone: { frequencyHz: 55, durationSec: 2, waveform: 'sawtooth' },
}

/**
 * Dialogue ducking (CLAUDE.md — "lower music slightly" under dialogue).
 * `musicDuckLevel` is a linear gain fraction of the current volume — matches
 * docs/ARCHITECTURE.md section 8's sequence diagram example verbatim
 * (`music:duck { to: 0.35 }`), not a dB value, so the Timeline Compiler's
 * cue payload is directly usable as a gain multiplier.
 */
export const musicDuckLevel = 0.35
export const musicDuckRampMs = 250
export const musicUnduckRampMs = 400

/** Crossfade on a `music:mood`/`music:start` state change. */
export const musicCrossfadeMs = 1800
export const reducedMusicCrossfadeMs = 400

/** Fade-out on `transport:complete` — the score winds down rather than cutting off (ADR-030 "single owner" fix). */
export const musicCompleteFadeMs = 1500
export const reducedMusicCompleteFadeMs = 300

/** `prefers-reduced-motion`/reduced-effects: shorter ramps, never disabled outright (CLAUDE.md — a mute toggle is the "disable entirely" affordance, not reduced motion). */
export const reducedMusicDuckRampMs = 80
export const reducedMusicUnduckRampMs = 120
