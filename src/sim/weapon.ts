import weaponTypes from "../../data/weapons.json";
import { moveBox } from "./move";
import type { PlayerState } from "./player";
import type { World } from "./world";
import { ZOMBIE_SIZE, type Zombie, zombieBox } from "./zombie";

export interface WeaponType {
  damage: number;
  /** Seconds between shots. */
  interval: number;
  /** How far a shot travels, in world pixels. */
  range: number;
  /** Radius of the sound a shot makes. */
  noise: number;
  /** Pixels a hit shoves the zombie along the shot. */
  knockback: number;
  /** Rounds in a full magazine. */
  mag: number;
  /** Seconds to swap a magazine. Reserve ammo is unlimited. */
  reload: number;
}

export const WEAPONS: Record<string, WeaponType> = weaponTypes;

/** A fired shot, for drawing the tracer. */
export interface Shot {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  hit: boolean;
}

const STEP = 4;
const FLASH = 0.08;

/** Can the trigger do anything right now? */
export function canFire(p: PlayerState): boolean {
  return p.cooldown === 0 && p.reload === 0 && p.ammo > 0;
}

/**
 * The ammo clock, run once a tick: finish a reload in progress, or start one when
 * asked for or when the magazine has run dry.
 */
export function stepReload(p: PlayerState, type: WeaponType, want: boolean, dt: number): void {
  if (p.reload > 0) {
    p.reload = Math.max(0, p.reload - dt);
    if (p.reload === 0) p.ammo = type.mag;
    return;
  }
  if ((want || p.ammo === 0) && p.ammo < type.mag) p.reload = type.reload;
}

/** Hitscan: walk the aim line until a wall or the first zombie, up to range. Instant. */
export function fireWeapon(w: World, type: WeaponType): Shot {
  const p = w.player;
  const dx = Math.cos(p.aim);
  const dy = Math.sin(p.aim);
  let x = p.x;
  let y = p.y;
  for (let d = STEP; d <= type.range; d += STEP) {
    x = p.x + dx * d;
    y = p.y + dy * d;
    if (w.grid.isSolid(w.grid.toTile(x), w.grid.toTile(y))) break;
    const z = w.zombies.find(
      (z) => Math.abs(z.x - x) <= ZOMBIE_SIZE / 2 && Math.abs(z.y - y) <= ZOMBIE_SIZE / 2,
    );
    if (z) {
      hit(z, w, type, dx, dy);
      return { x0: p.x, y0: p.y, x1: x, y1: y, hit: true };
    }
  }
  return { x0: p.x, y0: p.y, x1: x, y1: y, hit: false };
}

function hit(z: Zombie, w: World, type: WeaponType, dx: number, dy: number): void {
  z.hp -= type.damage;
  z.flash = FLASH;
  if (z.state === "idle") z.state = "chase";
  const box = moveBox(w.grid, zombieBox(z), dx * type.knockback, dy * type.knockback);
  z.x = box.x + ZOMBIE_SIZE / 2;
  z.y = box.y + ZOMBIE_SIZE / 2;
}
