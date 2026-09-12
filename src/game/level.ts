import type Phaser from "phaser";
import { Grid } from "../sim/grid";
import { COLLISION_LAYER, type LdtkEntity, type LdtkLevel, TILE } from "./ldtk";

export interface LevelRef {
  key: string;
  /** Folder holding data.json, relative to the site root. */
  dir: string;
}

export interface BuiltLevel {
  data: LdtkLevel;
  grid: Grid;
  entities: Record<string, LdtkEntity[] | undefined>;
}

/** Phase one: fetch data.json so we know which layer files exist. */
export function queueLevelData(scene: Phaser.Scene, ref: LevelRef): void {
  scene.load.json(`${ref.key}:data`, `${ref.dir}/data.json`);
}

/** Phase two: fetch every layer PNG and the collision CSV listed by data.json. */
export function queueLevelAssets(scene: Phaser.Scene, ref: LevelRef): void {
  const data = scene.cache.json.get(`${ref.key}:data`) as LdtkLevel;
  for (const png of data.layers) scene.load.image(`${ref.key}:${png}`, `${ref.dir}/${png}`);
  scene.load.text(`${ref.key}:collision`, `${ref.dir}/${COLLISION_LAYER}.csv`);
}

/** Place the layer images and build the collision grid. */
export function buildLevel(scene: Phaser.Scene, ref: LevelRef): BuiltLevel {
  const data = scene.cache.json.get(`${ref.key}:data`) as LdtkLevel;
  // LDtk lists the top layer first; add bottom-up so depth follows the editor.
  [...data.layers].reverse().forEach((png, depth) => {
    scene.add.image(0, 0, `${ref.key}:${png}`).setOrigin(0).setDepth(depth);
  });
  const grid = Grid.fromCsv(scene.cache.text.get(`${ref.key}:collision`) as string, TILE);
  return { data, grid, entities: data.entities };
}

/** Centre of an entity, in world pixels. */
export function entityCentre(e: LdtkEntity): { x: number; y: number } {
  return { x: e.x + e.width / 2, y: e.y + e.height / 2 };
}
