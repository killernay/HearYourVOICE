# Assembly & Validation (phases 5–6) — editor-agnostic

The skill produces an **editor-neutral timeline**. Assemble the final cut in whatever you use — CapCut, Premiere Pro, DaVinci Resolve, or a code-based renderer (e.g. Remotion). The handoff is the same; only the import step differs.

## Insert plan (source-agnostic)

Before assembling, write the per-episode insert plan. Each insert:

```jsonc
{
  "beat_id": "ep1-003",
  "start_sec": 12,
  "end_sec": 18,
  "source": "generative",     // "shot" | "generative" | "cc" | "graphic"
  "file": "car-or-house-first/ep1/ep1-003.mp4", // omit for a graphic built in-editor
  "note": "reveal, slow push-in"
}
```

Rules (validated by `scripts/check-insert-plan.mjs`):

- Contiguous: each `start_sec == previous end_sec`; first starts at 0.
- Final `end_sec == target edit length` (from `voiceover-durations.json` = `audioFrames + TAIL_FRAMES` in seconds).
- `source` is one of the four; non-graphic inserts need a video `file`.
- Optional: subject-lock term on subject shots; max consecutive subject shots (anti-loop).

A `veo-insert-planner` brief already satisfies this for generative inserts (`source: generative`). Merge per-source lists into one ordered plan for mixed projects.

## Export the timeline

Run `scripts/export-timeline.mjs --slug <slug> --episode ep1 --brief <brief.json> --durations voiceover-durations.json`. It writes, into `src/<slug>/edit/`:

- `ep1-timeline.json` — universal: per-clip `startSec/endSec`, frame numbers, and SMPTE timecode (`HH:MM:SS:FF`).
- `ep1-timeline.csv` — one row per clip (`start_tc, end_tc, duration, source, file, note`) — follow it in any NLE.
- (with `--format all`/`code`) a code snippet for a programmatic renderer.

## Assemble (any editor)

The recipe is identical everywhere:

1. Put the **voiceover mp3 on one audio track** — it is the master clock. Do not retime it.
2. Place each clip at its `start_tc`, trim to its duration, and **mute every clip** (audio comes only from the voiceover; add an optional continuous ambience bed if desired).
3. Keep the canvas **9:16 · 1080×1920 · 30 fps**.
4. **Graphics beats** (`source: graphic`) are built in your editor — motion-graphics/typography/data viz. Use your tool's animation (NLE keyframes, templates, or a code renderer). Keep on-screen text minimal.
5. Export the final **mp4**.

**If you assemble in a code-based renderer (e.g. Remotion):** load `remotion-best-practices` (optional companion skill), generate starter files with `new-project.mjs --remotion`, and drive clips off the timeline JSON — narration via an audio component, each clip in a sequence at its frame range, muted; animate only off the frame, no CSS transitions. This is one supported target, not a requirement.

## Validation gates (phase 6) — all must pass, any editor

1. **The exported mp4 exists** for each episode.
2. `ffprobe out/<slug>-<id>.mp4` confirms **1080×1920, 30 fps**, `duration ≈ target`, and **audio length ≈ video length** (voiceover not cut off).
3. **Eyeball it** (or a few still frames): not blank, correct episode, Thai text fits, no rejected/loose footage, clips muted.
4. If you assembled in code, also run that tool's checks (lint/type-check/still render).

`package-delivery.mjs` runs the ffprobe checks for you and records them in `manifest.json` (`status: ready`/`incomplete`).

## Package + log

Run `scripts/package-delivery.mjs --slug <slug>` to gather everything into `delivery/<slug>/` with `manifest.json` (see `output-format.md`). Then update `CURRENT_STATE.md` (or your project log) and mark the topic done. → loop back to phase 0.
