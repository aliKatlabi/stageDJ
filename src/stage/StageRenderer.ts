// File: src/stage/StageRenderer.ts

import * as PIXI from "pixi.js";
import type { SceneStore } from "../core/state/SceneStore";
import type { AssetManager } from "../core/assets/AssetManager";
import type { Transport } from "../core/transport/Transport";
import type { AudioEngine } from "../core/audio/AudioEngine";
import type { DragPayload } from "../ui/dragTypes";
import type { RoleInstanceState } from "../core/state/types";

function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2);
}

export class StageRenderer {
  public app: PIXI.Application;

  private root: HTMLElement;
  private store: SceneStore;
  private assets: AssetManager;
  private transport: Transport;
  private audio: AudioEngine;

  private stageLayer = new PIXI.Container();
  private trayLayer = new PIXI.Container();
  private trayBg = new PIXI.Graphics();
  private stageBg = new PIXI.Graphics();

  private instanceSprites = new Map<string, PIXI.Container>(); // instanceId -> container

  // Drag state
  private currentDrag: { payload: DragPayload; sprite: PIXI.Container } | null = null;

  // Targeting while dragging (dedicated drop zone: nearest performer within radius)
  private dragTargetRadiusPx = 140;
  private targetHalo = new PIXI.Graphics();
  private currentTargetId: string | null = null;

  // Layout constants
  private trayHeightRatio = 0.18;

  constructor(root: HTMLElement, store: SceneStore, assets: AssetManager, transport: Transport, audio: AudioEngine) {
    this.root = root;
    this.store = store;
    this.assets = assets;
    this.transport = transport;
    this.audio = audio;

    this.app = new PIXI.Application();
  }

  async init(): Promise<void> {
    await this.app.init({
      resizeTo: this.root,
      background: "#0b0b12",
      antialias: true,
    });

    this.root.appendChild(this.app.canvas);

    // Layers
    this.app.stage.addChild(this.stageBg, this.stageLayer, this.trayBg, this.trayLayer);

    // Halo for target preview while dragging
    this.targetHalo.visible = false;
    this.targetHalo.zIndex = 9998;
    this.stageLayer.addChild(this.targetHalo);
    this.stageLayer.sortableChildren = true;

    this.drawBackgrounds();

    // IMPORTANT for pointermove/up on stage to work consistently
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;

    window.addEventListener("resize", () => {
      this.drawBackgrounds();
      this.layoutInstances();
      this.app.stage.hitArea = this.app.screen;
      // tray depends on renderer size
      this.buildTray();
    });

    // Sync sprites when state changes
    this.store.subscribe((s) => {
      this.syncInstances(s.instances);
    });

    // Build tray (outfits grouped by role)
    this.buildTray();

    // Install global pointer handlers for dragging
    this.installGlobalPointerHandlers();

    // NEW REQUIREMENT: roles already on stage, neutral state (no outfit)
    this.spawnDefaultBandLineup();
    this.app.ticker.add(() => {
        this.processPendingSwaps();
        });
  }
  private processPendingSwaps() {
    const now = performance.now();
    const s = this.store.getState();

    for (const inst of s.instances) {
        const ps = inst.pendingSwap;
        if (!ps || ps.scheduledAtMs == null) continue;

        if (now < ps.scheduledAtMs) continue;

        // commit the swap
        inst.currentOutfitId = ps.newOutfitId;
        inst.pendingSwap = null;
        inst.status = "performing";
        this.store.upsertInstance(inst);

        this.pulseAccent(inst.instanceId);
    }
}

  // -------------------------
  // Layout & background
  // -------------------------

  private drawBackgrounds() {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const trayH = Math.floor(h * this.trayHeightRatio);
    const stageH = h - trayH;

    this.stageBg.clear();
    this.stageBg.rect(0, 0, w, stageH).fill({ color: 0x0b0b12 });

    this.trayBg.clear();
    this.trayBg.rect(0, stageH, w, trayH).fill({ color: 0x121224, alpha: 1 });
    this.trayBg.rect(0, stageH, w, 1).fill({ color: 0xffffff, alpha: 0.12 });

    this.trayLayer.y = stageH;
  }

  private getStageBounds() {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const trayH = Math.floor(h * this.trayHeightRatio);
    const stageH = h - trayH;
    return { x: 0, y: 0, width: w, height: stageH };
  }

  private layoutInstances() {
    // Future: keep band-like spacing rules on resize if desired.
  }

  // -------------------------
  // Build tray (grouped outfits by role)
  // -------------------------

  private buildTray() {
    this.trayLayer.removeChildren();

    const roles = this.assets.listRoles();
    const trayH = Math.floor(this.app.renderer.height * this.trayHeightRatio);

    const padding = 12;
    const headerY = 10;
    const cardsY = Math.floor(trayH * 0.48);

    let x = padding;

    for (const role of roles) {
      // Header
      const header = new PIXI.Text({
        text: role.displayName,
        style: { fontFamily: "Arial", fontSize: 12, fill: 0xe9e9f1 },
      });
      header.x = x;
      header.y = headerY;
      this.trayLayer.addChild(header);

      // Outfit cards for this role
      const outfits = this.assets.listOutfitsForRole(role.id);

      let sectionW = Math.max(180, header.width);
      let ox = x;

      for (const outfit of outfits) {
        const card = this.makeCard(outfit.id, 170, 38, 0x1a1a33);
        card.eventMode = "static";
        (card as any).interactive = true;
        card.cursor = "grab";

        card.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
          this.startDrag({ type: "outfit", outfitId: outfit.id }, outfit.id, e);
        });

        card.x = ox;
        card.y = cardsY;

        ox += card.width + 8;
        sectionW = Math.max(sectionW, ox - x);

        this.trayLayer.addChild(card);
      }

      // Divider line between role sections
      const divider = new PIXI.Graphics();
      divider.rect(x + sectionW + 8, headerY, 1, trayH - 16).fill({ color: 0xffffff, alpha: 0.12 });
      this.trayLayer.addChild(divider);

      x = x + sectionW + 22;
    }
  }

  private makeCard(label: string, w: number, h: number, color = 0x1a1a2a): PIXI.Container {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, w, h, 10).fill({ color, alpha: 1 });
    bg.roundRect(0, 0, w, h, 10).stroke({ color: 0xffffff, alpha: 0.14, width: 1 });

    const txt = new PIXI.Text({
      text: label,
      style: { fontFamily: "Arial", fontSize: 12, fill: 0xe9e9f1 },
    });
    txt.x = 10;
    txt.y = Math.floor((h - txt.height) / 2);

    c.addChild(bg, txt);
    return c;
  }

  // -------------------------
  // Default stage lineup (neutral: no outfit)
  // -------------------------

  private spawnDefaultBandLineup() {
    const roles = this.assets.listRoles();
    const bounds = this.getStageBounds();

    const y = bounds.height * 0.62;
    const left = bounds.width * 0.12;
    const right = bounds.width * 0.88;
    const step = roles.length > 1 ? (right - left) / (roles.length - 1) : 0;

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      this.createOrMoveRoleInstance(role.id, { x: left + step * i, y });
    }
  }

  private createOrMoveRoleInstance(roleId: string, pos: { x: number; y: number }) {
    const role = this.assets.getRole(roleId);
    if (!role) return this.store.setError(`Unknown roleId: ${roleId}`);

    const state = this.store.getState();
    const existing = state.instances.find((i) => i.roleId === roleId);

    if (existing) {
      existing.position = this.clampToStage(pos);
      this.store.upsertInstance(existing);
      return;
    }

    const instance: RoleInstanceState = {
      instanceId: uuid(),
      roleId,
      currentOutfitId: null, // NEUTRAL STATE
      position: this.clampToStage(pos),
      muted: false,
      status: "idle",
      pendingSwap: null,
    };

    this.store.upsertInstance(instance);
  }

  private clampToStage(pos: { x: number; y: number }) {
    const b = this.getStageBounds();
    const x = Math.max(60, Math.min(b.width - 60, pos.x));
    const y = Math.max(90, Math.min(b.height - 90, pos.y));
    return { x, y };
  }

  // -------------------------
  // Dragging
  // -------------------------

  private installGlobalPointerHandlers() {
    // Move ghost + update nearest target halo
    this.app.stage.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
      if (!this.currentDrag) return;

      const p = e.global;
      this.currentDrag.sprite.x = p.x - this.currentDrag.sprite.width / 2;
      this.currentDrag.sprite.y = p.y - this.currentDrag.sprite.height / 2;

      // Show nearest target halo only for outfit drags
      if (this.currentDrag.payload.type === "outfit") {
        const targetId = this.findNearestInstance({ x: p.x, y: p.y }, this.dragTargetRadiusPx);
        this.setDragTarget(targetId);
      } else {
        this.setDragTarget(null);
      }
    });

    // Drop
    this.app.stage.on("pointerup", (e: PIXI.FederatedPointerEvent) => {
      if (!this.currentDrag) return;
      this.finishDrag(e.global);
    });

    this.app.stage.on("pointerupoutside", (e: PIXI.FederatedPointerEvent) => {
      if (!this.currentDrag) return;
      this.finishDrag(e.global);
    });
  }

  private startDrag(payload: DragPayload, label: string, e: PIXI.FederatedPointerEvent) {
    const ghost = this.makeCard(label, 170, 38, 0x24244a);
    ghost.alpha = 0.92;
    ghost.zIndex = 9999;

    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(ghost);
    this.app.stage.sortChildren();

    const p = e.global;
    ghost.x = p.x - ghost.width / 2;
    ghost.y = p.y - ghost.height / 2;

    this.currentDrag = { payload, sprite: ghost };
    this.setDragTarget(null);
  }

  private finishDrag(globalPos: PIXI.PointData) {
    if (!this.currentDrag) return;

    const drag = this.currentDrag;
    this.currentDrag = null;

    drag.sprite.removeFromParent();
    drag.sprite.destroy({ children: true });

    this.setDragTarget(null);

    if (drag.payload.type === "outfit") {
      const targetId = this.findNearestInstance({ x: globalPos.x, y: globalPos.y }, this.dragTargetRadiusPx);
      if (!targetId) return;
      this.handleDropOutfit(targetId, drag.payload.outfitId);
    }
  }

  private findNearestInstance(point: { x: number; y: number }, radiusPx: number): string | null {
    let bestId: string | null = null;
    let bestDist2 = radiusPx * radiusPx;

    for (const [id, c] of this.instanceSprites) {
      const dx = c.x - point.x;
      const dy = c.y - point.y;
      const d2 = dx * dx + dy * dy;

      if (d2 <= bestDist2) {
        bestDist2 = d2;
        bestId = id;
      }
    }

    return bestId;
  }

  private setDragTarget(instanceId: string | null) {
    if (instanceId === this.currentTargetId) return;
    this.currentTargetId = instanceId;

    if (!instanceId) {
      this.targetHalo.visible = false;
      this.targetHalo.clear();
      return;
    }

    const c = this.instanceSprites.get(instanceId);
    if (!c) {
      this.targetHalo.visible = false;
      this.targetHalo.clear();
      return;
    }

    this.targetHalo.visible = true;
    this.targetHalo.clear();
    this.targetHalo.circle(c.x, c.y, 86).stroke({ color: 0xffffff, alpha: 0.35, width: 2 });
    this.targetHalo.circle(c.x, c.y, 92).stroke({ color: 0xffffff, alpha: 0.14, width: 1 });
  }

  // -------------------------
  // Outfit drop -> transition -> swap at boundary + schedule audio
  // -------------------------

  private handleDropOutfit(instanceId: string, newOutfitId: string) {
    const s = this.store.getState();
    const inst = s.instances.find((i) => i.instanceId === instanceId);
    if (!inst) return;

    const newOutfit = this.assets.getOutfit(newOutfitId);
    if (!newOutfit) return this.store.setError(`Unknown outfitId: ${newOutfitId}`);

    if (newOutfit.roleId !== inst.roleId) {
      this.pulseReject(instanceId);
      return this.store.setError(`Outfit role mismatch. outfit.roleId=${newOutfit.roleId}, instance.roleId=${inst.roleId}`);
    }

    // Pre-swap transition
    inst.status = "transitioning";
    inst.pendingSwap = { newOutfitId, scheduledAtMs: null, mode: s.swapMode };
    this.store.upsertInstance(inst);
    this.store.setError(null);

    const now = performance.now();

    // Compute swap time based on swapMode
    let swapTimeMs: number;

    if (s.swapMode === "bar") {
      swapTimeMs = this.transport.nextBarTime(now);
    } else {
      // loop-quantized: based on current outfit bars, or 1 if neutral/no loop
      const currentOutfit = inst.currentOutfitId ? this.assets.getOutfit(inst.currentOutfitId) : undefined;
      const currentLoop =
        currentOutfit?.loopAssetId ? this.assets.getLoop(currentOutfit.loopAssetId) : undefined;
      const currentBars = currentLoop?.bars ?? 1;

      swapTimeMs = this.transport.nextLoopBoundaryTime(currentBars, now);
    }

    if (inst.pendingSwap) inst.pendingSwap.scheduledAtMs = swapTimeMs;
    this.store.upsertInstance(inst);

    // Schedule AUDIO NOW (so it starts exactly at boundary)
    // Note: must happen on user gesture at least once. Drag/drop is a gesture.
    this.audio.scheduleOutfitChangeAt(instanceId, newOutfitId, swapTimeMs).catch((e) => {
      this.store.setError(`Audio schedule failed: ${e?.message ?? String(e)}`);
    });

    // Schedule VISUAL commit at boundary
    // const delay = Math.max(0, swapTimeMs - performance.now());

    // setTimeout(() => {
    //   const latest = this.store.getState().instances.find((i) => i.instanceId === instanceId);
    //   if (!latest || !latest.pendingSwap) return;

    //   latest.currentOutfitId = newOutfitId;
    //   latest.pendingSwap = null;
    //   latest.status = "performing";
    //   this.store.upsertInstance(latest);

    //   this.pulseAccent(instanceId);
    // }, delay);
  }

  // -------------------------
  // Sync state -> sprites
  // -------------------------

  private syncInstances(instances: RoleInstanceState[]) {
    for (const inst of instances) {
      if (!this.instanceSprites.has(inst.instanceId)) {
        const container = this.createPerformerSprite(inst);
        this.instanceSprites.set(inst.instanceId, container);
        this.stageLayer.addChild(container);
      }
    }

    for (const id of [...this.instanceSprites.keys()]) {
      if (!instances.some((i) => i.instanceId === id)) {
        const c = this.instanceSprites.get(id)!;
        c.removeFromParent();
        c.destroy({ children: true });
        this.instanceSprites.delete(id);
      }
    }

    for (const inst of instances) {
      const c = this.instanceSprites.get(inst.instanceId);
      if (!c) continue;
      c.x = inst.position.x;
      c.y = inst.position.y;
      this.applyInstanceVisuals(c, inst);
    }

    if (this.currentTargetId) {
      const c = this.instanceSprites.get(this.currentTargetId);
      if (c && this.targetHalo.visible) {
        this.targetHalo.clear();
        this.targetHalo.circle(c.x, c.y, 86).stroke({ color: 0xffffff, alpha: 0.35, width: 2 });
        this.targetHalo.circle(c.x, c.y, 92).stroke({ color: 0xffffff, alpha: 0.14, width: 1 });
      }
    }
  }

  private createPerformerSprite(inst: RoleInstanceState): PIXI.Container {
    const c = new PIXI.Container();
    c.eventMode = "static";
    (c as any).interactive = true;
    c.cursor = "pointer";

    const body = new PIXI.Graphics();
    body.name = "body";
    body.roundRect(-60, -90, 120, 180, 24).fill({ color: 0x202043, alpha: 1 });
    body.roundRect(-60, -90, 120, 180, 24).stroke({ color: 0xffffff, alpha: 0.18, width: 2 });

    const label = new PIXI.Text({
      text: inst.roleId,
      style: { fontFamily: "Arial", fontSize: 12, fill: 0xe9e9f1, align: "center" },
    });
    label.name = "label";
    label.anchor.set(0.5);
    label.x = 0;
    label.y = 10;

    const badge = new PIXI.Graphics();
    badge.name = "badge";

    c.addChild(body, label, badge);

    // Tap = mute toggle (now also controls audio)
    c.on("pointertap", async () => {
      const s = this.store.getState();
      const curr = s.instances.find((i) => i.instanceId === inst.instanceId);
      if (!curr) return;
      curr.muted = !curr.muted;
      this.store.upsertInstance(curr);

      try {
        await this.audio.ensureStarted();
        this.audio.setMuted(curr.instanceId, curr.muted);
      } catch (e: any) {
        this.store.setError(`Audio mute failed: ${e?.message ?? String(e)}`);
      }
    });

    // Gentle idle animation
    let t = 0;
    this.app.ticker.add((delta) => {
      t += delta * 0.02;
      if (!this.instanceSprites.has(inst.instanceId)) return;
      c.scale.y = 1 + Math.sin(t) * 0.01;
    });

    return c;
  }

  private applyInstanceVisuals(c: PIXI.Container, inst: RoleInstanceState) {
    const body = c.getChildByName("body") as PIXI.Graphics | undefined;
    const badge = c.getChildByName("badge") as PIXI.Graphics | undefined;
    const label = c.getChildByName("label") as PIXI.Text | undefined;

    const isNeutral = inst.currentOutfitId === null;

    if (body) {
      body.clear();

      const baseColor = isNeutral ? 0x2a2a34 : 0x202043;
      const transitionColor = 0x2a2540;
      const fillColor = inst.status === "transitioning" ? transitionColor : baseColor;
      const borderAlpha = isNeutral ? 0.22 : 0.18;

      body.roundRect(-60, -90, 120, 180, 24).fill({ color: fillColor, alpha: 1 });
      body.roundRect(-60, -90, 120, 180, 24).stroke({ color: 0xffffff, alpha: borderAlpha, width: 2 });
    }

    if (badge) {
      badge.clear();
      if (inst.muted) badge.circle(44, -70, 10).fill({ color: 0xff6666, alpha: 0.9 });
      else if (inst.status === "transitioning") badge.circle(44, -70, 10).fill({ color: 0xffcc66, alpha: 0.9 });
      else if (isNeutral) badge.circle(44, -70, 10).fill({ color: 0xe9e9f1, alpha: 0.55 });
      else badge.circle(44, -70, 10).fill({ color: 0x55ff99, alpha: 0.9 });
    }

    if (label) {
      const outfitText = inst.currentOutfitId ?? "(neutral)";
      label.text = `${inst.roleId}\n${outfitText}`;
    }
  }

  // -------------------------
  // Feedback animations
  // -------------------------

  private pulseReject(instanceId: string) {
    const c = this.instanceSprites.get(instanceId);
    if (!c) return;

    const origX = c.x;
    let n = 0;

    const shake = () => {
      if (n++ > 10) {
        c.x = origX;
        return;
      }
      c.x = origX + (n % 2 === 0 ? -6 : 6);
      requestAnimationFrame(shake);
    };

    shake();
  }

  private pulseAccent(instanceId: string) {
    const c = this.instanceSprites.get(instanceId);
    if (!c) return;

    c.scale.set(1.0);
    let t = 0;

    const tick = () => {
      t += 1;
      const s = 1 + Math.sin((t / 10) * Math.PI) * 0.06;
      c.scale.set(s);
      if (t < 10) requestAnimationFrame(tick);
      else c.scale.set(1);
    };

    tick();
  }
}
