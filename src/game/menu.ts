import Phaser from "phaser";

const INK = "#e8e4dc";
const MUTED = "#9aa3ab";
const DIM = "#6b747c";
const ROW_WIDTH = 160;

/** A titled list. Keys are routed in by the scene; rows also answer the mouse. */
export class Menu {
  private readonly rows: Phaser.GameObjects.Text[];
  private readonly heading: Phaser.GameObjects.Text;
  index: number;
  focused = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    private items: string[],
    selected: number,
    private readonly onPick: (index: number) => void,
  ) {
    this.index = Math.max(0, selected);
    this.heading = text(scene, x, y, title.toUpperCase(), DIM);
    // A fixed hit area: the label changes width as focus moves, and it starts out empty.
    const hit = new Phaser.Geom.Rectangle(0, 0, ROW_WIDTH, 10);
    this.rows = items.map((_, i) =>
      text(scene, x, y + 16 + i * 12, "", MUTED)
        .setInteractive({
          hitArea: hit,
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true,
        })
        .on("pointerover", () => {
          this.index = i;
          this.render();
        })
        .on("pointerdown", () => this.onPick(i)),
    );
    this.render();
  }

  setItems(items: string[]): void {
    this.items = items;
    this.render();
  }

  setFocus(focused: boolean): void {
    this.focused = focused;
    this.render();
  }

  move(delta: number): void {
    this.index = (this.index + delta + this.items.length) % this.items.length;
    this.render();
  }

  pick(): void {
    this.onPick(this.index);
  }

  destroy(): void {
    this.heading.destroy();
    for (const row of this.rows) row.destroy();
  }

  private render(): void {
    this.heading.setColor(this.focused ? INK : DIM);
    this.rows.forEach((row, i) => {
      const current = this.focused && i === this.index;
      row.setText(`${current ? "> " : "  "}${this.items[i] ?? ""}`).setColor(current ? INK : MUTED);
    });
  }
}

/** Menus are UI: pinned to the screen and drawn over everything. */
function text(scene: Phaser.Scene, x: number, y: number, s: string, color: string) {
  return scene.add
    .text(x, y, s, { fontFamily: "monospace", fontSize: "8px", color })
    .setScrollFactor(0)
    .setDepth(300);
}
