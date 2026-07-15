#!/usr/bin/env node
// export-timeline.mjs — turn an insert plan + durations into an editor-neutral
// timeline you can assemble in ANY tool: CapCut, Premiere, DaVinci Resolve, or a
// code-based renderer. Emits a universal JSON + a CSV/EDL-style sheet, and (only
// if asked) a code snippet for a programmatic renderer.
//
// Usage:
//   node export-timeline.mjs --slug car-or-house-first --episode ep1 \
//     --brief src/<slug>/veo/ep1-insert-brief.json \
//     --durations src/<slug>/voiceover-durations.json
//
// Options:
//   --slug <s>            project slug (for the asset path prefix)
//   --episode <id>        ep id, e.g. ep1 (required)
//   --brief <path>        scene brief / insert plan JSON (required)
//   --durations <path>    voiceover-durations.json (for total length)
//   --fps <n>             default 30
//   --source <kind>       default per-insert source: generative|cc|shot|graphic (default generative)
//   --public-prefix <p>   asset path prefix (default <slug>/<episode>/)
//   --format <f>          json | csv | code | all   (default all)
//   --out-dir <dir>       where to write (default src/<slug>/edit/)
//
// Outputs in --out-dir:
//   <episode>-timeline.json   universal timeline (start/end sec + frames + SMPTE TC)
//   <episode>-timeline.csv    one row per clip — drop into any NLE by timecode
//   (code snippet printed to stdout when --format includes code/all)

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, fb = "") => { const i = args.indexOf(n); if (i === -1) return fb; if (i === args.length - 1) throw new Error(`${n} requires a value`); return args[i + 1]; };
const has = (n) => args.includes(n);
if (has("-h") || has("--help") || args.length === 0) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 26).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

const slug = flag("--slug");
const episode = flag("--episode");
const briefPath = flag("--brief");
const durationsPath = flag("--durations");
const fps = Number(flag("--fps", "30"));
const source = flag("--source", "generative");
const publicPrefix = flag("--public-prefix", slug && episode ? `${slug}/${episode}/` : "");
const format = flag("--format", "all");
const outDir = flag("--out-dir", slug ? `src/${slug}/edit` : "edit");

if (!episode || !briefPath) { console.error("Error: --episode and --brief are required. Run with --help."); process.exit(1); }

const brief = JSON.parse(fs.readFileSync(path.resolve(briefPath), "utf8"));
if (!Array.isArray(brief) || brief.length === 0) { console.error("Error: brief must be a non-empty JSON array"); process.exit(1); }

let targetSec = null, durationInFrames = null;
if (durationsPath && fs.existsSync(durationsPath)) {
  const man = JSON.parse(fs.readFileSync(path.resolve(durationsPath), "utf8"));
  const rec = Array.isArray(man) ? man.find((m) => (m.id || "").toLowerCase() === episode) : (man[episode] || man[episode.toLowerCase()]);
  if (rec) { targetSec = rec.targetSec ?? rec.target_edit_sec ?? null; durationInFrames = rec.sceneFrames ?? (targetSec != null ? Math.ceil(targetSec * fps) : null); }
}
const lastEnd = brief[brief.length - 1].end_sec;
if (durationInFrames === null) durationInFrames = Math.ceil(lastEnd * fps);

const fileOf = (s) => { const n = s.file || s.output_filename || ""; return !n ? "" : (n.includes("/") ? n : `${publicPrefix}${n}`); };
const tc = (sec) => {
  const f = Math.round(sec * fps);
  const ff = f % fps, s = Math.floor(f / fps) % 60, m = Math.floor(f / (fps * 60)) % 60, h = Math.floor(f / (fps * 3600));
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}:${p(ff)}`;
};

const clips = brief.map((s, i) => ({
  index: i + 1,
  startSec: s.start_sec, endSec: s.end_sec, durationSec: Math.round((s.end_sec - s.start_sec) * 100) / 100,
  startFrame: Math.round(s.start_sec * fps), endFrame: Math.round(s.end_sec * fps),
  startTC: tc(s.start_sec), endTC: tc(s.end_sec),
  source: s.source || source, file: fileOf(s), note: s.note || s.edit_note || "",
}));

fs.mkdirSync(path.resolve(outDir), { recursive: true });
const want = (f) => format === "all" || format === f;
const written = [];

if (want("json")) {
  const timeline = { episode, fps, durationInFrames, durationSec: durationInFrames / fps, clipCount: clips.length, clips };
  const p = path.join(outDir, `${episode}-timeline.json`);
  fs.writeFileSync(p, `${JSON.stringify(timeline, null, 2)}\n`, "utf8"); written.push(p);
}
if (want("csv")) {
  const esc = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  const head = ["index", "start_tc", "end_tc", "start_sec", "end_sec", "duration_sec", "source", "file", "note"];
  const rows = clips.map((c) => [c.index, c.startTC, c.endTC, c.startSec, c.endSec, c.durationSec, c.source, c.file, c.note].map(esc).join(","));
  const p = path.join(outDir, `${episode}-timeline.csv`);
  fs.writeFileSync(p, `${head.join(",")}\n${rows.join("\n")}\n`, "utf8"); written.push(p);
}

// sanity
let issues = 0;
if (Math.abs(clips[0].startSec) > 0.05) { console.warn(`warn: first clip starts at ${clips[0].startSec}s, expected 0`); issues++; }
for (let i = 1; i < clips.length; i++) if (Math.abs(clips[i].startSec - clips[i - 1].endSec) > 0.05) { console.warn(`warn: gap/overlap before clip ${i + 1}`); issues++; }
if (targetSec !== null && Math.abs(lastEnd - targetSec) > 0.6) { console.warn(`warn: final end ${lastEnd}s vs target ${targetSec}s`); issues++; }

console.log(`${episode}: ${clips.length} clips, ${clips.at(-1).endSec}s (${durationInFrames}f @ ${fps}fps)${issues ? `, ${issues} warning(s)` : ", contiguous"}`);
for (const p of written) console.log(`  wrote ${p}`);

console.log(`\nAssemble in your editor:
  • Put the voiceover mp3 on one audio track (it is the master clock).
  • Place each clip at its start_tc; trim to duration; MUTE every clip.
  • Keep the aspect/resolution from project.config.json · ${fps}fps; export the final mp4,
    then run package-delivery.mjs (pass it the same --aspect/--width/--height/--fps).
The CSV opens in any NLE workflow (CapCut / Premiere / DaVinci); the JSON drives a code renderer.`);

if (want("code")) {
  const snippet = clips.map((c) => `  { file: ${JSON.stringify(c.file)}, startSec: ${c.startSec}, endSec: ${c.endSec}, source: ${JSON.stringify(c.source)} },`).join("\n");
  console.log(`\nFor a code-based renderer (e.g. a React/Remotion-style timeline), durationInFrames = ${durationInFrames}:\n[\n${snippet}\n]`);
}
