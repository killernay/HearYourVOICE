#!/usr/bin/env node
// package-delivery.mjs — gather the scattered working files into ONE standard
// deliverable folder (delivery/<slug>/) and write the canonical manifest.json.
// See references/output-format.md for the format and the definition of done.
//
// Usage:
//   node package-delivery.mjs --slug chado-series
//   node package-delivery.mjs --slug x --root . --dest delivery \
//     --durations src/x/voiceover-durations.json --briefs src/x/veo \
//     --renders out --voiceover public/x/voiceover
//
// Options (all have sensible defaults derived from --slug):
//   --slug <s>            (required)
//   --root <p>            repo root (default .)
//   --dest <p>            delivery base dir (default delivery) -> <dest>/<slug>/
//   --title <t>           project title for the manifest/README
//   --durations <p>       voiceover-durations.json
//   --briefs <dir>        dir of ep*-veo-insert-brief.json
//   --renders <dir>       dir of rendered mp4/png (default out)
//   --voiceover <dir>     dir of ep*.mp3
//   --script-dir <dir>    where voiceover-v1.md / script-v1.md / shotlist.xlsx live (default src/<slug>)
//   --attribution <p>     ATTRIBUTION.md (default public/<slug>/ATTRIBUTION.md)
//   --fps 30 --width 1080 --height 1920 --aspect 9:16
//   --tolerance 0.6       seconds slack for duration checks
//   --allow-incomplete    exit 0 even if status != ready (default exits 1)

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (n, fb = "") => { const i = args.indexOf(n); if (i === -1) return fb; if (i === args.length - 1) throw new Error(`${n} requires a value`); return args[i + 1]; };
const has = (n) => args.includes(n);
if (has("-h") || has("--help") || args.length === 0) {
  const _src = fs.readFileSync(new URL(import.meta.url), "utf8").split("\n");
  const _end = _src.findIndex((l, i) => i > 0 && !l.startsWith("//") && l.trim() !== "");
  console.log(_src.slice(1, _end).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

const slug = flag("--slug");
if (!slug) { console.error("Error: --slug is required. Run with --help."); process.exit(1); }
const root = path.resolve(flag("--root", "."));
const R = (p) => path.resolve(root, p);
const dest = flag("--dest", "delivery");
const title = flag("--title", slug);
const durationsPath = R(flag("--durations", `src/${slug}/voiceover-durations.json`));
// Where the insert plan lives. The rest of the pipeline is source-agnostic — check-insert-plan
// takes any --plan, export-timeline takes any --brief — but this script only ever looked in
// src/<slug>/veo for *-veo-insert-brief.json, which is where the GENERATIVE path writes. A
// graphics-only or CC-only episode writes ep*-insert-plan.json under edit/, so the manifest
// reported insertCount 0 for work that was done. Look everywhere the plan legitimately lands.
const briefDirs = has("--briefs")
  ? [R(flag("--briefs", ""))]
  : [R(`src/${slug}/edit`), R(`src/${slug}/veo`), R(`src/${slug}`)];
const rendersDir = R(flag("--renders", "out"));
const voiceoverDir = R(flag("--voiceover", `public/${slug}/voiceover`));
const scriptDir = R(flag("--script-dir", `src/${slug}`));
const attributionPath = R(flag("--attribution", `public/${slug}/ATTRIBUTION.md`));
const fps = Number(flag("--fps", "30"));
const width = Number(flag("--width", "1080"));
const height = Number(flag("--height", "1920"));
const aspect = flag("--aspect", "9:16");
const tol = Number(flag("--tolerance", "0.6"));
const allowIncomplete = has("--allow-incomplete");

const deliveryDir = R(`${dest}/${slug}`);
const round2 = (n) => Math.round(n * 100) / 100;
const pad2 = (n) => String(n).padStart(2, "0");
const epNum = (id) => Number((String(id).match(/\d+/) || [0])[0]);

const ensure = (d) => fs.mkdirSync(d, { recursive: true });
const copy = (from, toRel) => {
  if (!from || !fs.existsSync(from)) return null;
  const to = path.join(deliveryDir, toRel);
  ensure(path.dirname(to));
  fs.copyFileSync(from, to);
  return toRel;
};

const ffprobe = (file) => {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries",
      "format=duration:stream=index,codec_type,width,height,r_frame_rate", "-of", "json", file], { encoding: "utf8" });
    const j = JSON.parse(out);
    const v = (j.streams || []).find((s) => s.codec_type === "video") || {};
    const a = (j.streams || []).find((s) => s.codec_type === "audio");
    const rf = (v.r_frame_rate || "0/1").split("/");
    return {
      durationSec: round2(Number(j.format?.duration || 0)),
      width: v.width || null, height: v.height || null,
      fps: rf[1] && rf[1] !== "0" ? Math.round(Number(rf[0]) / Number(rf[1])) : null,
      audioSec: a ? round2(Number(j.format?.duration || 0)) : null,
      hasAudio: Boolean(a),
    };
  } catch { return null; }
};

// --- read durations into a normalized episode list -------------------------
if (!fs.existsSync(durationsPath)) { console.error(`Error: durations not found: ${durationsPath}`); process.exit(1); }
const durRaw = JSON.parse(fs.readFileSync(durationsPath, "utf8"));
const durList = (Array.isArray(durRaw)
  ? durRaw.map((d) => ({ id: (d.id || "").toLowerCase(), targetSec: d.target_edit_sec ?? d.targetSec, sceneFrames: d.sceneFrames ?? Math.ceil((d.target_edit_sec ?? d.targetSec) * fps), voiceSec: d.duration_sec ?? d.audioSec, file: d.file }))
  : Object.entries(durRaw).map(([id, d]) => ({ id: id.toLowerCase(), targetSec: d.targetSec ?? d.target_edit_sec, sceneFrames: d.sceneFrames ?? Math.ceil((d.targetSec ?? d.target_edit_sec) * fps), voiceSec: d.audioSec ?? d.duration_sec, file: d.file })))
  // skip non-episode keys (e.g. "_note") and anything not shaped like an episode
  .filter((d) => d.id && !d.id.startsWith("_") && /\d/.test(d.id));
durList.sort((a, b) => epNum(a.id) - epNum(b.id));

// --- list render files once -------------------------------------------------
const renderFiles = fs.existsSync(rendersDir) ? fs.readdirSync(rendersDir) : [];
const findRender = (num, exts, { series = false } = {}) => {
  const tags = series ? ["series"] : [`ep${pad2(num)}`, `ep${num}`];
  const cands = renderFiles.filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)) &&
    (series ? f.toLowerCase().includes("series") : tags.some((t) => f.toLowerCase().includes(t))) &&
    (series || !f.toLowerCase().includes("series")));
  // prefer names containing the slug, else the shortest (least suffixed) name
  cands.sort((a, b) => (Number(b.includes(slug)) - Number(a.includes(slug))) || a.length - b.length);
  return cands[0] ? path.join(rendersDir, cands[0]) : null;
};

// --- copy shared script artifacts ------------------------------------------
ensure(deliveryDir);
const sharedCopied = {
  voiceover_v1: copy(path.join(scriptDir, "voiceover-v1.md"), "script/voiceover-v1.md"),
  script_v1: copy(path.join(scriptDir, "script-v1.md"), "script/script-v1.md"),
  shotlist: copy(path.join(scriptDir, "shotlist.xlsx"), "script/shotlist.xlsx"),
  attribution: copy(attributionPath, "attribution/ATTRIBUTION.md"),
};

// --- per-episode -----------------------------------------------------------
const episodes = [];
for (const d of durList) {
  const id = d.id, num = epNum(id), issues = [];
  const ep = { id, title: "", voiceFile: null, voiceSec: d.voiceSec != null ? round2(d.voiceSec) : null,
    targetSec: d.targetSec, durationInFrames: d.sceneFrames, insertCount: 0,
    sources: { generative: 0, cc: 0, shot: 0, graphic: 0 }, brief: null, render: { exists: false }, checks: {}, status: "incomplete", issues };

  // voiceover
  const mp3 = path.join(voiceoverDir, `${id}.mp3`);
  if (fs.existsSync(mp3)) ep.voiceFile = copy(mp3, `voiceover/ep${pad2(num)}.mp3`);
  else issues.push("voiceover mp3 missing");

  // Insert plan — either name, from whichever dir has it. "-insert-plan" is what the
  // source-agnostic path writes; "-insert-brief" is the generative one. Same shape.
  let briefPath = null;
  for (const dir of briefDirs) {
    if (!fs.existsSync(dir)) continue;
    const f = fs.readdirSync(dir).find((n) =>
      epNum(n) === num && (n.endsWith("insert-plan.json") || n.endsWith("insert-brief.json")));
    if (f) { briefPath = path.join(dir, f); break; }
  }
  if (briefPath) {
    const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
    ep.insertCount = brief.length;
    for (const s of brief) {
      // Only a veo brief may omit source; everything else states it. Don't count a graphic
      // as generative — that misreports what was actually made, and what it cost.
      const src = s.source || (s.generation_mode === "generate_veo" ? "generative" : "generative");
      if (ep.sources[src] != null) ep.sources[src] += 1;
    }
    const contiguous = brief.every((s, i) => i === 0 ? Math.abs(s.start_sec) <= 0.05 : Math.abs(s.start_sec - brief[i - 1].end_sec) <= 0.05);
    const finalEnd = brief.at(-1)?.end_sec ?? 0;
    ep.checks.contiguous = contiguous;
    ep.checks.endMatchesTarget = Math.abs(finalEnd - d.targetSec) <= tol;
    if (!contiguous) issues.push("insert plan not contiguous");
    if (!ep.checks.endMatchesTarget) issues.push(`brief end ${finalEnd}s != target ${d.targetSec}s`);
    ep.brief = copy(briefPath, `briefs/ep${pad2(num)}-${path.basename(briefPath).replace(/^.*?(insert-(plan|brief)\.json)$/, "$1")}`);
  } else {
    issues.push("insert plan missing");
  }

  // render
  const render = findRender(num, [".mp4"]);
  if (render) {
    const m = ffprobe(render);
    const dst = copy(render, `video/${slug}-ep${pad2(num)}.mp4`);
    ep.render = { file: dst, exists: true, ...(m || {}) };
    if (m) {
      ep.checks.dimensionsMatch = m.width === width && m.height === height;
      ep.checks.fpsMatch = m.fps === fps;
      ep.checks.durationMatchesTarget = Math.abs(m.durationSec - d.targetSec) <= tol;
      ep.checks.audioMatchesVideo = m.hasAudio && Math.abs((m.audioSec ?? 0) - m.durationSec) <= tol;
      if (!ep.checks.dimensionsMatch) issues.push(`render ${m.width}x${m.height} != ${width}x${height}`);
      if (!ep.checks.fpsMatch) issues.push(`render fps ${m.fps} != ${fps}`);
      if (!ep.checks.durationMatchesTarget) issues.push(`render ${m.durationSec}s != target ${d.targetSec}s`);
      if (!ep.checks.audioMatchesVideo) issues.push("render audio length doesn't match video");
    } else issues.push("ffprobe failed on render");
  } else {
    issues.push("render mp4 missing");
  }

  // thumbnail (optional)
  const thumb = findRender(num, [".png", ".jpg"]);
  if (thumb) copy(thumb, `thumbnails/ep${pad2(num)}.png`);

  ep.status = issues.length === 0 ? "ready" : "incomplete";
  episodes.push(ep);
}

// series render (optional)
const seriesRender = findRender(0, [".mp4"], { series: true });
const series = seriesRender ? { file: copy(seriesRender, `video/${slug}-series.mp4`), exists: true, ...(ffprobe(seriesRender) || {}) } : { exists: false };

const ready = episodes.filter((e) => e.status === "ready").length;
const status = episodes.length > 0 && ready === episodes.length ? "ready" : "incomplete";

const manifest = {
  format: "hearyourvoice-deliverable", formatVersion: 1, slug, title,
  video: { aspect, width, height, fps },
  generatedAt: new Date().toISOString(),
  status, summary: { episodes: episodes.length, ready, incomplete: episodes.length - ready },
  artifacts: sharedCopied,
  episodes, series,
};
ensure(deliveryDir);
fs.writeFileSync(path.join(deliveryDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

// README.md
const rows = episodes.map((e) => `| ${e.id} | ${e.targetSec ?? "?"}s | ${e.insertCount} | ${e.render.exists ? "✅" : "—"} | ${e.status === "ready" ? "✅ ready" : "⚠️ " + e.issues.length + " issue(s)"} |`).join("\n");
const readme = `# ${title} — delivery

Format: \`hearyourvoice-deliverable\` v1 · ${aspect} · ${width}×${height} · ${fps}fps
Status: **${status}** (${ready}/${episodes.length} episodes ready)
Generated: ${manifest.generatedAt}

\`manifest.json\` is the canonical index. Final videos are in \`video/\`.

| episode | target | inserts | render | status |
|---|---|---|---|---|
${rows}

## Folders
- \`video/\` final renders · \`thumbnails/\` poster frames
- \`voiceover/\` narration mp3s · \`script/\` voiceover-v1.md + shotlist.xlsx
- \`briefs/\` per-episode insert plans · \`attribution/\` credits & licenses
`;
fs.writeFileSync(path.join(deliveryDir, "README.md"), readme, "utf8");

console.log(`Packaged -> ${path.relative(root, deliveryDir)}/`);
console.log(`Status: ${status} (${ready}/${episodes.length} ready)`);
for (const e of episodes) console.log(`  ${e.id.padEnd(5)} ${e.status === "ready" ? "ready" : "incomplete: " + e.issues.join("; ")}`);
console.log(`manifest.json + README.md written.`);
if (status !== "ready" && !allowIncomplete) process.exit(1);
