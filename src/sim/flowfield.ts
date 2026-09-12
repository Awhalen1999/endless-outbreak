import type { Grid } from "./grid";

export const UNREACHABLE = -1;

const CARDINAL: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const ALL_DIRS: ReadonlyArray<readonly [number, number]> = [
  ...CARDINAL,
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** BFS distance from every open tile to the target. One call serves every zombie. */
export function computeFlowField(grid: Grid, targetTx: number, targetTy: number): Int32Array {
  const field = new Int32Array(grid.cols * grid.rows).fill(UNREACHABLE);
  if (grid.isSolid(targetTx, targetTy)) return field;

  const queue = new Int32Array(grid.cols * grid.rows);
  let head = 0;
  let tail = 0;
  const start = grid.index(targetTx, targetTy);
  field[start] = 0;
  queue[tail++] = start;

  while (head < tail) {
    const i = queue[head++] as number;
    const d = (field[i] as number) + 1;
    const tx = i % grid.cols;
    const ty = (i - tx) / grid.cols;
    for (const [dx, dy] of CARDINAL) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (grid.isSolid(nx, ny)) continue;
      const ni = grid.index(nx, ny);
      if (field[ni] !== UNREACHABLE) continue;
      field[ni] = d;
      queue[tail++] = ni;
    }
  }
  return field;
}

/** The neighbouring tile with the lowest distance, or null at the target or when unreachable. */
export function nextStep(
  field: Int32Array,
  grid: Grid,
  tx: number,
  ty: number,
): { tx: number; ty: number } | null {
  const here = field[grid.index(tx, ty)] ?? UNREACHABLE;
  if (here <= 0) return null;

  let best: { tx: number; ty: number } | null = null;
  let bestD = here;
  for (const [dx, dy] of ALL_DIRS) {
    const nx = tx + dx;
    const ny = ty + dy;
    if (grid.isSolid(nx, ny)) continue;
    // No cutting corners: a diagonal needs both orthogonal neighbours open.
    if (dx !== 0 && dy !== 0 && (grid.isSolid(tx + dx, ty) || grid.isSolid(tx, ty + dy))) continue;
    const d = field[grid.index(nx, ny)] as number;
    if (d !== UNREACHABLE && d < bestD) {
      bestD = d;
      best = { tx: nx, ty: ny };
    }
  }
  return best;
}

/** Fields depend only on the grid and the target tile, so they are computed once and kept. */
export class FieldCache {
  private readonly fields = new Map<number, Int32Array>();

  constructor(readonly grid: Grid) {}

  get(tx: number, ty: number): Int32Array {
    const key = this.grid.index(tx, ty);
    let field = this.fields.get(key);
    if (!field) {
      field = computeFlowField(this.grid, tx, ty);
      this.fields.set(key, field);
    }
    return field;
  }
}
