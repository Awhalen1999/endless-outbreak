import { describe, expect, it } from "vitest";
import { Grid } from "../src/sim/grid";
import { canSee, hears } from "../src/sim/sense";

const grid = Grid.fromStrings(["#######", "#..#..#", "#..#..#", "#.....#", "#######"], 16);

describe("senses", () => {
  it("hears inside the radius only", () => {
    const s = { x: 100, y: 100, radius: 50 };
    expect(hears(130, 100, s)).toBe(true);
    expect(hears(160, 100, s)).toBe(false);
  });

  it("sees along a clear line and not through a wall", () => {
    expect(canSee(grid, 24, 24, 24, 56)).toBe(true);
    expect(canSee(grid, 24, 24, 72, 24)).toBe(false);
    expect(canSee(grid, 24, 56, 72, 56)).toBe(true);
  });
});
