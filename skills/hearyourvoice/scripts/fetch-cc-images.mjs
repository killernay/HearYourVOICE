#!/usr/bin/env node
// fetch-cc-images.mjs — find, license-check and download Creative-Commons STILLS for a beat.
//
// The ฿0 path was graphics-only, which in practice meant black cards with text. Real CC photos
// are just as free and look like a video. This fills that gap.
//
// Usage:
//   node fetch-cc-images.mjs --slug my-topic --query "air pollution bangkok" --limit 5
//   node fetch-cc-images.mjs --slug my-topic --query "ฝุ่น" --source wikimedia --json
//
// Options:
//   --slug <kebab>     project slug (required unless --out given)
//   --query <text>     what to search for (required). Thai works on wikimedia.
//   --limit <n>        how many to keep (default 5)
//   --out <dir>        download dir (default public/<slug>/cc/images)
//   --source <s>       openverse | wikimedia | both   (default both)
//   --attribution <p>  attribution file (default public/<slug>/ATTRIBUTION.md)
//   --allow-nc         also accept NonCommercial. OFF by default — you probably can't use it.
//   --dry-run          search and print, download nothing
//   --json             print JSON (for agents) instead of a table
//
// LICENCE POLICY, and why it is not negotiable:
//   Accepted:  CC0 · Public domain · CC BY · CC BY-SA
//   Rejected:  anything -ND (NoDerivatives — you are cutting it into a video, that IS a
//              derivative) and, unless --allow-nc, anything -NC.
//   Every image records creator + licence + source URL. The licence is read from each API's
//   metadata — never from a search filter, and never assumed. YouTube's "CC" filter taught this
//   lesson the expensive way; Google Images' CC filter has the same false positives, which is
//   why neither is used here.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, fb = "") => { const i = args.indexOf(n); if (i === -1) return fb; if (i === args.length - 1) throw new Error(`${n} requires a value`); return args[i + 1]; };
const has = (n) => args.includes(n);

if (has("-h") || has("--help") || args.length === 0) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split("\n").slice(1, 30).join("\n").replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}

const slug = flag("--slug");
const query = flag("--query");
const limit = Number(flag("--limit", "5"));
const source = flag("--source", "both");
const outDir = flag("--out", slug ? `public/${slug}/cc/images` : "");
const attrPath = flag("--attribution", slug ? `public/${slug}/ATTRIBUTION.md` : "");
const allowNC = has("--allow-nc");
const dryRun = has("--dry-run");
const asJson = has("--json");

if (!query || !outDir) { console.error("Error: --query is required, and --slug or --out. Run with --help."); process.exit(1); }

const UA = "HearYourVOICE/1.0 (https://github.com/killernay/HearYourVOICE)";

// A licence string is usable only if we can read it AND it permits editing.
// Unreadable licence = unusable image. Silence is never permission.
const licenceOk = (l) => {
  if (!l) return false;
  const s = l.toLowerCase();
  if (s.includes("nd") && /\bnd\b|-nd/.test(s)) return false;      // NoDerivatives — can't cut it
  if (!allowNC && /\bnc\b|-nc/.test(s)) return false;              // NonCommercial
  return /cc0|public domain|pdm|\bby\b|by-sa/.test(s);
};

const openverse = async () => {
  // license_type filters at the source too; the per-item licence is still checked below.
  const lt = allowNC ? "modification" : "commercial,modification";
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=${lt}&page_size=${Math.min(20, limit * 3)}`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`openverse ${r.status}`);
  const d = await r.json();
  return (d.results ?? []).map((x) => ({
    title: x.title || "untitled",
    licence: [x.license, x.license_version].filter(Boolean).join(" ").toUpperCase(),
    creator: x.creator || "unknown",
    url: x.url,
    page: x.foreign_landing_url || x.url,
    via: x.source || "openverse",
  }));
};

const wikimedia = async () => {
  // gsrnamespace=6 is the File: namespace — without it this returns articles, not images.
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search` +
    `&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${Math.min(20, limit * 3)}` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`wikimedia ${r.status}`);
  const d = await r.json();
  const strip = (s) => (s || "").replace(/<[^>]*>/g, "").trim();
  return Object.values(d.query?.pages ?? {}).map((p) => {
    const ii = p.imageinfo?.[0] ?? {};
    const m = ii.extmetadata ?? {};
    return {
      title: p.title.replace(/^File:/, ""),
      licence: strip(m.LicenseShortName?.value),
      creator: strip(m.Artist?.value) || "unknown",
      url: ii.thumburl || ii.url,
      page: ii.descriptionurl || "",
      via: "wikimedia",
    };
  });
};

const sources = source === "both" ? [openverse, wikimedia] : source === "wikimedia" ? [wikimedia] : [openverse];
const found = [];
for (const fn of sources) {
  try { found.push(...await fn()); }
  catch (e) { console.error(`  (${fn.name} failed: ${e.message})`); }   // one source down ≠ nothing works
}

const usable = found.filter((x) => x.url && licenceOk(x.licence)).slice(0, limit);
const rejected = found.length - found.filter((x) => x.url && licenceOk(x.licence)).length;

if (usable.length === 0) {
  console.error(`No usable image for "${query}" (${found.length} found, ${rejected} rejected on licence).`);
  console.error("Try another query, --source wikimedia, or fall back to a graphic beat.");
  process.exit(3);
}

if (dryRun || asJson) {
  if (asJson) console.log(JSON.stringify({ query, found: found.length, rejected, usable }, null, 2));
  else for (const x of usable) console.log(`  ${x.licence.padEnd(16)} ${x.via.padEnd(10)} ${x.title.slice(0, 44)}`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
const kept = [];
for (const [i, x] of usable.entries()) {
  const ext = (x.url.match(/\.(jpe?g|png|webp)/i)?.[1] ?? "jpg").toLowerCase();
  const file = path.join(outDir, `${(query.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "img").slice(0, 30)}-${i + 1}.${ext}`);
  const r = await fetch(x.url, { headers: { "User-Agent": UA } });
  if (!r.ok) { console.error(`  skip ${x.title}: HTTP ${r.status}`); continue; }
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  kept.push({ ...x, file });
  console.log(`  ✅ ${x.licence.padEnd(16)} ${path.relative(".", file)}`);
}

// Attribution is not optional for BY/BY-SA — the licence requires credit, so record it as we
// download rather than trusting anyone to reconstruct it later.
if (kept.length && attrPath) {
  fs.mkdirSync(path.dirname(attrPath), { recursive: true });
  const head = fs.existsSync(attrPath) ? "" : `# Attribution\n\nEvery asset below, its creator, its licence, and where it came from.\n`;
  const rows = kept.map((x) =>
    `\n## ${path.basename(x.file)}\n- source: ${x.via}\n- title: ${x.title}\n- creator: ${x.creator}\n- licence: **${x.licence}**\n- url: ${x.page || x.url}\n- query: \`${query}\`\n`).join("");
  fs.appendFileSync(attrPath, head + rows);
  console.log(`\n  ${kept.length} image(s) → ${outDir}`);
  console.log(`  credits appended → ${attrPath}`);
}
if (rejected) console.log(`  (${rejected} rejected: ND, or NC without --allow-nc)`);
