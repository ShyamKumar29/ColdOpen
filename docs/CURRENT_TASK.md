# Current Task

## Current Milestone

Milestone 1 — Static Stage

## Current Task

Not started.

## Completed

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

## Blocked

- Nothing blocked.

## Next

- Design tokens (`src/design/`): palette, lighting presets, silhouette geometry, type scale, timing constants.
- Silhouette SVGs for the 3 initial archetypes.
- Stage slot system and letterbox/backdrop/grain/vignette layers.
- Wire `features/stage` to render a still frame from the `heist-library` seed script with no code changes required to swap settings/lighting/cast.

## Notes

- Test runner: Vitest (colocated `*.test.ts` files next to the code they test — see `src/engines/bus/eventBus.test.ts` and `src/scenes/heist-library.test.ts` as the established convention).
- `zod` v4 and `tailwindcss` v4 (via `@tailwindcss/vite`) are the versions actually installed; no compatibility issues found during scaffolding.
