import { FieldCache } from "./flowfield";
import type { Grid } from "./grid";
import { PLAYER, type PlayerInput, type PlayerState, playerBox, stepPlayer } from "./player";
import type { Sound } from "./sense";
import { fireWeapon, type Shot, WEAPONS } from "./weapon";
import { createZombie, stepZombie, type Zombie } from "./zombie";
import { overlaps, type Zone } from "./zone";

/** Grabbing the item is loud. The house wakes up. */
const PICKUP_NOISE = 240;

export interface Placement {
  type: string;
  x: number;
  y: number;
}

export type Outcome = "extracted" | "died";

export interface World {
  grid: Grid;
  fields: FieldCache;
  player: PlayerState;
  zombies: Zombie[];
  zones: Zone[];
  carrying: boolean;
  done: Outcome | null;
  kills: number;
  time: number;
  /** Sounds made this tick. Cleared at the end of every step. */
  sounds: Sound[];
  /** Things that happened since the view last looked, for drawing. The view drains these. */
  emitted: Sound[];
  shots: Shot[];
  deaths: { x: number; y: number }[];
}

export function createWorld(
  grid: Grid,
  start: { x: number; y: number },
  zombies: Placement[],
  zones: Zone[] = [],
  weapon = "pistol",
): World {
  return {
    grid,
    fields: new FieldCache(grid),
    player: { x: start.x, y: start.y, aim: 0, hp: PLAYER.hp, weapon, cooldown: 0 },
    zombies: zombies.map((z, i) => createZombie(i + 1, z.type, z.x, z.y)),
    zones,
    carrying: false,
    done: null,
    kills: 0,
    time: 0,
    sounds: [],
    emitted: [],
    shots: [],
    deaths: [],
  };
}

function emitSound(w: World, s: Sound): void {
  w.sounds.push(s);
  w.emitted.push(s);
}

/** One fixed tick, in a fixed order: player, shot, zombies, the dead, zones, then sounds are spent. */
export function stepWorld(w: World, input: PlayerInput, dt: number): void {
  w.player = stepPlayer(w.player, input, w.grid, dt);

  const weapon = WEAPONS[w.player.weapon];
  if (input.fire && weapon && w.player.cooldown === 0) {
    w.shots.push(fireWeapon(w, weapon));
    emitSound(w, { x: w.player.x, y: w.player.y, radius: weapon.noise });
    w.player.cooldown = weapon.interval;
  }

  for (const z of w.zombies) stepZombie(z, w, dt);

  for (const z of w.zombies) if (z.hp <= 0) w.deaths.push({ x: z.x, y: z.y });
  w.kills += w.zombies.length;
  w.zombies = w.zombies.filter((z) => z.hp > 0);
  w.kills -= w.zombies.length;

  const box = playerBox(w.player);
  const zone = w.zones.find((z) => overlaps(z, box));
  if (zone?.kind === "objective") {
    w.carrying = true;
    w.zones = w.zones.filter((z) => z !== zone);
    emitSound(w, { x: w.player.x, y: w.player.y, radius: PICKUP_NOISE });
  }
  if (zone?.kind === "exit" && w.carrying) w.done = "extracted";
  if (w.player.hp <= 0) w.done = "died";

  w.time += dt;
  w.sounds.length = 0;
}
