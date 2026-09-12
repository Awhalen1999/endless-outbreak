import Phaser from "phaser";
import { DebugView } from "../game/debugView";
import { FxView } from "../game/fxView";
import { type BuiltLevel, buildLevel, entityCentre, type LevelRef, zombiesOf } from "../game/level";
import { PlayerView } from "../game/playerView";
import { ZombieView } from "../game/zombieView";
import type { PlayerInput } from "../sim/player";
import { FixedStep } from "../sim/tick";
import { createWorld, stepWorld, type World } from "../sim/world";

type Keys = Record<
  "W" | "A" | "S" | "D" | "UP" | "LEFT" | "DOWN" | "RIGHT",
  Phaser.Input.Keyboard.Key
>;

export class Mission extends Phaser.Scene {
  private world!: World;
  private player!: PlayerView;
  private zombies!: ZombieView;
  private fx!: FxView;
  private debug!: DebugView;
  private hud!: Phaser.GameObjects.Text;
  private keys!: Keys;
  private readonly step = new FixedStep(60);
  /** Latched until a sim step consumes it: a frame may run zero steps and would drop a tap. */
  private fire = false;

  constructor() {
    super("Mission");
  }

  create(data: { level: LevelRef }): void {
    const level = buildLevel(this, data.level);
    this.world = createWorld(level.grid, spawnPoint(level), zombiesOf(level));
    // Dev builds expose the sim for poking at from the console.
    if (import.meta.env.DEV) (window as unknown as { eo: World }).eo = this.world;
    this.player = new PlayerView(this);
    this.zombies = new ZombieView(this);
    this.fx = new FxView(this);
    this.debug = new DebugView(this);
    this.hud = this.add
      .text(4, 4, "", { fontFamily: "monospace", fontSize: "8px" })
      .setScrollFactor(0)
      .setDepth(200);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("keyboard input unavailable");
    this.keys = keyboard.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT") as Keys;
    keyboard.on("keydown-BACKTICK", () => this.debug.toggle());
    this.input.on("pointerdown", () => {
      this.fire = true;
    });

    this.cameras.main.setBounds(0, 0, level.grid.width, level.grid.height);
    this.cameras.main.startFollow(this.player.body, true);
    this.sync();
  }

  override update(_time: number, delta: number): void {
    const input = this.readInput();
    this.step.advance(delta, (dt) => {
      stepWorld(this.world, { ...input, fire: this.fire }, dt);
      this.fire = false;
    });
    this.sync();
    if (this.world.player.hp <= 0) this.scene.restart();
  }

  private sync(): void {
    this.player.sync(this.world.player);
    this.zombies.sync(this.world.zombies);
    const w = this.world;
    for (const s of w.emitted) this.fx.ring(s);
    for (const s of w.shots) this.fx.tracer(s);
    for (const d of w.deaths) this.fx.blood(d.x, d.y);
    w.emitted.length = w.shots.length = w.deaths.length = 0;
    this.hud.setText(`HP ${w.player.hp}   ${w.player.weapon}   zombies ${w.zombies.length}`);
    this.debug.sync(w);
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
