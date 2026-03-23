/**
 * Post-export script that converts Expo's dist/ output
 * into Vercel Build Output API v3 format (.vercel/output/).
 */

import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
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
  cpSync(OUTPUT, OUTPUT, { recursive: true }); // noop, just ensure exists
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

// Copy node_modules/@expo/server into the function (needed at runtime)
const expoServerSrc = join(ROOT, "node_modules", "@expo", "server");
const expoServerDest = join(funcDir, "node_modules", "@expo", "server");
mkdirSync(expoServerDest, { recursive: true });
cpSync(expoServerSrc, expoServerDest, { recursive: true });

// Function handler
writeFileSync(
  join(funcDir, "index.mjs"),
  `import { createRequestHandler } from "./node_modules/@expo/server/build/mjs/vendor/vercel.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const handler = createRequestHandler({ build: path.join(__dirname, "server") });

export default handler;
`
);

// Function config
writeFileSync(
  join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
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
