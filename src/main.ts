import { AssetManager } from "./core/assets/AssetManager";
import { SceneStore } from "./core/state/SceneStore";
import { StageRenderer } from "./stage/StageRenderer";
import { DebugOverlay } from "./core/debug/DebugOverlay";
import { Transport } from "./core/transport/Transport";
import { AudioEngine } from "./core/audio/AudioEngine";

async function bootstrap() {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app not found");

  const debugEl = document.getElementById("debugOverlay");
  if (!debugEl) throw new Error("#debugOverlay not found");

  const store = new SceneStore();
  const assets = new AssetManager();

  try {
    await assets.loadAll();
  } catch (e: any) {
    store.setError(`Asset load failed: ${e?.message ?? String(e)}`);
  }

  const transport = new Transport(assets.projectBpm);
  const audio = new AudioEngine(assets, transport);
  
  const stage = new StageRenderer(root, store, assets, transport);
  await stage.init();

  const debug = new DebugOverlay(debugEl, store, transport);
  debug.init();
}

bootstrap();
