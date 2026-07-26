# Cold Open — Roadmap

Milestones are sequenced so the AI integration lands second-to-last. Every milestone ends with something demo-able; if time runs out at any boundary, the project still has a working show.

---

## Milestone 0 — Skeleton & Contract

**Status:** Complete

**Objective:** Compiling app, the schema, and one hand-authored seed script.

**Deliverables:**
- Vite + TypeScript + Tailwind + Framer Motion project setup
- Event bus implementation
- Zustand store shell
- Zod schema for `SceneScript`
- `heist-library` seed script
- ESLint rule banning React imports in `engines/`

**Dependencies:** None

**Definition of Done:**
- Seed script validates against the schema with no errors
- Bus round-trips a typed event in a unit test
- App builds successfully with a clean local `npm run build`

Deployment to Vercel is not in scope for Milestone 0; it is introduced alongside the serverless Groq proxy in Milestone 5 (ADR-014).

---

## Milestone 1 — Static Stage

**Status:** Complete

**Objective:** A beautiful still frame rendered from JSON.

**Deliverables:**
- Letterbox, backdrop layers, silhouette SVGs (3 archetypes)
- Stage slot system
- Lighting presets as CSS
- Grain + vignette overlays
- Design tokens

**Dependencies:** Milestone 0

**Definition of Done:**
- Changing `setting`/`lighting`/`cast` in the seed script visibly changes the frame with no code edits
- Rendered frame reads as a film still

---

## Milestone 2 — Sequencer + Subtitles (Timer Clock)

**Status:** Complete

**Objective:** The scene plays as a silent film with screenplay captions.

**Deliverables:**
- Timeline compiler (`SceneScript` → `CueList`)
- SceneController with timer clock only
- Subtitle overlay
- Slugline / title cards
- Transport bar

**Dependencies:** Milestone 1

**Definition of Done:**
- Pressing play performs the full seed scene start to finish on estimated timings, with captions, pauses, and a clean ending
- Restart is idempotent

Debug cue log was deferred out of this milestone's scope and is carried over to Milestone 3.

---

## Milestone 3 — Character Animation Foundation

**Status:** Complete

**Objective:** Character state changes become smooth transitions instead of instantaneous swaps, without pulling in camera work or the speech clock.

**Deliverables:**
- Animation Engine: a framework-independent interpolation engine, owning its `MotionValue`s (same ownership pattern as the Camera Engine, ADR-017) and driven by an explicit `tick(now)` step rather than a hidden RAF-internal library call, so it stays unit-testable in plain Node
- A derived `CharacterPose` vocabulary (`idle`, `speaking`, `listening`, `surprised`, `thinking`) computed per beat from `SceneScript` content — never hardcoded UI behavior — and carried over the bus as a new minimal `character:pose` event
- Smooth opacity fades for character entrances/exits (replacing the Milestone 2 behavior where the renderer ignored `activeCharacters` entirely)
- A subtle pose-driven scale/vertical-settle transition, restrained and cinematic rather than exaggerated
- `prefers-reduced-motion` wired end-to-end for the first time: OS preference detected and reflected in the settings store, every preset shortened (not disabled, since pose/opacity carry meaning) in the same table as the full-motion presets

**Dependencies:** Milestone 2

**Definition of Done:**
- Character entrances/exits fade rather than pop
- Speaking/listening/surprised/thinking poses read as subtle, distinct, and readable
- The same `SceneScript` produces the same sequence of pose/opacity transitions every run
- `prefers-reduced-motion` shortens every character transition
- Beat progression, subtitles, and lighting remain exactly as synchronized as Milestone 2 left them

---

## Milestone 4 — Speech Engine (Clock Handoff)

**Status:** Complete (two deliverables deferred — see below)

**Objective:** Characters speak, and speech becomes the clock master.

**Deliverables:**
- Voice enumeration and casting per character
- Utterance queue with sentence splitting
- Capability probe with automatic fallback to the timer clock
- Deferred to a later milestone: `onboundary` → subtitle reveal + mouth flap (`speech:boundary` is emitted and available, but nothing consumes it yet — no phoneme/lip-sync animation shipped this milestone)
- Deferred to a later milestone: debug cue log (carried over from Milestone 2's deliverable list; still not implemented)

**Dependencies:** Milestone 3

**Definition of Done:**
- Two distinguishable voices perform dialogue
- Subtitles appear in sync with each dialogue beat's speech (full-line reveal at beat entry, not word-by-word `onboundary` tracking — that remains deferred, see above)
- Disabling TTS support degrades to Milestone 2 behavior with no visible break

---

## Milestone 5 — Camera & Lighting Foundation

**Status:** Complete (one deliverable rescoped out — see below)

**Objective:** The scene becomes cinematic rather than a slideshow. Character motion itself (pose/opacity/entrance/exit) was pulled forward into Milestone 3; this milestone is what's left — the camera and lighting.

**Deliverables:**
- Camera rig with named moves on a single composited node
- Automatic camera framing: the Timeline Compiler derives a shot/focus for every beat from scene state (active speaker, cast size, reveal moments) — a script with no authored `beat.camera` still gets a fully directed camera path (ADR-024)
- Lighting fades, flickers, blackout — `LightingRig` crossfades between presets rather than swapping instantly
- Cut-to-black — the `blackout` preset's `cut` transition
- Rescoped out of this milestone's original wording (ADR-025): "movement between stage slots (`beat.movements`) and gestures (`dialogueBeat.gesture`)" — both remain unwired schema fields, deferred to a later milestone

**Dependencies:** Milestone 4

**Definition of Done:**
- Sustained 60fps with camera movement, two actors, and a lighting change simultaneously
- `prefers-reduced-motion` degradation path works correctly for camera moves specifically (character-transition degradation already landed in Milestone 3) — every camera move collapses to a cut; lighting transitions collapse to an instant swap

---

## Milestone 6 — Groq Integration

**Status:** Complete

**Objective:** Any typed premise becomes a scene.

**Deliverables:**
- Groq client with streaming
- Tolerant preview parser feeding the "writing room" typewriter
- Validation → repair → retry-once → seed-script fallback chain
- Serverless proxy on Vercel so the API key never ships to the browser
- Referential integrity validation in the normalizer:
  - Validate `dialogue.characterId` exists in `cast`
  - Validate `movement.characterId` exists in `cast`
  - Validate `CameraDirection.target` references a valid character or supported preset
  - Validate entrance and exit beat numbers are within scene bounds
  - Introduce a shared `characterId` schema referenced by all `characterId` fields

**Dependencies:** Milestone 2

**Definition of Done:**
- A wide range of distinct premises all produce valid, watchable scenes
- A deliberately corrupted response still results in a playing scene

---

## Milestone 7 — Music Engine

**Status:** Not Started

**Objective:** Score.

**Deliverables:**
- Tone.js synthesis-only graph
- Mood-based arrangements
- Crossfade on mood change
- Dialogue ducking
- Stingers
- AudioContext unlock on the Direct button
- Mute toggle

**Dependencies:** Milestone 2

**Definition of Done:**
- Music starts on first gesture with no loading delay
- Music shifts with mood and ducks under dialogue
- No clipping or double-starts on restart

---

## Milestone 8 — Particles & Final Polish

**Status:** Not Started

**Objective:** Atmosphere and finish.

**Deliverables:**
- Dust, rain, embers, smoke particle effects
- Light-shaft god rays
- Title-card typography
- Loading theatre
- Keyboard shortcuts
- Share-a-premise URL param

**Dependencies:** Milestone 5

**Definition of Done:**
- No layout shift, no console errors
- FPS floor holds on integrated-GPU hardware

---

## Milestone 9 — Demo Hardening

**Status:** Not Started

**Objective:** Make judging unlosable.

**Deliverables:**
- Offline/API-failure banner with automatic seed fallback
- Curated example chips
- Deep-link parameter for a guaranteed-perfect run
- Themed error boundary
- Rehearsed run-through

**Dependencies:** All prior milestones

**Definition of Done:**
- Demo works with the network disconnected
- Multiple team members can run it cold, repeatedly, without incident
