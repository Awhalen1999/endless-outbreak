import missions from "../../data/missions.json";
import type { LevelRef } from "./level";

export interface MissionDef {
  id: string;
  name: string;
  dir: string;
  /** Weapon row unlocked by finishing this mission. */
  unlocks?: string;
}

export const MISSIONS: MissionDef[] = missions;

export function missionRef(m: MissionDef): LevelRef {
  return { key: m.id, dir: m.dir };
}
