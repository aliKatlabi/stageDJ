// File: src/core/state/types.ts

export type SwapMode = "bar" | "loop";

export type RoleDef = {
  id: string;
  displayName: string;
  category: string;
  maxInstances: number;
  defaultOutfitId: string; // still useful as "recommended first outfit"
};

export type OutfitDef = {
  id: string;
  roleId: string;

  // NOTE: Some outfits may be "visual-only" and have no loop (optional in v1-v3).
  loopAssetId?: string | null;

  energy: number;
  visual: { sprite: string };
  animationPreset: {
    idle: string;
    performing: string;
    transition: string;
    accent: string;
  };
};

export type LoopAssetDef = {
  id: string;
  category: string;
  file: string;
  bars: 1 | 2 | 4 | 8;
  gainDb: number;
  tags?: string[];
  sentenceHook?: boolean;
  text?: string;
};

export type PendingSwap = {
  newOutfitId: string;
  scheduledAtMs: number | null; // performance.now() timeline
  mode: SwapMode;
};

export type RoleInstanceState = {
  instanceId: string;
  roleId: string;

  // Neutral performer = null (not an outfit)
  currentOutfitId: string | null;

  position: { x: number; y: number };
  muted: boolean;
  status: "idle" | "performing" | "transitioning";
  pendingSwap: PendingSwap | null;
};

export type SceneState = {
  swapMode: SwapMode;
  instances: RoleInstanceState[];
  lastError?: string | null;
};
