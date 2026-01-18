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

## 2026-01-17
- Summary: M2 validated: grouped wardrobe tray, proximity drop zone, mismatch validation, transport-timed swaps.
- What changed:
  - StageRenderer updated: roles spawn on stage; outfits grouped by role; outfit apply via proximity; target halo.
  - Transport now drives swap scheduling (bar/loop boundaries).
- Why:
  - Establish reliable UX + timing before adding audio.
- Known issues / decisions:
  - Neutral state should not be an outfit; refactor planned for M3 (currentOutfitId should be nullable).
- Next:
  - M3: implement AudioEngine with WebAudio loop playback scheduled by Transport.
  - Refactor neutral state to no-outfit (null), start audio only after outfit applied.
