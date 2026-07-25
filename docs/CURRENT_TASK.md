# Current Task

## Current Milestone

Milestone 2 — Sequencer + Subtitles (Timer Clock)

## Current Task

Not started.

## Completed

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

- Timeline Compiler (`SceneScript` → `CueList`) in `engines/timeline`.
- SceneController with timer clock only.
- Subtitle overlay, slugline/title cards.
- Transport bar (replaces `StageScreen`'s disabled placeholder button).
- Debug cue log.

## Notes

- Test runner: Vitest (colocated `*.test.ts` files next to the code they test — see `src/engines/bus/eventBus.test.ts` and `src/scenes/heist-library.test.ts` as the established convention).
- `zod` v4 and `tailwindcss` v4 (via `@tailwindcss/vite`) are the versions actually installed; no compatibility issues found during scaffolding.
