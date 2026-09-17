import type Phaser from "phaser";
import type { Grid } from "../sim/grid";
import type { World } from "../sim/world";
import type { ZoneKind } from "../sim/zone";

/** The map is scaled to fit this box, at whole pixels per tile so it stays crisp. */
const MAX_W = 80;
const MAX_H = 56;
const MARGIN = 6;
const PAD = 2;

const PANEL = 0x0b0e11;
const BORDER = 0x3a444d;
const FLOOR = 0x1d242a;
const WALL = 0x49535d;
const PLAYER_DOT = 0xd9a441;
const ZOMBIE_DOT = 0xc8372d;
const ZONE_DOT: Record<ZoneKind, number> = { objective: 0xfff2c0, exit: 0x8db388 };

/** Alpha when the player is standing behind the map, so it never hides them. */
const FADED = 0.2;
const FADE_RATE = 0.25;

/**
 * Corner map of the whole level: the walls, where you are, and the two things worth
 * walking to. Idle zombies are left off — only the ones already coming for you show
 * up, so the map helps you navigate without giving the house away.
 */
export class MinimapView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly live: Phaser.GameObjects.Graphics;
  private readonly scale: number;
  private readonly w: number;
  private readonly h: number;

  constructor(
    private readonly scene: Phaser.Scene,
    grid: Grid,
  ) {
    this.scale = Math.max(1, Math.floor(Math.min(MAX_W / grid.cols, MAX_H / grid.rows)));
    this.w = grid.cols * this.scale;
    this.h = grid.rows * this.scale;

    const panel = scene.add.graphics();
    panel
      .fillStyle(PANEL, 0.75)
      .fillRect(0, 0, this.w + PAD * 2, this.h + PAD * 2)
      .lineStyle(1, BORDER, 0.8)
      .strokeRect(0.5, 0.5, this.w + PAD * 2 - 1, this.h + PAD * 2 - 1);
    this.drawWalls(panel, grid);

    this.live = scene.add.graphics();
    this.root = scene.add
      .container(scene.scale.width - MARGIN - this.w - PAD * 2, MARGIN, [panel, this.live])
      .setScrollFactor(0)
      .setDepth(210);
  }

  toggle(): void {
    this.root.setVisible(!this.root.visible);
  }

  sync(w: World): void {
    const g = this.live;
    g.clear();

    for (const z of w.zones) {
      this.dot(g, ZONE_DOT[z.kind], z.x + z.w / 2, z.y + z.h / 2, w.grid.tile, 2);
    }
    for (const z of w.zombies) {
      if (z.state !== "idle") this.dot(g, ZOMBIE_DOT, z.x, z.y, w.grid.tile, 1);
    }
    this.dot(g, PLAYER_DOT, w.player.x, w.player.y, w.grid.tile, 2);

    this.fadeBehindPlayer(w);
  }

  private drawWalls(g: Phaser.GameObjects.Graphics, grid: Grid): void {
    const s = this.scale;
    g.fillStyle(FLOOR, 1).fillRect(PAD, PAD, this.w, this.h);
    g.fillStyle(WALL, 1);
    for (let ty = 0; ty < grid.rows; ty++) {
      for (let tx = 0; tx < grid.cols; tx++) {
        if (grid.isSolid(tx, ty)) g.fillRect(PAD + tx * s, PAD + ty * s, s, s);
      }
    }
  }

  /** A blob centred on a world position, at least `size` pixels across. */
  private dot(
    g: Phaser.GameObjects.Graphics,
    colour: number,
    x: number,
    y: number,
    tile: number,
    size: number,
  ): void {
    const d = Math.max(size, this.scale);
    g.fillStyle(colour, 1).fillRect(
      PAD + Math.round((x / tile) * this.scale - d / 2),
      PAD + Math.round((y / tile) * this.scale - d / 2),
      d,
      d,
    );
  }

  /** At the edges of a level the camera stops but the player walks on, right into the corner. */
  private fadeBehindPlayer(w: World): void {
    const cam = this.scene.cameras.main;
    const sx = (w.player.x - cam.worldView.x) * cam.zoom;
    const sy = (w.player.y - cam.worldView.y) * cam.zoom;
    const near =
      sx > this.root.x - 8 &&
      sy < this.root.y + this.h + PAD * 2 + 8 &&
      sx < this.root.x + this.w + PAD * 2 + 8 &&
      sy > this.root.y - 8;
    const target = near ? FADED : 1;
    this.root.setAlpha(this.root.alpha + (target - this.root.alpha) * FADE_RATE);
  }
}
