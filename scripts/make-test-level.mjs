// Writes hand-made levels in the shape of LDtk's Super Simple Export, minus the art:
// one folder per level holding data.json (entities) and Collision.csv (the wall mask).
//   '#' wall  '.' floor  'P' player start  'Z' idle zombie  'O' objective  'E' exit
import { mkdir, writeFile } from "node:fs/promises";

const TILE = 16;

const ENTITY = {
  P: "PlayerStart",
  Z: "Zombie",
  O: "Objective",
  E: "Exit",
};

const TEST = [
  "########################################",
  "#......................#...............#",
  "#......................#....Z.....Z....#",
  "#......P...............#...............#",
  "#......................................#",
  "#......................#...............#",
  "#......................#...............#",
  "#E.....................#...............#",
  "#########......#########...............#",
  "#......................................#",
  "#..........Z...........................#",
  "#......................................#",
  "#......................#####...#########",
  "#......................#...............#",
  "#......................#...............#",
  "#..........############..#.............#",
  "#..........#...........#.#.............#",
  "#..........#..Z.....Z..#.#.............#",
  "#..........#...........#.#....Z...Z....#",
  "#..........#...........#.#.............#",
  "#..........#.....O.....#...............#",
  "#..........#...........#...............#",
  "#......................................#",
  "########################################",
];
const TEST2 = [
  "##############################",
  "#P...........#...............#",
  "#............#...............#",
  "#............#.....Z.........#",
  "#............#...............#",
  "#......###########...#########",
  "#......#.....................#",
  "#......#..Z..........Z.......#",
  "#......#.....................#",
  "#......#.....#####...........#",
  "#......#.....#...#...........#",
  "#......#.....#.O.#...Z.......#",
  "#......#.....#...#...........#",
  "#......#.....#.###...........#",
  "#......#.....................#",
  "#..Z...#..........Z..........#",
  "#......###########.###########",
  "#............................#",
  "#..Z.........................#",
  "#..........................E.#",
  "##############################",
];

async function writeLevel(name, map) {
  const rows = map.length;
  const cols = map[0].length;
  const out = `public/levels/${name}/simplified/Level_0`;
  const entities = {};

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const ch = map[ty][tx];
      if (!ENTITY[ch]) continue;
      entities[ENTITY[ch]] ??= [];
      const list = entities[ENTITY[ch]];
      list.push({
        id: ENTITY[ch],
        iid: `${name}-${ENTITY[ch]}-${list.length}`,
        layer: "Entities",
        x: tx * TILE,
        y: ty * TILE,
        width: TILE,
        height: TILE,
        color: 13121325,
        customFields: ch === "Z" ? { type: "walker" } : {},
      });
    }
  }

  await mkdir(out, { recursive: true });
  const csv = map.map((row) => `${[...row].map((c) => (c === "#" ? 1 : 0)).join(",")},`).join("\n");
  await writeFile(`${out}/Collision.csv`, `${csv}\n`);

  const data = {
    identifier: "Level_0",
    uniqueIdentifer: `${name}-level-0`,
    x: 0,
    y: 0,
    width: cols * TILE,
    height: rows * TILE,
    bgColor: "#0b0e11",
    neighbourLevels: [],
    customFields: {},
    entities,
  };
  await writeFile(`${out}/data.json`, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${out} (${cols}x${rows} tiles)`);
}

await writeLevel("test", TEST);
await writeLevel("test2", TEST2);
