import { describe, expect, it } from "vitest";
import { Grid } from "../src/sim/grid";
import { moveBox } from "../src/sim/move";

const grid = Grid.fromStrings(["#####", "#...#", "#...#", "#####"], 16);
const box = { x: 20, y: 20, w: 8, h: 8 };

describe("moveBox", () => {
  it("moves freely in open space", () => {
    expect(moveBox(grid, box, 3, -2)).toEqual({ x: 23, y: 18, w: 8, h: 8 });
  });

  it("stops flush against a wall", () => {
    expect(moveBox(grid, box, -10, 0).x).toBe(16);
    expect(moveBox(grid, { ...box, x: 50 }, 20, 0).x).toBe(64 - 8);
    expect(moveBox(grid, box, 0, -10).y).toBe(16);
  });

  it("slides along a wall", () => {
    const out = moveBox(grid, box, -10, 4);
    expect(out.x).toBe(16);
    expect(out.y).toBe(24);
  });
});
