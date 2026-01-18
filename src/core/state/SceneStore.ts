import type { SceneState, SwapMode, RoleInstanceState } from "./types";

type Listener = (state: SceneState) => void;

export class SceneStore {
  private state: SceneState = { swapMode: "loop", instances: [], lastError: null };
  private listeners: Listener[] = [];

  getState(): SceneState {
    return structuredClone(this.state);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    fn(this.getState());
    return () => {
      this.listeners = this.listeners.filter(x => x !== fn);
    };
  }

  setSwapMode(mode: SwapMode) {
    this.state.swapMode = mode;
    this.emit();
  }

  upsertInstance(instance: RoleInstanceState) {
    const idx = this.state.instances.findIndex(i => i.instanceId === instance.instanceId);
    if (idx >= 0) this.state.instances[idx] = instance;
    else this.state.instances.push(instance);
    this.emit();
  }

  removeInstance(instanceId: string) {
    this.state.instances = this.state.instances.filter(i => i.instanceId !== instanceId);
    this.emit();
  }

  setError(msg: string | null) {
    this.state.lastError = msg;
    this.emit();
  }

  private emit() {
    const snapshot = this.getState();
    for (const l of this.listeners) l(snapshot);
  }
}
