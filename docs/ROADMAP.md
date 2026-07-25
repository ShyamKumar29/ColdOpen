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

## Milestone 3 — Speech Engine (Clock Handoff)

**Status:** Not Started

**Objective:** Characters speak, and speech becomes the clock master.

**Deliverables:**
- Voice enumeration and casting per character
- Utterance queue with sentence splitting
- `onboundary` → subtitle reveal + mouth flap
- Capability probe with automatic fallback to the timer clock
- Debug cue log (carried over from Milestone 2)

**Dependencies:** Milestone 2

**Definition of Done:**
- Two distinguishable voices perform dialogue
- Subtitles track speech timing
- Disabling TTS support degrades to Milestone 2 behavior with no visible break

---

## Milestone 4 — Camera, Lighting Transitions & Character Motion

**Status:** Not Started

**Objective:** The scene becomes cinematic rather than a slideshow.

**Deliverables:**
- Camera rig with named moves on a single composited node
- Character entrances, exits, and movement between slots
- Gestures
- Lighting fades, flickers, blackout
- Cut-to-black

**Dependencies:** Milestone 3

**Definition of Done:**
- Sustained 60fps with camera movement, two actors, and a lighting change simultaneously
- `prefers-reduced-motion` degradation path works correctly

---

## Milestone 5 — Groq Integration

**Status:** Not Started

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

## Milestone 6 — Music Engine

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

## Milestone 7 — Particles & Final Polish

**Status:** Not Started

**Objective:** Atmosphere and finish.

**Deliverables:**
- Dust, rain, embers, smoke particle effects
- Light-shaft god rays
- Title-card typography
- Loading theatre
- Keyboard shortcuts
- Share-a-premise URL param

**Dependencies:** Milestone 4

**Definition of Done:**
- No layout shift, no console errors
- FPS floor holds on integrated-GPU hardware

---

## Milestone 8 — Demo Hardening

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
