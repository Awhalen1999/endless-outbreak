// Writes hand-made levels in the exact shape of LDtk's Super Simple Export,
// so the loader is proven before LDtk is even installed.
//   '#' wall  '.' floor  'P' player start  'Z' idle zombie  'O' objective  'E' exit
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

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

const rgba = (hex, a = 255) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255, a];
const FLOOR = [rgba(0x2a2f36), rgba(0x272c33)];
const WALL = rgba(0x4a5563);
const WALL_EDGE = rgba(0x1c2129);

async function writeLevel(name, map) {
  const rows = map.length;
  const cols = map[0].length;
  const W = cols * TILE;
  const H = rows * TILE;
  const out = `public/levels/${name}/simplified/Level_0`;

  const floor = Buffer.alloc(W * H * 4);
  const walls = Buffer.alloc(W * H * 4);
  const put = (buf, x, y, px) => buf.set(px, (y * W + x) * 4);
  const entities = {};

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const ch = map[ty][tx];
      if (ENTITY[ch]) {
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
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const px = tx * TILE + x;
          const py = ty * TILE + y;
          put(floor, px, py, FLOOR[(tx + ty) & 1]);
          if (ch === "#") put(walls, px, py, y >= TILE - 3 || y === 0 ? WALL_EDGE : WALL);
        }
      }
    }
  }

  const raw = { raw: { width: W, height: H, channels: 4 } };
  await mkdir(out, { recursive: true });
  await sharp(floor, raw).png().toFile(`${out}/Floor.png`);
  await sharp(walls, raw).png().toFile(`${out}/Walls.png`);
  await sharp(floor, raw)
    .composite([{ input: walls, raw: raw.raw }])
    .png()
    .toFile(`${out}/_composite.png`);

  const csv = map.map((row) => `${[...row].map((c) => (c === "#" ? 1 : 0)).join(",")},`).join("\n");
  await writeFile(`${out}/Collision.csv`, `${csv}\n`);

  const data = {
    identifier: "Level_0",
    uniqueIdentifer: `${name}-level-0`,
    x: 0,
    y: 0,
    width: W,
    height: H,
    bgColor: "#0b0e11",
    neighbourLevels: [],
    customFields: {},
    layers: ["Walls.png", "Floor.png"],
    entities,
  };
  await writeFile(`${out}/data.json`, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${out} (${cols}x${rows} tiles)`);
}

await writeLevel("test", TEST);
await writeLevel("test2", TEST2);
