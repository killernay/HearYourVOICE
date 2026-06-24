#!/usr/bin/env python3
"""veo-generate.py — portable Google Veo clip generator.

Generalizes the project-specific generate_ep1_veo.py: takes a veo-insert-planner
scene brief and generates one silent MP4 per scene into an output folder. No
hardcoded project or provider paths — point --plugin / --agent-root at your own
Veo provider, and --brief / --out at the episode you're generating.

Each scene's prompt is built from the brief fields (visual_prompt, camera_motion,
edit_note, negative_prompt, vo_line for timing reference only). Output is forced
silent (-an) and padded to the exact requested duration when Veo returns a shorter
source clip.

Usage:
  python3 veo-generate.py \
    --brief src/<slug>/veo/ep1-veo-insert-brief.json \
    --out   public/<slug>/generated/ep1 \
    --plugin /path/to/google-veo/__init__.py \
    --agent-root /path/to/agent \
    --env .env --model veo-3.1-generate-preview --seed 23062301

Batch a whole series with --all over a brief directory:
  python3 veo-generate.py --brief-dir src/<slug>/veo --out-base public/<slug>/generated --all \
    --plugin ... --agent-root ... --batch-size 5 --pause 15

Render the copy/paste prompt Markdown from a brief (no Veo calls, no plugin needed):
  python3 veo-generate.py --brief src/<slug>/veo/ep1-veo-insert-brief.json --emit-md
  python3 veo-generate.py --brief-dir src/<slug>/veo --all --emit-md      # whole series

Flags (env fallbacks in parens):
  --brief PATH            single brief json (VEO_BRIEF_PATH)
  --out DIR              single output dir (VEO_OUT_DIR)
  --brief-dir DIR / --out-base DIR / --all   batch mode over ep*-veo-insert-brief.json
  --plugin PATH          Veo provider plugin (VEO_PLUGIN_PATH) — required
  --agent-root PATH      path added to sys.path for the plugin (VEO_AGENT_ROOT)
  --env PATH             .env with provider keys (VEO_ENV_PATH)
  --model ID             (VEO_MODEL, default veo-3.1-generate-preview)
  --resolution 720p  --aspect 9:16  --seed N
  --style-bible PATH|TEXT   optional shared style text appended to every prompt
  --beats a,b,c          (VEO_BEAT_IDS) restrict to these beat_ids
  --workers N            parallel workers, capped at 5 (VEO_MAX_WORKERS)
  --batch-size N --pause SEC   batch pacing in --all mode
  --dry-run              build prompts + write a plan, do NOT call Veo
  --emit-md [PATH]       render ep*-google-veo-insert-prompts.md from the brief and exit
"""
import argparse
import importlib.util
import json
import os
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

GENERIC_PREFIX = (
    "Create a silent vertical video insert for an existing narrated documentary. "
    "Use Google Veo to generate video only. Do not generate narration, dialogue, "
    "music, ambience, or sound effects. The output video must be silent; if audio "
    "is an option, disable it. The voiceover is already generated separately and the "
    "reference line below is only for visual timing and meaning — do not read it aloud. "
    "Aspect ratio: vertical 9:16. No text, subtitles, captions, logo, watermark, UI, "
    "letters, typography, or labels."
)

_log_lock = threading.Lock()
_io_lock = threading.Lock()


def log(msg):
    with _log_lock:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}", flush=True)


def load_env(path):
    if not path or not Path(path).exists():
        return
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def load_provider(plugin_path, agent_root):
    if not plugin_path:
        sys.exit("Error: --plugin (or VEO_PLUGIN_PATH) is required — point it at your Veo provider plugin.")
    if agent_root and str(agent_root) not in sys.path:
        sys.path.insert(0, str(agent_root))
    spec = importlib.util.spec_from_file_location("veo_plugin", str(plugin_path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load plugin from {plugin_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    # Common provider class names; adjust to your plugin if different.
    for cls in ("GoogleVeoVideoGenProvider", "VeoVideoGenProvider", "VideoGenProvider", "Provider"):
        if hasattr(module, cls):
            return getattr(module, cls)()
    raise RuntimeError(f"No known provider class found in {plugin_path}")


def source_duration(requested):
    return requested if requested in (4, 6, 8) else 4


def scene_prompt_parts(scene, prefix, style_bible):
    """The ordered prompt parts for one scene. Single source of truth for both the
    API prompt (joined with spaces) and the copy/paste markdown (joined with blank lines)."""
    parts = [prefix]
    if style_bible:
        parts.append(style_bible)
    parts += [
        f'Generate exactly {scene["insert_duration_sec"]} seconds.',
        f'Voiceover reference, do not read aloud: {scene.get("vo_line", "")}',
        f'Visual: {scene.get("visual_prompt", "")}',
        f'Camera: {scene.get("camera_motion", "")}',
        f'Composition: {scene.get("edit_note", "")}',
        f'Avoid: {scene.get("negative_prompt", "")}',
    ]
    return [p for p in parts if p]


def scene_prompt(scene, prefix, style_bible):
    return " ".join(scene_prompt_parts(scene, prefix, style_bible))


def fmt_tc(sec):
    sec = int(round(sec))
    return f"{sec // 60:02d}:{sec % 60:02d}"


def md_path_for(brief_path, emit_val):
    """Where to write the prompt markdown. Explicit path wins (single-brief only);
    otherwise derive ep*-google-veo-insert-prompts.md next to the brief."""
    if emit_val and emit_val != "__AUTO__":
        return Path(emit_val)
    name = Path(brief_path).name.replace("-veo-insert-brief.json",
                                         "-google-veo-insert-prompts.md")
    if name == Path(brief_path).name:  # brief didn't use the expected suffix
        name = Path(brief_path).stem + "-google-veo-insert-prompts.md"
    return Path(brief_path).parent / name


def render_prompts_md(brief_path, out_md, cfg):
    """Render the human copy/paste prompt markdown from a scene brief. Each scene's
    code block is self-contained (full prefix + parts) so it pastes straight into Veo.
    No provider needed — this is a documentation/handoff artifact derived from the brief."""
    brief = json.loads(Path(brief_path).read_text())
    if cfg["beats"]:
        brief = [s for s in brief if s["beat_id"] in cfg["beats"]]
    if not brief:
        log(f"emit-md: {Path(brief_path).name} has no scenes — skipped")
        return
    ep = brief[0].get("episode") or Path(brief_path).name.split("-")[0].upper()
    target = max((s.get("end_sec", 0) for s in brief), default=0)

    out = [
        f"# {ep} Google Veo Insert Prompts",
        "",
        "Generated from the scene brief by `veo-generate.py --emit-md`. The JSON brief "
        f"(`{Path(brief_path).name}`) is the canonical source; this Markdown is the "
        "copy/paste prompt version for the Google Veo UI.",
        "",
        "- Silent visual inserts only — the voiceover is generated separately. Do not ask Veo for audio.",
        "- If Veo outputs audio anyway, strip it (`ffmpeg -an`) before editing.",
        f"- Target edited length: `{target} seconds` (from the brief timeline). Place clips against the existing voice track.",
        f"- Expected output folder: `public/<slug>/generated/{ep.lower()}/` — one file per scene (`output_filename`).",
        "",
        "Global Veo prompt prefix (already embedded in every scene block below):",
        "",
        "```text",
        cfg["prefix"],
        "```",
        "",
    ]
    for i, s in enumerate(brief, 1):
        out += [
            f"## Scene {i:03d} — {s.get('asset_name', s['beat_id'])}",
            "",
            f"Timecode for edit: `{fmt_tc(s.get('start_sec', 0))}-{fmt_tc(s.get('end_sec', 0))}`  ",
            f"Duration: `{s['insert_duration_sec']} seconds`  ",
            f"Required final clip duration: `{s.get('required_clip_duration_sec', s['insert_duration_sec'])} seconds`  ",
            f"Output filename: `{s['output_filename']}`  ",
            f"Visual strategy: `{s.get('visual_strategy', '')}`  ",
            "",
            "```text",
            "\n\n".join(scene_prompt_parts(s, cfg["prefix"], cfg["style_bible"])),
            "```",
            "",
        ]
    Path(out_md).parent.mkdir(parents=True, exist_ok=True)
    Path(out_md).write_text("\n".join(out), encoding="utf-8")
    log(f"emit-md: wrote {len(brief)} scenes -> {out_md}")


def run(cmd, label):
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"cmd failed [{label}]: {' '.join(cmd)}\n{proc.stderr}")


def ffprobe_json(path):
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    )
    return json.loads(proc.stdout)


def generate_one(scene, index, total, cfg):
    provider = load_provider(cfg["plugin"], cfg["agent_root"])
    requested = int(scene["insert_duration_sec"])
    src = source_duration(requested)
    prompt = scene_prompt(scene, cfg["prefix"], cfg["style_bible"])
    beat = scene["beat_id"]
    final_path = Path(cfg["out"]) / scene["output_filename"]
    log(f"[{index}/{total}] {beat} -> {scene['output_filename']} (req={requested}s src={src}s)")

    result = provider.generate(prompt, model=cfg["model"], duration=src,
                               aspect_ratio=cfg["aspect"], resolution=cfg["resolution"], seed=cfg["seed"])
    if not result.get("success"):
        raise RuntimeError(json.dumps(result, ensure_ascii=False))
    gen = Path(result["video"])
    if requested == src:
        run(["ffmpeg", "-y", "-i", str(gen), "-an", "-c:v", "copy", str(final_path)], beat)
    else:
        run(["ffmpeg", "-y", "-i", str(gen), "-an",
             "-vf", f"tpad=stop_mode=clone:stop_duration={requested - src}",
             "-t", str(requested), str(final_path)], beat)
    return {"beat_id": beat, "output_filename": scene["output_filename"],
            "requested_duration_sec": requested, "source_generation_duration_sec": src,
            "model": cfg["model"], "seed": cfg["seed"], "output_path": str(final_path),
            "ffprobe": ffprobe_json(final_path)}


def generate_brief(brief_path, out_dir, cfg):
    brief = json.loads(Path(brief_path).read_text())
    if cfg["beats"]:
        brief = [s for s in brief if s["beat_id"] in cfg["beats"]]
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    cfg = {**cfg, "out": out_dir}
    manifest_path = Path(out_dir) / "generation-manifest.json"
    failures_path = Path(out_dir) / "generation-failures.json"

    if cfg["dry_run"]:
        plan = [{"beat_id": s["beat_id"], "output_filename": s["output_filename"],
                 "prompt": scene_prompt(s, cfg["prefix"], cfg["style_bible"])} for s in brief]
        (Path(out_dir) / "generation-plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2))
        log(f"DRY RUN: wrote {len(plan)} prompts to {out_dir}/generation-plan.json (no Veo calls)")
        return 0, 0

    done, failed = [], []
    workers = max(1, min(cfg["workers"], 5))
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(generate_one, s, i + 1, len(brief), cfg): s["beat_id"] for i, s in enumerate(brief)}
        for fut in as_completed(futs):
            beat = futs[fut]
            try:
                row = fut.result()
            except Exception as exc:
                log(f"[{beat}] FAILED: {exc}")
                with _io_lock:
                    failed.append({"beat_id": beat, "error": str(exc)})
                    failures_path.write_text(json.dumps(sorted(failed, key=lambda r: r["beat_id"]), ensure_ascii=False, indent=2))
                continue
            with _io_lock:
                done.append(row)
                manifest_path.write_text(json.dumps(sorted(done, key=lambda r: r["beat_id"]), ensure_ascii=False, indent=2))
    log(f"brief {Path(brief_path).name}: {len(done)} ok, {len(failed)} failed")
    return len(done), len(failed)


def main():
    ap = argparse.ArgumentParser(add_help=True)
    g = ap.add_argument
    g("--brief"); g("--out"); g("--brief-dir"); g("--out-base"); g("--all", action="store_true")
    g("--plugin", default=os.environ.get("VEO_PLUGIN_PATH"))
    g("--agent-root", default=os.environ.get("VEO_AGENT_ROOT"))
    g("--env", default=os.environ.get("VEO_ENV_PATH", ".env"))
    g("--model", default=os.environ.get("VEO_MODEL", "veo-3.1-generate-preview"))
    g("--resolution", default="720p"); g("--aspect", default="9:16")
    g("--seed", type=int, default=int(os.environ.get("VEO_SEED", "0")) or None)
    g("--style-bible", default=os.environ.get("VEO_STYLE_BIBLE", ""))
    g("--prompt-prefix", default=os.environ.get("VEO_PROMPT_PREFIX", GENERIC_PREFIX))
    g("--beats", default=os.environ.get("VEO_BEAT_IDS", ""))
    g("--workers", type=int, default=int(os.environ.get("VEO_MAX_WORKERS", "3")))
    g("--batch-size", type=int, default=5); g("--pause", type=int, default=15)
    g("--dry-run", action="store_true")
    g("--emit-md", nargs="?", const="__AUTO__", default=None,
      help="render the copy/paste prompt markdown from the brief and exit (no Veo calls); "
           "optional PATH, else ep*-google-veo-insert-prompts.md next to the brief")
    a = ap.parse_args()

    load_env(a.env)
    style = a.style_bible
    if style and Path(style).exists():
        style = Path(style).read_text().strip()
    cfg = {"plugin": a.plugin, "agent_root": a.agent_root, "model": a.model,
           "resolution": a.resolution, "aspect": a.aspect, "seed": a.seed,
           "style_bible": style, "prefix": a.prompt_prefix,
           "beats": {b.strip() for b in a.beats.split(",") if b.strip()},
           "workers": a.workers, "dry_run": a.dry_run}

    # Emit the copy/paste prompt markdown and exit — derived from the brief, no provider needed.
    if a.emit_md is not None:
        if a.all or a.brief_dir:
            bdir = a.brief_dir or os.path.dirname(a.brief or "")
            briefs = sorted(Path(bdir).glob("ep*-veo-insert-brief.json"),
                            key=lambda p: int("".join(c for c in p.name.split("-")[0] if c.isdigit()) or "0"))
        else:
            single = a.brief or os.environ.get("VEO_BRIEF_PATH")
            if not single:
                sys.exit("Error: --emit-md needs --brief (or --brief-dir/--all)")
            briefs = [Path(single)]
        if not briefs:
            sys.exit("Error: no ep*-veo-insert-brief.json found to render")
        for bp in briefs:
            # With many briefs, ignore an explicit path and auto-derive per brief.
            emit_val = "__AUTO__" if len(briefs) > 1 else a.emit_md
            render_prompts_md(bp, md_path_for(bp, emit_val), cfg)
        sys.exit(0)

    if not a.dry_run:
        load_provider(a.plugin, a.agent_root)  # surface plugin errors early

    if a.all:
        if not a.brief_dir or not a.out_base:
            sys.exit("Error: --all needs --brief-dir and --out-base")
        briefs = sorted(Path(a.brief_dir).glob("ep*-veo-insert-brief.json"),
                        key=lambda p: int("".join(c for c in p.name.split("-")[0] if c.isdigit())))
        total_ok = total_fail = 0
        for i, bp in enumerate(briefs):
            ep = bp.name.split("-")[0]
            out = Path(a.out_base) / ep
            log(f"=== {ep} ({i + 1}/{len(briefs)}) ===")
            ok, fail = generate_brief(bp, out, cfg)
            total_ok += ok; total_fail += fail
            if i != len(briefs) - 1 and not a.dry_run:
                time.sleep(a.pause)
        log(f"ALL DONE: {total_ok} ok, {total_fail} failed")
        sys.exit(1 if total_fail else 0)

    brief = a.brief or os.environ.get("VEO_BRIEF_PATH")
    out = a.out or os.environ.get("VEO_OUT_DIR")
    if not brief or not out:
        sys.exit("Error: provide --brief and --out (or --all with --brief-dir/--out-base)")
    ok, fail = generate_brief(brief, out, cfg)
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
