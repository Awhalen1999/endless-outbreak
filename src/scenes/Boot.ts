import Phaser from "phaser";
import { MISSIONS, missionRef } from "../game/data";
import { queueLevel } from "../game/level";

const LEVELS = MISSIONS.map(missionRef);

/** Loads every level up front, then opens the base screen. */
export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    for (const ref of LEVELS) queueLevel(this, ref);
  }

  create(): void {
    this.scene.start("Base");
  }
}
