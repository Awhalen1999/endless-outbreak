import type { Grid } from "./grid";

/** Something loud happened here. Radius in world pixels; anything inside hears it. */
export interface Sound {
  x: number;
  y: number;
  radius: number;
}

export function hears(x: number, y: number, s: Sound): boolean {
  return Math.hypot(s.x - x, s.y - y) <= s.radius;
}

/** Straight line from a to b with no solid tile in the way. Sampled every half tile. */
export function canSee(grid: Grid, ax: number, ay: number, bx: number, by: number): boolean {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.ceil(dist / (grid.tile / 2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (grid.isSolid(grid.toTile(ax + (bx - ax) * t), grid.toTile(ay + (by - ay) * t)))
      return false;
  }
  return true;
}
