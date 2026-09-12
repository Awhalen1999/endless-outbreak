import type { Grid } from "./grid";

/** Axis-aligned box, top-left origin, in pixels. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const EPS = 0.001;

/**
 * Move a box through the grid, resolving each axis separately so it slides along walls.
 * Assumes a step never exceeds one tile, which holds at 60 Hz for anything in this game.
 */
export function moveBox(grid: Grid, box: Box, dx: number, dy: number): Box {
  return sweepY(grid, sweepX(grid, box, dx), dy);
}

function sweepX(grid: Grid, box: Box, dx: number): Box {
  if (dx === 0) return box;
  const x = box.x + dx;
  const ty0 = grid.toTile(box.y);
  const ty1 = grid.toTile(box.y + box.h - EPS);
  const edge = dx > 0 ? grid.toTile(x + box.w - EPS) : grid.toTile(x);
  for (let ty = ty0; ty <= ty1; ty++) {
    if (grid.isSolid(edge, ty)) {
      return { ...box, x: dx > 0 ? edge * grid.tile - box.w : (edge + 1) * grid.tile };
    }
  }
  return { ...box, x };
}

function sweepY(grid: Grid, box: Box, dy: number): Box {
  if (dy === 0) return box;
  const y = box.y + dy;
  const tx0 = grid.toTile(box.x);
  const tx1 = grid.toTile(box.x + box.w - EPS);
  const edge = dy > 0 ? grid.toTile(y + box.h - EPS) : grid.toTile(y);
  for (let tx = tx0; tx <= tx1; tx++) {
    if (grid.isSolid(tx, edge)) {
      return { ...box, y: dy > 0 ? edge * grid.tile - box.h : (edge + 1) * grid.tile };
    }
  }
  return { ...box, y };
}
