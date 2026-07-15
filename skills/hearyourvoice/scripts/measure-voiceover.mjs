#!/usr/bin/env node
// measure-voiceover.mjs — ffprobe every MP3 in a voiceover folder and write a
// durations manifest. The measured audio is the master clock for all timing.
//
// Usage:
//   node measure-voiceover.mjs --dir public/<slug>/voiceover --out src/<slug>/voiceover-durations.json
//
// Options:
//   --dir <path>        folder of ep*.mp3 (required)
//   --out <path>        manifest JSON to write (required)
//   --fps 30            frames per second (default 30)
//   --tail-frames 24    extra frames of tail added to scene length (default 24)
//
// Output JSON shape (keyed by episode id):
//   { "ep1": { "file": "ep1.mp3", "audioSec": 86.96, "audioFrames": 2609,
//              "sceneFrames": 2633, "targetSec": 87.77 }, ... }

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const readFlag = (name, fallback = "") => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  if (i === args.length - 1) throw new Error(`${name} requires a value`);
  return args[i + 1];
};
const has = (n) => args.includes(n);

if (has("-h") || has("--help") || args.length === 0) {
  const _src = fs.readFileSync(new URL(import.meta.url), "utf8").split("\n");
  const _end = _src.findIndex((l, i) => i > 0 && !l.startsWith("//") && l.trim() !== "");
  console.log(_src.slice(1, _end).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

const dir = readFlag("--dir");
const out = readFlag("--out");
const fps = Number(readFlag("--fps", "30"));
const tail = Number(readFlag("--tail-frames", "24"));

if (!dir || !out) {
  console.error("Error: --dir and --out are required. Run with --help.");
  process.exit(1);
}

const probe = (file) => {
  const sec = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
    { encoding: "utf8" }
  ).trim();
  const n = Number(sec);
  if (!Number.isFinite(n)) throw new Error(`ffprobe gave no duration for ${file}`);
  return n;
};

const epNum = (name) => {
  const m = name.match(/ep(\d+)/i);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
};

const files = fs
  .readdirSync(dir)
  .filter((f) => /\.mp3$/i.test(f))
  .sort((a, b) => epNum(a) - epNum(b) || a.localeCompare(b));

if (files.length === 0) {
  console.error(`Error: no .mp3 files in ${dir}`);
  process.exit(1);
}

const manifest = {};
const round2 = (n) => Math.round(n * 100) / 100;

for (const f of files) {
  const id = (f.match(/ep\d+/i)?.[0] || path.basename(f, ".mp3")).toLowerCase();
  const audioSec = probe(path.join(dir, f));
  const audioFrames = Math.ceil(audioSec * fps);
  const sceneFrames = audioFrames + tail;
  manifest[id] = {
    file: f,
    audioSec: round2(audioSec),
    audioFrames,
    sceneFrames,
    targetSec: round2(sceneFrames / fps),
  };
}

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(path.resolve(out), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Measured ${files.length} files (fps=${fps}, tail=${tail}f) -> ${out}`);
for (const [id, m] of Object.entries(manifest)) {
  console.log(`  ${id.padEnd(6)} ${String(m.audioSec).padStart(8)}s  audio ${String(m.audioFrames).padStart(5)}f  scene ${String(m.sceneFrames).padStart(5)}f  target ${m.targetSec}s`);
}
