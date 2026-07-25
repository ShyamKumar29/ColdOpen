import type { SceneScript } from '@schema'

/**
 * Hand-authored seed SceneScript (ADR-011 in docs/DECISIONS.md).
 *
 * This exists purely to validate the schema end-to-end in Milestone 0 —
 * it is not yet played back by anything. It becomes the offline/failure
 * fallback and rendering reference starting in Milestone 1.
 */
export const heistLibrary: SceneScript = {
  version: '1.0',
  title: 'The Last Checkout',
  genre: 'heist',
  mood: 'tense',
  scene: {
    slugline: 'INT. GRAND LIBRARY - NIGHT',
    setting: 'library',
    timeOfDay: 'night',
    weather: 'clear',
    establishingText: 'Moonlight falls through tall windows onto rows of silent shelves.',
  },
  cast: [
    {
      id: 'vera',
      name: 'Vera',
      archetype: 'mastermind',
      build: 'slight',
      voice: { register: 'mid', rate: 'normal' },
      entrance: { beat: 0, from: 'shadow', style: 'creep' },
      silhouetteAccent: 'coat',
    },
    {
      id: 'dez',
      name: 'Dez',
      archetype: 'rookie',
      build: 'tall',
      voice: { register: 'high', rate: 'fast' },
      entrance: { beat: 1, from: 'offRight', style: 'stride' },
      silhouetteAccent: 'none',
    },
  ],
  beats: [
    {
      id: 'b0-title',
      type: 'title',
      subtitle: 'A heist movie inside a library.',
      lighting: { preset: 'coldMoonlight', transition: 'fade' },
      holdMs: 800,
    },
    {
      id: 'b1-slugline',
      type: 'slugline',
      camera: { move: 'static', intensity: 'subtle' },
      holdMs: 400,
    },
    {
      id: 'b2-action',
      type: 'action',
      text: 'Vera slips between the shelves. Dez fumbles in behind her.',
      camera: { move: 'pushIn', target: 'vera', intensity: 'subtle' },
      particles: { effect: 'dust', density: 0.3, action: 'start' },
      holdMs: 300,
    },
    {
      id: 'b3-dialogue-vera',
      type: 'dialogue',
      characterId: 'vera',
      line: "The manuscript's in the archive vault. Touch nothing else.",
      delivery: 'whisper',
      gesture: 'point',
      camera: { move: 'pushIn', target: 'vera', intensity: 'normal' },
      lighting: { preset: 'singleSpot', transition: 'fade' },
      music: { action: 'start', mood: 'tense', intensity: 0.3 },
    },
    {
      id: 'b4-dialogue-dez',
      type: 'dialogue',
      characterId: 'dez',
      line: 'What if someone hears us?',
      delivery: 'trembling',
      gesture: 'shrug',
      camera: { move: 'panRight', target: 'dez', intensity: 'subtle' },
    },
    {
      id: 'b5-beat',
      type: 'beat',
      durationMs: 900,
      lighting: { preset: 'coldMoonlight', transition: 'flicker' },
    },
    {
      id: 'b6-dialogue-vera-2',
      type: 'dialogue',
      characterId: 'vera',
      line: 'Then we stop hearing anything at all.',
      delivery: 'flat',
      gesture: 'turn-away',
      music: { action: 'swell', intensity: 0.6 },
    },
    {
      id: 'b7-reveal',
      type: 'reveal',
      text: 'A shadow crosses the moonlit floor behind them.',
      camera: { move: 'whipPan', target: 'wide', intensity: 'dramatic' },
      lighting: { preset: 'blackout', transition: 'cut' },
      music: { action: 'sting', stinger: 'hit' },
      particles: { effect: 'dust', action: 'stop' },
    },
  ],
  outro: {
    style: 'cutToBlack',
    text: 'COLD OPEN',
  },
}
