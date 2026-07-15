#!/usr/bin/env node
// package-delivery only looked in src/<slug>/veo for *-veo-insert-brief.json — where the
// GENERATIVE path writes. A graphics-only episode writes ep*-insert-plan.json under edit/, so a
// real 3-topic run reported insertCount: 0 for 17 planned graphic beats. The manifest is the
// definition of "done"; under-reporting real work is as bad as over-reporting it.
//
//   node test-package-delivery.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
let failed = 0;
const ok = (name, pass, detail = "") => {
  console.log(`  ${pass ? "✅" : "❌"} ${name}${detail && !pass ? ` — ${detail}` : ""}`);
  if (!pass) failed++;
};

// Build a project whose insert plan lives at `where`, then read back what the manifest saw.
const run = (where, filename, plan, durSec) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hyv-pkg-"));
  fs.mkdirSync(path.join(tmp, "src/demo", where), { recursive: true });
  fs.mkdirSync(path.join(tmp, "public/demo/voiceover"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "src/demo", where, filename), JSON.stringify(plan));
  fs.writeFileSync(path.join(tmp, "src/demo/voiceover-durations.json"),
    JSON.stringify({ ep1: { voiceSec: durSec - 0.1, targetSec: durSec } }));
  fs.writeFileSync(path.join(tmp, "src/demo/script-v1.md"), "# s\n");
  fs.writeFileSync(path.join(tmp, "src/demo/voiceover-v1.md"), "# v\n");
  execFileSync("ffmpeg", ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(durSec - 0.1),
    "-q:a", "9", path.join(tmp, "public/demo/voiceover/ep1.mp3"), "-y"], { stdio: "ignore" });
  // Exits non-zero when the bundle is incomplete — by design, and every fixture here is
  // (no render). The manifest is still written; that's what we're asserting on.
  try {
    execFileSync("node", [path.join(HERE, "package-delivery.mjs"), "--slug", "demo"],
      { cwd: tmp, stdio: "ignore" });
  } catch { /* incomplete is the expected state for these fixtures */ }
  const m = JSON.parse(fs.readFileSync(path.join(tmp, "delivery/demo/manifest.json"), "utf8"));
  fs.rmSync(tmp, { recursive: true, force: true });
  return m;
};

const graphics = Array.from({ length: 5 }, (_, i) => ({
  beat_id: `ep1-g${i}`, start_sec: i * 2, end_sec: (i + 1) * 2,
  source: "graphic", file: `graphics/ep1-g${i}.png`,
}));
let m = run("edit", "ep1-insert-plan.json", graphics, 10);
ok("finds a graphics-only plan under edit/", m.episodes[0].insertCount === 5,
  `insertCount ${m.episodes[0].insertCount}, still looking only in veo/`);
ok("counts graphics as graphics", m.episodes[0].sources.graphic === 5 && m.episodes[0].sources.generative === 0);
ok("copies the plan into the bundle", !!m.episodes[0].brief);

// The generative path must keep working, in its own directory, under its own name.
const veo = Array.from({ length: 3 }, (_, i) => ({
  beat_id: `B${i}`, start_sec: i * 2, end_sec: (i + 1) * 2,
  generation_mode: "generate_veo", output_filename: `b${i}.mp4`, insert_duration_sec: 2,
}));
m = run("veo", "ep1-veo-insert-brief.json", veo, 6);
ok("still finds a veo brief under veo/", m.episodes[0].insertCount === 3);
ok("counts veo as generative", m.episodes[0].sources.generative === 3);

// No render, so honesty check: this must never claim ready.
ok("still reports incomplete without a render", m.status === "incomplete");

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
