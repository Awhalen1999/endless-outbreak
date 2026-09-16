import { describe, expect, it } from "vitest";
import { Grid } from "../src/sim/grid";
import { createWorld, stepWorld } from "../src/sim/world";
import type { Zone } from "../src/sim/zone";

const grid = Grid.fromStrings(["##########", "#........#", "#........#", "##########"], 16);
const idle = { moveX: 0, moveY: 0, aimX: 0, aimY: 0, fire: false };
const objective: Zone = { kind: "objective", x: 48, y: 16, w: 16, h: 16 };
const exit: Zone = { kind: "exit", x: 112, y: 16, w: 16, h: 16 };

const tick = (w: ReturnType<typeof createWorld>, input = idle) => stepWorld(w, input, 1 / 60);

describe("world", () => {
  it("picks the item up by walking over it, loudly", () => {
    const w = createWorld(grid, { x: 24, y: 24 }, [], [objective, exit]);
    tick(w);
    expect(w.carrying).toBe(false);
    w.player.x = 56;
    tick(w);
    expect(w.carrying).toBe(true);
    expect(w.zones).toEqual([exit]);
    expect(w.emitted.at(-1)?.radius).toBeGreaterThan(200);
  });

  it("only extracts through the exit while carrying", () => {
    const w = createWorld(grid, { x: 120, y: 24 }, [], [objective, exit]);
    tick(w);
    expect(w.done).toBeNull();
    w.carrying = true;
    tick(w);
    expect(w.done).toBe("extracted");
  });

  it("ends on death and counts kills", () => {
    const w = createWorld(grid, { x: 24, y: 24 }, [{ type: "walker", x: 80, y: 24 }]);
    const z = w.zombies[0];
    if (!z) throw new Error("no zombie");
    z.hp = 0;
    tick(w);
    expect(w.kills).toBe(1);
    expect(w.zombies).toHaveLength(0);
    w.player.hp = 0;
    tick(w);
    expect(w.done).toBe("died");
  });

  it("starts with the chosen weapon", () => {
    expect(createWorld(grid, { x: 24, y: 24 }, [], [], "silenced").player.weapon).toBe("silenced");
  });
});
