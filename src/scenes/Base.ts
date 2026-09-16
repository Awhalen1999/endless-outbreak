import Phaser from "phaser";
import { MISSIONS, missionRef } from "../game/data";
import type { LevelRef } from "../game/level";
import { Menu } from "../game/menu";
import { loadSave, type Save, storeSave } from "../game/save";
import { WEAPONS } from "../sim/weapon";
import type { Outcome } from "../sim/world";

export interface MissionResult {
  level: LevelRef;
  outcome: Outcome;
  kills: number;
  time: number;
}

type Keys = Record<
  "W" | "A" | "S" | "D" | "UP" | "LEFT" | "DOWN" | "RIGHT" | "E" | "ENTER",
  Phaser.Input.Keyboard.Key
>;

/** Between missions: the tally from the last run, the mission list, the weapon list. */
export class Base extends Phaser.Scene {
  private save!: Save;
  private missions!: Menu;
  private weapons!: Menu;
  private focus!: Menu;
  private keys!: Keys;

  constructor() {
    super("Base");
  }

  create(data?: Partial<MissionResult>): void {
    // Phaser passes {} when a scene starts with no data, so check for a real result.
    const result = data?.outcome ? (data as MissionResult) : undefined;
    this.save = loadSave();
    if (result) this.record(result);

    this.add.text(16, 14, "ENDLESS OUTBREAK", { fontFamily: "monospace", fontSize: "8px" });
    if (result)
      this.add.text(16, 30, tally(result), {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#9aa3ab",
      });

    this.missions = new Menu(this, 16, 90, "missions", this.missionLabels(), 0, (i) => {
      const mission = MISSIONS[i];
      if (mission) this.scene.start("Mission", { level: missionRef(mission) });
    });
    const weaponNames = Object.keys(WEAPONS);
    this.weapons = new Menu(
      this,
      200,
      90,
      "weapon",
      this.weaponLabels(weaponNames),
      weaponNames.indexOf(this.save.weapon),
      (i) => {
        const weapon = weaponNames[i];
        if (!weapon || !this.save.unlocked.includes(weapon)) return;
        this.save.weapon = weapon;
        storeSave(this.save);
        this.weapons.setItems(this.weaponLabels(weaponNames));
      },
    );
    this.setFocus(this.missions);

    this.add.text(16, this.scale.height - 16, "W/S move   A/D switch   E go   or click", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#6b747c",
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("keyboard input unavailable");
    this.keys = keyboard.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,E,ENTER") as Keys;
  }

  override update(): void {
    const k = this.keys;
    const down = Phaser.Input.Keyboard.JustDown;
    if (down(k.W) || down(k.UP)) this.focus.move(-1);
    if (down(k.S) || down(k.DOWN)) this.focus.move(1);
    if (down(k.A) || down(k.LEFT)) this.setFocus(this.missions);
    if (down(k.D) || down(k.RIGHT)) this.setFocus(this.weapons);
    if (down(k.E) || down(k.ENTER)) this.focus.pick();
  }

  private setFocus(menu: Menu): void {
    this.focus = menu;
    this.missions.setFocus(menu === this.missions);
    this.weapons.setFocus(menu === this.weapons);
  }

  /** A successful run marks the mission done and unlocks its weapon. */
  private record(result: MissionResult): void {
    const mission = MISSIONS.find((m) => m.id === result.level.key);
    if (result.outcome !== "extracted" || !mission) return;
    if (!this.save.completed.includes(mission.id)) this.save.completed.push(mission.id);
    if (mission.unlocks && !this.save.unlocked.includes(mission.unlocks)) {
      this.save.unlocked.push(mission.unlocks);
    }
    storeSave(this.save);
  }

  private missionLabels(): string[] {
    return MISSIONS.map((m) => (this.save.completed.includes(m.id) ? `${m.name}  done` : m.name));
  }

  /** Every weapon in the data file, so you can see what a mission will earn you. */
  private weaponLabels(names: string[]): string[] {
    return names.map((w) => {
      if (w === this.save.weapon) return `${w}  equipped`;
      return this.save.unlocked.includes(w) ? w : `${w}  locked`;
    });
  }
}

function tally(r: MissionResult): string {
  const head = r.outcome === "extracted" ? "extracted" : "you died";
  return `${head}   kills ${r.kills}   time ${r.time.toFixed(1)}s`;
}
