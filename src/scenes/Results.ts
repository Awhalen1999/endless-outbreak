import Phaser from "phaser";

/** Post-mission tally, then back to the hub. */
export class Results extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create(): void {
    this.add.text(8, 8, "RESULTS (todo)", { fontFamily: "monospace", fontSize: "8px" });
  }
}
