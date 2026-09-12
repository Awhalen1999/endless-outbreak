import { describe, expect, it } from "vitest";
import { FixedStep } from "../src/sim/tick";

describe("FixedStep", () => {
  it("runs whole steps only", () => {
    const step = new FixedStep(60);
    expect(step.advance(10, () => {})).toBe(0);
    expect(step.advance(10, () => {})).toBe(1);
  });

  it("caps catch-up after a long frame", () => {
    const step = new FixedStep(60, 5);
    expect(step.advance(1000, () => {})).toBe(5);
  });
});
