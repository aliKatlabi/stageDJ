# /docs/TASK_BOARD.md

## Backlog (ideas, not scheduled)
- Energy slider affecting animation intensity + mix macros
- FX as “moment button” (non-performer) for v1.1
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
- [ ] Refactor neutral performer state: currentOutfitId = null (neutral is not an outfit)
- [ ] AudioEngine v1: load loop buffers, schedule start/stop/swap on Transport boundaries
- [ ] Per-performer gain + mute
- [ ] Master limiter/safety (simple)

## In Progress
- [ ] M3 Audio: WebAudio loop playback per performer; start only after outfit applied; quantized swaps (bar/loop)

## Done
- [x] M2 Transport: BPM grid + beat/bar ticks + real swap scheduling (bar/loop)
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
- Cause: Pixi stage had no hitArea; pointermove/pointerup events on stage didn’t fire reliably.
- Fix: Set app.stage.hitArea = app.screen (and update on resize).
- Prevention: Always set hitArea when using stage-level pointer handlers.
