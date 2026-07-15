#!/usr/bin/env node
// Every default in these scripts falls back to an env var, so .env MUST be loaded before those
// defaults are evaluated. It wasn't — .env was read after, and only ELEVENLABS_API_KEY (read
// late, at call time) ever worked. VOICE_ID and all ten VEO_* vars silently never applied while
// env.example told people to put them there.
//
//   node test-env-loading.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hyv-env-"));
let failed = 0;
const ok = (name, pass, detail = "") => {
  console.log(`  ${pass ? "✅" : "❌"} ${name}${detail && !pass ? ` — ${detail}` : ""}`);
  if (!pass) failed++;
};

// --- gen-voiceover.mjs: VOICE_ID from .env must reach the emitted sheet -----------------
fs.mkdirSync(path.join(tmp, "src/demo"), { recursive: true });
fs.writeFileSync(path.join(tmp, "src/demo/voiceover-v1.md"), "## EP1 - t\n\nVO:\n\nสวัสดี\n");
fs.writeFileSync(path.join(tmp, ".env"), "VOICE_ID=from-dot-env\nMODEL=model-from-dot-env\n");

execFileSync("node", [path.join(HERE, "gen-voiceover.mjs"), "--slug", "demo",
  "--md", "src/demo/voiceover-v1.md", "--out", "public/demo/voiceover", "--emit-md"],
  { cwd: tmp, encoding: "utf8", env: { ...process.env, VOICE_ID: "", MODEL: "" } });

const sheet = fs.readFileSync(path.join(tmp, "src/demo/voiceover-v1-tts-prompts.md"), "utf8");
ok("gen-voiceover reads VOICE_ID from .env", sheet.includes("from-dot-env"), "still not loaded before defaults");
ok("gen-voiceover reads MODEL from .env", sheet.includes("model-from-dot-env"));

// An exported var must still win over .env.
execFileSync("node", [path.join(HERE, "gen-voiceover.mjs"), "--slug", "demo",
  "--md", "src/demo/voiceover-v1.md", "--out", "public/demo/voiceover",
  "--emit-md", path.join(tmp, "exported.md")],
  { cwd: tmp, encoding: "utf8", env: { ...process.env, VOICE_ID: "from-export" } });
ok("exported env still beats .env",
  fs.readFileSync(path.join(tmp, "exported.md"), "utf8").includes("from-export"));

// --- veo-generate.py: VEO_* from .env must reach argparse defaults ----------------------
fs.writeFileSync(path.join(tmp, "brief.json"),
  JSON.stringify([{ beat_id: "B01", output_filename: "b01.mp4", insert_duration_sec: 5 }]));
fs.writeFileSync(path.join(tmp, ".env"), "VEO_PRICE_PER_SEC_THB=99\n");

let out = "";
try {
  execFileSync("python3", [path.join(HERE, "veo-generate.py"), "--brief", "brief.json",
    "--out", "out", "--plugin", "x", "--agent-root", "."],
    { cwd: tmp, encoding: "utf8", env: { ...process.env, VEO_PRICE_PER_SEC_THB: "" } });
} catch (e) { out = (e.stdout || "") + (e.stderr || ""); }   // exits 2 at the spend gate

ok("veo-generate reads VEO_* from .env", out.includes("99"), "argparse defaults still evaluated before load_env");
ok("veo-generate still refuses to spend without --yes", out.includes("SPENDS generative credits"));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
