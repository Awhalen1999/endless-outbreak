import { describe, expect, it } from "vitest";
import { Grid } from "../src/sim/grid";

describe("Grid", () => {
  it("parses LDtk IntGrid CSV with trailing commas", () => {
    const grid = Grid.fromCsv("1,1,1,\n1,0,1,\n1,1,1,\n", 16);
    expect(grid.cols).toBe(3);
    expect(grid.rows).toBe(3);
    expect(grid.isSolid(1, 1)).toBe(false);
    expect(grid.isSolid(0, 0)).toBe(true);
  });

  it("treats out of bounds as solid", () => {
    const grid = Grid.fromStrings(["..", ".."]);
    expect(grid.isSolid(-1, 0)).toBe(true);
    expect(grid.isSolid(2, 0)).toBe(true);
  });
});
