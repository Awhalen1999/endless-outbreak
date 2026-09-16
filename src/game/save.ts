/** Progress lives in this browser. One blob, versioned key, no accounts. */
export interface Save {
  completed: string[];
  unlocked: string[];
  weapon: string;
}

const KEY = "endless-outbreak.save.v1";
const FRESH: Save = { completed: [], unlocked: ["pistol"], weapon: "pistol" };

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...FRESH, ...(JSON.parse(raw) as Partial<Save>) } : { ...FRESH };
  } catch {
    return { ...FRESH };
  }
}

export function storeSave(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Private mode or blocked storage: the run still plays, it just will not persist.
  }
}
