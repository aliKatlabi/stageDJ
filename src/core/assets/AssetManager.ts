import type { RoleDef, OutfitDef, LoopAssetDef } from "../state/types";

type RolesFile = { version: number; roles: RoleDef[] };
type OutfitsFile = { version: number; outfits: OutfitDef[] };
type LoopsFile = { version: number; projectBpm: number; loops: LoopAssetDef[] };

export class AssetManager {
  private rolesById = new Map<string, RoleDef>();
  private outfitsById = new Map<string, OutfitDef>();
  private loopsById = new Map<string, LoopAssetDef>();
  public projectBpm: number = 140;

  async loadAll(): Promise<void> {
    const [roles, outfits, loops] = await Promise.all([
      this.fetchJson<RolesFile>("/assets/characters/meta/roles.json"),
      this.fetchJson<OutfitsFile>("/assets/characters/meta/outfits.json"),
      this.fetchJson<LoopsFile>("/assets/audio/meta/loops.json"),
    ]);

    this.projectBpm = loops.projectBpm ?? 140;

    for (const r of roles.roles) this.rolesById.set(r.id, r);
    for (const o of outfits.outfits) this.outfitsById.set(o.id, o);
    for (const l of loops.loops) this.loopsById.set(l.id, l);

    this.validate();
  }

  getRole(roleId: string): RoleDef | undefined {
    return this.rolesById.get(roleId);
  }
  getOutfit(outfitId: string): OutfitDef | undefined {
    return this.outfitsById.get(outfitId);
  }
  getLoop(loopId: string): LoopAssetDef | undefined {
    return this.loopsById.get(loopId);
  }

  listRoles(): RoleDef[] {
    return [...this.rolesById.values()];
  }

  listOutfitsForRole(roleId: string): OutfitDef[] {
    return [...this.outfitsById.values()].filter(o => o.roleId === roleId);
  }
  
  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(path);

    // If this fails, you get the URL and status.
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to fetch ${path}: ${res.status}. Body (first 120 chars): ${txt.slice(0, 120)}`);
    }

    // Always parse manually so we can print helpful diagnostics on parse failure.
    const text = await res.text();

    if (!text.trim()) {
        throw new Error(`Empty JSON response from ${path}. File may be empty or not served correctly.`);
    }

    try {
        return JSON.parse(text) as T;
    } catch (err: any) {
        throw new Error(
        `Invalid JSON at ${path}: ${err?.message ?? err}. First 200 chars:\n${text.slice(0, 200)}`
        );
    }
    }

  private validate(): void {
    // Basic content contract validation (more later)
    for (const role of this.rolesById.values()) {
      const defOutfit = this.outfitsById.get(role.defaultOutfitId);
      if (!defOutfit) throw new Error(`Role ${role.id} defaultOutfitId not found: ${role.defaultOutfitId}`);
      if (defOutfit.roleId !== role.id) throw new Error(`Default outfit roleId mismatch for role ${role.id}`);
    }

    for (const outfit of this.outfitsById.values()) {
      const role = this.rolesById.get(outfit.roleId);
      if (!role) throw new Error(`Outfit ${outfit.id} references missing roleId: ${outfit.roleId}`);
      
      const loopAssetId = outfit.loopAssetId ?? null;
      
      if (loopAssetId === null) continue;
      const loop = this.loopsById.get(loopAssetId);
      if (!loop) throw new Error(`Outfit ${outfit.id} references missing loopAssetId: ${loopAssetId}`);
      
      if (loop.category !== role.category) {
        throw new Error(`Outfit ${outfit.id} loop category mismatch: role.category=${role.category}, loop.category=${loop.category}`);
        }

    }
  }
}
