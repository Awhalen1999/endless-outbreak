import type { Box } from "./move";

/** A rectangle on the floor that means something when the player walks into it. */
export type ZoneKind = "objective" | "exit";

export interface Zone extends Box {
  kind: ZoneKind;
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
