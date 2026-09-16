// Writes hand-made levels in the exact shape of LDtk's Super Simple Export, tiled from
// TheLazyStone's Post-Apocalypse pack (art/packs/lazystone, gitignored).
//   '#' wall  '.' floor  'P' player start  'Z' idle zombie  'O' objective  'E' exit
import { access, mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const TILE = 16;
const PACK = "art/packs/lazystone/Tiles";
const GROUND = `${PACK}/Background_Dark-Green_TileSet.png`;
const BRICK = `${PACK}/Brick-Wall_TileSet.png`;

// Tile picks as [column, row] on the sheets. Repeats weight the random choice.
const GRASS = [
  [0, 2],
  [5, 0],
  [2, 0],
  [0, 2],
  [5, 0],
  [2, 0],
  [0, 0],
];
const FLOWERS = [3, 0];
const WALL_FACE = [
  [3, 1],
  [3, 1],
  [3, 1],
  [5, 1],
];
const WALL_CAP = [
  [5, 0],
  [5, 0],
  [5, 0],
  [1, 0],
  [2, 0],
  [3, 0],
];
const WALL_CAP_MOSS = [4, 0];

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

/** Stable pseudo-random 0..1 per tile, so a regenerated level looks the same. */
function noise(tx, ty, salt) {
  let h = (tx * 374761393 + ty * 668265263 + salt * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h >>> 8) / 16777216;
}

const pick = (list, tx, ty, salt) => list[Math.floor(noise(tx, ty, salt) * list.length)];

const tiles = new Map();
async function tile(sheet, [tx, ty]) {
  const key = `${sheet}:${tx},${ty}`;
  if (!tiles.has(key)) {
    tiles.set(
      key,
      await sharp(sheet)
        .extract({ left: tx * TILE, top: ty * TILE, width: TILE, height: TILE })
        .ensureAlpha()
        .raw()
        .toBuffer(),
    );
  }
  return tiles.get(key);
}

function blit(layer, layerWidth, tx, ty, src) {
  for (let y = 0; y < TILE; y++) {
    const from = y * TILE * 4;
    src.copy(layer, ((ty * TILE + y) * layerWidth + tx * TILE) * 4, from, from + TILE * 4);
  }
}

async function writeLevel(name, map) {
  const rows = map.length;
  const cols = map[0].length;
  const W = cols * TILE;
  const H = rows * TILE;
  const out = `public/levels/${name}/simplified/Level_0`;

  const floor = Buffer.alloc(W * H * 4);
  const walls = Buffer.alloc(W * H * 4);
  const entities = {};
  const wallAt = (tx, ty) => map[ty]?.[tx] === "#";

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
      const grass = noise(tx, ty, 7) < 0.04 ? FLOWERS : pick(GRASS, tx, ty, 1);
      blit(floor, W, tx, ty, await tile(GROUND, grass));
      if (ch === "#") {
        // A wall with open ground above shows its capped top; one under another wall is plain face.
        const capped = !wallAt(tx, ty - 1);
        const brick = capped
          ? noise(tx, ty, 5) < 0.08
            ? WALL_CAP_MOSS
            : pick(WALL_CAP, tx, ty, 3)
          : pick(WALL_FACE, tx, ty, 2);
        blit(walls, W, tx, ty, await tile(BRICK, brick));
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

await access(PACK).catch(() => {
  throw new Error(
    `tile pack not found at ${PACK}: unzip TheLazyStone's pack into art/packs/lazystone`,
  );
});
await writeLevel("test", TEST);
await writeLevel("test2", TEST2);
