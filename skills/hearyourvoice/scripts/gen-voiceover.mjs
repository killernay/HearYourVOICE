#!/usr/bin/env node
// gen-voiceover.mjs — generic ElevenLabs voiceover generator for any HearYourVOICE project.
// Generalizes the per-project gen-<slug>-voiceover.sh scripts: one parameterized
// tool, no hardcoded voice id / paths / segment ids.
//
// Reads the TTS-ready narration (src/<slug>/voiceover-v1.md), generates one MP3
// per "## EP<n> - ... / VO:" segment into public/<slug>/voiceover/, then measures
// each with ffprobe and prints a duration table.
//
// Usage:
//   node gen-voiceover.mjs --slug chado-series --voice-id gey3zFG8aVFMUYHil4BK
//   node gen-voiceover.mjs --md src/x/voiceover-v1.md --out public/x/voiceover --voice-id <id>
//   node gen-voiceover.mjs --slug x --voice-id <id> --only ep1,ep4   # subset
//   node gen-voiceover.mjs --slug x --voice-id <id> --force          # overwrite
//   node gen-voiceover.mjs --slug x --list                           # print segments, no API
//
// Options:
//   --slug <s>          project slug (derives --md and --out if not given)
//   --md <path>         voiceover-v1.md (default src/<slug>/voiceover-v1.md)
//   --out <path>        output dir (default public/<slug>/voiceover)
//   --voice-id <id>     ElevenLabs voice id (or env VOICE_ID) — required to generate
//   --model <id>        default eleven_v3 (or env MODEL)
//   --format <fmt>      default mp3_44100_128 (or env FORMAT)
//   --stability <n>     default 0.45     --similarity <n>  default 0.8
//   --only <ids>        comma list of episode ids to (re)generate
//   --force             regenerate even if the mp3 exists
//   --fps <n>           default 30     --tail-frames <n>  default 24
//   --env <path>        .env to load ELEVENLABS_API_KEY from (default ./.env)
//   --list              print parsed segments and exit (no API calls)
//   --emit-md [path]    write a copy/paste TTS sheet and exit — voice settings, each segment,
//                       the filename to save it as, and how to bring the audio back. No key,
//                       no API call, nothing billed. The sheet is FOR THE HUMAN to voice in
//                       whatever tool they choose. An agent must not answer it with a system
//                       voice (`say`, a local model): a placeholder sounds broken and its
//                       timing is off by ~20% anyway, so every insert placed against it is
//                       waste. No key → hand back the sheet and stop.
//   --yes               REQUIRED to actually spend. Without it this prints the character
//                       count it would bill and exits 2 without calling the API.
//
// ENV — you do not need to read this file's source to know how it resolves:
//   .env is loaded FIRST (--env <path>, default ./.env), then every default below falls back to
//   it. So ELEVENLABS_API_KEY, VOICE_ID, MODEL and FORMAT all resolve from .env on their own —
//   pass NOTHING for them unless you are overriding on purpose. Precedence, highest first:
//     explicit flag  >  exported shell env  >  .env  >  built-in default
//   A blank line in .env (VOICE_ID=) counts as unset and does not shadow the default.
//   ELEVENLABS_API_KEY is required to generate. Needs Node 18+ (global fetch) and ffprobe.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (n, fb = "") => {
  const i = args.indexOf(n);
  if (i === -1) return fb;
  if (i === args.length - 1) throw new Error(`${n} requires a value`);
  return args[i + 1];
};
const has = (n) => args.includes(n);

if (has("-h") || has("--help") || args.length === 0) {
  const _src = fs.readFileSync(new URL(import.meta.url), "utf8").split("\n");
  const _end = _src.findIndex((l, i) => i > 0 && !l.startsWith("//") && l.trim() !== "");
  console.log(_src.slice(1, _end).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

// Load .env BEFORE anything reads process.env below — every default here falls back to an env
// var, so loading it later means .env silently never applies. Doesn't clobber an exported one.
const envPath = flag("--env", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const [k, ...rest] = t.split("=");
    const v = rest.join("=").trim();
    // A blank placeholder in .env means "not set" — env.example ships them, so exporting "" here
    // would shadow the real defaults below and leak an empty var into every child process.
    if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
  }
}

const slug = flag("--slug");
const mdPath = flag("--md", slug ? `src/${slug}/voiceover-v1.md` : "");
const outDir = flag("--out", slug ? `public/${slug}/voiceover` : "");
const voiceId = flag("--voice-id", process.env.VOICE_ID || "");
const model = flag("--model", process.env.MODEL || "eleven_v3");
const format = flag("--format", process.env.FORMAT || "mp3_44100_128");
const stability = Number(flag("--stability", "0.45"));
const similarity = Number(flag("--similarity", "0.8"));
const only = flag("--only", "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const force = has("--force");
const fps = Number(flag("--fps", "30"));
const tail = Number(flag("--tail-frames", "24"));
const listOnly = has("--list");
const emitMd = has("--emit-md")
  ? (() => { const i = args.indexOf("--emit-md"); const v = args[i + 1];
             return !v || v.startsWith("--") ? "__AUTO__" : v; })()
  : null;

if (!mdPath || !outDir) {
  console.error("Error: provide --slug, or both --md and --out. Run with --help.");
  process.exit(1);
}
if (!fs.existsSync(mdPath)) {
  console.error(`Error: voiceover md not found: ${mdPath}`);
  process.exit(1);
}

// Parse "## EP<n> - <title>\n\nVO:\n\n<body until next ## EP>".
const md = fs.readFileSync(mdPath, "utf8");
const re = /^## (EP\d+)\s*-\s*(.*?)\n[\s\S]*?^VO:\n\n([\s\S]*?)(?=^## EP\d+\b|$(?![\s\S]))/gm;
const segments = [];
for (const m of md.matchAll(re)) {
  segments.push({ id: m[1].toLowerCase(), title: m[2].trim(), text: m[3].trim() });
}
if (segments.length === 0) {
  console.error("Error: no '## EP<n> - … / VO:' segments found. See references/script-and-voiceover-spec.md.");
  process.exit(1);
}

if (listOnly) {
  for (const s of segments) console.log(`\n## ${s.id.toUpperCase()} - ${s.title}\n${s.text}`);
  console.log(`\n(${segments.length} segments)`);
  process.exit(0);
}

// Prompt-only path: hand the narration to ANY TTS (ElevenLabs' own UI, another vendor, a local
// model) and drop the mp3s back in. Costs nothing, needs no key. The naming section is the point
// — measure-voiceover.mjs only finds the files if they come back as <id>.mp3.
if (emitMd !== null) {
  const outFile = emitMd === "__AUTO__"
    ? path.join(path.dirname(mdPath), `${path.basename(mdPath, ".md")}-tts-prompts.md`)
    : emitMd;
  const lines = [
    `# Voiceover — copy/paste into any TTS`,
    ``,
    `Generated from \`${mdPath}\`. Nothing here has been billed.`,
    ``,
    `## Voice settings to match`,
    ``,
    `| Setting | Value |`,
    `|---|---|`,
    `| voice id | \`${voiceId || "(not set — pass --voice-id or set VOICE_ID)"}\` |`,
    `| model | \`${model}\` |`,
    `| format | \`${format}\` |`,
    `| stability | \`${stability}\` |`,
    `| similarity | \`${similarity}\` |`,
    ``,
    `Any voice works — these are just the settings this project was written for. Keep one voice`,
    `across every segment or the episodes won't match.`,
    ``,
    `## Segments (${segments.length})`,
    ``,
  ];
  for (const s of segments) {
    lines.push(`### ${s.id.toUpperCase()} — ${s.title}`, ``, `**Save as:** \`${s.id}.mp3\` · ${s.text.length} characters`, ``, "```text", s.text, "```", ``);
  }
  lines.push(
    `## Bringing the audio back`,
    ``,
    `1. Put every mp3 in \`${outDir || "public/<slug>/voiceover"}/\`, named exactly \`ep1.mp3\`, \`ep2.mp3\`, … as above.`,
    `2. Measure them — this is what makes the timing real:`,
    `   \`\`\`bash`,
    `   node measure-voiceover.mjs --dir ${outDir || "public/<slug>/voiceover"} --fps ${fps} --tail-frames ${tail}`,
    `   \`\`\``,
    `3. That writes \`voiceover-durations.json\`, and the rest of the pipeline runs off those`,
    `   **measured** durations. Never hand-write that file — a guessed number silently breaks`,
    `   every timecode downstream.`,
    ``,
  );
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, lines.join("\n"));
  console.log(`Wrote ${outFile} — ${segments.length} segment(s), no API calls, nothing billed.`);
  process.exit(0);
}

const wanted = (id) => only.length === 0 || only.includes(id);
const apiKey = process.env.ELEVENLABS_API_KEY;
const willGenerate = segments.some((s) => wanted(s.id) && (force || !fs.existsSync(path.join(outDir, `${s.id}.mp3`))));
if (willGenerate && !apiKey) {
  console.error("Error: ELEVENLABS_API_KEY not set (export it or put it in .env).");
  process.exit(1);
}

// Spending gate. ElevenLabs bills per character and the spend is irreversible, so this is a
// mechanical stop, not a note in the docs telling an agent to remember to ask. Default is to
// refuse and show the bill; --yes is the human's signature.
if (willGenerate && !has("--yes")) {
  const todo = segments.filter((s) => wanted(s.id) && (force || !fs.existsSync(path.join(outDir, `${s.id}.mp3`))));
  const chars = todo.reduce((n, s) => n + s.text.length, 0);
  console.error(`\n⚠️  This SPENDS ElevenLabs credits — ${todo.length} segment(s), ${chars} characters billed:\n`);
  for (const s of todo) console.error(`      ${s.id.padEnd(6)} ${String(s.text.length).padStart(5)} chars   ${s.title}`);
  console.error(`\n    Nothing was generated. Show this to the user, get an explicit OK,`);
  console.error(`    then re-run the same command with --yes.\n`);
  process.exit(2);
}

fs.mkdirSync(outDir, { recursive: true });

const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], { encoding: "utf8" }).trim());
const round2 = (n) => Math.round(n * 100) / 100;

const genOne = async (seg) => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${format}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: seg.text, model_id: model, voice_settings: { stability, similarity_boost: similarity } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${seg.id}: ${(await res.text()).slice(0, 300)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(outDir, `${seg.id}.mp3`), buf);
};

const main = async () => {
  if (!voiceId && willGenerate) {
    console.error("Error: --voice-id (or env VOICE_ID) required to generate.");
    process.exit(1);
  }
  console.log(`voice=${voiceId || "(none)"} model=${model} -> ${outDir}\n`);
  console.log(`${"id".padEnd(6)} ${"sec".padStart(8)} ${"audioF".padStart(7)} ${"sceneF".padStart(7)}  tag`);
  const manifest = {};
  for (const seg of segments) {
    const out = path.join(outDir, `${seg.id}.mp3`);
    let tag = "kept";
    if (wanted(seg.id) && (force || !fs.existsSync(out))) {
      await genOne(seg);
      tag = "gen";
    } else if (!wanted(seg.id)) {
      tag = "skip";
    }
    if (!fs.existsSync(out)) { console.log(`${seg.id.padEnd(6)} ${"(missing)".padStart(8)}`); continue; }
    const sec = probe(out);
    const audioFrames = Math.ceil(sec * fps);
    const sceneFrames = audioFrames + tail;
    manifest[seg.id] = { file: `${seg.id}.mp3`, audioSec: round2(sec), audioFrames, sceneFrames, targetSec: round2(sceneFrames / fps) };
    console.log(`${seg.id.padEnd(6)} ${String(round2(sec)).padStart(8)} ${String(audioFrames).padStart(7)} ${String(sceneFrames).padStart(7)}  [${tag}]`);
  }
  console.log(`\nDone. ${Object.keys(manifest).length} files measured. Next: write durations with measure-voiceover.mjs (or reuse the table above).`);
};

main().catch((e) => { console.error(`Error: ${e.message}`); process.exit(1); });
