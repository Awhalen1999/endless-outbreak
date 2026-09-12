import type { Grid } from "./grid";
import { type Box, moveBox } from "./move";

export const PLAYER = { w: 10, h: 10, speed: 90, hp: 5 } as const;

export interface PlayerInput {
  /** Movement axes in [-1, 1]. */
  moveX: number;
  moveY: number;
  /** Aim target in world pixels. */
  aimX: number;
  aimY: number;
  /** Trigger pulled this tick. */
  fire: boolean;
}

export interface PlayerState {
  /** Centre position in world pixels. */
  x: number;
  y: number;
  /** Aim angle in radians. */
  aim: number;
  hp: number;
  /** Row in weapons.json. */
  weapon: string;
  /** Seconds until it may fire again. */
  cooldown: number;
}

export function playerBox(p: PlayerState): Box {
  return { x: p.x - PLAYER.w / 2, y: p.y - PLAYER.h / 2, w: PLAYER.w, h: PLAYER.h };
}

export function stepPlayer(
  p: PlayerState,
  input: PlayerInput,
  grid: Grid,
  dt: number,
): PlayerState {
  const len = Math.hypot(input.moveX, input.moveY);
  const scale = len > 1 ? 1 / len : 1;
  const dx = input.moveX * scale * PLAYER.speed * dt;
  const dy = input.moveY * scale * PLAYER.speed * dt;
  const box = moveBox(grid, playerBox(p), dx, dy);
  const x = box.x + PLAYER.w / 2;
  const y = box.y + PLAYER.h / 2;
  return {
    ...p,
    x,
    y,
    aim: Math.atan2(input.aimY - y, input.aimX - x),
    cooldown: Math.max(0, p.cooldown - dt),
  };
}
