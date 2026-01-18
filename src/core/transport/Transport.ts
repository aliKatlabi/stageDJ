export type TransportSnapshot = {
  bpm: number;
  msPerBeat: number;
  msPerBar: number;
  nowMs: number;         // performance.now()
  elapsedMs: number;     // nowMs - startMs
  beatInBar: 1 | 2 | 3 | 4;
  barIndex: number;      // starts at 1
};

export class Transport {
  private bpm: number;
  private readonly beatsPerBar = 4 as const;
  private startMs: number; // performance.now() when transport started

  constructor(bpm: number) {
    this.bpm = bpm;
    this.startMs = performance.now();
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  getBpm() {
    return this.bpm;
  }
  public getStartMs(): number {
    return this.startMs;
    }

  restart() {
    this.startMs = performance.now();
  }

  getMsPerBeat(): number {
    return 60000 / this.bpm;
  }

  getMsPerBar(): number {
    return this.getMsPerBeat() * this.beatsPerBar;
  }

  snapshot(nowMs: number = performance.now()): TransportSnapshot {
    const msPerBeat = this.getMsPerBeat();
    const msPerBar = this.getMsPerBar();
    const elapsedMs = Math.max(0, nowMs - this.startMs);

    const beatIndex0 = Math.floor(elapsedMs / msPerBeat); // 0-based total beats since start
    const beatInBar0 = beatIndex0 % this.beatsPerBar;     // 0..3
    const barIndex = Math.floor(beatIndex0 / this.beatsPerBar) + 1;

    return {
      bpm: this.bpm,
      msPerBeat,
      msPerBar,
      nowMs,
      elapsedMs,
      beatInBar: (beatInBar0 + 1) as 1 | 2 | 3 | 4,
      barIndex,
    };
  }

  /** next bar boundary time in performance.now() milliseconds */
  nextBarTime(nowMs: number = performance.now()): number {
    const msPerBar = this.getMsPerBar();
    const elapsed = Math.max(0, nowMs - this.startMs);
    const nextBarCount = Math.ceil(elapsed / msPerBar);
    return this.startMs + nextBarCount * msPerBar;
  }

  /** next beat boundary time in performance.now() milliseconds */
  nextBeatTime(nowMs: number = performance.now()): number {
    const msPerBeat = this.getMsPerBeat();
    const elapsed = Math.max(0, nowMs - this.startMs);
    const nextBeatCount = Math.ceil(elapsed / msPerBeat);
    return this.startMs + nextBeatCount * msPerBeat;
  }

  /**
   * Loop-quantized boundary: end of current loop cycle based on `cycleBars`.
   * Assumes loops are aligned to the transport start grid (bar-aligned).
   */
  nextLoopBoundaryTime(cycleBars: number, nowMs: number = performance.now()): number {
    const msPerBar = this.getMsPerBar();
    const cycleMs = msPerBar * cycleBars;
    const elapsed = Math.max(0, nowMs - this.startMs);
    const nextCycleCount = Math.ceil(elapsed / cycleMs);
    return this.startMs + nextCycleCount * cycleMs;
  }
}
