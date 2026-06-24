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

function resolveBase(target) {
  if (!target || target === "claude") return { base: GLOBAL.claude, scope: "global (Claude Code)" };
  if (GLOBAL[target]) return { base: GLOBAL[target], scope: `global (${target})` };
  if (target === "project") return { base: path.join(process.cwd(), ".claude", "skills"), scope: "project (this working dir)" };
  // explicit path (absolute, relative, or existing dir)
  if (target.includes("/") || target.includes(path.sep) || fs.existsSync(target)) {
    return { base: path.resolve(target), scope: "custom path" };
  }
  return null;
}

function install(target) {
  const r = resolveBase(target);
  if (!r) { console.error(`Unknown target '${target}'. Use: claude | codex | hermes | project | <path>`); process.exit(1); }
  if (!fs.existsSync(path.join(SRC, "SKILL.md"))) { console.error(`Error: cannot find skill payload at ${SRC}`); process.exit(1); }
  const dest = path.join(r.base, SKILL);
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(SRC, dest);
  console.log(`✅ Installed HearYourVOICE — ${r.scope}`);
  console.log(`   → ${dest}`);
  console.log(`   verify:  node "${path.join(dest, "scripts", "measure-voiceover.mjs")}" --help`);
}

function which(cmd, args2) {
  try { return execFileSync(cmd, args2, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim().split("\n")[0]; }
  catch { return null; }
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
  console.log("\n  (ElevenLabs key + a video editor are needed for voiceover & final render.)");
}

function help() {
  console.log(`HearYourVOICE — install the skill into your agent.

Global (whole machine):
  npx hearyourvoice install            # ~/.claude/skills/hearyourvoice
  npx hearyourvoice install codex      # ~/.codex/skills/hearyourvoice
  npx hearyourvoice install hermes     # ~/.hermes/skills/hearyourvoice

Project-level (only the repo you're in — run from its root):
  npx hearyourvoice install project    # ./.claude/skills/hearyourvoice
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
