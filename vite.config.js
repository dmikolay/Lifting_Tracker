import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Writes dist/sw.js from src/sw.js with a cache version derived from the built
// files, so every release that changes anything gets a fresh cache automatically.
function serviceWorker() {
  let outDir;
  return {
    name: "service-worker",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const hash = createHash("sha256");
      for (const file of readdirSync(outDir).sort()) {
        if (file !== "sw.js") hash.update(file).update(readFileSync(join(outDir, file)));
      }
      const version = hash.digest("hex").slice(0, 10);
      const source = readFileSync(resolve("src/sw.js"), "utf8");
      writeFileSync(join(outDir, "sw.js"), source.replaceAll("__CACHE_VERSION__", version));
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile(), serviceWorker()],
  test: {
    environment: "node",
  },
});
