import { describe, expect, it } from "vitest";
import { computeFlowField, nextStep, UNREACHABLE } from "../src/sim/flowfield";
import { Grid } from "../src/sim/grid";

const grid = Grid.fromStrings([
  "#######",
  "#.....#",
  "#.###.#",
  "#.#...#",
  "#.#.###",
  "#.....#",
  "#######",
]);

describe("flow field", () => {
  const field = computeFlowField(grid, 5, 1);

  it("measures distance to the target", () => {
    expect(field[grid.index(5, 1)]).toBe(0);
    expect(field[grid.index(1, 1)]).toBe(4);
    expect(field[grid.index(3, 3)]).toBe(4);
  });

  it("marks walls and sealed tiles unreachable", () => {
    expect(field[grid.index(2, 2)]).toBe(UNREACHABLE);
    expect(field[grid.index(4, 4)]).toBe(UNREACHABLE);
  });

  it("steps downhill toward the target", () => {
    expect(nextStep(field, grid, 1, 1)).toEqual({ tx: 2, ty: 1 });
    expect(nextStep(field, grid, 5, 1)).toBeNull();
  });

  it("never cuts a corner", () => {
    // From (3,3) the diagonal to (4,2) is blocked by walls on both sides.
    const step = nextStep(field, grid, 3, 3);
    expect(step).not.toEqual({ tx: 4, ty: 2 });
  });

  it("returns an empty field when the target is inside a wall", () => {
    const f = computeFlowField(grid, 0, 0);
    expect(f.every((d) => d === UNREACHABLE)).toBe(true);
  });
});
