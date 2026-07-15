#!/usr/bin/env node
// check-insert-plan.mjs — validate a source-agnostic insert plan for one episode.
// Works for any footage source (shot / generative / cc / graphic), including a
// veo-insert-planner brief (treated as source=generative).
//
// Usage:
//   node check-insert-plan.mjs --plan ep1-plan.json --durations voiceover-durations.json --episode ep1
//   node check-insert-plan.mjs --plan ep1-veo-insert-brief.json --target 88
//
// Options:
//   --plan <path>            JSON array of inserts (required)
//   --durations <path>       voiceover-durations.json (for target lookup)
//   --episode <id>           episode id to look up in the manifest, e.g. ep1
//   --target <sec>           target edit length in seconds (overrides manifest)
//   --subject-term <text>    if set, subject shots must contain this term
//   --max-consecutive-subject N   anti-loop: max consecutive subject shots (default off)
//   --tolerance 0.05         seconds of slack for contiguity/target checks
//   --strict                 treat warnings as errors
//
// An insert: { beat_id, start_sec, end_sec, source, file|output_filename, note,
//              insert_type|visual_prompt }. source ∈ shot|generative|cc|graphic.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const readFlag = (n, fb = "") => {
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

const planPath = readFlag("--plan");
const durationsPath = readFlag("--durations");
const episode = readFlag("--episode");
const targetFlag = readFlag("--target");
const subjectTerm = readFlag("--subject-term");
const maxConsec = readFlag("--max-consecutive-subject");
const tol = Number(readFlag("--tolerance", "0.05"));
const strict = has("--strict");

if (!planPath) {
  console.error("Error: --plan is required. Run with --help.");
  process.exit(1);
}

const fail = [];
const warn = [];
const note = (m) => (strict ? fail.push(m) : warn.push(m));

let plan;
try {
  plan = JSON.parse(fs.readFileSync(path.resolve(planPath), "utf8"));
} catch (e) {
  console.error(`Error: cannot parse plan JSON: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(plan) || plan.length === 0) {
  console.error("Error: plan must be a non-empty JSON array of inserts");
  process.exit(1);
}

// Resolve target edit length.
let target = targetFlag ? Number(targetFlag) : null;
if (target === null && durationsPath && episode) {
  try {
    const man = JSON.parse(fs.readFileSync(path.resolve(durationsPath), "utf8"));
    const rec = man[episode] || man[episode.toLowerCase()];
    if (rec && typeof rec.targetSec === "number") target = rec.targetSec;
    else note(`episode '${episode}' not found in durations manifest`);
  } catch (e) {
    note(`cannot read durations manifest: ${e.message}`);
  }
}

const VALID_SOURCES = new Set(["shot", "generative", "cc", "graphic"]);
const fileOf = (s) => s.file || s.output_filename || "";
const subjectText = (s) => `${s.insert_type || ""} ${s.visual_prompt || ""} ${s.note || ""}`.toLowerCase();
// Prefer the explicit visual_strategy field; fall back to heuristics only if absent.
const isSubject = (s) =>
  s.visual_strategy
    ? s.visual_strategy === "subject"
    : s.insert_type === "subject" || /\bsubject\b|predator_behavior|hero/.test(subjectText(s));

// Per-insert checks.
let consecutiveSubject = 0;
let maxRunSubject = 0;
plan.forEach((s, i) => {
  const tag = s.beat_id || `insert ${i + 1}`;
  if (typeof s.start_sec !== "number" || typeof s.end_sec !== "number")
    fail.push(`${tag}: start_sec/end_sec must be numbers`);
  else if (s.end_sec <= s.start_sec) fail.push(`${tag}: end_sec must be > start_sec`);

  if (s.source && !VALID_SOURCES.has(s.source)) note(`${tag}: unknown source '${s.source}'`);

  const isGraphic = s.source === "graphic";
  const file = fileOf(s);
  if (!isGraphic) {
    if (!file) note(`${tag}: non-graphic insert has no file`);
    else if (!/\.(mp4|mov|webm)$/i.test(file)) note(`${tag}: file should be a video (.mp4/.mov/.webm): ${file}`);
  }

  if (subjectTerm && isSubject(s)) {
    if (!subjectText(s).includes(subjectTerm.toLowerCase()))
      note(`${tag}: subject shot missing subject-lock term "${subjectTerm}"`);
  }

  if (maxConsec) {
    if (isSubject(s)) consecutiveSubject += 1;
    else consecutiveSubject = 0;
    maxRunSubject = Math.max(maxRunSubject, consecutiveSubject);
  }
});

// Contiguity.
if (Math.abs(plan[0].start_sec - 0) > tol) note(`first insert starts at ${plan[0].start_sec}s, expected 0`);
for (let i = 1; i < plan.length; i++) {
  const d = plan[i].start_sec - plan[i - 1].end_sec;
  if (Math.abs(d) > tol) {
    const kind = d > 0 ? `gap of ${d.toFixed(2)}s` : `overlap of ${(-d).toFixed(2)}s`;
    fail.push(`${kind} before ${plan[i].beat_id || `insert ${i + 1}`}`);
  }
}

// Final end vs target.
const finalEnd = plan[plan.length - 1].end_sec;
if (target !== null && Math.abs(finalEnd - target) > Math.max(tol, 0.5))
  note(`final end_sec ${finalEnd}s drifts from target ${target}s by ${(finalEnd - target).toFixed(2)}s`);

// Anti-loop.
if (maxConsec && maxRunSubject > Number(maxConsec))
  note(`anti-loop: ${maxRunSubject} consecutive subject shots > max ${maxConsec}`);

// Report.
const totalSec = (finalEnd - plan[0].start_sec).toFixed(2);
console.log(`Plan: ${plan.length} inserts, ${totalSec}s total${target !== null ? ` (target ${target}s)` : ""}`);
for (const w of warn) console.warn(`  warn: ${w}`);
for (const f of fail) console.error(`  FAIL: ${f}`);
if (fail.length) {
  console.error(`\n${fail.length} error(s). Plan is NOT ready.`);
  process.exit(1);
}
console.log(warn.length ? `\nOK with ${warn.length} warning(s).` : "\nOK — plan is contiguous and on target.");
