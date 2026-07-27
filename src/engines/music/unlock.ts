import * as Tone from 'tone'

let unlocking: Promise<void> | null = null

/**
 * Resumes the shared `Tone.js`/`AudioContext` from the Direct button's click
 * (docs/ARCHITECTURE.md section 3 — "AudioContext + TTS unlock gesture";
 * `DirectButton.tsx`'s doc comment names this exact call as its anchor).
 *
 * Deliberately a standalone function, not a `MusicEngine` method: the click
 * happens on `PremiseScreen`, before scene generation even starts, and the
 * `MusicEngine` isn't constructed until `StageScreen` mounts once the scene
 * is ready — seconds later, well outside the click's own call stack. `Tone.
 * start()` only needs to run once per page while a user gesture is "sticky"
 * (the browser's autoplay policy), not synchronously inside the handler, so
 * calling it here and letting `MusicEngine.unlock()` call it again later
 * (idempotent — `Tone.start()` resolves immediately once already started)
 * covers both the common path and any future caller that mounts audio
 * without a prior Direct click (e.g. a dev seed-script shortcut).
 */
export function unlockAudio(): Promise<void> {
  if (!unlocking) unlocking = Tone.start()
  return unlocking
}
