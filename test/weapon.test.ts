import { describe, expect, it } from "vitest";
import { Grid } from "../src/sim/grid";
import { fireWeapon, WEAPONS, type WeaponType } from "../src/sim/weapon";
import { createWorld, stepWorld, type World } from "../src/sim/world";

// One long corridor: player at the left end, aiming right.
const grid = Grid.fromStrings(
  ["####################", "#..................#", "####################"],
  16,
);
const pistol = WEAPONS.pistol as WeaponType;

function world(...zombieXs: number[]): World {
  const w = createWorld(
    grid,
    { x: 24, y: 24 },
    zombieXs.map((x) => ({ type: "walker", x, y: 24 })),
  );
  w.player.aim = 0;
  return w;
}

const idle = { moveX: 0, moveY: 0, aimX: 300, aimY: 24, fire: false };

describe("pistol", () => {
  it("hits the first zombie in line and wakes it", () => {
    const w = world(120, 150);
    const shot = fireWeapon(w, pistol);
    expect(shot.hit).toBe(true);
    expect(w.zombies[0]?.hp).toBe(2);
    expect(w.zombies[0]?.state).toBe("chase");
    expect(w.zombies[1]?.hp).toBe(3);
  });

  it("stops at range and at walls", () => {
    const far = world(24 + pistol.range + 20);
    expect(fireWeapon(far, pistol).hit).toBe(false);
    const behindWall = world(120);
    behindWall.player.aim = Math.PI / 2;
    const shot = fireWeapon(behindWall, pistol);
    expect(shot.hit).toBe(false);
    expect(shot.y1).toBeLessThan(40);
  });

  it("kills after enough hits and records the death", () => {
    const w = world(120);
    for (let i = 0; i < 3; i++) stepWorld(w, { ...idle, fire: true }, 1);
    expect(w.zombies.length).toBe(0);
    expect(w.deaths.length).toBe(1);
  });

  it("respects the fire interval and makes noise per shot", () => {
    const w = world(120);
    for (let i = 0; i < 60; i++) stepWorld(w, { ...idle, fire: true }, 1 / 60);
    expect(w.shots.length).toBe(4);
    expect(w.emitted.length).toBe(4);
    expect(w.emitted[0]?.radius).toBe(pistol.noise);
  });
});
