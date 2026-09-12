// Colour-grades every PNG under art/packs/ into public/tiles/, so five packs share one palette.
// Raw packs are licensed and gitignored; only this output is ever loaded by the game.
import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";

const SRC = "art/packs";
const OUT = "public/tiles";
const GRADE = { brightness: 0.6, saturation: 0.42, hue: -12, contrast: 1.22, lift: -18 };

async function* pngs(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pngs(path);
    else if (entry.name.toLowerCase().endsWith(".png")) yield path;
  }
}

const exists = await stat(SRC).then(
  () => true,
  () => false,
);
let count = 0;
if (exists) {
  for await (const src of pngs(SRC)) {
    const dst = join(OUT, relative(SRC, src));
    await mkdir(dirname(dst), { recursive: true });
    await sharp(src)
      .modulate({ brightness: GRADE.brightness, saturation: GRADE.saturation, hue: GRADE.hue })
      .linear(GRADE.contrast, GRADE.lift)
      .png()
      .toFile(dst);
    count++;
  }
}
console.log(count ? `graded ${count} files into ${OUT}` : `nothing in ${SRC} yet`);
