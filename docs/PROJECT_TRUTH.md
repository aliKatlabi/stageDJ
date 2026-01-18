# /docs/PROJECT_TRUTH.md
## 1) One-paragraph vision
StageDJ is a web-first game-like stage where users drag performers and outfits to build an “Angelic Techno” audiovisual show. Characters/animation are premium and elegant; audio is grid-locked and quantized; output can be recorded for YouTube.

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
- Roles spawn on stage by default in a band lineup with a neutral outfit (no loop).
- Tray contains outfits grouped by role (Kick/Perc/Bass/…).
- Outfit drop uses dedicated drop zones: dropping within a radius around a performer applies the outfit; otherwise no effect.

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

## 7) Next actions (the “what we do next” list)
1) Freeze JSON schemas (roles, outfits, loop assets)
2) Define starter content pack spec (how many loops/outfits per role)
3) Implement Milestone 1
