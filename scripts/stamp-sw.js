// scripts/stamp-sw.js
// Replaces __BUILD_ID__ in the exported sw.js with a unique hash per build.
// Runs automatically after `next build` via the "build" npm script.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// On Vercel the website builds as a server (see next.config.ts): there is no
// out/ and public/ is served as it is, so `--before` stamps public/sw.js ahead
// of `next build` — only there, in Vercel's throwaway checkout, never in a
// working copy.
const before = process.argv.includes("--before");
const serverBuild =
  process.env.NEXT_OUTPUT === "server" || (process.env.NEXT_OUTPUT !== "export" && !!process.env.VERCEL);
if (before && !(serverBuild && process.env.VERCEL)) process.exit(0);

const outDir = path.join(__dirname, "..", before ? "public" : "out");
const swPath = path.join(outDir, "sw.js");

if (!fs.existsSync(swPath)) {
  console.log(`[stamp-sw] No ${path.relative(path.join(__dirname, ".."), swPath)} found, skipping.`);
  process.exit(0);
}

const buildId = crypto.randomBytes(8).toString("hex");
let content = fs.readFileSync(swPath, "utf-8");
content = content.replace(/__BUILD_ID__/g, buildId);
fs.writeFileSync(swPath, content, "utf-8");

console.log(`[stamp-sw] Stamped sw.js with build ID: ${buildId}`);
