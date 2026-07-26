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

---

## ADR-017

**Decision:** The Camera Engine (`engines/camera`) constructs and owns its Framer Motion `MotionValue`s directly, rather than being pure-TS and having a hook layer construct them.

**Context:** CLAUDE.md's project structure rules state `engines/` must have "no React imports, ever," and this was reviewed during the Milestone 0 design pass (see `docs/ARCHITECTURE.md` §6, point 2) because it appears to conflict with that rule. Milestone 0 cleanup considered moving `MotionValue` construction into a `useCameraRig`-style hook so `engines/camera` would import nothing from `framer-motion`.

**Reasoning:** `MotionValue` is not React — it has no dependency on React's runtime, renders nothing, and requires no component tree or hooks to exist. It is a plain, framework-independent mutable-value primitive that happens to ship from the `framer-motion` package. Splitting `MotionValue` construction into the hook layer would not remove a React dependency (there wasn't one); it would only relocate object construction across a layer boundary and force every consumer of the Camera Engine through an extra indirection to get a handle to state the engine itself must still update on every `applyMove`. The engine remains unit-testable in plain Node (`MotionValue.get()`/`.set()` work with no DOM or React tree), which is the actual property the "no React imports" rule protects.

**Trade-offs:** The rule "no React imports in `engines/`" is enforced by an ESLint rule banning the `react` package specifically; it does not and should not ban `framer-motion`, since `MotionValue` construction is exactly the kind of engine-owned, framework-independent state the rule is meant to allow. Revisit only if a future engine needs `MotionValue`s without depending on `framer-motion` as a package (e.g., a non-web host), which is not a currently anticipated requirement.

**Status:** Accepted

---

## ADR-019

**Decision:** A character's on-stage pose (`idle`, `speaking`, `listening`, `surprised`, `thinking`) is not schema data. It is derived purely from beat content by the Timeline Compiler and carried over the bus as a new `character:pose` event, the same way `character:enter`/`character:exit` already are.

**Context:** Milestone 3 (Character Animation Foundation) needed a pose vocabulary richer than the pre-existing `CastMember.pose: 'idle' | 'gesture'` stub. Adding a `pose` field to the `Character` or `Beat` schema was considered and rejected: the AI/seed-script layer should not have to author "who's listening right now," since it's entirely determined by which beat is playing and who's on stage — exactly the category of fact ADR-006/ADR-007 already put in the compiler's hands (relative, content-derived timing) rather than the schema's.
- `dialogue` beat → the speaker is `speaking`; every other character already on stage is `listening`.
- `reveal` beat → everyone present is `surprised`.
- `beat` (pause) → everyone present is `thinking`.
- everything else → `idle`.

**Reasoning:** Keeping pose derivation a pure function of `(beat, characterId)` inside `compileTimeline` means it inherits the Timeline Compiler's existing determinism guarantee for free — the same `SceneScript` always produces the same sequence of `character:pose` cues. It also means `engines/character` and `engines/animation` don't duplicate the mapping; both import the single `CharacterPose` union the bus already owns as the taxonomy's source of truth (mirroring how `LightingPreset` flows from `@schema` into `light:change`'s payload).

**Trade-offs:** The five-pose vocabulary is a deliberately small, hand-picked set matched to what a silhouette actor with no rigged limbs can meaningfully convey (ADR-010). It is not extensible by scene content — a future beat type that needs a pose the compiler doesn't already derive requires a code change here, not a schema change, which is the intended trade rather than an oversight.

**Status:** Accepted

---

## ADR-020

**Decision:** The Animation Engine advances every in-flight character transition through an explicit `tick(now: number)` step that the React bridge hook (`useSceneController`) calls once per `requestAnimationFrame`, rather than delegating to Framer Motion's imperative `animate()`.

**Context:** `animate()` schedules its own internal frame loop and callback timing, which is convenient but makes "the same sequence of calls always produces the same interpolation" hard to state precisely, and awkward to unit-test without either fake timers or waiting on real frames.

**Reasoning:** Making `tick` a pure function of the timestamp it is given — progress is `(now - startedAt) / durationMs`, eased through a cubic-bezier solver shared with the CSS design tokens (`design/timing.ts`'s `easingCurves`) — means the engine's entire interpolation logic is testable in plain Node with synthetic timestamps (`animationEngine.test.ts`), with no DOM, no real animation frame, and no fake-timer gymnastics. It also mirrors the Scene Controller's own approach to timing (`remainingMs`/`beatEnteredAt` in `sceneController.ts`) rather than introducing a second, differently-shaped timing model for a sibling engine.

**Trade-offs:** The engine does not get Framer's built-in spring physics or interruption handling for free; retargeting a channel (e.g., a new pose before the old one finishes) simply starts a fresh linear-time transition from the current interpolated value, which is enough for the restrained, cinematic motion this milestone calls for and keeps the implementation small. Revisit if a future milestone needs spring-based motion the bezier model can't express.

**Status:** Accepted

---

## ADR-021

**Decision:** The Scene Controller depends on the Speech Engine only through a two-method structural interface (`SpeechClockAdapter { probeCapability(); cancel() }`) declared locally in `engines/controller/types.ts`, never by importing `engines/speech`. Actually starting an utterance happens entirely through the existing `speech:request` bus cue (documented in `docs/ARCHITECTURE.md` section 8's sequence diagram, formalized into the bus taxonomy this milestone) — the Controller never calls `speak()` directly. On resume-from-pause, a dialogue beat's line restarts from the beginning rather than attempting to continue mid-utterance; if speech drops to unavailable mid-scene, the Controller falls back to the timer clock for the remainder of the run.

**Context:** Milestone 4 needed the Scene Controller (ADR-005's clock owner) and the Speech Engine to coordinate on two things a bus cue alone can't express: which clock is authoritative right now, and stopping in-flight speech on pause/stop/seek/restart without that stop looking like a natural completion (`speech:end`) and falsely advancing a beat. The Web Speech API also has no reliable mid-utterance pause/resume across browsers (the existing Speech API risk table already flags `pause()`/`resume()` as buggy), so "resume exactly where it paused" was never a viable option.

**Reasoning:** Giving the Controller the full `SpeechEngine` type would let it call `speak()` directly, which duplicates the beat-driven triggering the compiler/bus already does via `speech:request` and would let two different code paths start an utterance (violating the "one authoritative emitter" rule this project holds for every other cue). Shrinking the dependency to exactly the two calls the Controller actually needs — "is speech available" and "stop whatever's playing" — keeps `engines/controller` compilable and testable without ever importing `engines/speech`; the existing `sceneController.test.ts` suite passes a plain object literal as the fake adapter, with no DOM or `SpeechSynthesis` mocking required. Restarting the line on resume, rather than faking a mid-utterance continuation, is a deliberate simplification given the underlying API can't do it reliably anyway; only the `speech:request` cue re-fires on resume, not the beat's other entry cues, so subtitle/light/character state (already correct) isn't visibly redone.

**Trade-offs:** A user who pauses mid-sentence and resumes hears the character's line restart from the top rather than continuing — an acceptable and disclosed limitation given Web Speech's own unreliability here, not a regression from some more capable baseline. The Controller's speech-driven wait is also backed by its own watchdog (`durationMs × 2`) in addition to the Speech Engine's own per-chunk watchdog — deliberate double coverage, since a hung Controller (the one thing standing between "paused forever" and a working demo) is worse than a redundant timer.

**Status:** Accepted

---

## ADR-022

**Decision:** `createSpeechEngine` and `createSceneController` never call `bus.on(...)` inside their own factory function bodies. Any reaction one of them needs to another engine's bus event is wired by `useSceneController`, inside its existing bus-subscribing `useEffect`, either as a direct method call (`speech.speak(...)`) or through a small `notifySpeechEnd`/`notifySpeechError`/`notifySpeechUnavailable` surface the Controller exposes for exactly this purpose.

**Context:** The initial Milestone 4 implementation had `createSpeechEngine` subscribe itself to `speech:request`, and `createSceneController` subscribe itself to `speech:end`/`speech:error`/`speech:unavailable`, directly in their constructors — an "observation" pattern that seemed to match ADR-001's description of engines reacting to bus events. In the browser, every dialogue line was spoken twice. The cause: both engines are constructed via `useState(() => createX(bus))` lazy initializers in `useSceneController`, and React StrictMode's dev-mode double-invoke calls a `useState` lazy initializer twice on mount to help surface impure renders. `createEventBus()` and `createAnimationEngine()` are pure constructors, so their duplicate call is harmless — but `bus.on(...)` performed inside `createSpeechEngine`/`createSceneController` is a real side effect on a shared, mutable object (the one bus instance, itself resolved once), so both the discarded first-pass engine instance and the committed second-pass instance ended up with live handlers on the same bus. A `speech:request` cue then triggered two independent `speak()` calls.

**Reasoning:** This codebase already has a proven-safe place for cross-engine bus reactions: `useSceneController`'s single `useEffect`, which every other cue (`character:enter`, `character:pose`, `light:change`, etc.) already goes through, calling engine methods directly rather than having engines subscribe to each other or to the bus themselves. That effect's subscribe/unsubscribe pair already survives StrictMode's mount → cleanup → mount cycle correctly (cleanup functions run in the discarded pass, leaving only one live subscription) — it was never broken; Milestone 4 simply didn't route its new cross-engine wiring through it. Restoring that pattern for `speech:request`/`speech:end`/`speech:error`/`speech:unavailable` fixes the duplication at its actual source (a side effect in the render phase) rather than papering over the symptom (e.g., de-duplicating by request id, or disabling StrictMode).

**Trade-offs:** The Scene Controller's public interface grows three narrow `notifySpeech*` methods instead of listening for those events itself — slightly more surface area, but it keeps `createSceneController`'s constructor pure and testable with a plain function call (`controller.notifySpeechEnd('vera')`) instead of requiring every test to go through the bus. Any future engine that needs to react to another engine's bus event must remember to wire it through the owning hook's effect, not its own constructor — worth calling out here since the failure mode (StrictMode-only, dev-only, silent duplication) is easy to miss without dev-mode browser verification, exactly as happened this milestone.

**Status:** Accepted

---

## ADR-023

**Decision:** `Actor`'s silhouette box height (`design/spacing.ts`'s `stage.actorHeightFraction`) is computed from the maximum combined build-scale × pose-scale value actually defined in `design/silhouette.ts` and `design/pose.ts`, minus a fixed safety margin, rather than a hand-picked percentage.

**Context:** A 'tall' character (`silhouetteTokens.tall.scaleY = 1.08`) shown in a 'surprised' pose (`poseTokens.surprised.scale = 1.05`) had its head clipped by the stage's `overflow-hidden` top edge. `Actor.tsx` applies both scales from a `transformOrigin: 'bottom center'` on nested elements, so any combined scale above 1 stretches the silhouette upward with no corresponding change to its layout box. The previous constant (`height: '88%'`, hardcoded in `Actor.tsx`) sized an *unscaled* silhouette to almost exactly fill the stage height already — the small remaining headroom (12% of stage height) was less than what an 8% build stretch and a 5% pose stretch compound to (13.4% of the 88% box, i.e. ~11.8% of stage height), so the two together had nowhere to expand into but past the frame.

**Reasoning:** Picking a new fixed percentage that merely fixes today's worst case ('tall' + 'surprised') would silently reintroduce the same bug the next time either token table gains a larger scale value — exactly the kind of magic-number drift CLAUDE.md's Code Style rules warn against. Deriving `actorHeightFraction` from `Math.max(...)` over the actual `silhouetteTokens`/`poseTokens` values, plus a fixed 3%-of-stage-height safety margin, means the box height automatically stays safe for any future build or pose scale, without anyone having to remember to re-check this file when `design/silhouette.ts` or `design/pose.ts` changes.

**Trade-offs:** `design/spacing.ts` now imports from `design/silhouette.ts` and `design/pose.ts` (previously spacing.ts had no internal `design/` imports) — a small increase in coupling within the `design/` folder, acceptable since all three are peer token files in the same layer, not a cross-layer violation. Characters render slightly smaller (headroom went from 12% to ~14.5% of stage height) as a direct consequence of guaranteeing the worst case never clips; this is the correct trade given the alternative is a visibly broken frame.

**Status:** Accepted

---

## ADR-024

**Decision:** The camera's framing — `CameraShot` (`wide`/`medium`/`close`/`twoShot`/`overShoulder`/`reveal`) and `CameraFocus` (`left`/`center`/`right`/`wide`) — is not schema data. It is derived purely from beat content by the Timeline Compiler and carried on the `camera:move` cue, the same way `CharacterPose` already is (ADR-019).

**Context:** Milestone 5 needed the camera to read as directed cinematography — pushing in on a lone speaker, favoring an over-the-shoulder framing with two characters present, punching into a tight dramatic shot on a reveal — without requiring every seed script or future AI-generated scene to author a `camera` direction on every beat (CLAUDE.md: "do not require camera data in SceneScript"). `beat.camera` (`CameraDirection`) already exists in the schema as an optional per-beat override, but a script author only supplies `move`/`target`/`intensity`, not "how tight should this read" or "which side of the stage."

**Reasoning:** Treating shot/focus as compiler-derived state, exactly like `poseForBeat` derives `CharacterPose` (ADR-019), means the Camera Engine stays a pure interpolator — it maps a resolved `{move, shot, focus, intensity}` cue to `{x, y, zoom}` via `design/camera.ts`'s token tables and never reasons about characters, cast size, or beat types itself (keeping `engines/camera` decoupled from `engines/character` and `engines/timeline`, per CLAUDE.md's "never tightly couple engines"). When a beat does author `beat.camera`, its `move`/`target`/`intensity`/`durationMs` take precedence field-by-field over the automatic derivation, but the automatic framing still fills in whatever the author left unspecified — so a fully hand-authored scene and a scene with zero camera data both compile to a complete camera path, and the same `SceneScript` always produces the same one (Milestone 5's determinism requirement).

**Trade-offs:** A reveal beat's shot is always `'reveal'` regardless of the beat's authored `move` — a deliberate exception (the beat type is a stronger signal of dramatic intent than which move got the camera there) that meant the seed script's `whipPan` reveal, which would otherwise have mapped to a generic `'wide'` shot via the move→shot table, now correctly reads as the tightest, most dramatic framing. Any future beat type needing a shot vocabulary this table doesn't already derive requires a code change in the compiler, not a schema change — the same trade ADR-019 already accepted for pose.

**Status:** Accepted

---

## ADR-025

**Decision:** `beat.movements` (moving a character between stage slots) and `dialogueBeat.gesture` (a spoken line's parenthetical gesture) remain unwired past Milestone 5, despite `docs/ROADMAP.md`'s prior wording listing both as this milestone's deliverables.

**Context:** The Milestone 5 task brief for this session explicitly scoped out "gesture animation" and "body movement," while the then-current `docs/ROADMAP.md` text (written during the Milestone 3 reshuffle, ADR-019/ADR-020's sibling decision) still described Milestone 5 as covering "movement between stage slots and gestures... the two schema fields the Timeline Compiler still doesn't turn into cues," alongside camera and lighting.

**Reasoning:** Implementing camera and lighting well — automatic framing derived from scene state, a real crossfade-capable `LightingRig`, `CameraFrame` as the single composited transform — was already the full scope of a foundation milestone on its own; folding in a second, unrelated animation system (limb/stage-position choreography) in the same pass would have diluted both rather than shipping either well. `engines/character`'s `assignSlot` method and the `character:move`/`character:gesture` bus events already exist as the seam for this future work to slot into without a redesign.

**Trade-offs:** `docs/ROADMAP.md`'s Milestone 5 entry is corrected to reflect what actually shipped; movements/gestures have no assigned milestone yet and will need one before Groq-generated scenes can rely on them reading as anything other than static blocking.

**Status:** Accepted

---

## ADR-026

**Decision:** A character's build-driven height variance (`design/silhouette.ts`'s `scaleY`) is expressed in `Silhouette.tsx` as leg-length translation — legs stretch from a fixed floor line up to a raised hip, and the torso/arms/head group translates rigidly by that same amount — rather than as a whole-figure CSS `scale()` from a bottom-center transform origin, which is how `Actor.tsx` previously applied it.

**Context:** `Actor.tsx` used to apply `token.scaleY` as `transform: scale(x, scaleY)` on the whole assembled silhouette, anchored bottom-center. A bottom-anchored whole-figure scale stretches every part of the figure by the same factor, including the distance from the floor to the top of the head — so a `tall` build (`scaleY: 1.08`) didn't just have longer legs, it had a head positioned 8% higher than an `average` build's, and a proportionally larger head, on top of that. Combined with `ADR-023`'s pose scale, this is what produced inconsistent headroom across builds: the stage's `actorHeightFraction` had to be sized for the worst-case combination, and taller builds still read as "scaled up" rather than "taller" — a subtly wrong cinematic result even where clipping didn't occur.

**Reasoning:** A real person's height difference lives almost entirely in leg length and torso length, not head size — heads vary far less than bodies across individuals. Translating only the legs (foot fixed at the floor line, hip raised by `(floorY - hipY) * (heightScale - 1)`, everything above the hip rigidly translated by that same offset) reproduces this: every build shares an identical head size and an identical neutral head-to-hip proportion, and a taller build reads as taller through longer legs and a correspondingly higher (but not larger) head, rather than through uniform enlargement. This also keeps the fix at the correct architectural layer — actor geometry is `Silhouette`/`Actor`'s concern alone. The Camera Engine and Timeline Compiler were deliberately left untouched (no camera framing or auto-framing logic was added to compensate for build height): the camera reasons only about beat content, active speaker, and cast size (ADR-024), never about an individual actor's silhouette geometry. Fixing the actual geometry at its source, instead of nudging camera `y`/zoom to paper over a taller silhouette's head position, keeps the Camera Engine decoupled from `engines/character`/`features/stage` exactly as ADR-024 requires.

**Trade-offs:** `design/spacing.ts`'s `actorHeightFraction` still derives its safety margin from the raw `scaleY` value (see the comment there), which is now a conservative overestimate rather than a tight bound — leg-only stretch raises the head by less than a full `scaleY` would, so the actual worst-case headroom need is smaller than what `actorHeightFraction` budgets for. This is intentional (a safe upper bound is cheap insurance against future token-table changes) but means characters render very slightly smaller than the tightest-possible-safe size. `Silhouette`'s SVG viewBox coordinates (hip/floor y-values) are shared, per-shape constants (`SHAPES` in `Silhouette.tsx`) that the translation math depends on; changing a shape's leg geometry without checking both legs still share the same hip/floor y would silently break the stretch anchor.

**Status:** Accepted

---

## ADR-018

**Decision:** The Timeline Compiler estimates each beat's on-screen duration from its content (dialogue line length, an explicit pause `durationMs`, or a fixed per-type constant, plus `holdMs`) rather than the Scene Controller inventing timing at playback time. The Scene Controller schedules exactly one `setTimeout` per beat off that duration — never a per-frame loop — and tracks `remainingMs`/`beatEnteredAt` so pause/resume is accurate to the millisecond.

**Context:** Milestone 2 has no Speech Engine yet (ADR-005's speech clock lands in Milestone 3), so something has to decide how long a silent scene holds on each beat. The duration also has to be deterministic, since Milestone 2's definition of done requires the same script to produce the same run every time.

**Reasoning:** Putting the duration estimate in the compiler (not the controller) keeps "how long is this beat" a pure function of the `SceneScript`, consistent with the Timeline Compiler's existing responsibility for "computing timing information." It also gives Milestone 3 a clean seam: the Speech Engine will supply real utterance-derived durations for dialogue beats and the controller's clock-source strategy picks between the two, rather than the timer logic needing to be rewritten. A single `setTimeout` per beat (instead of a ticking interval) matches CLAUDE.md's Performance Rules — nothing about playback pacing needs 60Hz resolution, and `PlaybackSlice.elapsedMs` is deliberately updated once per beat, not every frame (ADR-004).

**Trade-offs:** The duration heuristics (55ms/char for dialogue, fixed constants for title/slugline/action/reveal beats) are hand-tuned guesses with no basis in actual speech timing; they will very likely be replaced wholesale by real `onboundary`/`onend`-derived durations once the Speech Engine exists in Milestone 3, at which point this ADR's timer-clock path becomes the fallback rather than the only path (per ADR-005).

**Status:** Accepted

---

## ADR-027

**Decision:** `ai/createScene`'s `onStatusChange` callback fires exactly once, with `'generating'`, when generation begins. There is no matching `'ready'` event. The caller (`hooks/useSceneGeneration.ts`) applies the resolved script and its own `'ready'` status transition together, in one `.then()` callback — `setScript(script)` immediately followed by `setStatus('ready')` — never as two separately-triggered updates.

**Context:** The first Milestone 6 implementation had `createScene` itself call `onStatusChange?.('ready')` right before returning, and the hook wired that straight into `setStatus`, with `setScript` applied separately in the promise's `.then()`. In the browser this surfaced exactly the failure class ADR-022 already named for engines: React 18's `<StrictMode>` double-invokes `WritingRoom`'s mount effect in dev, producing two independent `createScene` calls — one whose `AbortController` gets aborted by the first cleanup, one real. The aborted call still ran its fallback path to completion in the background (harmless on its own, since its final `setScript` was correctly skipped behind a `cancelled` guard) and called `onStatusChange('ready')` unconditionally, which was *not* behind that guard. `sceneSlice.status` flipped to `'ready'` while `script` was still whatever it had been before (`null` on the very first run), and `DirectorRoom`'s `status === 'ready' && script` branch failed, falling through to `<PremiseScreen />` with a freshly blanked input — a visible regression to the start screen after a successful generation.

**Reasoning:** The proximate bug (missing a `cancelled` guard on one of three callbacks) was a one-line fix, but the deeper issue is the same one ADR-022 already identified: two `setState` calls that must be observed together but are triggered from different points in an async flow can be seen a render apart, especially across a promise-then microtask boundary, since promise callbacks are never guaranteed to land in the same batch as the code that scheduled them. Removing the `'ready'` event from `createScene` entirely — rather than just re-adding the guard — removes the seam where that split can happen at all: there is exactly one place (`useSceneGeneration`'s `.then()`) that ever transitions `status` to `'ready'`, and it does so in the same synchronous callback that sets `script`, which React 18's automatic batching guarantees lands in one render. `createScene`'s existing "never rejects" contract (ADR-015) already means promise resolution *is* "ready" from the caller's point of view; a second, redundant status event calling out the same moment was surface area for exactly this class of bug and added no information the resolved promise didn't already carry.

**Trade-offs:** `CreateSceneStatus` is now a single-member union (`'generating'`) purely for future-proofing if an intermediate status is ever needed; a caller that wants a distinct "ready" signal must derive it from promise resolution itself, not from a callback, which is a mildly less obvious calling convention than a symmetric `'generating'`/`'ready'` pair would have been. Any future addition to `ai/`'s callback surface should default to firing at most once per meaningfully-distinct moment, and multi-field updates that must be observed atomically should be the caller's job to combine, not something spread across two async callbacks.

**Status:** Accepted

---

## ADR-028

**Decision:** `api/generate-scene.ts`'s `toPlainTextStream` `pull()` implementation now loops across upstream reads until it can enqueue at least one delta or the upstream closes, instead of performing exactly one upstream `read()` per `pull()` call and returning regardless of whether anything was enqueued.

**Context:** Found during the Milestone 6 PR review's follow-up cleanup, while adding the review's requested lightweight API-layer tests. A test that fed `toPlainTextStream` an upstream chunk containing only a `[DONE]` line (no delta) hung indefinitely instead of completing. Reproduced outside the test harness with a standalone Node script to rule out a test-infrastructure artifact: confirmed that when a `ReadableStream`'s `pull()` callback resolves without calling `enqueue()` or `close()`, the stream does not automatically re-invoke `pull()` — per the WHATWG spec, `pull()` is only called again on the next explicit `read()` from a consumer or a re-entrant call while already pulling (`[[pullAgain]]`), not simply because the previous call's promise settled with nothing done. The original implementation read exactly one upstream chunk, decoded it into zero or more lines, enqueued a delta for each line that had one, and returned — with no accounting for the case where none of those lines carried a delta.

**Reasoning:** This was not a hypothetical edge case. OpenAI-compatible streaming chat-completion APIs, including Groq's, conventionally open a stream with a `{"delta":{"role":"assistant"}}` chunk carrying no `content`, and may also emit blank keep-alive lines. Any upstream network `read()` that happens to land on one of these — which, for the very first chunk of every real stream, it always does — resolves `pull()` without enqueueing, permanently stalling the client's `for await` loop in `ai/groqStream.ts`. The only thing that ever unblocked a real generation attempt was `createScene`'s unrelated 20-second per-attempt `AbortController` timeout (ADR unnamed, see `createScene.ts`'s `DEFAULT_TIMEOUT_MS`), which exists for a different reason (network calls that never resolve at all) but incidentally also covered this case — meaning every live-Groq attempt likely burned a full 20 seconds before falling back to a retry, and the whole 40-second two-attempt chain before falling back to the seed script, with no visible error and no signal that anything was wrong. This is exactly the kind of masked failure the "never rejects" fallback chain (ADR-015) is designed to survive gracefully, but surviving gracefully still isn't the same as working: the live-Groq path had, in effect, never actually been exercised successfully in any session, including the original Milestone 6 verification (which only had the opportunity to test the seed-fallback path, since no `GROQ_API_KEY` was available then either).

**Trade-offs:** None of consequence — the fix is a straightforward loop with the same per-chunk decode/split/enqueue logic as before, no new dependencies, no change to the response shape or headers, and `groqStream.ts`/`createScene.ts` are both unaware anything changed. The fix does not, by itself, prove the live-Groq path now works end-to-end against the real API (still blocked on a deployed `GROQ_API_KEY`); it removes the specific defect that was guaranteed to break it every time.

**Status:** Accepted

---

## ADR-029

**Decision:** An untrusted candidate document passes through a **pre-validation coercion layer** (`schema/coerce/`) before `sceneScriptSchema.safeParse`, not after. The layer resolves out-of-vocabulary enum values through a four-step ladder (exact member → canonical member → curated alias → longest embedded member) and fills in bookkeeping the renderer can derive, then hands the result to the *same* Zod parse and referential-integrity check every `SceneScript` has always gone through. Alongside it, the `setting`, `genre`, and `mood` vocabularies were expanded, and `beats[].id` was removed from what the model is asked to author.

**Context:** With a live `GROQ_API_KEY` finally available, the ingestion path was measured against 16 real `llama-3.3-70b-versatile` responses for the first time (ADR-028 had removed the stream stall that previously made this impossible to observe). **Only 4 of 16 validated.** The other 12 were discarded and replaced by the `heist-library` seed script — the user-visible bug: the Writing Room showed "Echoes at Sea / Lighthouse / Drama", then the Stage performed the heist demo. The failures were not creative failures. Counted across the corpus:

| Cause | Occurrences |
|---|---|
| `beats[].id` absent | 61 |
| `null` written for an absent optional field (`weather`, `exit`, `build`, `silhouetteAccent`, `parenthetical`, `establishingText`, `outro.text`) | 12 |
| enum value borrowed from a sibling enum (`entrance.style: "stand"`, `"none"`) | 3 |
| `setting` outside the 12-value enum (`"lighthouse"`, `"hotel"`, `"bunker"`) | 3 |
| beat `type` outside the union (`"music"`) | 2 |
| string longer than its schema maximum | 1 |

Every one of these is *miscoded* content, not *missing* content — the scene the model wrote was fine, and was thrown away over an id it had no reason to invent and a `null` that means exactly what `undefined` means.

**Reasoning:** CLAUDE.md's JSON Schema Rules and ADR-015 both already required that "unknown or invalid enum values are normalized to a defined default, never thrown as fatal errors in the render path." That was never implemented — `validateSceneScript` failed hard on the first unknown enum. It *cannot* be implemented after `safeParse`, because Zod has already rejected the document by then, so the only place it can live is ahead of the parse, operating on `unknown`. Crucially this is not a bypass: the coerced document still has to satisfy the identical schema and referential-integrity checks, so the renderer's "validated JSON only" guarantee is untouched. The layer only decides what an out-of-vocabulary value *means*, before the contract is checked.

The design goal was to preserve the model's intent, not to make validation pass. Three mechanisms in descending order of fidelity:

1. **Expand the vocabulary where the renderer can genuinely honour it.** `setting` gained 10 art-directed members (`lighthouse`, `ship`, `hospital`, `church`, `laboratory`, `graveyard`, `cabin`, `highway`, `mountain`, `castle`), each with a real backdrop in `design/environments.ts` — a lighthouse premise now renders *as a lighthouse*. `genre` gained four top-level film genres it could not previously express (`mystery`, `action`, `adventure`, `supernatural`); `mood` gained `hopeful`. Genre and mood cost nothing in art direction today (both are display-only until the Music Engine lands), while each new `setting` is a real design commitment, which is what bounds the expansion.
2. **Semantic aliases for the long tail.** ~450 curated entries, each required to be a true synonym, a strict subtype, or the nearest renderable neighbour (`cathedral`→`church`, `tavern`→`diner`, `run`→`stride`). Two unit tests assert every alias key is in canonical form and every alias/fallback target is a real member of its own vocabulary, so the tables cannot rot into dead entries or into a coercion that lands in a second Zod failure.
3. **A least-committal fallback, only when the first two fail.** `setting` falls back to `void` — an abstract dark stage that asserts *no* location — specifically so an unrecognized place is never rendered as a confidently wrong one. This is the direct answer to "do not silently replace lighthouse with forest": the fallback declines to name a place rather than naming the wrong one. The `slugline` is free text and always survives verbatim, so the scene still *reads* as its real location on screen even in the fallback case.

`beats[].id` is handled differently again, by asking for less: it is renderer bookkeeping with no creative content, so the prompt no longer requests it and the coercion layer derives `${type}-${index}`. The schema keeps `id` **required**, so every downstream consumer still sees `id: string` rather than `id?: string` — the field is filled in at ingestion, not weakened in the contract.

Equally deliberate is what the layer refuses to repair: a missing dialogue `line`, an unrecognizable beat `type`, a beat list below the schema minimum, and **duplicate cast ids**. The last one is the sharp case. Beat ids are de-duplicated freely because nothing references them; cast ids are the target of a reference graph, so silently renaming a colliding second character would bind half the scene's dialogue to the wrong actor. Those all still fail validation and drive the existing repair → retry → seed-fallback chain, which preserves the Milestone 6 review's duplicate-cast-id fix intact.

**Results:** the captured corpus went from 4/16 to 16/16 validating, with no script's title, beat count, or authored setting altered — the only changes were the miscodings above. The corpus is committed as `ai/groqSamples.fixture.ts` and asserted per-sample in `ai/groqSamples.test.ts`, including a test pinning the original bug: the lighthouse premise must reach playback with `setting: 'lighthouse'` and a slugline still naming a lighthouse.

**Trade-offs:** The alias tables are hand-curated judgement calls and will need occasional extension; that is accepted as the cost of not falling back arbitrarily, and the two structural tests keep them honest without anyone having to re-read them. `resolveEnum`'s embedded-substring step (step 4) is the one genuinely fuzzy rule — it resolves "abandoned warehouse" correctly but could in principle mis-resolve an unforeseen compound, so it is bounded to matches of 4+ characters and takes the longest match ("starship bridge" resolves on `starship`, not `bridge`). Coercion is by nature silent to the user, which is exactly the risk ADR-015 flagged; `validateSceneScript` therefore returns a `coercions: CoercionNote[]` list on both success and failure, and `createScene` logs it in development only. The `setting` vocabulary is now 22 values, so any future table keyed on `Setting` (a music arrangement, a particle default) has 22 entries to fill rather than 12 — `Record<Setting, T>` makes that a compile error rather than a silent gap, which is the intended pressure.

**Status:** Accepted
