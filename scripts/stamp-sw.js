// scripts/stamp-sw.js
// Replaces __BUILD_ID__ in the exported sw.js with a unique hash per build.
// Runs automatically after `next build` via the "build" npm script.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const outDir = path.join(__dirname, "..", "out");
const swPath = path.join(outDir, "sw.js");

if (!fs.existsSync(swPath)) {
  console.log("[stamp-sw] No out/sw.js found, skipping.");
  process.exit(0);
}

const buildId = crypto.randomBytes(8).toString("hex");
let content = fs.readFileSync(swPath, "utf-8");
content = content.replace(/__BUILD_ID__/g, buildId);
fs.writeFileSync(swPath, content, "utf-8");

console.log(`[stamp-sw] Stamped sw.js with build ID: ${buildId}`);
