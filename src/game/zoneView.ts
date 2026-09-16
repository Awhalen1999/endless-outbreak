import type Phaser from "phaser";
import type { Zone, ZoneKind } from "../sim/zone";

const STYLE: Record<ZoneKind, { fill?: number; stroke: number }> = {
  objective: { fill: 0xd9a441, stroke: 0xfff2c0 },
  exit: { stroke: 0x8db388 },
};

/** Placeholder zones: an outlined rectangle each, the item filled so it reads as a thing. */
export class ZoneView {
  private readonly boxes = new Map<Zone, Phaser.GameObjects.Rectangle>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(zones: readonly Zone[]): void {
    for (const z of zones) {
      if (this.boxes.has(z)) continue;
      const s = STYLE[z.kind];
      const box = this.scene.add
        .rectangle(z.x + z.w / 2, z.y + z.h / 2, z.w - 2, z.h - 2, s.fill ?? 0, s.fill ? 1 : 0)
        .setStrokeStyle(1, s.stroke, 0.8)
        .setDepth(5);
      this.boxes.set(z, box);
    }
    for (const [z, box] of this.boxes) {
      if (!zones.includes(z)) {
        box.destroy();
        this.boxes.delete(z);
      }
    }
  }
}
