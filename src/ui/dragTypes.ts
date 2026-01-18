export type DragPayload =
  | { type: "role"; roleId: string }
  | { type: "outfit"; outfitId: string };
