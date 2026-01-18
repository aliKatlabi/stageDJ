import type { SceneStore } from "../state/SceneStore";
import type { SceneState } from "../state/types";
import type { Transport } from "../transport/Transport";

export class DebugOverlay {
  private el: HTMLElement;
  private store: SceneStore;
  private transport: Transport;

  private headerEl!: HTMLDivElement;
  private modeEl!: HTMLSpanElement;
  private errEl!: HTMLDivElement;
  private listEl!: HTMLPreElement;
  private toggleBtn!: HTMLButtonElement;

  constructor(el: HTMLElement, store: SceneStore, transport: Transport) {
    this.el = el;
    this.store = store;
    this.transport = transport;
  }

  init() {
    // Build DOM ONCE
    this.el.innerHTML = `
      <div class="row">
        <div id="hdr"></div>
      </div>
      <div class="row">
        <div>swapMode: <b><span id="mode"></span></b></div>
        <button id="toggleSwap">toggle</button>
      </div>
      <div id="err"></div>
      <div class="row"><div class="muted" id="count"></div></div>
      <pre id="list" style="margin:0; white-space:pre-wrap; line-height:1.25;"></pre>
    `;

    this.headerEl = this.el.querySelector("#hdr") as HTMLDivElement;
    this.modeEl = this.el.querySelector("#mode") as HTMLSpanElement;
    this.errEl = this.el.querySelector("#err") as HTMLDivElement;
    this.listEl = this.el.querySelector("#list") as HTMLPreElement;
    this.toggleBtn = this.el.querySelector("#toggleSwap") as HTMLButtonElement;

    // Attach handler ONCE
    this.toggleBtn.onclick = () => {
      const s = this.store.getState();
      this.store.setSwapMode(s.swapMode === "bar" ? "loop" : "bar");
    };

    // Update when state changes
    this.store.subscribe((s) => this.renderStatic(s));

    // Update ticker text smoothly without rebuilding DOM
    const tick = () => {
      const snap = this.transport.snapshot();
      this.headerEl.textContent = `BPM ${snap.bpm} | Bar ${snap.barIndex} | Beat ${snap.beatInBar}`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private renderStatic(state: SceneState) {
    this.modeEl.textContent = state.swapMode.toUpperCase();

    const countEl = this.el.querySelector("#count") as HTMLDivElement;
    countEl.textContent = `instances: ${state.instances.length}`;

    if (state.lastError) {
      this.errEl.innerHTML = `<div class="err">Error: ${escapeHtml(state.lastError)}</div>`;
    } else {
      this.errEl.innerHTML = "";
    }

    const rows = state.instances.map(i => {
      const pend = i.pendingSwap ? ` -> ${i.pendingSwap.newOutfitId} @${i.pendingSwap.scheduledAtMs ?? "?"} (${i.pendingSwap.mode})` : "";
      const muted = i.muted ? " (MUTED)" : "";
      return `• ${i.roleId} :: ${i.currentOutfitId} [${i.status}]${muted}${pend}`;
    }).join("\n");

    this.listEl.textContent = rows || "(none)";
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c] as string));
}
