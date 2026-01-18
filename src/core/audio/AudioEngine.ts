// File: src/core/audio/AudioEngine.ts

import type { AssetManager } from "../assets/AssetManager";
import type { Transport } from "../transport/Transport";

type TrackState = {
  gain: GainNode;
  currentSource: AudioBufferSourceNode | null;
  currentLoopAssetId: string | null;
  muted: boolean;
};

export class AudioEngine {
  private assets: AssetManager;
  private transport: Transport;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  // Map: loopAssetId -> decoded buffer (cached)
  private bufferCache = new Map<string, AudioBuffer>();

  // Map: instanceId -> track
  private tracks = new Map<string, TrackState>();

  // Mapping between performance timeline and audio timeline
  private perfStartMs: number | null = null;     // transport.getStartMs()
  private audioStartSec: number | null = null;   // ctx.currentTime when mapped

  constructor(assets: AssetManager, transport: Transport) {
    this.assets = assets;
    this.transport = transport;
  }

  /** Ensure AudioContext exists and is resumed (must be called on user gesture). */
  async ensureStarted(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);

      // Initialize mapping now
      this.perfStartMs = this.transport.getStartMs();
      this.audioStartSec = this.ctx.currentTime;
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
      // refresh mapping after resume
      this.perfStartMs = this.transport.getStartMs();
      this.audioStartSec = this.ctx.currentTime;
    }
  }

  /** Create track if missing. */
  private ensureTrack(instanceId: string): TrackState {
    if (!this.ctx || !this.master) throw new Error("AudioEngine not started");

    let t = this.tracks.get(instanceId);
    if (t) return t;

    const gain = this.ctx.createGain();
    gain.gain.value = 1.0;
    gain.connect(this.master);

    t = { gain, currentSource: null, currentLoopAssetId: null, muted: false };
    this.tracks.set(instanceId, t);
    return t;
  }

  setMuted(instanceId: string, muted: boolean): void {
    if (!this.ctx) return; // if audio never started, ignore
    const t = this.ensureTrack(instanceId);
    t.muted = muted;

    const now = this.ctx.currentTime;
    const target = muted ? 0.0 : 1.0;
    t.gain.gain.cancelScheduledValues(now);
    t.gain.gain.setValueAtTime(t.gain.gain.value, now);
    t.gain.gain.linearRampToValueAtTime(target, now + 0.03);
  }

  /** Schedule an outfit change at a specific performance-now time. */
  async scheduleOutfitChangeAt(
    instanceId: string,
    newOutfitId: string,
    atPerfMs: number
  ): Promise<void> {
    await this.ensureStarted();

    const outfit = this.assets.getOutfit(newOutfitId);
    if (!outfit) return;

    const loopAssetId = outfit.loopAssetId ?? null;

    // If outfit has no loop: stop at boundary
    if (loopAssetId === null) {
      this.scheduleStopAt(instanceId, atPerfMs);
      return;
    }

    this.scheduleSwapLoopAt(instanceId, loopAssetId, atPerfMs);
  }

  /** Fade out and stop current loop at a boundary. */
  scheduleStopAt(instanceId: string, atPerfMs: number): void {
    if (!this.ctx) return;
    const t = this.ensureTrack(instanceId);

    const atSec = this.perfMsToAudioSec(atPerfMs);
    const fade = 0.06;

    const now = this.ctx.currentTime;
    const start = Math.max(now, atSec - fade);

    t.gain.gain.cancelScheduledValues(now);
    t.gain.gain.setValueAtTime(t.gain.gain.value, now);
    t.gain.gain.linearRampToValueAtTime(0.0, start + fade);

    if (t.currentSource) {
      try {
        t.currentSource.stop(atSec + 0.01);
      } catch {
        // ignore
      }
    }
    t.currentSource = null;
    t.currentLoopAssetId = null;

    // after stop, if not muted, restore gain to 1 for next start
    const restoreTarget = t.muted ? 0.0 : 1.0;
    t.gain.gain.linearRampToValueAtTime(restoreTarget, atSec + 0.12);
  }

  /** Swap to loopAssetId at boundary with short crossfade. */
  private async scheduleSwapLoopAt(instanceId: string, loopAssetId: string, atPerfMs: number): Promise<void> {
    if (!this.ctx) return;
    const t = this.ensureTrack(instanceId);

    // If it's already that loop, do nothing
    if (t.currentLoopAssetId === loopAssetId) return;

    const buffer = await this.getBuffer(loopAssetId);
    if (!buffer) return;

    const atSec = this.perfMsToAudioSec(atPerfMs);
    const now = this.ctx.currentTime;

    // Create new source
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    // Per-outfit gain adjustment (optional)
    const loopDef = this.assets.getLoop(loopAssetId);
    const gainDb = loopDef?.gainDb ?? 0;
    const gainLin = Math.pow(10, gainDb / 20);

    const srcGain = this.ctx.createGain();
    srcGain.gain.value = 0.0001; // fade-in from near zero

    src.connect(srcGain);
    srcGain.connect(t.gain);

    // Crossfade old out, new in around boundary
    const fade = 0.06;
    const fadeStart = Math.max(now, atSec - fade);

    // Fade out old (track gain level) briefly only if something is playing
    if (t.currentSource) {
      t.gain.gain.cancelScheduledValues(now);
      t.gain.gain.setValueAtTime(t.gain.gain.value, now);
      t.gain.gain.linearRampToValueAtTime(0.0, fadeStart + fade);

      try {
        t.currentSource.stop(atSec + 0.01);
      } catch {
        // ignore
      }

      // Restore track gain after boundary (respect mute)
      const restoreTarget = t.muted ? 0.0 : 1.0;
      t.gain.gain.linearRampToValueAtTime(restoreTarget, atSec + 0.12);
    } else {
      // Ensure track gain is correct (mute respected)
      const restoreTarget = t.muted ? 0.0 : 1.0;
      t.gain.gain.setValueAtTime(restoreTarget, now);
    }

    // Schedule the new source start
    const startAt = Math.max(now + 0.01, atSec);
    src.start(startAt);

    // Fade in the new source gain to desired level
    srcGain.gain.setValueAtTime(0.0001, startAt);
    srcGain.gain.linearRampToValueAtTime(gainLin, startAt + fade);

    // Update track state
    t.currentSource = src;
    t.currentLoopAssetId = loopAssetId;
  }

  private async getBuffer(loopAssetId: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;

    const cached = this.bufferCache.get(loopAssetId);
    if (cached) return cached;

    const loop = this.assets.getLoop(loopAssetId);
    if (!loop) return null;

    const res = await fetch("/" + loop.file.replace(/^\/+/, ""));
    if (!res.ok) throw new Error(`Audio fetch failed: ${loop.file} (${res.status})`);

    const arr = await res.arrayBuffer();
    const buf = await this.ctx.decodeAudioData(arr);
    this.bufferCache.set(loopAssetId, buf);
    return buf;
  }

  private perfMsToAudioSec(perfMs: number): number {
    if (!this.ctx || this.perfStartMs === null || this.audioStartSec === null) {
      // fallback: immediate
      return this.ctx ? this.ctx.currentTime : 0;
    }
    const deltaSec = (perfMs - this.perfStartMs) / 1000;
    return this.audioStartSec + deltaSec;
  }
}
