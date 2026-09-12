import { describe, expect, it } from "vitest";
import { Grid } from "../src/sim/grid";
import { createWorld, type World } from "../src/sim/world";
import { stepZombie, type Zombie } from "../src/sim/zombie";

// A wide room with a wall stub in the middle row. Player far bottom-left, zombie far top-right,
// well outside its 112px sight.
const grid = Grid.fromStrings(
  [
    "####################",
    "#..................#",
    "#..................#",
    "#...####...........#",
    "#..................#",
    "####################",
  ],
  16,
);

const world = (): World => createWorld(grid, { x: 24, y: 72 }, [{ type: "walker", x: 296, y: 24 }]);

function zombie(w: World): Zombie {
  const z = w.zombies[0];
  if (!z) throw new Error("no zombie");
  return z;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) stepZombie(zombie(w), w, 1 / 60);
};

describe("zombie", () => {
  it("stands idle until something happens", () => {
    const w = world();
    run(w, 1);
    expect(zombie(w).state).toBe("idle");
    expect(zombie(w).x).toBe(296);
  });

  it("ignores a sound out of range", () => {
    const w = world();
    w.sounds.push({ x: 24, y: 72, radius: 20 });
    run(w, 1 / 60);
    expect(zombie(w).state).toBe("idle");
  });

  it("chases the player after hearing a sound, wherever the sound was", () => {
    const w = world();
    w.sounds.push({ x: 280, y: 24, radius: 40 });
    run(w, 1 / 60);
    w.sounds.length = 0;
    expect(zombie(w).state).toBe("chase");
    run(w, 2);
    expect(zombie(w).x).toBeLessThan(296);
    expect(zombie(w).y).toBeGreaterThan(24);
  });

  it("chases on sight and attacks in reach", () => {
    const w = world();
    w.player.x = 280;
    w.player.y = 24;
    run(w, 1 / 60);
    expect(zombie(w).state).toBe("chase");
    run(w, 2);
    expect(w.player.hp).toBeLessThan(5);
    // It stops at arm's length between swings instead of walking into the player.
    expect(Math.hypot(w.player.x - zombie(w).x, w.player.y - zombie(w).y)).toBeGreaterThan(8);
  });

  it("never stands down once alerted", () => {
    const w = world();
    w.player.x = 280;
    w.player.y = 24;
    run(w, 1 / 60);
    w.player.x = 24;
    w.player.y = 72;
    run(w, 3);
    expect(zombie(w).state).toBe("chase");
  });
});
