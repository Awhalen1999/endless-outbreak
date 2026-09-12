import type Phaser from "phaser";
import { WEAPONS } from "../sim/weapon";
import type { World } from "../sim/world";
import { ZOMBIE_TYPES } from "../sim/zombie";

/** Backtick overlay: solid tiles, each idle zombie's sight radius, and the player's weapon range. */
export class DebugView {
  private graphics?: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {}

  toggle(): void {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = undefined;
    } else {
      this.graphics = this.scene.add.graphics().setDepth(100);
    }
  }

  sync(w: World): void {
    const g = this.graphics;
    if (!g) return;
    g.clear();

    g.lineStyle(1, 0xc8372d, 0.9);
    const t = w.grid.tile;
    for (let ty = 0; ty < w.grid.rows; ty++) {
      for (let tx = 0; tx < w.grid.cols; tx++) {
        if (w.grid.isSolid(tx, ty)) g.strokeRect(tx * t + 0.5, ty * t + 0.5, t - 1, t - 1);
      }
    }

    g.lineStyle(1, 0x8da0b3, 0.5);
    for (const z of w.zombies) {
      if (z.state === "idle") g.strokeCircle(z.x, z.y, ZOMBIE_TYPES[z.type]?.sight ?? 0);
    }

    g.lineStyle(1, 0xd9a441, 0.5);
    g.strokeCircle(w.player.x, w.player.y, WEAPONS[w.player.weapon]?.range ?? 0);
  }
}
