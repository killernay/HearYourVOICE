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
import { fileURLToPath } from "node:url";

const EXAMPLES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "references", "examples");

// Driven entirely by the exported timeline — the same ep*-timeline.json any editor gets. It
// already carries fps, durationInFrames and per-clip start/end frames, so nothing is recomputed
// here and the render can't drift from the CSV a human would cut by hand.
// A graphic beat needs no PNG: the plan's note carries its text, so it renders as a card. That's
// what makes the ฿0 path finishable in code.
const EPISODE_TSX = `import React from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile,
  interpolate, useCurrentFrame, useVideoConfig,
} from "remotion";

export type Clip = {
  index: number; startFrame: number; endFrame: number;
  source: "shot" | "generative" | "cc" | "graphic"; file?: string; note?: string;
};

const isVideo = (f: string) => /\\.(mp4|mov|webm|mkv)$/i.test(f);
// A beat's note carries its on-screen line as "TEXT: <line>". Anything else is a note to a human.
const textOf = (n?: string) => (n && /^TEXT:/i.test(n) ? n.replace(/^TEXT:\\s*/i, "").trim() : "");

// A still held for five seconds reads as a dead slideshow. A slow push makes it read as video.
const KenBurns: React.FC<{ src: string; frames: number }> = ({ src, frames }) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, frames], [1, 1.08], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(" + scale + ")" }} />
    </AbsoluteFill>
  );
};

// Text over the footage, not instead of it. The scrim is what keeps it readable over a photo.
const Caption: React.FC<{ text: string; solo: boolean }> = ({ text, solo }) => {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: solo ? "center" : "flex-end", padding: "8%" }}>
      <div style={{
        color: "white", fontSize: Math.round(width * 0.066), fontWeight: 700, lineHeight: 1.25,
        textAlign: "center", textShadow: solo ? "none" : "0 2px 24px rgba(0,0,0,0.9)",
        background: solo ? "none" : "rgba(0,0,0,0.35)", padding: solo ? 0 : "0.5em 0.6em",
        borderRadius: 12,
      }}>{text}</div>
    </AbsoluteFill>
  );
};

const Beat: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frames = Math.max(1, clip.endFrame - clip.startFrame + 1);
  const text = textOf(clip.note);
  // A file is only usable if it was actually produced. A graphics/ path is a plan, not a picture:
  // if nobody drew it, the text still carries the beat rather than leaving a hole.
  const file = clip.file && !/^graphics\\//.test(clip.file) ? clip.file : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1212" }}>
      {file && isVideo(file)
        // Muted always: the voiceover is the only audio track.
        ? <OffthreadVideo muted src={staticFile(file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : file
        ? <KenBurns src={staticFile(file)} frames={frames} />
        : null}
      {text ? <Caption text={text} solo={!file} /> : null}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{ clips: Clip[]; voiceFile?: string }> = ({ clips, voiceFile }) => (
  <AbsoluteFill style={{ backgroundColor: "#0a1212" }}>
    {clips.map((c) => (
      <Sequence key={c.index} from={c.startFrame} durationInFrames={Math.max(1, c.endFrame - c.startFrame + 1)}>
        <Beat clip={c} />
      </Sequence>
    ))}
    {voiceFile ? <Audio src={staticFile(voiceFile)} /> : null}
  </AbsoluteFill>
);
`;

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

// project.config.json is the first gate: every subagent reads the output spec from it and
// nothing is hardcoded, so scaffold it from the template with this project's slug filled in.
const cfgPath = path.join(srcDir, "project.config.json");
if (!fs.existsSync(cfgPath)) {
  const cfg = JSON.parse(fs.readFileSync(path.join(EXAMPLES, "project.config.example.json"), "utf8"));
  cfg.slug = slug;
  write(cfgPath, JSON.stringify(cfg, null, 2) + "\n");
} else skipped.push(path.relative(root, cfgPath));

// .env goes at the repo root, not per project — one set of keys serves every video.
// Never overwrite: someone's real keys may already be in there.
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) write(envPath, fs.readFileSync(path.join(EXAMPLES, "env.example"), "utf8"));
else skipped.push(".env");

write(path.join(srcDir, "research.md"), `# Research Brief — ${title}\n\nslug: ${slug}\nformat: see src/${slug}/project.config.json (defaults 9:16 · 1080×1920 · 30fps — change it there, not here)\n\n## Thesis\n<one line>\n\n## Subject lock\nexact: <the precise named subject>\nreject: <look-alikes to avoid>\n\n## Key facts (with sources)\n- <fact> — <url>\n`);
write(path.join(srcDir, "script-v1.md"), `# ${title} — Script v1\n\n## Thesis\n<one line the video proves>\n\n## Beats\n- <beat 1>\n\n## Closing (punchline candidate)\n<payoff line>\n`);
write(path.join(srcDir, "voiceover-v1.md"), `# ${title} Voiceover v1\n\nSource text for ElevenLabs TTS into \`public/${slug}/voiceover/\`.\n\nVoice pass:\n\n- Voice id: \`<voice-id>\`\n- Model: \`eleven_v3\`\n- Direction: performance-ready Thai narration. Short lines, clear pauses, strong hook, strong punchline.\n\n${epList.map((id, i) => `## EP${i + 1} - <title>\n\nVO:\n\n<hook line>\n\n<short line>\n\n<punchline beat>`).join("\n\n")}\n`);

// Code renderers need a real project scaffolded; NLEs (capcut/premiere/davinci) need nothing —
// they just open the exported CSV. Remotion is the only code renderer today. When a second one
// shows up, add a function and a key here; don't build a plugin system for one entry.
const RENDERERS = { remotion: scaffoldRemotion };

if (withRemotion) RENDERERS.remotion();

// One Remotion project at the repo root serving every slug — one npm install, one studio, all
// your videos. Root.tsx is regenerated from whatever src/*/project.config.json exists, so a new
// slug needs no hand-editing; re-run this after exporting a timeline to pick it up.
function scaffoldRemotion() {
  const R = (p) => path.join(root, p);
  const rel = (p) => path.relative(root, p);

  // package.json: create it, or add only the deps we need. Never clobber someone's project file.
  const pkgPath = R("package.json");
  const deps = { remotion: "^4.0.0", "@remotion/cli": "^4.0.0", react: "^18.3.1", "react-dom": "^18.3.1" };
  const devDeps = { "@types/react": "^18.3.1", typescript: "^5.5.0" };
  if (!fs.existsSync(pkgPath)) {
    write(pkgPath, JSON.stringify({
      name: path.basename(root), private: true, version: "0.0.0",
      scripts: { studio: "remotion studio remotion/index.ts", render: "remotion render remotion/index.ts" },
      dependencies: deps, devDependencies: devDeps,
    }, null, 2) + "\n");
  } else {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const before = JSON.stringify(pkg);
    pkg.dependencies = { ...deps, ...pkg.dependencies };
    pkg.devDependencies = { ...devDeps, ...pkg.devDependencies };
    pkg.scripts = { studio: "remotion studio remotion/index.ts", render: "remotion render remotion/index.ts", ...pkg.scripts };
    if (JSON.stringify(pkg) !== before) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      made.push("package.json (deps merged)");
    } else skipped.push("package.json");
  }

  write(R("tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "ES2020", module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx",
      strict: true, esModuleInterop: true, skipLibCheck: true,
      resolveJsonModule: true,   // Root.tsx imports the timeline + config JSON directly
    },
  }, null, 2) + "\n");

  write(R("remotion.config.ts"),
    `import { Config } from "@remotion/cli/config";\n\n` +
    `Config.setVideoImageFormat("jpeg");\n` +
    `// Every clip is muted on the timeline — the voiceover is the only audio track.\n` +
    `Config.setChromiumOpenGlRenderer("angle");\n`);

  write(R("remotion/index.ts"),
    `import { registerRoot } from "remotion";\nimport { RemotionRoot } from "./Root";\n\n` +
    `registerRoot(RemotionRoot);\n`);

  // EPISODE_TSX is a template literal emitting TypeScript. A backtick inside it has to survive
  // two levels of escaping and has silently lost that fight twice — the file looks fine and
  // esbuild dies with `Syntax error "\`"` only once Remotion bundles. The generated code uses
  // string concat instead of nested templates; this refuses to write proof it slipped back in.
  if (/\\`/.test(EPISODE_TSX)) {
    console.error("Error: generated Episode.tsx contains an escaped backtick — it will not bundle.\n" +
      "Use string concatenation in EPISODE_TSX, not a nested template literal.");
    process.exit(1);
  }
  write(R("remotion/Episode.tsx"), EPISODE_TSX);
  writeRemotionRoot(R, rel);
}

// Regenerate Root.tsx from every slug on disk that has a project.config.json.
function writeRemotionRoot(R, rel) {
  const srcRoot = R("src");
  const slugs = fs.existsSync(srcRoot)
    ? fs.readdirSync(srcRoot).filter((d) => fs.existsSync(path.join(srcRoot, d, "project.config.json")))
    : [];
  if (!slugs.includes(slug)) slugs.push(slug);

  const imports = [], comps = [];
  for (const s of slugs.sort()) {
    const id = s.replace(/[^a-zA-Z0-9]/g, "_");
    const cfg = JSON.parse(fs.readFileSync(path.join(srcRoot, s, "project.config.json"), "utf8"));
    imports.push(`import cfg_${id} from "../src/${s}/project.config.json";`);
    const editDir = path.join(srcRoot, s, "edit");
    const timelines = fs.existsSync(editDir)
      ? fs.readdirSync(editDir).filter((f) => f.endsWith("-timeline.json")).sort()
      : [];
    if (timelines.length === 0) {
      // No timeline exported yet — register a placeholder so the studio still opens and shows
      // the frame at the right size. Re-run new-project --remotion once phase 5 has run.
      comps.push(`      <Composition id="${s}" component={Episode} durationInFrames={30}\n` +
        `        fps={cfg_${id}.fps ?? 30} width={cfg_${id}.width ?? 1080} height={cfg_${id}.height ?? 1920}\n` +
        `        defaultProps={{ clips: [], voiceFile: undefined }} />`);
      continue;
    }
    for (const t of timelines) {
      const ep = t.replace("-timeline.json", "");
      const tid = `${id}_${ep}`;
      imports.push(`import tl_${tid} from "../src/${s}/edit/${t}";`);
      comps.push(`      <Composition id="${s}-${ep}" component={Episode}\n` +
        `        durationInFrames={tl_${tid}.durationInFrames} fps={tl_${tid}.fps}\n` +
        `        width={cfg_${id}.width ?? 1080} height={cfg_${id}.height ?? 1920}\n` +
        `        defaultProps={{ clips: tl_${tid}.clips as any, voiceFile: "${s}/voiceover/${ep}.mp3" }} />`);
    }
  }

  // Always overwrite: this file is generated, and re-running to pick up a new timeline is the
  // whole point. write() skips what exists, which would silently keep the placeholder forever.
  const outPath = R("remotion/Root.tsx");
  const isNew = !fs.existsSync(outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath,
    `// GENERATED by new-project.mjs --remotion. Re-run it to pick up new slugs or timelines.\n` +
    `import React from "react";\nimport { Composition } from "remotion";\n` +
    `import { Episode } from "./Episode";\n${imports.join("\n")}\n\n` +
    `export const RemotionRoot: React.FC = () => {\n  return (\n    <>\n${comps.join("\n")}\n    </>\n  );\n};\n`);
  (isNew ? made : made).push(`remotion/Root.tsx (${comps.length} composition${comps.length === 1 ? "" : "s"})`);
}

console.log(`Scaffolded '${slug}' (${episodes} ep${episodes > 1 ? "s" : ""})${withRemotion ? " + Remotion project" : ""}\n`);
if (made.length) console.log("Created:\n" + made.map((m) => "  + " + m).join("\n"));
if (skipped.length) console.log("\nSkipped (exist):\n" + skipped.map((m) => "  = " + m).join("\n"));
console.log(`\nNext:
  0. confirm the output spec in src/${slug}/project.config.json (aspect/fps/editor) — nothing is hardcoded
  1. node scripts/new-shotlist.py --slug ${slug} --episodes ${episodes}
  2. write src/${slug}/voiceover-v1.md, then EITHER
       free : node scripts/gen-voiceover.mjs --slug ${slug} --emit-md      # TTS sheet, voice it anywhere
       paid : node scripts/gen-voiceover.mjs --slug ${slug} --voice-id <id>   # shows the bill, add --yes to spend
  3. node scripts/measure-voiceover.mjs --dir public/${slug}/voiceover --out src/${slug}/voiceover-durations.json
  4. build the insert plan -> node scripts/export-timeline.mjs --slug ${slug} --episode ep1 --brief <brief.json> --durations src/${slug}/voiceover-durations.json
  5. assemble in your editor (CapCut / Premiere / DaVinci / Remotion) -> render -> node scripts/package-delivery.mjs --slug ${slug}`);
