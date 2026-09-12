/**
 * Shapes from LDtk's "Super Simple Export": one folder per level holding
 * data.json, one PNG per layer, and one CSV per IntGrid layer.
 */
export interface LdtkEntity {
  id: string;
  iid: string;
  layer: string;
  /** Pixel position of the entity's pivot within the level. */
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  customFields: Record<string, unknown>;
}

export interface LdtkLevel {
  identifier: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  /** Layer PNG filenames, top-most first. */
  layers: string[];
  entities: Record<string, LdtkEntity[] | undefined>;
  customFields: Record<string, unknown>;
}

/** The IntGrid layer whose value 1 means "wall". */
export const COLLISION_LAYER = "Collision";
export const TILE = 16;
