import Phaser from "phaser";

/** The camp. Walkable menu: weapon stations, upgrades, the ladder to the mission picker. */
export class Hub extends Phaser.Scene {
  constructor() {
    super("Hub");
  }

  create(): void {
    this.add.text(8, 8, "HUB (todo)", { fontFamily: "monospace", fontSize: "8px" });
  }
}
