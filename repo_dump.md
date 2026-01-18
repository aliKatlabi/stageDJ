# Repository Dump

Generated on 2026-01-17 21:57:39 from root $rootName.

## Project Tree

- **docs/**
  - **ADR/**
    - docs/ADR/ADR-0001-stack.md
  - docs/agent_project_requirment.md
  - docs/PROGRESS_LOG.md
  - docs/PROJECT_TRUTH.md
  - docs/TASK_BOARD.md
- **public/**
  - **assets/**
    - public/assets/README.md
- **src/**
  - src/README.md

---

## File Contents

### `docs/ADR/ADR-0001-stack.md`

```markdown
# /docs/ADR/ADR-0001-stack-web.md

# ADR-0001: Web-first stack for v1

## Decision
Use PixiJS (rendering) + WebAudio (audio) + MediaRecorder (record/export) for v1.

## Context
Need game-like stage without Unity, fast iteration, and the ability to record video for YouTube.

## Alternatives considered
- Unity (heavy workflow, slower iteration)
- Phaser (good, but Pixi is lighter for custom stage rendering)
- Three.js (nice visuals, heavier for v1)

## Consequences
- Great iteration speed and shareability.
- Recording quality depends on browser limitations; may upgrade to WebCodecs later.

```

### `docs/agent_project_requirment.md`

```markdown
# MASTER PROMPT â€” â€œStageDJâ€: Angelic Techno Game-Stage Loop Composer + Elegant Characters + Recordable Show (Web-First)

You are a senior product designer + real-time audio engineer + game UX designer + character animation director + web graphics engineer. Help me design and prototype a WEB-FIRST app that creates an energetic, emotional â€œAngelic Technoâ€ audiovisual show by layering loops and rhythmic vocal clips. This is interactive composing (not ultra-low-latency live performance). Users build a show by placing performers on a stage; character visuals/animation are a core part of the value.

## Key goals
- Must feel like a GAME and a SHOW, not a DAW.
- Characters and animations must be elegant and satisfying.
- Audio stays tight and musical via a global tempo grid and quantized changes.
- Output must be recordable/exportable for YouTube.

## Layout requirement (UI)
- The STAGE takes the full width of the screen and most of the height.
- The CHARACTER TRAY is at the BOTTOM (cast bar / band lineup).
- Users drag performers/outfits from the tray onto the stage.

## Style definition: â€œAngelic Technoâ€
Driving rhythm + luminous, sacred emotion:
- Rhythm: forward, energetic, clean
- Harmony: airy pads/choir textures, shimmering bells, wide reverb (not harsh)
- Vocals: rhythmic vocals with at least ONE repeatable sentence hook; generic synthetic voices only (no cloning real singers)
- FX: light-beam risers/impacts (celestial, not explosive)

## MVP roles (6 performers)
Use 6 core categories (MVP), each represented by ONE performer role:
1) Kick/Drive
2) Perc/Hats
3) Bass
4) Pads/Choir
5) Lead/Bells
6) Vox/Chants

Each role can play ONLY loops from its own category.

## Wardrobe / Outfit mechanic (FUN loop selection; no swipe/next buttons)
Loop selection must NOT rely on swipe/next-prev buttons or boring lists as the primary UX.
Instead, use a wardrobe/outfit mechanic:

- Each role has a â€œclosetâ€ of OUTFITS (skins).
- Each outfit corresponds to a LoopPreset (audio loop + animation/style preset).
- User drags an outfit onto the performer on stage (or onto the performerâ€™s slot in the tray).
- The performer shows immediate visual feedback (pre-swap transition), then the audio changes at a quantized boundary.

### Pre-swap transition (required)
- Visual transform begins immediately upon outfit drop (sparkle/pose/wardrobe morph).
- Audio swap waits for the chosen quantized boundary.
- At the exact swap boundary, trigger a clear accent cue (pose hit, flash, stomp, etc.).
This makes delayed swaps feel intentional and â€œshow-like,â€ not laggy.

## Audio timing rules (plain language, no assumptions)
### Bars and loop lengths
- Explain what a â€œbarâ€ is (usually 4 beats in dance music).
- Loops have lengths in bars: 1, 2, 4, or 8 bars.
- Enforce that loop assets are exported to loop cleanly at their declared bar length.

### Quantization and two swap modes
All playback uses a global Transport (clock) with BPM and a beat/bar grid. Actions occur on boundaries so audio stays aligned.

Support TWO swap modes:
1) BAR-QUANTIZED (snappy):
   - Outfit swap takes effect at the next bar boundary.
2) LOOP-QUANTIZED (musical/elegant):
   - Outfit swap takes effect at the end of the currently playing loopâ€™s full cycle (based on its bar length), then starts the new loop on the next compatible boundary.

Default swap mode: LOOP-QUANTIZED (elegant), with a toggle to BAR-QUANTIZED.

### Add/remove behavior
- Adding a performer starts its current outfit loop at a quantized boundary (choose bar by default).
- Removing can be:
  - immediate stop (responsive), OR
  - quantized stop (clean)
Pick one for MVP and justify; optionally support both later.

### SAFE vs CHAOS modes
- SAFE MODE (default):
  - tempo locked
  - category caps (only 1 bass, 1 lead, etc.)
  - auto gain staging by category
  - basic master limiter/soft clip to prevent distortion
- CHAOS MODE:
  - relax certain constraints (timing/pitch/layer caps), but keep the system usable (still no clipping).

## Vocal animation requirement (Option A only for MVP)
We will NOT require platform-provided timestamps.
Vocal mouth movement uses a simple, scalable MVP system driven by the vocal audio envelope:
- Mouth states: closed / open-small / open-wide
- Triggered by vocal loudness and peaks (syllable-like hits).
Goal: believable â€œsinging/chantingâ€ without phoneme-level lip sync.

## Character animation priority (elegant, scalable)
Use an animation approach suitable for elegant characters on the web (e.g., Rive or skeletal 2D like Spine, or high-quality sprite sheets).
Define animation states per performer:
- idle (breathing/poise)
- performing (loop active)
- accent (beat/bar hits)
- transition/transform (pre-swap and swap accent)
- muted (clear but elegant indication)

Drive animation with:
- Transport events (beat/bar)
- simple audio-reactive signals (low/mid/high energy OR per-track loudness)

## Content pipeline (MVP)
For MVP, do NOT generate audio inside the app:
- Loops and vocal clips are created externally (AI generator platform or custom pipeline).
- The app ingests assets via files + metadata JSON.
- Design for easy expansion: adding new outfits/loops should be content-only (minimal or no code changes).

## Stage simplicity (v1 visual scope)
Stage visuals can be simple in v1 (no heavy glow/shaders required), but:
- performers must be visually distinct and elegant
- performance animations must read clearly and match the beat
- layout should support 6â€“8 performers lined horizontally like a band if needed

## Tech stack (avoid Unity; web-first)
Recommend ONE primary v1 stack and ONE backup. Prefer:
- Rendering: PixiJS (or Phaser) for stage and 2D characters
- Audio: WebAudio API with a stable Transport scheduler
- Recording: canvas capture + audio stream to MediaRecorder (v1), with a path to upgrade later

Explain tradeoffs for performance, timing stability, and recording quality.

## Architecture requirements (code quality)
The codebase must be:
- Extendable (easy to add/modify performers, outfits, and loops)
- Easy to debug (clear logs, debug overlay)
- Readable (modular, minimal coupling)

Provide:
- Modules:
  - AssetManager
  - Transport/Clock
  - AudioEngine (LoopPlayer, Mixer)
  - StageRenderer (Pixi)
  - AnimationController
  - Recorder
  - UI
  - DebugPanel
- Data schemas (JSON) for:
  - PerformerRole
  - Outfit/LoopPreset
  - LoopAsset (category, BPM, bars, energy, file path)
  - VocalAsset (category, BPM, bars, sentence_hook flag, file path)
  - SceneState (active performers, chosen outfits, positions, mute states)
- Step-by-step MVP build plan (milestones) and minimal prototype spec:
  - 6 roles
  - multiple outfits per role (e.g., 6 per role)
  - wardrobe drag-drop onto performer to swap outfit (with pre-swap transition)
  - support BAR-QUANTIZED and LOOP-QUANTIZED swap modes
  - record/export button outputs a shareable video

## Constraints and safety
- No copyrighted music. All loops/vocals must be original or properly licensed.
- No cloning real singersâ€™ voices or recognizable vocal identities.
- Explain terms once in simple language.
- If uncertain, state assumptions and offer options.

## Output format
- 1 paragraph summary of v1 direction
- Headings:
  Layout, Roles, Wardrobe UX, Audio Rules, Vocal Animation, Animation System, Recording, Content Pipeline, Tech Stack, Architecture, Data Schemas (JSON), Milestones
- Practical, implementation-oriented, no fluff

```

### `docs/PROGRESS_LOG.md`

```markdown
# /docs/PROGRESS_LOG.md
## YYYY-MM-DD
- What changed:
- Why:
- Files touched:
- Known issues / follow-ups:

## 2026-01-17
- Summary: Initialized project truth + progress tracking structure.
- What changed: Added PROJECT_TRUTH.md / PROGRESS_LOG.md / TASK_BOARD.md / ADR skeletons.
- Why: Ensure continuity + recreate project if chat context is lost.
- Files touched: /docs/*
- Known issues: None yet.
- Next: Freeze JSON schemas; define starter content pack spec.

## 2026-01-17
- Summary: Locked M1 blueprint and added Pixi-based visual skeleton plan + schemas aligned to repo layout.
- What changed:
  - Confirmed canonical asset metadata locations:
    - assets/characters/meta/roles.json
    - assets/characters/meta/outfits.json
    - assets/audio/meta/loops.json
  - Froze JSON content contracts for roles/outfits/loops (data-driven extendability).
  - Defined M1 event-flow contract (drop performer, drop outfit, pre-swap transition, swap modes).
  - Added M1 implementation (Pixi stage + bottom tray + drag/drop + debug overlay) with placeholder swap timing (to be replaced by Transport in M2).
- Why:
  - Ensure project is recreatable and extendable via JSON + assets.
  - Build a playable visual toy before adding timing/audio complexity.
- Files touched (expected):
  - docs/PROGRESS_LOG.md
  - docs/TASK_BOARD.md
  - assets/characters/meta/roles.json
  - assets/characters/meta/outfits.json
  - assets/audio/meta/loops.json
  - src/main.ts
  - src/core/assets/AssetManager.ts
  - src/core/state/types.ts
  - src/core/state/SceneStore.ts
  - src/core/debug/DebugOverlay.ts
  - src/stage/StageRenderer.ts
  - index.html
- Known issues:
  - Placeholder swap timing uses setTimeout; must be replaced with Transport scheduling in M2.
  - Tray overflow/scroll not implemented in M1.
  - Performer visuals are placeholders (no real sprites wired yet).
- Next:
  - Run M1 locally, confirm drag/drop + debug overlay behavior.
  - Implement M2 Transport and replace placeholder swap timing with real bar/loop boundaries.

## 2026-01-17
- Summary: M1 verified working; starting M2 Transport integration.
- What changed: Replace placeholder swap delays with Transport-based scheduling using BPM + bar/loop boundaries.
- Why: Make visuals+logic match the real timing model that audio will use later.
- Next: Add Transport module; wire swap scheduling; show beat/bar in debug overlay.

```

### `docs/PROJECT_TRUTH.md`

```markdown
# /docs/PROJECT_TRUTH.md
## 1) One-paragraph vision
StageDJ is a web-first game-like stage where users drag performers and outfits to build an â€œAngelic Technoâ€ audiovisual show. Characters/animation are premium and elegant; audio is grid-locked and quantized; output can be recorded for YouTube.

## 2) Non-negotiable requirements
- Web-first, avoid Unity
- Full-width stage + bottom tray
- 6 roles (Kick/Drive, Perc/Hats, Bass, Pads/Choir, Lead/Bells, Vox/Chants)
- Wardrobe/outfit swapping (no swipe/next UI)
- Two swap modes: BAR-QUANTIZED and LOOP-QUANTIZED
- Pre-swap transition: visuals immediate, audio swaps at quantized boundary
- Vox includes at least one repeatable sentence hook
- Mouth animation Option A: envelope-based (no timestamps)
- Extendable by content (JSON + assets), easy to debug/read

## 3) Current decisions (locked)
- Stack: PixiJS + WebAudio + MediaRecorder
- State model: SceneState with RoleInstances, pendingSwap, swapMode
- Content pipeline MVP: external audio generation; app ingests assets + JSON metadata

## 4) Repo layout
(Paste your current repo layout here.)

## 5) MVP scope
### In scope
- Drag performer onto stage => loop starts quantized
- Drag outfit onto performer => pre-swap transition + quantized swap
- Mute/remove performer
- Record/export video (canvas + mixed audio)
- Debug panel (BPM, bar/beat, active roles, scheduled swaps)

### Out of scope (v1)
- In-app AI generation
- Advanced shaders/glow/3D
- Time-stretching to arbitrary BPM
- Phoneme-accurate lip sync
- Accounts/sharing/multiplayer

## 6) Milestones
- M1 Visual skeleton (stage + tray + drag/drop)
- M2 Transport (BPM grid + debug ticks)
- M3 Audio loops (quantized start/stop)
- M4 Wardrobe swap + two swap modes + pre-swap transition
- M5 Recording/export
- M6 Polish (animation states, UX)

## 7) Next actions (the â€œwhat we do nextâ€ list)
1) Freeze JSON schemas (roles, outfits, loop assets)
2) Define starter content pack spec (how many loops/outfits per role)
3) Implement Milestone 1

```

### `docs/TASK_BOARD.md`

```markdown
# /docs/TASK_BOARD.md

## Backlog (ideas, not scheduled)
- Energy slider affecting animation intensity + mix macros
- FX as â€œmoment buttonâ€ (non-performer) for v1.1
- Save/load scenes
- Upgrade recorder quality (WebCodecs) if MediaRecorder limits quality

## Next (do soon)
- [ ] Freeze JSON schemas: roles, outfits, loop assets, scene state
- [ ] Define starter content pack spec (how many outfits per role; naming; folder structure)
- [ ] Create placeholder asset set (silent loops or simple tones) to unblock dev
- [ ] Define event flow: drag performer, drag outfit, mute/remove, record start/stop

## In Progress
- (empty)

## Done
- [x] Decide v1 stack: PixiJS + WebAudio + MediaRecorder
- [x] Decide UX: full-width stage + bottom tray
- [x] Decide wardrobe swapping + two swap modes + pre-swap transition
- [x] Decide mouth animation Option A (envelope-based)

## Failures & Why (keep this honest and short)
> Rule: If something fails, add a bullet here with cause + fix.

- (none yet)

## Notes / Working Agreements
- After each milestone: update PROGRESS_LOG.md and TASK_BOARD.md.
- If a decision changes: add an ADR entry explaining why.


## Next
- [ ] M2 Transport: BPM grid + beat/bar ticks + swap scheduling timestamps

## In Progress
- [ ] M2 Transport: BPM grid + beat/bar ticks + real swap scheduling (bar/loop)

## Done
- [x] M1 Visual skeleton: stage + bottom tray + drag/drop + debug overlay (no audio)

## Failures & Why
- Symptom: App failed to load assets; "Role perc defaultOutfitId not found"
- Cause: roles.json referenced perc_outfit_01 but outfits.json did not contain it
- Fix: ensure each role has a valid default outfit; add missing outfits + referenced loops
- Prevention: treat roles/outfits/loops as a contract; validate with a quick script/check before running

- Symptom: SwapMode toggle stopped working after adding beat/bar ticker.
- Cause: Debug overlay re-rendered entire HTML each animation frame, destroying the button before click completed.
- Fix: Build debug DOM once; update only text nodes each frame; attach handlers once.
- Prevention: Never replace interactive DOM in a per-frame render loop; update text/attributes only.

- Symptom: Dragging stopped working (no drag move/up).
- Cause: Pixi stage had no hitArea; pointermove/pointerup events on stage didnâ€™t fire reliably.
- Fix: Set app.stage.hitArea = app.screen (and update on resize).
- Prevention: Always set hitArea when using stage-level pointer handlers.

```

### `public/assets/README.md`

```markdown
# /assets/meta/README.md

This folder contains metadata that defines:
- roles (performer categories)
- outfits (wardrobe presets)
- loop assets (audio loops and vocal loops)
These files should be treated as the content contract of the app.
Adding new outfits/loops should usually not require code changes.

```

### `src/README.md`

```markdown
```

