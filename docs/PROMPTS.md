# Cold Open — Prompt Library

Reusable prompts for future Claude Code sessions working on Cold Open. Each prompt assumes `CLAUDE.md`, `docs/ARCHITECTURE.md`, and `docs/DECISIONS.md` are available as context. Fill in the bracketed placeholders before use.

---

## Implementation

### Implement a new engine feature

```
Read docs/ARCHITECTURE.md section on [ENGINE NAME] before starting.

Implement [FEATURE] in engines/[engine-folder]/.

Requirements:
- No React imports in this file.
- Follow the event naming convention (domain:verb) for any new events.
- Reuse existing types from schema/ — do not redefine scene-data shapes.
- Add a short unit test that exercises the new behavior without a DOM.

Explain your approach before writing code if it touches more than one engine.
```

### Implement a new React component

```
Implement [COMPONENT] in features/[feature-folder]/.

Requirements:
- Decide and state whether this component is a stateful orchestrator or a stateless presenter before writing it.
- If it needs engine data, use an existing hook from hooks/ or propose a new one — do not call engine methods directly from the component body.
- No animation values above component-local concern should be re-implemented; use the presets in engines/animation.
- Follow the naming, file-size, and prop conventions in CLAUDE.md.
```

### Add a new field to the SceneScript schema

```
Add [FIELD] to the [Beat/Character/SceneHeader] type in schema/.

Requirements:
- Field must be optional with a normalizer-supplied default (see ADR-016 in docs/DECISIONS.md) unless this is an explicitly agreed breaking change.
- Update the normalizer to handle missing/invalid values.
- Update any affected seed script(s) in scenes/ to use the new field as a reference example.
- Do not change how existing fields are validated as a side effect.
```

---

## Debugging

### Diagnose a desync or timing bug

```
There is a timing/desync issue: [DESCRIBE SYMPTOM].

Investigate using this priority order:
1. Check whether anything is scheduling against an absolute timestamp instead of beat-relative timing or speech completion (see ADR-005, ADR-007).
2. Check the event bus cue log for out-of-order or duplicate events.
3. Check whether a high-frequency value leaked into React state or the event bus instead of a MotionValue/ref.

Report the root cause before proposing a fix. Do not add a timeout or delay as a workaround without identifying why the timing assumption failed.
```

### Diagnose a rendering/visual bug

```
[DESCRIBE VISUAL BUG] is happening in [COMPONENT/ENGINE].

Trace the issue from the SceneScript through the pipeline: schema validation → normalization → timeline compilation → event emission → component render. State which stage is producing the incorrect value before changing any code.
```

### Diagnose a Web Speech / audio issue

```
[DESCRIBE SPEECH OR AUDIO SYMPTOM] is happening, reproduced in [BROWSER].

Check against the known Speech API limitations documented in docs/ARCHITECTURE.md (Engineering Risks → Speech API) before assuming this is a new bug:
- getVoices() timing
- utterance garbage collection
- onend not firing
- text length truncation

State which known limitation (if any) applies, or confirm this is a new issue, before implementing a fix.
```

---

## Code Review

### Review a pull request or diff for architectural compliance

```
Review this diff against CLAUDE.md and docs/DECISIONS.md. Specifically check:

- No engine file imports React.
- No high-frequency value is stored in React state or passed through the event bus.
- No component reaches into another feature's internals.
- No hardcoded scene content (dialogue, names, settings) outside schema/scenes.
- Event names follow domain:verb convention with a single authoritative emitter.
- No `any` types introduced.

List violations with file and line references. Do not silently fix them — report first.
```

### Review a new engine for coupling

```
Review engines/[engine-name] for tight coupling to other engines or to React.

Check specifically whether this engine:
- Imports another engine directly to call its methods (should go through the Controller or the bus instead).
- Imports anything from features/ or React.
- Could be deleted or replaced without requiring changes to other engines.

Report findings; do not refactor unless asked.
```

---

## Refactoring

### Extract logic into an engine

```
[COMPONENT/FILE] currently contains logic that belongs in an engine rather than a component.

Identify which engine (existing or new) this logic belongs in per docs/ARCHITECTURE.md's Core Systems table. Propose the extraction — including the resulting component's props/hook usage — before making changes.
```

### Reduce component or function size

```
[FILE] has grown beyond a size that's easy to reason about.

Propose a split along responsibility boundaries (not arbitrary line count) consistent with the layering in docs/ARCHITECTURE.md. State the proposed new file(s) and their responsibilities before making changes.
```

---

## Performance

### Investigate frame-rate drops

```
The app is dropping frames during [SCENARIO, e.g. "camera move + particle burst"].

Check in this order:
1. Any React state updates occurring at animation frequency.
2. Any animated element using a layout-triggering CSS property or a live SVG filter instead of transform/opacity.
3. Particle or DOM node counts exceeding their capped limits.
4. Multiple competing animations targeting the same MotionValue/property.

Report findings with the specific file/line before changing code.
```

### Audit for unnecessary re-renders

```
Audit [COMPONENT or feature folder] for unnecessary re-renders.

Check whether store subscriptions use narrow selectors, whether any component subscribes to more state than it visually depends on, and whether any transient value should be a ref/MotionValue instead of store state. Report findings before applying fixes.
```

---

## Architecture Review

### Validate a proposed change against the finalized architecture

```
I'm considering [PROPOSED CHANGE].

Check this against docs/ARCHITECTURE.md and docs/DECISIONS.md. State explicitly:
- Which layer(s) this change touches.
- Whether it violates any existing ADR, and if so, which one and why.
- Whether it can be implemented within the current architecture, or requires a new decision.

Do not implement anything yet — this is a review only.
```

### Propose a new architectural decision

```
[DESCRIBE THE SITUATION REQUIRING A DECISION]

Do not implement anything. Propose the decision in ADR format (Decision / Context / Reasoning / Trade-offs / Status: Proposed) so it can be reviewed and, if accepted, added to docs/DECISIONS.md.
```

---

## Milestone Completion

### Verify a milestone's Definition of Done

```
Check the current state of the codebase against the Definition of Done for [MILESTONE NAME] in docs/ROADMAP.md.

For each criterion, state whether it is met, partially met, or not met, with concrete evidence (file references, test results, manual verification steps). Do not mark anything done based on intent alone.
```

### Update tracking after completing work

```
I've completed [WORK] toward [MILESTONE NAME].

Update docs/CURRENT_TASK.md: move finished items into Completed, update Current Task, and set Next based on the remaining Deliverables for this milestone in docs/ROADMAP.md. Do not change ROADMAP.md's milestone status yourself — confirm with me whether this milestone is fully done before flipping its status.
```
