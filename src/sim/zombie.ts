import zombieTypes from "../../data/zombies.json";
import { nextStep } from "./flowfield";
import { type Box, moveBox } from "./move";
import { canSee, hears } from "./sense";
import type { World } from "./world";

export interface ZombieType {
  speed: number;
  hp: number;
  damage: number;
  /** Sight radius in world pixels. */
  sight: number;
  /** Attack reach in world pixels. */
  reach: number;
  windup: number;
  cooldown: number;
}

export const ZOMBIE_TYPES: Record<string, ZombieType> = zombieTypes;
export const ZOMBIE_SIZE = 10;

/** Idle until it sees the player or hears a sound. Alerted zombies never stand down. */
export type ZombieState = "idle" | "chase" | "attack";

export interface Zombie {
  id: number;
  type: string;
  x: number;
  y: number;
  hp: number;
  state: ZombieState;
  /** Seconds left in the current swing. */
  windup: number;
  /** Seconds until it may swing again. */
  cooldown: number;
  /** Seconds left of the white hit flash. */
  flash: number;
}

const SEPARATION = 12;

export function createZombie(id: number, type: string, x: number, y: number): Zombie {
  const t = ZOMBIE_TYPES[type];
  if (!t) throw new Error(`unknown zombie type ${type}`);
  return { id, type, x, y, hp: t.hp, state: "idle", windup: 0, cooldown: 0, flash: 0 };
}

export function zombieBox(z: Zombie): Box {
  return { x: z.x - ZOMBIE_SIZE / 2, y: z.y - ZOMBIE_SIZE / 2, w: ZOMBIE_SIZE, h: ZOMBIE_SIZE };
}

export function stepZombie(z: Zombie, w: World, dt: number): void {
  const t = ZOMBIE_TYPES[z.type] as ZombieType;
  const p = w.player;
  const dist = Math.hypot(p.x - z.x, p.y - z.y);
  z.cooldown = Math.max(0, z.cooldown - dt);
  z.flash = Math.max(0, z.flash - dt);

  switch (z.state) {
    case "idle": {
      const sees = dist <= t.sight && canSee(w.grid, z.x, z.y, p.x, p.y);
      if (sees || w.sounds.some((s) => hears(z.x, z.y, s))) z.state = "chase";
      return;
    }
    case "chase":
      if (dist > t.reach) {
        moveToward(z, p.x, p.y, t.speed, w, dt);
      } else if (z.cooldown === 0) {
        z.state = "attack";
        z.windup = t.windup;
      }
      return;
    case "attack":
      z.windup -= dt;
      if (z.windup <= 0) {
        if (dist <= t.reach * 1.5) p.hp -= t.damage;
        z.state = "chase";
        z.cooldown = t.cooldown;
      }
      return;
  }
}

/** One step down the flow field toward the target, pushed apart from neighbours, slid along walls. */
function moveToward(z: Zombie, tx: number, ty: number, speed: number, w: World, dt: number): void {
  const g = w.grid;
  const field = w.fields.get(g.toTile(tx), g.toTile(ty));
  const step = nextStep(field, g, g.toTile(z.x), g.toTile(z.y));
  const goalX = step ? (step.tx + 0.5) * g.tile : tx;
  const goalY = step ? (step.ty + 0.5) * g.tile : ty;

  let dx = goalX - z.x;
  let dy = goalY - z.y;
  const len = Math.hypot(dx, dy) || 1;
  dx = (dx / len) * speed;
  dy = (dy / len) * speed;

  for (const o of w.zombies) {
    if (o === z) continue;
    const d = Math.hypot(z.x - o.x, z.y - o.y);
    if (d > 0 && d < SEPARATION) {
      const push = ((SEPARATION - d) / SEPARATION) * speed;
      dx += ((z.x - o.x) / d) * push;
      dy += ((z.y - o.y) / d) * push;
    }
  }

  const box = moveBox(g, zombieBox(z), dx * dt, dy * dt);
  z.x = box.x + ZOMBIE_SIZE / 2;
  z.y = box.y + ZOMBIE_SIZE / 2;
}
