import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths: itch.io serves the build from a deep path inside an iframe.
  base: "./",
  // Phaser is one 1.2 MB chunk by design; the default 500 kB warning is noise here.
  build: { target: "es2022", assetsInlineLimit: 0, chunkSizeWarningLimit: 1500 },
  test: { include: ["test/**/*.test.ts"], environment: "node" },
});
