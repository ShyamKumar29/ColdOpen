# Current Task

## Current Milestone

Milestone 3 — Speech Engine (Clock Handoff)

## Current Task

Not started.

## Completed

- Milestone 2 — Sequencer + Subtitles (Timer Clock):
  - Timeline Compiler (`engines/timeline/compiler.ts`) implemented as a pure function: flattens `SceneScript.beats` into a frozen `CompiledBeat[]`, each with a deterministic `durationMs` (dialogue beats estimate reading time from line length, pause beats use their explicit `durationMs`, other beat types use fixed pacing constants — all plus `holdMs`) and the frozen list of entry cues (`subtitle:show/hide/slugline`, `light:change`, `character:enter/exit`) that fire the instant the beat starts. Cue payload types are pulled directly from `ColdOpenEventMap` (no duplicate type system) via a `CueKind` subset.
  - Scene Controller (`engines/controller/sceneController.ts`) rewritten from the Milestone 0 scaffold into a real timer-clock sequencer: `load/play/resume/pause/stop/restart/seek/destroy`, plus `getPhase/getClockSource/getBeatIndex/getElapsedMs`. Uses one `setTimeout` per beat (never a 60Hz loop), tracks `remainingMs`/`beatEnteredAt` so pause/resume mid-beat is accurate, and stays framework-independent — it only touches the compiled timeline and the `EventBus`, never the store or React. `skip()` and `transport:skip` were removed in the post-review cleanup pass — no UI ever emitted them.
  - `hooks/useSceneController.ts` — the React↔engine bridge (same lazy-`useState`-construct-once pattern as `useCastRoster`): subscribes to the controller's bus emissions and writes into `playbackSlice`/`presentationSlice` via their explicit setters. Transport controls call the returned `SceneController` directly rather than dispatching through the store, per the architecture's "TransportBar dispatches to controller" rule.
  - `playbackSlice` gained `elapsedMs` (cumulative, updated once per beat — deliberately not a 60Hz value, see ADR-004) and `activeCharacters` (string ids, updated via `character:enter/exit`). `presentationSlice.caption`/`lightingPreset` renamed to `currentSubtitle` (a `{kind:'line'|'slugline', ...}` union carrying speaker id + parenthetical) and `currentLighting` (tightened from `string` to the `LightingPreset` schema type).
  - `features/transport/TransportControls.tsx` replaces `StageScreen`'s disabled placeholder button — a stateless presenter driven by a `phase` prop and a `controller` prop, enabling/disabling Play/Resume/Pause/Stop/Restart based on phase.
  - `features/subtitles/SubtitleOverlay.tsx` — reads `currentSubtitle`/`captionsOn` from the store, renders a slugline card or a screenplay dialogue block (speaker name resolved from `cast`, parenthetical, line). Mounted inside `Stage.tsx`.
  - `Stage.tsx` now sources its lighting preset from `presentationSlice.currentLighting` (falling back to the Milestone 1 `deriveInitialLighting` static lookup only for the first paint before the controller's `load()` effect runs) — the only change to the Milestone 1 renderer; no rendering component (`Backdrop`, `LightingRig`, `ActorLayer`, etc.) was touched.
  - Bus taxonomy: added `transport:stop` (Milestone 0 had play/pause/restart/skip/complete but nothing for a hard stop-and-reset) and an optional `parenthetical` field on `subtitle:show`. Tightened `light:change`/`light:flicker` payloads from `string` to the schema's `LightingPreset`/transition-literal types.
  - Deferred, not in scope this milestone: the dev-mode debug cue log (ROADMAP lists it under Milestone 2, but it wasn't part of this session's explicit scope) and any renderer response to `activeCharacters` (entrances/exits as visual events are Milestone 4 scope).
  - Verified: `format:check`, `lint`, `typecheck`, `test` (36 tests across timeline compiler + scene controller + existing suites), and `build` all pass with zero errors. Ran the app in a real browser: Play/Pause/Resume/Stop/Restart all produce the correct phase and stage state, subtitles advance through title → slugline → action → dialogue → pause → dialogue → reveal, lighting shifts (coldMoonlight → singleSpot → blackout) render live, zero console errors.

- Milestone 1 — Static Stage:
  - Design tokens (`src/design/`): palette, typography, spacing/letterbox/stage proportions, z-index layer ordering, lighting presets (all 8 `LightingPreset` values art-directed with ambient/glow/vignette/contrast), environment backdrops (all 12 `Setting` values mapped to a horizon gradient + CSS-pattern motif, plus time-of-day brightness), silhouette geometry (all 4 `Build` values mapped to one of three shapes + scale), and stage slot positions (all 5 `StageSlot` values as percentages).
  - Closed the `StageSlot`/`Facing` type duplication the Milestone 0 stub left in `engines/character/types.ts`: both now derive from the schema (`z.infer`) instead of being hand-typed, alongside newly-exported `Setting`, `TimeOfDay`, `Weather`, `LightingPreset`, `Build`, `SilhouetteAccent`, and `Entrance` types in `src/schema/types.ts`.
  - Character Engine (`engines/character/characterEngine.ts`) implemented: deterministic, cast-size-aware slot layout (1 → center, 2 → left/right, 3 → farLeft/center/farRight) and entrance-derived facing direction. Previously a stub returning `null` slots.
  - Three placeholder silhouette shapes (`Silhouette.tsx`) built from primitives (circle head, polygon torso, rounded-stroke limbs) rather than one hand-drawn path, so individual limbs stay addressable for future pose animation.
  - Full stage layer stack in `features/stage/components/`: `Backdrop` (setting + time-of-day + weather), `StageFloor`, `ActorLayer`/`Actor` (slot position, facing flip, build scale — all derived from the script, no pixel coordinates), `LightingRig`, `GrainVignette` (static SVG-noise data URI, not a live filter), `Letterbox`, `SceneHeading`.
  - `Stage.tsx` (orchestrator) composes the layers from a `SceneScript` prop; `deriveStaticFrame.ts` picks the scene's establishing lighting preset (first beat with a `lighting` direction) since there's no Timeline Compiler yet to sequence through beats.
  - `useCastRoster` hook (`hooks/`) bridges the Character Engine to the store — the only new engine/React bridge this milestone needed.
  - `App.tsx` loads `heist-library` into the store directly (Groq and the seed-fallback chain are Milestone 5 scope) and renders `StageScreen`, which adds the title header and a disabled placeholder control (real transport lands in Milestone 2).
  - Verified by rendering the app in a headless browser: two-character cast places correctly at the `left`/`right` slots, the scene's `coldMoonlight` lighting beat is picked up, letterboxing/floor/vignette/grain all render, zero console errors.
  - Verified: `format:check`, `lint`, `test`, `typecheck`, and `build` all pass with zero errors/warnings.

- Milestone 0 — Skeleton & Contract:
  - Vite + React + TypeScript + Tailwind CSS + Framer Motion project scaffolded.
  - Zustand, Zod, and Tone.js installed as dependencies.
  - ESLint (flat config) + Prettier configured; TypeScript strict mode enabled; path aliases (`@`, `@engines`, `@features`, `@ai`, `@schema`, `@store`, `@scenes`, `@design`, `@hooks`, `@lib`, `@app-types`) wired in both `tsconfig.app.json` and `vite.config.ts`.
  - An ESLint rule bans React imports inside `src/engines/**`, enforcing the framework-independence rule from CLAUDE.md.
  - Full `src/` folder structure created per `docs/ARCHITECTURE.md` (including `src/engines/dialogue/`, added to close a gap the Milestone 0 design review identified between architecture sections 4 and 5).
  - `SceneScript` Zod schema implemented in full (`src/schema/`), matching `docs/ARCHITECTURE.md` section 7, including the previously-unenumerated `outro.style` values.
  - `validateSceneScript()` / `normalizeSceneScript()` implemented — validation only; tolerant repair and enum-coercion fallback remain Milestone 5 scope.
  - `heist-library` seed script authored (`src/scenes/`) and confirmed to validate against the schema via an automated test.
  - Event Bus implemented (`src/engines/bus/`) with a typed event taxonomy matching architecture section 8, and unit-tested (round-trip, unsubscribe, `once`, wildcard tap).
  - Minimal, non-functional scaffolding created for every other engine (Controller, Timeline, Speech, Camera, Music, Character, Particles, Animation, Dialogue) — public interfaces only, method bodies deferred to their owning milestone.
  - Zustand store created with five empty domain slices (scene, playback, cast, presentation, settings) and no application logic.
  - Vitest installed and configured as the project's test runner.
  - Verified: `npm run dev`, `npm run build`, `tsc -b`, and `eslint .` all succeed with zero errors/warnings.
  - Two small clarifications added to `docs/ARCHITECTURE.md` (dialogue folder listing; camera `MotionValue` ownership) to resolve inconsistencies implementation surfaced.
  - Milestone 0 closeout pass: removed Vercel deployment from the Milestone 0 Definition of Done (deployment is Milestone 5 scope, alongside the serverless Groq proxy); confirmed `format`/`format:check` scripts are wired and passing; added ADR-017 documenting why the Camera Engine owns its `MotionValue`s directly rather than moving construction to the hook layer; added the deferred referential-integrity validation items to Milestone 5's deliverables (docs only, no implementation); synced `docs/ARCHITECTURE.md` section 7 with the schema's `outro.style` and `exit.to` enums; added doc comments distinguishing `SceneSlice.status` from `PlaybackSlice.phase`. No dead code found to remove — lint reports zero unused-import/unused-var violations.

## Blocked

- Nothing blocked.

## Next

- Voice enumeration and casting per character (Speech Engine).
- Utterance queue with sentence splitting.
- `onboundary` → subtitle reveal + mouth flap.
- Capability probe with automatic fallback to the Milestone 2 timer clock (`ClockSource: 'speech' | 'timer'` already exists in `engines/controller/types.ts`; the controller currently hardcodes `'timer'`).
- Dev-mode debug cue log (carried over from Milestone 2's deliverable list; deferred, not implemented yet).

## Notes

- Test runner: Vitest (colocated `*.test.ts` files next to the code they test — see `src/engines/bus/eventBus.test.ts` and `src/scenes/heist-library.test.ts` as the established convention).
- `zod` v4 and `tailwindcss` v4 (via `@tailwindcss/vite`) are the versions actually installed; no compatibility issues found during scaffolding.
