#!/usr/bin/env node
// Build the two uploadable bundles, and refuse to build a broken one.
//
//   node bin/build-bundles.mjs [--out <dir>]     default out: ~/Desktop
//
// Two different upload channels want two different shapes:
//
//   skill zip   → Customize > Skills.   ONE top-level folder, SKILL.md directly inside it.
//                 Carries the skill only — NOT the agents. This is the chat tier.
//   plugin zip  → Customize > Plugins.  .claude-plugin/plugin.json + skills/ + agents/.
//                 Plugins are the only way to ship sub-agents (docs: "hooks and sub-agents
//                 run only in Cowork"). This is the Cowork tier.
//
// Claude Code needs neither — it installs from npm via `npx hearyourvoice install`.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = "hearyourvoice";
// Two different uploaders, two different limits — both found by having an upload rejected.
const SKILL_DESCRIPTION_LIMIT = 1024; // Skills uploader
const PLUGIN_DESCRIPTION_LIMIT = 500; // Plugins uploader

const outArg = process.argv.indexOf("--out");
const OUT = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : path.join(os.homedir(), "Desktop");
const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

const fail = (msg) => { console.error(`❌ ${msg}`); process.exitCode = 1; };
let errors = 0;
const check = (ok, msg) => { if (!ok) { fail(msg); errors++; } return ok; };

// ---- validate before packing -------------------------------------------------
const skillDir = path.join(ROOT, "skills", SKILL);
const skillMd = path.join(skillDir, "SKILL.md");

check(fs.existsSync(skillMd), `missing ${path.relative(ROOT, skillMd)}`);

if (fs.existsSync(skillMd)) {
  const src = fs.readFileSync(skillMd, "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(src);
  if (check(fm, "SKILL.md has no frontmatter")) {
    const d = /^description:\s*([\s\S]*?)(?=\n[a-z_]+:|$)/m.exec(fm[1]);
    if (check(d, "SKILL.md frontmatter has no description")) {
      const len = d[1].trim().length;
      check(len <= SKILL_DESCRIPTION_LIMIT,
        `SKILL.md description is ${len} chars — the Skills uploader rejects anything over ${SKILL_DESCRIPTION_LIMIT}`);
      if (len <= SKILL_DESCRIPTION_LIMIT) console.log(`  SKILL.md description   ${len}/${SKILL_DESCRIPTION_LIMIT} chars`);
    }
    check(/^name:\s*\S/m.test(fm[1]), "SKILL.md frontmatter has no name");
  }
}

const manifestPath = path.join(ROOT, ".claude-plugin", "plugin.json");
if (check(fs.existsSync(manifestPath), "missing .claude-plugin/plugin.json")) {
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  check(m.version === version, `plugin.json version ${m.version} != package.json ${version}`);
  const dlen = (m.description || "").length;
  check(dlen > 0, "plugin.json has no description");
  check(dlen <= PLUGIN_DESCRIPTION_LIMIT,
    `plugin.json description is ${dlen} chars — the Plugins uploader rejects anything over ${PLUGIN_DESCRIPTION_LIMIT}`);
  if (dlen && dlen <= PLUGIN_DESCRIPTION_LIMIT) console.log(`  plugin.json description ${dlen}/${PLUGIN_DESCRIPTION_LIMIT} chars`);
}

const agents = fs.existsSync(path.join(ROOT, "agents"))
  ? fs.readdirSync(path.join(ROOT, "agents")).filter((f) => f.startsWith("hyv-") && f.endsWith(".md"))
  : [];
check(agents.length > 0, "no hyv-* agents found in agents/");

if (errors) { console.error(`\n${errors} problem(s) — nothing packed.`); process.exit(1); }

// ---- pack --------------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
const zip = (cwd, outFile, args) => {
  fs.rmSync(outFile, { force: true });
  execFileSync("zip", ["-qr", outFile, ...args, "-x", "*.DS_Store", "*/node_modules/*"], { cwd });
  return (fs.statSync(outFile).size / 1024).toFixed(0);
};

// skill zip: top-level folder must BE the skill folder, SKILL.md directly inside
const skillZip = path.join(OUT, `${SKILL}-skill-${version}.zip`);
const skillKb = zip(path.join(ROOT, "skills"), skillZip, [SKILL]);

// plugin zip: manifest + skills/ + agents/ at the root
const pluginZip = path.join(OUT, `${SKILL}-plugin-${version}.zip`);
const pluginKb = zip(ROOT, pluginZip, [".claude-plugin", "skills", "agents", "README.md", "LICENSE"]);

console.log(`\n✅ built v${version}`);
console.log(`   skill  → ${skillZip}  (${skillKb}K)  — Customize > Skills · chat · no agents`);
console.log(`   plugin → ${pluginZip}  (${pluginKb}K)  — Customize > Plugins · ${agents.length} agents · Cowork`);
