/** Tile grid with a solid mask. Out-of-bounds tiles count as solid. */
export class Grid {
  readonly solid: Uint8Array;

  constructor(
    readonly cols: number,
    readonly rows: number,
    readonly tile: number,
    solid?: Uint8Array,
  ) {
    this.solid = solid ?? new Uint8Array(cols * rows);
  }

  get width(): number {
    return this.cols * this.tile;
  }

  get height(): number {
    return this.rows * this.tile;
  }

  index(tx: number, ty: number): number {
    return ty * this.cols + tx;
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.cols && ty < this.rows;
  }

  isSolid(tx: number, ty: number): boolean {
    return !this.inBounds(tx, ty) || this.solid[this.index(tx, ty)] === 1;
  }

  setSolid(tx: number, ty: number, solid: boolean): void {
    if (this.inBounds(tx, ty)) this.solid[this.index(tx, ty)] = solid ? 1 : 0;
  }

  toTile(px: number): number {
    return Math.floor(px / this.tile);
  }

  /** LDtk IntGrid CSV: one row per line, comma separated, trailing comma per row. */
  static fromCsv(
    csv: string,
    tile: number,
    isSolid: (v: number) => boolean = (v) => v === 1,
  ): Grid {
    const rows = csv
      .trim()
      .split(/\r?\n/)
      .map((line) =>
        line
          .split(",")
          .filter((s) => s.trim() !== "")
          .map(Number),
      );
    const cols = rows[0]?.length ?? 0;
    const grid = new Grid(cols, rows.length, tile);
    for (const [ty, row] of rows.entries()) {
      for (const [tx, v] of row.entries()) grid.setSolid(tx, ty, isSolid(v));
    }
    return grid;
  }

  /** Test helper: '#' is solid, anything else is open. */
  static fromStrings(rows: readonly string[], tile = 16): Grid {
    const cols = rows[0]?.length ?? 0;
    const grid = new Grid(cols, rows.length, tile);
    for (const [ty, row] of rows.entries()) {
      for (const [tx, ch] of [...row].entries()) grid.setSolid(tx, ty, ch === "#");
    }
    return grid;
  }
}
