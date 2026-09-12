# Endless Outbreak

Top-down zombie mission shooter in the Endless War mould. Gump Jam 3, Sept 12–26, 2026.

## Run

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # vitest over src/sim
pnpm typecheck
pnpm lint         # biome
pnpm build        # dist/, zip it for itch
```

WASD or arrows to move, mouse to aim. Backtick outlines solid tiles.

## Layout

```
src/sim/      pure TypeScript, no Phaser: grid, flow field, movement, rng, fixed step, player
src/game/     binds sim to Phaser: LDtk loader, player view
src/scenes/   Boot, Hub, Mission, Results
public/levels LDtk project and its Super Simple Export output
scripts/      make-test-level.mjs (a level in LDtk export shape), grade.mjs (tile colour grade)
art/packs/    raw tile packs, gitignored, licensed
test/         vitest for src/sim
```

## Decisions

480 by 270 internal, integer zoom to fit the window. Fixed 60 Hz tick, seeded RNG. Own AABB movement against
the LDtk IntGrid. LDtk Super Simple Export: layer PNGs, `Collision.csv` where 1 is wall,
entities in `data.json`. Aseprite exports for sprites. Data in JSON. localStorage save.

`sim/` never imports Phaser. One file per system. No abstraction until the third copy.
