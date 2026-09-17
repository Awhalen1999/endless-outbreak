import type Phaser from "phaser";
import { Grid } from "../sim/grid";
import type { Placement } from "../sim/world";
import type { Zone, ZoneKind } from "../sim/zone";
import { COLLISION_LAYER, type LdtkEntity, type LdtkLevel, TILE } from "./ldtk";

export interface LevelRef {
  key: string;
  /** Folder holding data.json, relative to the site root. */
  dir: string;
}

export interface BuiltLevel {
  grid: Grid;
  entities: Record<string, LdtkEntity[] | undefined>;
}

/** A level is two files: the entity list and the wall mask. */
export function queueLevel(scene: Phaser.Scene, ref: LevelRef): void {
  scene.load.json(`${ref.key}:data`, `${ref.dir}/data.json`);
  scene.load.text(`${ref.key}:collision`, `${ref.dir}/${COLLISION_LAYER}.csv`);
}

/** Build the collision grid and hand back the entities placed on it. */
export function buildLevel(scene: Phaser.Scene, ref: LevelRef): BuiltLevel {
  const data = scene.cache.json.get(`${ref.key}:data`) as LdtkLevel;
  const grid = Grid.fromCsv(scene.cache.text.get(`${ref.key}:collision`) as string, TILE);
  return { grid, entities: data.entities };
}

/** Centre of an entity, in world pixels. */
export function entityCentre(e: LdtkEntity): { x: number; y: number } {
  return { x: e.x + e.width / 2, y: e.y + e.height / 2 };
}

/** Zombie entities placed in the level. The LDtk `type` field picks the row in zombies.json. */
export function zombiesOf(level: BuiltLevel): Placement[] {
  return (level.entities.Zombie ?? []).map((e) => ({
    ...entityCentre(e),
    type: (e.customFields.type as string) ?? "walker",
  }));
}

const ZONE_ENTITIES: Record<string, ZoneKind> = { Objective: "objective", Exit: "exit" };

/** Walk-over rectangles: the item and the way out. */
export function zonesOf(level: BuiltLevel): Zone[] {
  return Object.entries(ZONE_ENTITIES).flatMap(([name, kind]) =>
    (level.entities[name] ?? []).map((e) => ({ kind, x: e.x, y: e.y, w: e.width, h: e.height })),
  );
}
