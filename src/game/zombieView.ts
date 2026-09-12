import type Phaser from "phaser";
import { ZOMBIE_SIZE, type Zombie, type ZombieState } from "../sim/zombie";

const STATE_COLOUR: Record<ZombieState, number> = {
  idle: 0x6b747c,
  chase: 0xc8372d,
  attack: 0xff6a5c,
};

/** Placeholder zombies: one box each, coloured by state so the brain is visible. */
export class ZombieView {
  private readonly boxes = new Map<number, Phaser.GameObjects.Rectangle>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(zombies: readonly Zombie[]): void {
    const alive = new Set<number>();
    for (const z of zombies) {
      alive.add(z.id);
      let box = this.boxes.get(z.id);
      if (!box) {
        box = this.scene.add.rectangle(z.x, z.y, ZOMBIE_SIZE, ZOMBIE_SIZE).setDepth(9);
        this.boxes.set(z.id, box);
      }
      box.setPosition(z.x, z.y).setFillStyle(z.flash > 0 ? 0xffffff : STATE_COLOUR[z.state]);
    }
    for (const [id, box] of this.boxes) {
      if (!alive.has(id)) {
        box.destroy();
        this.boxes.delete(id);
      }
    }
  }
}
