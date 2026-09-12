import type Phaser from "phaser";
import type { Sound } from "../sim/sense";
import type { Shot } from "../sim/weapon";

/** One-shot visuals: sound rings, tracers, blood. Nothing here is read back by the sim. */
export class FxView {
  constructor(private readonly scene: Phaser.Scene) {}

  /** A ring at the sound's radius that fades out, so you can see who should have heard it. */
  ring(s: Sound): void {
    const c = this.scene.add
      .circle(s.x, s.y, s.radius)
      .setStrokeStyle(1, 0xe8e4dc, 0.5)
      .setDepth(50);
    this.fade(c, 400);
  }

  /** The shot's path, gone in a blink. */
  tracer(s: Shot): void {
    const line = this.scene.add
      .line(0, 0, s.x0, s.y0, s.x1, s.y1, s.hit ? 0xfff2c0 : 0xe8e4dc)
      .setOrigin(0)
      .setLineWidth(1)
      .setDepth(40);
    this.fade(line, 80);
  }

  /** A blood pool that stays on the floor for the rest of the level. */
  blood(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const r = i === 0 ? 4 : 1 + Math.random() * 2;
      const ox = i === 0 ? 0 : (Math.random() - 0.5) * 12;
      const oy = i === 0 ? 0 : (Math.random() - 0.5) * 12;
      this.scene.add.circle(x + ox, y + oy, r, 0x5a1414).setDepth(1);
    }
  }

  private fade(target: Phaser.GameObjects.GameObject, duration: number): void {
    this.scene.tweens.add({
      targets: target,
      alpha: 0,
      duration,
      onComplete: () => target.destroy(),
    });
  }
}
