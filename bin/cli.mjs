#!/usr/bin/env node
// HearYourVOICE CLI — install the skill into an agent's skills directory.
// Cross-platform (pure Node, no bash). Run via npx or node.
//
//   npx hearyourvoice install            # global, Claude Code (~/.claude/skills)
//   npx hearyourvoice install codex      # global, Codex (~/.codex/skills)
//   npx hearyourvoice install hermes     # global, Hermes/openclaws (~/.hermes/skills)
//   npx hearyourvoice install project    # THIS project only (./.claude/skills)
//   npx hearyourvoice install ./path/to/skills   # any skills directory
//   npx hearyourvoice doctor             # check Node / Python / ffmpeg
//
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL = "hearyourvoice";
const SRC = path.resolve(__dirname, "..", "skills", SKILL);
const AGENTS_SRC = path.resolve(__dirname, "..", "agents");
const HOME = os.homedir();

const GLOBAL = {
  claude: path.join(HOME, ".claude", "skills"),
  codex: path.join(HOME, ".codex", "skills"),
  hermes: path.join(HOME, ".hermes", "skills"),
};

const args = process.argv.slice(2);
const cmd = args[0];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === ".DS_Store") continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// agents live in `.claude/agents/` — a different tree than skills, and Claude Code only.
// codex/hermes have no equivalent, so they get the skill alone.
function resolveBase(target) {
  if (!target || target === "claude") {
    return { base: GLOBAL.claude, agents: path.join(HOME, ".claude", "agents"), scope: "global (Claude Code)" };
  }
  if (GLOBAL[target]) return { base: GLOBAL[target], agents: null, scope: `global (${target})` };
  if (target === "project") {
    return { base: path.join(process.cwd(), ".claude", "skills"), agents: path.join(process.cwd(), ".claude", "agents"), scope: "project (this working dir)" };
  }
  // explicit path (absolute, relative, or existing dir)
  if (target.includes("/") || target.includes(path.sep) || fs.existsSync(target)) {
    return { base: path.resolve(target), agents: null, scope: "custom path" };
  }
  return null;
}

// The agents dir is shared with the user's own agents — only ever touch our own `hyv-*.md`.
function installAgents(agentsDir) {
  if (!fs.existsSync(AGENTS_SRC)) return 0;
  const ours = fs.readdirSync(AGENTS_SRC).filter((f) => f.startsWith("hyv-") && f.endsWith(".md"));
  if (!ours.length) return 0;
  fs.mkdirSync(agentsDir, { recursive: true });
  // drop stale hyv-* from a previous version, leave every other agent alone
  for (const f of fs.readdirSync(agentsDir)) {
    if (f.startsWith("hyv-") && f.endsWith(".md")) fs.rmSync(path.join(agentsDir, f), { force: true });
  }
  for (const f of ours) fs.copyFileSync(path.join(AGENTS_SRC, f), path.join(agentsDir, f));
  return ours.length;
}

function install(target) {
  const r = resolveBase(target);
  if (!r) { console.error(`Unknown target '${target}'. Use: claude | codex | hermes | project | <path>`); process.exit(1); }
  if (!fs.existsSync(path.join(SRC, "SKILL.md"))) { console.error(`Error: cannot find skill payload at ${SRC}`); process.exit(1); }
  const dest = path.join(r.base, SKILL);
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(SRC, dest);
  console.log(`✅ Installed HearYourVOICE — ${r.scope}`);
  console.log(`   skill  → ${dest}`);

  if (r.agents) {
    const n = installAgents(r.agents);
    console.log(`   agents → ${r.agents}  (${n} hyv-* subagents)`);
  } else {
    console.log(`   agents → skipped (only Claude Code reads .claude/agents/)`);
  }
  console.log(`   verify:  node "${path.join(dest, "scripts", "measure-voiceover.mjs")}" --help`);
}

function which(cmd, args2) {
  try { return execFileSync(cmd, args2, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim().split("\n")[0]; }
  catch { return null; }
}

// Read .env without pulling values into anything we print. Presence only — a doctor that
// echoes a key into a terminal someone is screen-sharing is worse than no doctor.
function envKeys(file = ".env") {
  const found = new Set();
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [k, ...rest] = t.split("=");
      if (rest.join("=").trim()) found.add(k.trim());
    }
  }
  return found;
}

function doctor() {
  const checks = [
    ["Node", which("node", ["--version"]), ">=18 required"],
    ["Python 3", which("python3", ["--version"]), "for new-shotlist.py / veo-generate.py"],
    ["ffmpeg", which("ffmpeg", ["-version"]), "timing + render checks"],
    ["ffprobe", which("ffprobe", ["-version"]), "duration measurement"],
  ];
  console.log("HearYourVOICE doctor:\n");
  for (const [name, found, hint] of checks) {
    console.log(`  ${found ? "✅" : "❌"} ${name.padEnd(9)} ${found ? found.replace(/\n.*/, "") : "not found"}  — ${hint}`);
  }

  const inEnv = envKeys();
  const set = (k) => inEnv.has(k) || !!process.env[k];
  const keys = [
    ["ELEVENLABS_API_KEY", "generating voiceover — without it, use gen-voiceover.mjs --emit-md"],
    ["VOICE_ID", "which ElevenLabs voice to use"],
    ["VEO_PLUGIN_PATH", "generative clips — without it, use veo-generate.py --emit-md"],
  ];
  console.log(`\n  Keys (${fs.existsSync(".env") ? "./.env + environment" : "environment only — no ./.env here"}):`);
  for (const [k, why] of keys) {
    console.log(`  ${set(k) ? "✅" : "○"} ${k.padEnd(19)} ${set(k) ? "set" : "not set"}  — ${why}`);
  }

  console.log(`
  ○ is fine. Every key is optional: they gate the steps that SPEND money, and
  those steps refuse to run without --yes anyway. Research, script, the punchline
  debate, and both --emit-md paths need no keys at all.

  Need one? Copy the template and fill it in — .env is gitignored, keep it that way:
    cp <skill>/references/examples/env.example .env

  Still needed for a final render: a video editor (CapCut / Premiere / DaVinci).`);
}

function help() {
  console.log(`HearYourVOICE — install the skill (+ the hyv-* subagent team) into your agent.

Global (whole machine):
  npx hearyourvoice install            # ~/.claude/skills/hearyourvoice + ~/.claude/agents/hyv-*
  npx hearyourvoice install codex      # ~/.codex/skills/hearyourvoice   (skill only)
  npx hearyourvoice install hermes     # ~/.hermes/skills/hearyourvoice  (skill only)

Project-level (only the repo you're in — run from its root):
  npx hearyourvoice install project    # ./.claude/skills/hearyourvoice + ./.claude/agents/hyv-*
  npx hearyourvoice install ./.claude/skills        # same, explicit
  npx hearyourvoice install /path/to/repo/.claude/skills

Other:
  npx hearyourvoice doctor             # check Node / Python / ffmpeg
  npx hearyourvoice --help

Running from a local checkout (not published)?  Use  npx .  from the repo:
  cd HearYourVOICE && npx . install project`);
}

if (cmd === "install") install(args[1]);
else if (cmd === "doctor") doctor();
else help();
