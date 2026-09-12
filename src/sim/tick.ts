/** Fixed-step accumulator. The sim only ever advances in whole steps of 1/hz seconds. */
export class FixedStep {
  private acc = 0;

  constructor(
    readonly hz = 60,
    readonly maxSteps = 5,
  ) {}

  get dt(): number {
    return 1 / this.hz;
  }

  /** Feed a frame's elapsed ms; runs `step` zero or more times. Returns steps run. */
  advance(deltaMs: number, step: (dt: number) => void): number {
    this.acc = Math.min(this.acc + deltaMs / 1000, this.dt * this.maxSteps);
    let steps = 0;
    while (this.acc >= this.dt) {
      step(this.dt);
      this.acc -= this.dt;
      steps++;
    }
    return steps;
  }
}
