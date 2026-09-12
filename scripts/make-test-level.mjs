// Writes a hand-made level in the exact shape of LDtk's Super Simple Export,
// so the loader is proven before LDtk is even installed.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const TILE = 16;
const OUT = "public/levels/test/simplified/Level_0";

// '#' wall, '.' floor, 'P' player start (floor).
const MAP = [
  "########################################",
  "#......................#...............#",
  "#......................#...............#",
  "#......P...............#...............#",
  "#......................................#",
  "#......................#...............#",
  "#......................#...............#",
  "#......................#...............#",
  "#########......#########...............#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................#####...#########",
  "#......................#...............#",
  "#......................#...............#",
  "#..........############..#.............#",
  "#..........#...........#.#.............#",
  "#..........#...........#.#.............#",
  "#..........#...........#.#.............#",
  "#..........#...........#.#.............#",
  "#..........#...........#...............#",
  "#..........#...........#...............#",
  "#......................................#",
  "########################################",
];

const rows = MAP.length;
const cols = MAP[0].length;
const W = cols * TILE;
const H = rows * TILE;

const rgba = (hex, a = 255) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255, a];
const FLOOR = [rgba(0x2a2f36), rgba(0x272c33)];
const WALL = rgba(0x4a5563);
const WALL_EDGE = rgba(0x1c2129);

const floor = Buffer.alloc(W * H * 4);
const walls = Buffer.alloc(W * H * 4);
const put = (buf, x, y, px) => buf.set(px, (y * W + x) * 4);

let start = null;
for (let ty = 0; ty < rows; ty++) {
  for (let tx = 0; tx < cols; tx++) {
    const ch = MAP[ty][tx];
    if (ch === "P") start = { x: tx * TILE, y: ty * TILE };
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
await mkdir(OUT, { recursive: true });
await sharp(floor, raw).png().toFile(`${OUT}/Floor.png`);
await sharp(walls, raw).png().toFile(`${OUT}/Walls.png`);
await sharp(floor, raw)
  .composite([{ input: walls, raw: raw.raw }])
  .png()
  .toFile(`${OUT}/_composite.png`);

const csv = MAP.map((row) => `${[...row].map((c) => (c === "#" ? 1 : 0)).join(",")},`).join("\n");
await writeFile(`${OUT}/Collision.csv`, `${csv}\n`);

const data = {
  identifier: "Level_0",
  uniqueIdentifer: "test-level-0",
  x: 0,
  y: 0,
  width: W,
  height: H,
  bgColor: "#0b0e11",
  neighbourLevels: [],
  customFields: {},
  layers: ["Walls.png", "Floor.png"],
  entities: {
    PlayerStart: [
      {
        id: "PlayerStart",
        iid: "test-player-start",
        layer: "Entities",
        x: start.x,
        y: start.y,
        width: TILE,
        height: TILE,
        color: 14262081,
        customFields: {},
      },
    ],
  },
};
await writeFile(`${OUT}/data.json`, `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${OUT} (${cols}x${rows} tiles, ${W}x${H}px)`);
