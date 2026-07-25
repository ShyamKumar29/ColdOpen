# Cold Open — Architectural Decision Record

This document captures the architectural decisions already made for Cold Open. It is a record, not a proposal list — each entry reflects a decision finalized during design.

---

## ADR-001

**Decision:** Cold Open is architected as an event-driven rendering engine, not an AI application with a UI bolted on.

**Context:** The product's core interaction (speech → animation → subtitles → music → camera all reacting together) requires many independent subsystems to coordinate without knowing about each other.

**Reasoning:** An event bus lets each subsystem react to what happened without being told what to do by a central controller for every detail, and lets subsystems be added, removed, or replaced without touching unrelated code.

**Trade-offs:** Debugging requires tracing emitted events rather than following direct function calls; mitigated by a dev-mode cue log that records every event with its emitter and payload.

**Status:** Accepted

---

## ADR-002

**Decision:** Groq only generates structured JSON (`SceneScript`). The renderer never knows or cares where its data came from.

**Context:** The temptation in an "AI app" is to let the model influence presentation directly (colors, timing, copy for UI chrome, etc.), coupling the renderer to the AI provider.

**Reasoning:** Treating the AI as a swappable data source — interchangeable with a hand-authored seed script — keeps the renderer testable without network access, keeps the product functional offline, and prevents architecture rot where "which layer does this belong in" becomes ambiguous.

**Trade-offs:** Requires a strict, versioned schema and a normalization step that not every hackathon-style AI integration would bother with.

**Status:** Accepted

---

## ADR-003

**Decision:** The system is organized into four one-directional layers: Data & Ingestion → Engines → Orchestration → Presentation. Lower layers never import from higher layers.

**Context:** Without an enforced dependency direction, a rendering engine and an AI client tend to become entangled within days.

**Reasoning:** A one-directional flow means each layer can be reasoned about, tested, and replaced independently. Engines (layer 2) have zero React imports, so they run and test in plain Node.

**Trade-offs:** Slightly more indirection (adapter hooks between React and engines) than calling engine code directly from components.

**Status:** Accepted

---

## ADR-004

**Decision:** Discrete cues travel over the event bus; continuous, high-frequency values (camera transform, mouth openness, particle positions) travel through Framer Motion `MotionValue`s or refs, never through the bus or React state.

**Context:** Routing 60Hz data through the bus or `setState` causes excessive re-renders and dropped frames.

**Reasoning:** Separating "things that happened" (events, ~1–5Hz) from "things that are continuously changing" (motion, 60Hz) matches each data shape to the mechanism suited for it.

**Trade-offs:** Two distinct communication mechanisms to learn and to enforce by convention/code review rather than the type system alone.

**Status:** Accepted

---

## ADR-005

**Decision:** Speech Engine completion (`onend`) is the primary clock source driving beat advancement; a timer-based clock is the fallback when speech is unavailable or fails.

**Context:** Web Speech API utterance durations cannot be known in advance and vary by browser/voice, so any timeline scheduled in absolute milliseconds will visibly desync from spoken dialogue.

**Reasoning:** Anchoring the sequencer to actual speech completion (with `onboundary` driving finer-grained subtitle reveal) keeps animation, captions, and audio synchronized regardless of TTS timing variance. Building the timer clock as the foundation (rather than an afterthought) means the product works correctly even when speech is entirely unavailable.

**Trade-offs:** Requires a watchdog timer to force `beat:complete` if `onend` never fires (a known browser inconsistency), adding defensive complexity to the Speech Engine.

**Status:** Accepted

---

## ADR-006

**Decision:** All AI-authored scene data uses closed enum vocabularies (lighting presets, camera moves, gestures, settings, moods) rather than free-form values, colors, or coordinates.

**Context:** Free-form AI output (arbitrary hex colors, coordinates, descriptive text for visual properties) is unpredictable and expensive to validate meaningfully.

**Reasoning:** A closed vocabulary means every possible value maps to a hand-designed, art-directed rendering. It also makes validation trivial: an unrecognized value is simply invalid and normalizes to a default, rather than being a value that "parses" but looks wrong.

**Trade-offs:** Less expressive range per scene than free-form generation would theoretically allow; considered an acceptable and intentional constraint given the visual quality gained.

**Status:** Accepted

---

## ADR-007

**Decision:** The `SceneScript` schema contains no absolute timestamps. Timing is expressed as beat order plus optional `holdMs` plus speech-derived duration.

**Context:** Absolute millisecond scheduling cannot stay synchronized with variable-duration speech playback.

**Reasoning:** Relative, beat-anchored timing composes correctly regardless of how long any individual beat's speech takes to play.

**Trade-offs:** The Timeline Compiler must flatten and resolve relative offsets at runtime rather than the schema carrying pre-resolved timing.

**Status:** Accepted

---

## ADR-008

**Decision:** Zustand is the state management library, used as a single store sliced by domain, with three additional tiers (local `useState`, refs, and Framer Motion `MotionValue`s) reserved for state that doesn't belong in the shared store.

**Context:** Alternatives considered were React Context + reducer, Redux Toolkit, and XState.

**Reasoning:** Context re-renders every consumer on any change, which conflicts with 60Hz-adjacent updates in a deep component tree. Redux Toolkit's ceremony outweighs its benefits at this project's scope. XState is the theoretically ideal model for the phase/beat sequencer, but its learning curve is a poor trade against a discriminated-union `phase` field plus an explicit transition function, which achieves most of the same safety. Zustand's selector-based subscriptions and ability to be read outside React (via `getState()`) fit an engine-driven architecture where non-React code needs to read and write shared state.

**Trade-offs:** Less structural rigor than XState for complex state machines; mitigated by keeping the transition table explicit and data-driven so a future migration path remains open.

**Status:** Accepted

---

## ADR-009

**Decision:** The Music Engine (Tone.js) uses synthesis only — no audio sample files are loaded.

**Context:** Sample-based audio introduces loading latency, failure states, and larger bundle/asset size.

**Reasoning:** Pure synthesis starts instantly with no loading state, keeps the bundle small, and eliminates an entire class of failure (missing/slow-loading audio assets).

**Trade-offs:** Less realistic/rich instrumentation than sampled audio would provide; accepted because the goal is theatrical, not realistic.

**Status:** Accepted

---

## ADR-010

**Decision:** Characters are rendered as silhouette actors (SVG shapes), not detailed or realistic character art.

**Context:** The product's goal is explicitly not realism but a polished, theatrical, memorable performance.

**Reasoning:** Silhouettes avoid the uncanny valley, are cheap to animate and pose, and read as a deliberate stylistic choice rather than a technical limitation.

**Trade-offs:** Cannot convey detailed facial expression or fine character distinction beyond build/archetype/accent silhouette variation.

**Status:** Accepted

---

## ADR-011

**Decision:** Hand-authored seed `SceneScript` files are first-class, permanent source files (`scenes/`), not disposable test fixtures.

**Context:** The renderer needs to be built, tested, and demoed independent of live AI availability.

**Reasoning:** Seed scripts let the rendering pipeline be built and polished before AI integration exists, and serve permanently as an offline/failure fallback and as a design reference for what a well-formed `SceneScript` looks like.

**Trade-offs:** Seed scripts must be maintained in step with schema changes, same as any other schema consumer.

**Status:** Accepted

---

## ADR-012

**Decision:** The cast of any single scene is capped at three characters.

**Context:** Stage legibility with silhouette actors, voice casting distinctness, and slot-based positioning all degrade with more simultaneous characters.

**Reasoning:** A hard cap enforced in the schema guarantees the stage never becomes cluttered or confusing regardless of what the AI generates.

**Trade-offs:** Cannot represent premises implying larger ensembles; the AI is expected to compress cast lists in the writing, not the schema.

**Status:** Accepted

---

## ADR-013

**Decision:** Camera movement is implemented as a single GPU-compositable `transform` applied to one wrapper node (`CameraFrame`), never as per-child transforms.

**Context:** Applying independent transforms to many child nodes is significantly more expensive than transforming one parent layer.

**Reasoning:** A single transformed wrapper composites cheaply on the GPU and guarantees all child content moves together in perfect sync, which also matches how a real camera relates to a scene.

**Trade-offs:** Individual elements cannot have camera-independent motion without being deliberately placed outside the `CameraFrame` (e.g., foreground parallax, letterbox).

**Status:** Accepted

---

## ADR-014

**Decision:** The Groq API is accessed only through a Vercel serverless function proxy; the API key is never present in client-side code.

**Context:** Client-side API keys for paid services are a standard security and abuse vector.

**Reasoning:** A serverless proxy keeps the key server-side while preserving the same deployment simplicity (Vercel hosts both frontend and function).

**Trade-offs:** Adds one network hop and a small amount of serverless infrastructure versus calling Groq directly from the browser.

**Status:** Accepted

---

## ADR-015

**Decision:** The `SceneScript` schema is validated (Zod) and normalized before use by any consumer, regardless of source. Invalid or unknown values are corrected to known defaults rather than raising a fatal error in the render path; unrecoverable failures fall back to a seed script rather than surfacing a broken stage.

**Context:** LLM output is not guaranteed to be well-formed or to use only defined enum values, and a broken render mid-demo is the worst possible failure mode.

**Reasoning:** A validation → normalization → fallback chain means the user-visible experience never breaks even when the underlying data is malformed, at the cost of the malformed data being silently corrected rather than surfaced as an error to the end user.

**Trade-offs:** Silent normalization can mask AI output quality issues from developers unless explicitly logged in development.

**Status:** Accepted

---

## ADR-016

**Decision:** The `SceneScript` schema carries an explicit `version` field and an open `meta` field for forward compatibility, rather than being designed for repeated breaking changes.

**Context:** The schema is the contract between the AI layer and the renderer and is expected to evolve.

**Reasoning:** Additive fields with normalizer-supplied defaults require no migration path; only a breaking change requires a version bump and explicit migration logic, keeping the common case (adding a field) cheap.

**Trade-offs:** Requires discipline to keep new fields optional-with-default rather than required, and to actually bump `version` on breaking changes.

**Status:** Accepted
