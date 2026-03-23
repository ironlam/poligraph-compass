/**
 * Post-export script that converts Expo's dist/ output
 * into Vercel Build Output API v3 format (.vercel/output/).
 */

import { cpSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const OUTPUT = join(ROOT, ".vercel", "output");

if (!existsSync(join(DIST, "client")) || !existsSync(join(DIST, "server"))) {
  console.error("Error: dist/client or dist/server not found. Run 'npx expo export --platform web' first.");
  process.exit(1);
}

// Clean previous output
if (existsSync(OUTPUT)) {
  rmSync(OUTPUT, { recursive: true });
}

// 1. Copy static assets
const staticDir = join(OUTPUT, "static");
mkdirSync(staticDir, { recursive: true });
cpSync(join(DIST, "client"), staticDir, { recursive: true });
console.log("Copied dist/client/ -> .vercel/output/static/");

// 2. Create the catch-all SSR function
const funcDir = join(OUTPUT, "functions", "[[...path]].func");
mkdirSync(funcDir, { recursive: true });

// Copy server code into the function
cpSync(join(DIST, "server"), join(funcDir, "server"), { recursive: true });

// Copy data files so server-side fs.readFileSync can find them
const dataDir = join(ROOT, "data");
if (existsSync(dataDir)) {
  cpSync(dataDir, join(funcDir, "data"), { recursive: true });
  console.log("Copied data/ -> function bundle");
}

// Copy @expo/server and its runtime dependencies into the function
const depsToBundle = [
  ["@expo", "server"],
  ["abort-controller"],
  ["debug"],
  ["ms"],
  ["event-target-shim"],
];
for (const parts of depsToBundle) {
  const src = join(ROOT, "node_modules", ...parts);
  const dest = join(funcDir, "node_modules", ...parts);
  if (existsSync(src)) {
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log(`  Bundled ${parts.join("/")}`);
  }
}

// Function handler (CJS: @expo/server uses extensionless imports that only resolve with require())
writeFileSync(
  join(funcDir, "index.js"),
  `const path = require("node:path");

// Ensure process.cwd() returns the function directory so bundled
// server code can resolve data/ files with fs.readFileSync
process.chdir(__dirname);

const { createRequestHandler } = require("@expo/server/adapter/vercel");

const handler = createRequestHandler({ build: path.join(__dirname, "server") });

module.exports = handler;
`
);

// Function config
writeFileSync(
  join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
      supportsResponseStreaming: true,
    },
    null,
    2
  )
);

console.log("Created .vercel/output/functions/[[...path]].func/");

// 3. Create routing config
writeFileSync(
  join(OUTPUT, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Static assets first (with cache)
        {
          src: "/_expo/static/(.+)",
          headers: { "Cache-Control": "public, max-age=31536000, immutable" },
          continue: true,
        },
        // Try static files first, fall through to SSR function
        { handle: "filesystem" },
        // Everything else goes to the SSR/API function
        { src: "/(.*)", dest: "/[[...path]]" },
      ],
    },
    null,
    2
  )
);

console.log("Created .vercel/output/config.json");
console.log("Build output ready for Vercel.");
