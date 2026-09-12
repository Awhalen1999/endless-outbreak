import type Phaser from "phaser";
import { PLAYER, type PlayerState } from "../sim/player";

/** Placeholder survivor: a box for the body, a line for the gun. Sprites replace this later. */
export class PlayerView {
  readonly body: Phaser.GameObjects.Rectangle;
  private readonly gun: Phaser.GameObjects.Line;

  constructor(scene: Phaser.Scene) {
    this.body = scene.add.rectangle(0, 0, PLAYER.w, PLAYER.h, 0xd9a441).setDepth(10);
    this.gun = scene.add.line(0, 0, 0, 0, 9, 0, 0xe8e4dc).setOrigin(0).setLineWidth(1).setDepth(11);
  }

  sync(p: PlayerState): void {
    this.body.setPosition(p.x, p.y);
    this.gun.setPosition(p.x, p.y).setRotation(p.aim);
  }
}
