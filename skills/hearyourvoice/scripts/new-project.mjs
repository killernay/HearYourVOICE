#!/usr/bin/env node
// new-project.mjs — scaffold a new HearYourVOICE video project. Editor-agnostic:
// creates the working folders + script/voiceover/research stubs. The final cut can
// be assembled in any editor (CapCut, Premiere, DaVinci) or a code renderer.
// Pass --remotion to also emit a starter Remotion config + composition.
//
// Usage:
//   node new-project.mjs --slug my-topic --title "เรื่องของฉัน" --episodes 1
//   node new-project.mjs --slug my-topic --remotion        # also scaffold Remotion files
//
// Options:
//   --slug <kebab>   project slug (required)
//   --title <text>   display title (default: the slug)
//   --episodes <n>   number of episodes (default 1)
//   --root <path>    repo root (default: current dir)
//   --remotion       also generate config.ts + <Name>.tsx (optional)

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, fb = "") => { const i = args.indexOf(n); if (i === -1) return fb; if (i === args.length - 1) throw new Error(`${n} requires a value`); return args[i + 1]; };
const has = (n) => args.includes(n);
if (has("-h") || has("--help") || args.length === 0) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 17).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

const slug = flag("--slug");
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { console.error("Error: --slug must be kebab-case. Run with --help."); process.exit(1); }
const title = flag("--title", slug);
const episodes = Math.max(1, Number(flag("--episodes", "1")));
const root = path.resolve(flag("--root", process.cwd()));
const withRemotion = has("--remotion");
const Name = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");

const srcDir = path.join(root, "src", slug);
const pubDir = path.join(root, "public", slug);
const made = [], skipped = [];
const mkdir = (p) => { if (!fs.existsSync(p)) { fs.mkdirSync(p, { recursive: true }); made.push(path.relative(root, p) + "/"); } };
const write = (p, c) => { if (fs.existsSync(p)) { skipped.push(path.relative(root, p)); return; } fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, "utf8"); made.push(path.relative(root, p)); };

for (const d of ["voiceover", "raw", "select", "cc/video", "cc/select", "generated"]) mkdir(path.join(pubDir, d));
mkdir(path.join(srcDir, "veo"));   // insert briefs
mkdir(path.join(srcDir, "edit"));  // exported timelines (json/csv) for your editor

const epList = Array.from({ length: episodes }, (_, i) => `ep${i + 1}`);

write(path.join(srcDir, "research.md"), `# Research Brief — ${title}\n\nslug: ${slug}\nformat: 9:16 · 1080×1920 · 30fps\n\n## Thesis\n<one line>\n\n## Subject lock\nexact: <the precise named subject>\nreject: <look-alikes to avoid>\n\n## Key facts (with sources)\n- <fact> — <url>\n`);
write(path.join(srcDir, "script-v1.md"), `# ${title} — Script v1\n\n## Thesis\n<one line the video proves>\n\n## Beats\n- <beat 1>\n\n## Closing (punchline candidate)\n<payoff line>\n`);
write(path.join(srcDir, "voiceover-v1.md"), `# ${title} Voiceover v1\n\nSource text for ElevenLabs TTS into \`public/${slug}/voiceover/\`.\n\nVoice pass:\n\n- Voice id: \`<voice-id>\`\n- Model: \`eleven_v3\`\n- Direction: performance-ready Thai narration. Short lines, clear pauses, strong hook, strong punchline.\n\n${epList.map((id, i) => `## EP${i + 1} - <title>\n\nVO:\n\n<hook line>\n\n<short line>\n\n<punchline beat>`).join("\n\n")}\n`);

if (withRemotion) {
  const configTs = `export const FPS = 30;\nexport const WIDTH = 1080;\nexport const HEIGHT = 1920;\nconst framesFromSeconds = (s: number) => Math.ceil(s * FPS);\n\nexport type Insert = { file: string; startSec: number; endSec: number; source?: "shot" | "generative" | "cc" | "graphic" };\nexport type Episode = { id: string; episode: string; title: string; thesis: string; closing: string; durationInFrames: number; voiceFile?: string; inserts?: Insert[]; footage: { src: string; label: string; credit: string; license: string; sourceUrl: string }[]; beats: string[]; shotIds: string[] };\n\nexport const SERIES_TITLE = ${JSON.stringify(title)};\nexport const EPISODES: Episode[] = [\n${epList.map((id, i) => `  { id: ${JSON.stringify(id)}, episode: ${JSON.stringify("EP" + (i + 1))}, title: "", thesis: "", closing: "", durationInFrames: framesFromSeconds(60), voiceFile: ${JSON.stringify(`${slug}/voiceover/${id}.mp3`)}, inserts: [], footage: [], beats: [], shotIds: [] }`).join(",\n")}\n];\nexport const SERIES_TOTAL_FRAMES = EPISODES.reduce((s, e) => s + e.durationInFrames, 0);\n`;
  const compTsx = `import React from "react";\nimport { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";\nimport { EPISODES } from "./config";\n\nexport const ${Name}Episode: React.FC<{ episodeId: string }> = ({ episodeId }) => {\n  const ep = EPISODES.find((e) => e.id === episodeId) ?? EPISODES[0];\n  const { fps } = useVideoConfig();\n  return (\n    <AbsoluteFill style={{ backgroundColor: "#0a1212" }}>\n      {(ep.inserts ?? []).map((ins, i) => (\n        <Sequence key={i} from={Math.round(ins.startSec * fps)} durationInFrames={Math.round((ins.endSec - ins.startSec) * fps)}>\n          <OffthreadVideo muted src={staticFile(ins.file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />\n        </Sequence>\n      ))}\n      {ep.voiceFile ? <Audio src={staticFile(ep.voiceFile)} /> : null}\n    </AbsoluteFill>\n  );\n};\n`;
  write(path.join(srcDir, "config.ts"), configTs);
  write(path.join(srcDir, `${Name}.tsx`), compTsx);
}

console.log(`Scaffolded '${slug}' (${episodes} ep${episodes > 1 ? "s" : ""})${withRemotion ? " + Remotion starter" : ""}\n`);
if (made.length) console.log("Created:\n" + made.map((m) => "  + " + m).join("\n"));
if (skipped.length) console.log("\nSkipped (exist):\n" + skipped.map((m) => "  = " + m).join("\n"));
console.log(`\nNext:
  1. node scripts/new-shotlist.py --slug ${slug} --episodes ${episodes}
  2. write src/${slug}/voiceover-v1.md -> node scripts/gen-voiceover.mjs --slug ${slug} --voice-id <id>
  3. node scripts/measure-voiceover.mjs --dir public/${slug}/voiceover --out src/${slug}/voiceover-durations.json
  4. build the insert plan -> node scripts/export-timeline.mjs --slug ${slug} --episode ep1 --brief <brief.json> --durations src/${slug}/voiceover-durations.json
  5. assemble in your editor (CapCut / Premiere / DaVinci / Remotion) -> render -> node scripts/package-delivery.mjs --slug ${slug}`);
