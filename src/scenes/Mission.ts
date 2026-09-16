import Phaser from "phaser";
import { DebugView } from "../game/debugView";
import { FxView } from "../game/fxView";
import {
  type BuiltLevel,
  buildLevel,
  entityCentre,
  type LevelRef,
  zombiesOf,
  zonesOf,
} from "../game/level";
import { Menu } from "../game/menu";
import { PlayerView } from "../game/playerView";
import { loadSave } from "../game/save";
import { ZombieView } from "../game/zombieView";
import { ZoneView } from "../game/zoneView";
import type { PlayerInput } from "../sim/player";
import { FixedStep } from "../sim/tick";
import { createWorld, stepWorld, type World } from "../sim/world";
import type { MissionResult } from "./Base";

type Keys = Record<
  "W" | "A" | "S" | "D" | "UP" | "LEFT" | "DOWN" | "RIGHT" | "E" | "ENTER" | "ESC",
  Phaser.Input.Keyboard.Key
>;

/** One mission: the level, the sim stepping at 60 Hz, and the views that draw it. */
export class Mission extends Phaser.Scene {
  private level!: LevelRef;
  private world!: World;
  private player!: PlayerView;
  private zombies!: ZombieView;
  private zones!: ZoneView;
  private fx!: FxView;
  private debug!: DebugView;
  private hud!: Phaser.GameObjects.Text;
  private pause?: { backdrop: Phaser.GameObjects.Rectangle; menu: Menu };
  private keys!: Keys;
  private readonly step = new FixedStep(60);
  /** A tap is latched until a sim step consumes it: a frame may run zero steps and would drop it. */
  private fire = false;
  /** The button is held. Set only by presses inside this scene, so a menu click never fires. */
  private held = false;

  constructor() {
    super("Mission");
  }

  create(data: { level: LevelRef }): void {
    this.level = data.level;
    const level = buildLevel(this, data.level);
    this.world = createWorld(
      level.grid,
      spawnPoint(level),
      zombiesOf(level),
      zonesOf(level),
      loadSave().weapon,
    );
    // Dev builds expose the sim for poking at from the console.
    if (import.meta.env.DEV) (window as unknown as { eo: World }).eo = this.world;

    this.player = new PlayerView(this);
    this.zombies = new ZombieView(this);
    this.zones = new ZoneView(this);
    this.fx = new FxView(this);
    this.debug = new DebugView(this);
    this.hud = this.add
      .text(4, 4, "", { fontFamily: "monospace", fontSize: "8px" })
      .setScrollFactor(0)
      .setDepth(200);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("keyboard input unavailable");
    this.keys = keyboard.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,ENTER,ESC") as Keys;
    keyboard.on("keydown-BACKTICK", () => this.debug.toggle());
    this.input.on("pointerdown", () => {
      this.fire = true;
      this.held = true;
    });
    this.input.on("pointerup", () => {
      this.held = false;
    });

    this.cameras.main.setBounds(0, 0, level.grid.width, level.grid.height);
    this.cameras.main.startFollow(this.player.body, true);
    this.sync();
  }

  override update(_time: number, delta: number): void {
    if (this.pause) {
      this.updatePause();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.openPause();
      return;
    }

    const input = this.readInput();
    this.step.advance(delta, (dt) => {
      stepWorld(this.world, { ...input, fire: this.fire || this.held }, dt);
      this.fire = false;
    });
    this.sync();

    const w = this.world;
    if (w.done) {
      const result: MissionResult = {
        level: this.level,
        outcome: w.done,
        kills: w.kills,
        time: w.time,
      };
      this.scene.start("Base", result);
    }
  }

  /** Esc: the sim stops and a small menu offers resume or the way back to base. */
  private openPause(): void {
    const { width, height } = this.scale;
    const backdrop = this.add
      .rectangle(width / 2, height / 2, width, height, 0x0b0e11, 0.7)
      .setScrollFactor(0)
      .setDepth(299);
    const menu = new Menu(
      this,
      width / 2 - 40,
      height / 2 - 20,
      "paused",
      ["resume", "quit to base"],
      0,
      (i) => {
        if (i === 0) this.closePause();
        else this.scene.start("Base");
      },
    );
    menu.setFocus(true);
    this.pause = { backdrop, menu };
  }

  private closePause(): void {
    this.pause?.backdrop.destroy();
    this.pause?.menu.destroy();
    this.pause = undefined;
    this.fire = false;
    this.held = false;
  }

  private updatePause(): void {
    const menu = this.pause?.menu;
    if (!menu) return;
    const k = this.keys;
    const down = Phaser.Input.Keyboard.JustDown;
    if (down(k.W) || down(k.UP)) menu.move(-1);
    if (down(k.S) || down(k.DOWN)) menu.move(1);
    if (down(k.ESC)) this.closePause();
    else if (down(k.E) || down(k.ENTER)) menu.pick();
  }

  private sync(): void {
    const w = this.world;
    this.player.sync(w.player);
    this.zombies.sync(w.zombies);
    this.zones.sync(w.zones);
    for (const s of w.emitted) this.fx.ring(s);
    for (const s of w.shots) this.fx.tracer(s);
    for (const d of w.deaths) this.fx.blood(d.x, d.y);
    w.emitted.length = w.shots.length = w.deaths.length = 0;
    this.debug.sync(w);

    const item = w.carrying ? "   ITEM" : "";
    this.hud.setText(`HP ${w.player.hp}   ${w.player.weapon}   zombies ${w.zombies.length}${item}`);
  }

  private readInput(): Omit<PlayerInput, "fire"> {
    const k = this.keys;
    // pointer.worldX only refreshes on mouse events, so it goes stale when the camera scrolls.
    const pointer = this.input.activePointer;
    const aim = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return {
      moveX: Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown),
      moveY: Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown),
      aimX: aim.x,
      aimY: aim.y,
    };
  }
}

function spawnPoint(level: BuiltLevel): { x: number; y: number } {
  const start = level.entities.PlayerStart?.[0];
  return start ? entityCentre(start) : { x: level.grid.tile * 2, y: level.grid.tile * 2 };
}
