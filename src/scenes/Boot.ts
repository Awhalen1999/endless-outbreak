import Phaser from "phaser";
import { MISSIONS, missionRef } from "../game/data";
import { queueLevelAssets, queueLevelData } from "../game/level";

const LEVELS = MISSIONS.map(missionRef);

/** Loads every level up front, then opens the base screen. */
export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    for (const ref of LEVELS) queueLevelData(this, ref);
  }

  create(): void {
    for (const ref of LEVELS) queueLevelAssets(this, ref);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.scene.start("Base"));
    this.load.start();
  }
}
