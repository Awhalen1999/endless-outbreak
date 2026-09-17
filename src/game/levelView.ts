import type Phaser from "phaser";
import type { Grid } from "../sim/grid";

const FLOOR = 0x171c21;
const WALL = 0x2f373f;
const WALL_EDGE = 0x454f59;

/** Placeholder level: the floor as one slab, each solid tile as a block. Tiles replace this later. */
export class LevelView {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, grid: Grid) {
    this.graphics = scene.add.graphics().setDepth(0);
    this.draw(grid);
  }

  private draw(grid: Grid): void {
    const g = this.graphics;
    const t = grid.tile;
    g.fillStyle(FLOOR, 1).fillRect(0, 0, grid.width, grid.height);

    g.fillStyle(WALL, 1);
    for (let ty = 0; ty < grid.rows; ty++) {
      for (let tx = 0; tx < grid.cols; tx++) {
        if (grid.isSolid(tx, ty)) g.fillRect(tx * t, ty * t, t, t);
      }
    }

    // A lighter cap wherever a wall meets open floor above, so corners read at a glance.
    g.fillStyle(WALL_EDGE, 1);
    for (let ty = 0; ty < grid.rows; ty++) {
      for (let tx = 0; tx < grid.cols; tx++) {
        if (grid.isSolid(tx, ty) && ty > 0 && !grid.isSolid(tx, ty - 1)) {
          g.fillRect(tx * t, ty * t, t, 3);
        }
      }
    }
  }
}
