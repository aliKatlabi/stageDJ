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
