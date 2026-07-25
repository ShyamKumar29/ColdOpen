# Project Overview

Cold Open turns a single sentence into a live cinematic opening scene, performed in the browser. A user types a premise; Groq generates a structured scene script; a deterministic rendering engine performs it — dialogue, silhouette actors, camera movement, lighting, music, and screenplay subtitles — entirely client-side.

Cold Open is not an AI chat wrapper. It is a **JSON-driven cinematic playback engine**. The AI is one interchangeable data source among possible others (hand-authored seed scripts, future editors, alternate models). The renderer has no knowledge of where its data came from and must never be written as if Groq is the only possible input.

# Core Philosophy

- **Event-driven architecture.** Subsystems communicate through a typed event bus, not direct references to one another.
- **The renderer is AI-agnostic.** Nothing under `engines/` or `features/stage` may import from `ai/` or know that Groq exists.
- **Groq only generates JSON.** The AI layer's sole output is a `SceneScript` document. It never decides how anything is drawn, timed, or animated beyond the vocabulary the schema defines.
- **The renderer consumes validated JSON only.** Every `SceneScript` — from Groq, a seed file, or any future source — passes through the same Zod validation and normalization before anything renders it.
- **Modular systems.** Each engine (speech, music, camera, character, subtitle, particle, animation) owns one concern and can be understood, tested, and replaced in isolation.
- **Reusable components.** Presentation components are generic and driven by props/state, never hardcoded to a specific scene, premise, or character.
- **Clean separation of concerns.** Data ingestion, orchestration, engines, and presentation are distinct layers with a one-directional dependency flow: presentation depends on orchestration, orchestration depends on engines, engines depend on validated data. Never the reverse.

# Technology Stack

Approved technologies only. Do not introduce alternatives without discussion.

- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Graphics:** SVG + CSS (no WebGL, no canvas libraries, no video)
- **Speech:** Browser Web Speech API (no third-party TTS services)
- **Audio/Music:** Tone.js, synthesis only (no sample/audio file loading)
- **AI:** Groq API, accessed only through a serverless proxy
- **State:** Zustand
- **Validation:** Zod
- **Deployment:** Vercel

# Project Structure Rules

- **`engines/`** — Framework-independent TypeScript. No React imports, ever. Each subfolder (`bus`, `controller`, `timeline`, `speech`, `music`, `camera`, `character`, `particles`, `animation`) is a self-contained module with a narrow public API. This is the layer that must remain unit-testable outside a browser DOM tree.
- **`features/`** — React components and hooks grouped by user-facing concern (`premise`, `stage`, `subtitles`, `transport`, `debug`). Features may consume engines through hooks; they never reach into another feature's internals.
- **`ai/`** — Groq client, streaming, parsing, repair, retry logic. This is the only folder allowed to know an LLM exists. It produces raw candidate JSON and nothing more.
- **`schema/`** — Zod schemas, inferred types, normalizer, and defaults. This is the contract between `ai/` and everything downstream. Owned by neither side; imported by both.
- **`store/`** — Zustand slices and selectors, organized by domain (`scene`, `playback`, `cast`, `presentation`, `settings`).
- **`scenes/`** — Hand-authored `SceneScript` files. Permanent fixtures, fallback content, and design references — not scratch files.
- **`design/`** — Design tokens: palette, lighting presets, silhouette geometry, type scale, timing constants. The single source of truth for how enum values map to visuals.
- **`hooks/`** — Thin React↔engine adapters only. No business logic lives here.
- **`lib/`** — Generic utilities with zero domain knowledge of Cold Open.
- **`types/`** — Ambient, cross-cutting types only. Domain types belong in `schema/`.

New files go in the folder matching their layer, not the folder that's most convenient at the time.

# React Rules

- **Components are either stateful orchestrators or stateless presenters.** Know which one you're writing before you write it.
- **State ownership follows data lifetime and audience**, not convenience: durable, shared state lives in the store; per-component transient state stays local; high-frequency values never touch React state at all (see State Management Rules).
- **Props are the only way data enters a stateless component.** Stateless components never read from the store or call `getState()` directly.
- **Hooks are the only bridge between React and engines.** Components never instantiate or call engine classes directly.
- **Composition over configuration.** Prefer small components combined by their parent over one component with many conditional branches and boolean props.
- **No component branches on more state than it needs.** If a component only needs to know whether a scene is playing, it takes an `isPlaying` boolean, not the whole playback slice.
- **Never re-create engine instances on render.** Engines are constructed once (typically in a top-level effect or ref) and referenced thereafter.

# TypeScript Rules

- **Strict mode is always on.** Never weaken `tsconfig` strictness to make an error disappear.
- **`any` is forbidden.** Use `unknown` at real boundaries (parsed JSON, external API responses) and narrow explicitly. If you're reaching for `any`, the type is underspecified — fix the type.
- **Shared domain types live in `schema/`**, derived from Zod schemas via `z.infer`, never hand-duplicated alongside them.
- **Prefer discriminated unions over optional-field soup**, especially for the `Beat` type and phase/state machines. A `type` field that lets TypeScript narrow the rest of the shape is always better than a pile of `?` fields.
- **Enums in the schema are closed string-literal unions**, not TypeScript `enum` — this keeps them structurally compatible with Zod and JSON.
- **Interfaces for object shapes that might be extended; `type` for unions, aliases, and utility compositions.** Be consistent within a file.
- **No implicit `null`/`undefined` handling.** Optional fields are explicit `?:` with a defined default in the normalizer, not a runtime guess.

# State Management Rules

Pick the right tier deliberately — this is the most consequential recurring decision in the codebase.

- **Zustand** — durable, shared, low-to-moderate frequency state: the active `SceneScript`, phase, beat index, cast roster and slots, current caption, lighting preset, settings. Anything multiple unrelated components or engines need to read.
- **Local `useState`** — ephemeral state scoped to one component that nothing else needs: text input contents, hover state, menu open/closed.
- **Refs** — mutable values that must survive renders but should never trigger one: engine instance handles, timers, live utterance references, non-visual bookkeeping.
- **Framer Motion `MotionValue`s** — any value updated at animation frequency (~60 Hz): camera transform, mouth openness, particle positions, breathing/idle motion. These never round-trip through React state or the Zustand store. If a value changes every frame, it does not belong in `setState` of any kind.

Engines write to the Zustand store only through explicit, named action functions — never by calling `setState` with a raw object from inside an engine.

# Animation Rules

- **All motion is defined through named presets in `engines/animation`**, not inlined ad hoc into components. A camera push, a character entrance, a gesture — each is a named, reusable variant.
- **Naming convention:** `category.name` (e.g. `entrance.stride`, `camera.pushIn`, `gesture.point`, `exit.dissolve`). Consistent across engines so cues and presets are traceable to each other.
- **One node, one active animation per property.** A new camera move retargets the existing `MotionValue`; it never starts a second competing animation on the same property.
- **Animate `transform` and `opacity` only** on anything that moves. Never animate layout-triggering properties (`width`, `top`, `left`, box-shadow blur, filters) on active elements. Static/backdrop layers may use filters; animated foreground elements may not.
- **Every animatable component must define reduced-motion behavior** in the same preset table — camera moves degrade to cuts, particle effects disable, transition durations shorten. This is not a separate system bolted on later.
- **Transition timing values (durations, easings, springs) are defined once in `design/`** and referenced, never hardcoded per component.

# Event Bus Rules

- **Naming convention:** `domain:verb` (e.g. `speech:start`, `camera:move`, `beat:complete`). No other format.
- **Every event type has exactly one authoritative emitter**, documented alongside the event union. If two systems could plausibly emit the same event, the event is misdesigned — split it or route it through the Controller.
- **Engines may observe each other's events but never control each other through them.** Music reacting to `speech:start` by ducking is observation. An engine calling into another engine's methods based on a bus event is control and belongs in the Controller instead.
- **The bus is fire-and-forget.** No handler returns a value to the emitter. If a response is needed, emit a second, distinct event.
- **Never route per-frame/high-frequency data through the bus.** The bus carries discrete cues, not continuous values — those belong on `MotionValue`s or refs.
- **Handlers must be idempotent.** A duplicate event firing twice must never cause a visibly duplicated effect.
- **Forbidden:** components emitting directly to control other components (bypass the bus and use props/composition instead); engines importing each other directly to call methods; using the bus as a request/response mechanism; subscribing to your own emitted events to drive your own next step (use a direct function call instead).

# JSON Schema Rules

- **The renderer never accepts invalid JSON.** Every `SceneScript`, regardless of source, passes through Zod validation before any engine or component touches it.
- **Never bypass validation**, including for seed scripts, test fixtures, or "just this once" debugging. If a seed script fails validation, the seed script is wrong.
- **Never hardcode scene data into components or engines.** All scene content — text, character names, dialogue, settings — flows through the `SceneScript` schema. If you find yourself writing a literal line of dialogue into a component, stop.
- **Unknown or invalid enum values are normalized to a defined default, never thrown as fatal errors** in the render path. Validation failures fall back to a known-good seed script rather than surfacing a broken stage.
- **The schema is a stable contract.** Additive changes must be optional fields with defaults handled in the normalizer. Breaking changes require a `version` bump and an explicit migration path in the normalizer, not a silent shape change.

# Performance Rules

- **Avoid unnecessary re-renders.** Use selectors when reading from the store; never subscribe to more state than a component needs.
- **Engines stay framework-independent.** No engine file imports React. This is what keeps them fast to test and safe to reuse.
- **Prefer GPU-compositable transforms.** Camera movement applies as a single `transform` on one wrapper node, not per-child transforms.
- **Respect `prefers-reduced-motion`** in every animated system, not just the obvious ones (camera and particles included).
- **Cap unbounded work.** Particle counts, cast size, and speech queue length are all bounded; nothing scales with unbounded user input.
- **Defensive timeouts around anything not guaranteed to resolve** (speech synthesis callbacks, network calls) so the app can never hang indefinitely waiting on a browser or network event.

# Accessibility Rules

- **Full keyboard navigation** for all interactive controls (premise input, transport controls, settings) — no mouse-only interactions.
- **`prefers-reduced-motion` is respected everywhere animation occurs**, not treated as optional polish.
- **Captions/subtitles are a first-class, always-available feature**, not a fallback bolted on for when audio fails — the experience must be complete with sound off.
- **Sufficient contrast** between subtitle text, UI chrome, and the cinematic backdrop in every lighting preset — verify contrast when adding or changing a lighting preset, not just at initial design time.

# Code Style

- **Naming:** descriptive, unabbreviated names for anything public (exported functions, types, components). `camelCase` for variables/functions, `PascalCase` for components/types, `SCREAMING_SNAKE_CASE` for true constants.
- **File size:** if a file is doing more than one job, split it. A component file mixing layout, animation logic, and data transformation is a signal to extract, not a style violation to ignore later.
- **Function size:** a function should fit on one screen and do one thing. Long conditional chains handling multiple concerns should be decomposed.
- **Comments:** explain *why*, never *what*. No comment should restate what a well-named function or variable already communicates. Do not leave commented-out code in the codebase.
- **Imports:** absolute imports from defined path aliases over long relative chains. Never import across a layer boundary that violates Project Structure Rules (e.g. an engine importing a component).
- **Formatting:** enforced by the project's formatter/linter config, not by hand. Do not argue with the formatter in code review.

# Engineering Principles

- **Prefer readability over cleverness.** Code is read far more often than it is written.
- **Prefer modularity over shortcuts that couple systems together**, even when the shortcut is faster in the moment.
- **Prefer composition over inheritance or configuration flags.**
- **Never tightly couple engines to each other or to React.** If removing one engine would require editing another engine's internals, they are coupled and need to be decoupled through the event bus or the Controller.
- **Prefer the smallest change that solves the actual problem.** Do not refactor unrelated code, introduce abstractions for hypothetical future needs, or add configurability nobody asked for.

# Rules for AI Assistance

When implementing features in this codebase:

- **Think before coding.** Identify which layer the change belongs in and which existing systems it should reuse before writing anything.
- **Reuse existing systems.** Check `engines/`, `schema/`, and `design/` for an existing mechanism before adding a new one. Duplicated logic across engines is a defect, not a convenience.
- **Never rewrite architecture.** The layering, event-bus model, and schema-first data flow described in this file are fixed. Work within them.
- **Explain architectural changes before making them.** If a task genuinely requires deviating from a rule in this file, state the proposed change and reasoning before implementing it — do not silently diverge.
- **Never generate documentation unless explicitly requested.** No README updates, no new markdown files, no docstring sweeps, unless the user asks for them.
