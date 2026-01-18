# MASTER PROMPT — “StageDJ”: Angelic Techno Game-Stage Loop Composer + Elegant Characters + Recordable Show (Web-First)

You are a senior product designer + real-time audio engineer + game UX designer + character animation director + web graphics engineer. Help me design and prototype a WEB-FIRST app that creates an energetic, emotional “Angelic Techno” audiovisual show by layering loops and rhythmic vocal clips. This is interactive composing (not ultra-low-latency live performance). Users build a show by placing performers on a stage; character visuals/animation are a core part of the value.

## Key goals
- Must feel like a GAME and a SHOW, not a DAW.
- Characters and animations must be elegant and satisfying.
- Audio stays tight and musical via a global tempo grid and quantized changes.
- Output must be recordable/exportable for YouTube.

## Layout requirement (UI)
- The STAGE takes the full width of the screen and most of the height.
- The CHARACTER TRAY is at the BOTTOM (cast bar / band lineup).
- Users drag performers/outfits from the tray onto the stage.

## Style definition: “Angelic Techno”
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

- Each role has a “closet” of OUTFITS (skins).
- Each outfit corresponds to a LoopPreset (audio loop + animation/style preset).
- User drags an outfit onto the performer on stage (or onto the performer’s slot in the tray).
- The performer shows immediate visual feedback (pre-swap transition), then the audio changes at a quantized boundary.

### Pre-swap transition (required)
- Visual transform begins immediately upon outfit drop (sparkle/pose/wardrobe morph).
- Audio swap waits for the chosen quantized boundary.
- At the exact swap boundary, trigger a clear accent cue (pose hit, flash, stomp, etc.).
This makes delayed swaps feel intentional and “show-like,” not laggy.

## Audio timing rules (plain language, no assumptions)
### Bars and loop lengths
- Explain what a “bar” is (usually 4 beats in dance music).
- Loops have lengths in bars: 1, 2, 4, or 8 bars.
- Enforce that loop assets are exported to loop cleanly at their declared bar length.

### Quantization and two swap modes
All playback uses a global Transport (clock) with BPM and a beat/bar grid. Actions occur on boundaries so audio stays aligned.

Support TWO swap modes:
1) BAR-QUANTIZED (snappy):
   - Outfit swap takes effect at the next bar boundary.
2) LOOP-QUANTIZED (musical/elegant):
   - Outfit swap takes effect at the end of the currently playing loop’s full cycle (based on its bar length), then starts the new loop on the next compatible boundary.

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
Goal: believable “singing/chanting” without phoneme-level lip sync.

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
- layout should support 6–8 performers lined horizontally like a band if needed

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
- No cloning real singers’ voices or recognizable vocal identities.
- Explain terms once in simple language.
- If uncertain, state assumptions and offer options.

## Output format
- 1 paragraph summary of v1 direction
- Headings:
  Layout, Roles, Wardrobe UX, Audio Rules, Vocal Animation, Animation System, Recording, Content Pipeline, Tech Stack, Architecture, Data Schemas (JSON), Milestones
- Practical, implementation-oriented, no fluff
