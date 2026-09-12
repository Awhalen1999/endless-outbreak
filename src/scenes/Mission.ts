import Phaser from "phaser";
import { type BuiltLevel, buildLevel, entityCentre, type LevelRef } from "../game/level";
import { PlayerView } from "../game/playerView";
import type { Grid } from "../sim/grid";
import { type PlayerInput, type PlayerState, stepPlayer } from "../sim/player";
import { FixedStep } from "../sim/tick";

type Keys = Record<
  "W" | "A" | "S" | "D" | "UP" | "LEFT" | "DOWN" | "RIGHT",
  Phaser.Input.Keyboard.Key
>;

export class Mission extends Phaser.Scene {
  private grid!: Grid;
  private player!: PlayerState;
  private view!: PlayerView;
  private keys!: Keys;
  private readonly step = new FixedStep(60);
  private debug?: Phaser.GameObjects.Graphics;

  constructor() {
    super("Mission");
  }

  create(data: { level: LevelRef }): void {
    const level = buildLevel(this, data.level);
    this.grid = level.grid;
    this.player = { ...spawnPoint(level), aim: 0 };
    this.view = new PlayerView(this);
    this.view.sync(this.player);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("keyboard input unavailable");
    this.keys = keyboard.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT") as Keys;
    keyboard.on("keydown-BACKTICK", () => this.toggleDebug());

    this.cameras.main.setBounds(0, 0, this.grid.width, this.grid.height);
    this.cameras.main.startFollow(this.view.body, true);
  }

  override update(_time: number, delta: number): void {
    const input = this.readInput();
    this.step.advance(delta, (dt) => {
      this.player = stepPlayer(this.player, input, this.grid, dt);
    });
    this.view.sync(this.player);
  }

  private readInput(): PlayerInput {
    const k = this.keys;
    const pointer = this.input.activePointer;
    return {
      moveX: Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown),
      moveY: Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown),
      aimX: pointer.worldX,
      aimY: pointer.worldY,
    };
  }

  /** Backtick: outline every solid tile, to see what the movement code sees. */
  private toggleDebug(): void {
    if (this.debug) {
      this.debug.destroy();
      this.debug = undefined;
      return;
    }
    const g = this.add.graphics().setDepth(100).lineStyle(1, 0xc8372d, 0.9);
    const t = this.grid.tile;
    for (let ty = 0; ty < this.grid.rows; ty++) {
      for (let tx = 0; tx < this.grid.cols; tx++) {
        if (this.grid.isSolid(tx, ty)) g.strokeRect(tx * t + 0.5, ty * t + 0.5, t - 1, t - 1);
      }
    }
    this.debug = g;
  }
}

function spawnPoint(level: BuiltLevel): { x: number; y: number } {
  const start = level.entities.PlayerStart?.[0];
  return start ? entityCentre(start) : { x: level.grid.tile * 2, y: level.grid.tile * 2 };
}
