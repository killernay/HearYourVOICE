#!/usr/bin/env node
// gen-veo-briefs.mjs — config-driven Veo insert-brief builder with guards.
// Generalizes the project-specific gen-<slug>-veo-briefs.mjs: the mechanics
// (parse voiceover, segment by measured duration, inject subject lock + anti-loop,
// validate, write per-episode briefs + log) are generic; everything project-
// specific lives in a JSON config (see references/examples/veo-briefs.config.example.json).
//
// Usage:
//   node gen-veo-briefs.mjs --config src/<slug>/veo/briefs.config.json
//   node gen-veo-briefs.mjs --config cfg.json --only ep1,ep2
//
// The config supplies: subject lock, style descriptors, negative-prompt terms,
// camera motions, shot variations, per-episode focuses, and guard thresholds.
// The brief it writes is the same shape veo-insert-planner / check-insert-plan use.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, fb = "") => {
  const i = args.indexOf(n);
  if (i === -1) return fb;
  if (i === args.length - 1) throw new Error(`${n} requires a value`);
  return args[i + 1];
};
const has = (n) => args.includes(n);

if (has("-h") || has("--help") || args.length === 0) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 18).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

const configPath = flag("--config");
if (!configPath) { console.error("Error: --config <json> is required. Run with --help."); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));

const voiceoverMd = flag("--voiceover", cfg.voiceoverMd);
const durationsPath = flag("--durations", cfg.durations);
const outDir = flag("--out", cfg.outDir);
const onlyIds = flag("--only", "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const segmentSeconds = cfg.segmentSeconds || 6;

for (const [k, v] of [["voiceoverMd", voiceoverMd], ["durations", durationsPath], ["outDir", outDir], ["subjectLock", cfg.subjectLock], ["style", cfg.style]]) {
  if (!v) { console.error(`Error: config missing '${k}'`); process.exit(1); }
}

const exact = cfg.subjectLock.exact;
const aliases = cfg.subjectLock.aliases || [];
const rejectTerms = cfg.subjectLock.rejectTerms || [];
const subjectInsertTypes = new Set(cfg.subjectInsertTypes || ["underwater", "surface", "predator_behavior"]);
const sub = (tpl) => String(tpl).replace(/\{exact\}/g, exact).replace(/\{aliases\}/g, aliases.join(", "));
const baseStyle = sub(cfg.style.base);
const subjectDescriptor = sub(cfg.style.subjectDescriptor);
const contextDescriptor = sub(cfg.style.contextDescriptor || cfg.style.subjectDescriptor);
const noneDescriptor = sub(cfg.style.noneDescriptor || cfg.style.contextDescriptor || cfg.style.subjectDescriptor);
const noneVisualMarker = cfg.noneVisualMarker || "no subject visible";
const negativeBase = (cfg.negativeBase || ["text", "subtitles", "logo", "watermark", "UI"]).concat(rejectTerms);
const noneNegativeExtra = cfg.noneNegativeExtra || ["visible subject", "subject in frame"];
const subjectNegativeExtra = cfg.subjectNegativeExtra || ["circling movement", "looped swimming"];
const cameraMotions = cfg.cameraMotions && cfg.cameraMotions.length ? cfg.cameraMotions : ["slow forward drift", "slow lateral pan", "locked-off observational shot", "subtle push-in"];
const shotVariations = cfg.shotVariations && cfg.shotVariations.length ? cfg.shotVariations : ["wide establishing shot", "tight detail close-up", "low foreground angle", "negative-space composition"];
const focuses = cfg.episodeFocuses || {};
const guards = cfg.guards || {};

const md = fs.readFileSync(path.resolve(voiceoverMd), "utf8");
const durationsRaw = JSON.parse(fs.readFileSync(path.resolve(durationsPath), "utf8"));
fs.mkdirSync(path.resolve(outDir), { recursive: true });

// Normalize durations into [{id, episode, targetSec, file}] regardless of source shape.
const durations = Array.isArray(durationsRaw)
  ? durationsRaw.map((d) => ({ id: (d.id || "").toLowerCase(), episode: d.episode, targetSec: Math.round(d.target_edit_sec ?? d.targetSec), file: d.file }))
  : Object.entries(durationsRaw).map(([id, d]) => ({ id: id.toLowerCase(), episode: id.toUpperCase(), targetSec: Math.round(d.targetSec ?? d.target_edit_sec), file: d.file }));

const parseEpisodes = () => {
  const re = /^## (EP\d+)\s*-\s*(.*?)\n[\s\S]*?^VO:\n\n([\s\S]*?)(?=^## EP\d+\b|$(?![\s\S]))/gm;
  const out = {};
  for (const m of md.matchAll(re)) {
    out[m[1].toLowerCase()] = { title: m[2].trim(), lines: m[3].split(/\n+/).map((l) => l.trim()).filter(Boolean) };
  }
  return out;
};

const buildDurations = (totalSec) => {
  const count = Math.max(1, Math.ceil(totalSec / segmentSeconds));
  const base = Math.floor(totalSec / count);
  const rem = totalSec - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
};

const splitLines = (lines, count) => {
  if (lines.length === 0) return Array.from({ length: count }, () => "");
  const chunks = [];
  const per = Math.ceil(lines.length / count);
  for (let i = 0; i < count; i++) chunks.push(lines.slice(i * per, (i + 1) * per).join(" "));
  if (chunks.length < count) while (chunks.length < count) chunks.push("");
  const used = per * count;
  if (used < lines.length) chunks[chunks.length - 1] += " " + lines.slice(used).join(" ");
  return chunks.slice(0, count);
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const secTC = (s) => { const w = Math.round(s); return `${String(Math.floor(w / 60)).padStart(2, "0")}:${String(w % 60).padStart(2, "0")}`; };
const countBy = (a) => a.reduce((m, v) => ((m[v] = (m[v] || 0) + 1), m), {});
const maxConsec = (arr, pred) => { let max = 0, run = 0; for (const x of arr) { if (pred(x)) { run++; max = Math.max(max, run); } else run = 0; } return max; };

const defaultFocus = (i) => {
  const types = ["habitat", "underwater", "surface", "lure", "predator_behavior", "transition"];
  const t = types[i % types.length];
  const mode = i % 3 === 1 ? "subject" : i % 3 === 2 ? "none" : "context";
  return [t, `${mode === "none" ? noneVisualMarker + ", " : ""}documentary insert beat ${i + 1}`, mode];
};

const episodes = parseEpisodes();
const runLog = { generated_at: new Date().toISOString(), source_files: { voiceoverMd, durationsPath }, output_dir: outDir, subject_lock: { exact, aliases, rejectTerms }, episodes: [] };
let hadError = 0;

for (const d of durations) {
  if (onlyIds.length && !onlyIds.includes(d.id)) continue;
  const ep = episodes[d.id];
  if (!ep) { console.error(`Error: missing voiceover section for ${d.id}`); hadError = 1; continue; }
  const segDurs = buildDurations(d.targetSec);
  const chunks = splitLines(ep.lines, segDurs.length);
  const epFocus = focuses[d.id] || segDurs.map((_, i) => defaultFocus(i));
  let start = 0;
  const brief = segDurs.map((dur, i) => {
    const f = epFocus[i % epFocus.length];
    const insertType = f[0];
    const focus = f[1];
    let mode = f[2] || "context";
    if (mode === "no_fish") mode = "none";
    const sourceShotId = f[3];
    const end = start + dur;
    const beat = `${d.id}-${String(i + 1).padStart(3, "0")}`;
    const asset = `${beat}-${slug(insertType)}`;
    const descriptor = mode === "none" ? noneDescriptor : (mode === "subject" || subjectInsertTypes.has(insertType)) ? subjectDescriptor : contextDescriptor;
    const neg = mode === "none"
      ? [...negativeBase, ...noneNegativeExtra].join(", ")
      : [...negativeBase, ...subjectNegativeExtra].join(", ");
    const scene = {
      episode: d.id.toUpperCase(),
      beat_id: beat,
      asset_name: asset,
      start_sec: start,
      end_sec: end,
      vo_line: chunks[i] || "",
      insert_duration_sec: dur,
      required_clip_duration_sec: dur,
      insert_type: insertType,
      visual_strategy: mode,
      source: "generative",
      source_shot_id: sourceShotId || null,
      generation_mode: "generate_veo",
      visual_prompt: `${baseStyle}, ${descriptor}, ${shotVariations[i % shotVariations.length]}, ${focus}`,
      negative_prompt: neg,
      camera_motion: cameraMotions[i % cameraMotions.length],
      edit_note: `${secTC(start)}-${secTC(end)} Visual supports: ${chunks[i] || ""}`,
      output_filename: `${asset}.mp4`,
      duration_policy: `Final edit duration is fixed at ${dur}s from the voice timeline. Generate exactly ${dur} seconds.`,
    };
    start = end;
    return scene;
  });

  const errs = validate(d.id, brief, d.targetSec);
  if (errs.length) {
    console.error(`VALIDATION FAILED ${d.id}: ${errs.join("; ")}`);
    hadError = 1;
    continue; // do not write an invalid brief
  }
  const outPath = path.join(outDir, `${d.id}-veo-insert-brief.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(brief, null, 2)}\n`, "utf8");
  runLog.episodes.push({
    id: d.id, episode: d.episode, target_edit_sec: d.targetSec, scene_count: brief.length,
    brief_path: outPath, final_end_sec: brief.at(-1).end_sec,
    subject_count: brief.filter((s) => s.visual_strategy === "subject").length,
    none_count: brief.filter((s) => s.visual_strategy === "none").length,
    context_count: brief.filter((s) => s.visual_strategy === "context").length,
    visual_prompts_with_exact: brief.filter((s) => s.visual_prompt.includes(exact)).length,
  });
  console.log(`${d.id}: ${brief.length} scenes, ${d.targetSec}s -> ${outPath} (subject=${runLog.episodes.at(-1).subject_count}, none=${runLog.episodes.at(-1).none_count})`);
}

const logPath = path.join(outDir, "generation-log.json");
fs.writeFileSync(logPath, `${JSON.stringify(runLog, null, 2)}\n`, "utf8");
console.log(`generation log -> ${logPath}`);
process.exit(hadError);

function validate(id, scenes, targetSec) {
  const errs = [];
  const g = guards.global || {};
  const finalEnd = scenes.at(-1)?.end_sec ?? 0;
  const total = scenes.reduce((s, x) => s + x.insert_duration_sec, 0);
  if (finalEnd !== targetSec) errs.push(`final_end_sec ${finalEnd} != target ${targetSec}`);
  if (total !== targetSec) errs.push(`scene total ${total} != target ${targetSec}`);
  if (g.requireSubjectLock !== false) {
    const missing = scenes.filter((s) => !s.visual_prompt.includes(exact)).length;
    if (missing) errs.push(`${missing} scenes missing subject lock "${exact}"`);
  }
  if (g.requireRejectTerms !== false && rejectTerms.length) {
    const missing = scenes.filter((s) => rejectTerms.some((t) => !s.negative_prompt.includes(t))).length;
    if (missing) errs.push(`${missing} scenes missing reject terms`);
  }
  if (g.noWrongSpeciesInVisual !== false && rejectTerms.length) {
    const bad = scenes.filter((s) => rejectTerms.some((t) => s.visual_prompt.includes(t))).length;
    if (bad) errs.push(`${bad} visual prompts contain a reject term`);
  }
  if (g.noDuplicateVisualPrompts) {
    const dupes = Object.values(countBy(scenes.map((s) => s.visual_prompt))).filter((c) => c > 1).length;
    if (dupes) errs.push(`${dupes} duplicate visual prompt(s)`);
  }
  const pe = (guards.perEpisode || {})[id];
  if (pe) {
    const none = scenes.filter((s) => s.visual_strategy === "none");
    const subj = scenes.filter((s) => s.visual_strategy === "subject");
    const ctx = scenes.filter((s) => s.visual_strategy === "context");
    if (pe.minNone != null && none.length < pe.minNone) errs.push(`${id} needs >= ${pe.minNone} none scenes, got ${none.length}`);
    if (pe.maxSubject != null && subj.length > pe.maxSubject) errs.push(`${id} allows <= ${pe.maxSubject} subject scenes, got ${subj.length}`);
    if (pe.forbidContext && ctx.length) errs.push(`${id} should not use context scenes, got ${ctx.length}`);
    if (pe.maxConsecutiveSubject != null) {
      const run = maxConsec(scenes, (s) => s.visual_strategy === "subject");
      if (run > pe.maxConsecutiveSubject) errs.push(`${id} has ${run} consecutive subject scenes; max ${pe.maxConsecutiveSubject}`);
    }
    if (pe.enforceNone) {
      const bad = none.filter((s) => !s.visual_prompt.includes(noneVisualMarker) || !noneNegativeExtra.some((t) => s.negative_prompt.includes(t))).length;
      if (bad) errs.push(`${bad} ${id} none scenes missing none-enforcement`);
    }
    if (pe.enforceAntiLoop) {
      const bad = subj.filter((s) => subjectNegativeExtra.some((t) => !s.negative_prompt.includes(t))).length;
      if (bad) errs.push(`${bad} ${id} subject scenes missing anti-loop terms`);
    }
  }
  return errs;
}
