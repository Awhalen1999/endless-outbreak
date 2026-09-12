import Phaser from "phaser";
import { type LevelRef, queueLevelAssets, queueLevelData } from "../game/level";

const TEST_LEVEL: LevelRef = { key: "test", dir: "levels/test/simplified/Level_0" };

export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    queueLevelData(this, TEST_LEVEL);
  }

  create(): void {
    queueLevelAssets(this, TEST_LEVEL);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.scene.start("Mission", { level: TEST_LEVEL });
    });
    this.load.start();
  }
}
