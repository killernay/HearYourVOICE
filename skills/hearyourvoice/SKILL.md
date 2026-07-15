---
name: hearyourvoice
description: The complete, repeatable production workflow for short Thai documentary/explainer videos — from idea to a finished MP4 in any format. Use whenever the user wants to produce a video end to end or run any stage of it: research a topic, write a script, run an adversarial agent debate over the hook/punchline, generate ElevenLabs voiceover, gather visuals (self-shot mock shots, generative shots, or found Creative-Commons footage), and export a timecoded timeline to assemble in any editor. Format-agnostic: aspect/resolution/fps come from a per-project config (9:16, 16:9, 1:1, 4:5, custom) — nothing is hardcoded. Editor-agnostic: the final cut can be built in CapCut, Premiere, DaVinci Resolve, or a code-based renderer — the skill hands off a universal timeline (JSON + CSV) and a delivery folder. Footage source is flexible — generative (e.g. Google Veo) is ONE optional source, not required. Ships a 15-strong `hyv-*` subagent team (producer, researcher, scriptwriter, reviewer, storyboard, debate panel, judge, shotlister, voiceover, CC scout, prompt smith, Veo runner, assembler) so a whole video can be delegated or fanned out in parallel. Optionally orchestrates `veo-insert-planner` (generative footage) and `remotion-best-practices` (only if assembling in a code renderer).
---

# HearYourVOICE

The end-to-end loop that turns one topic into one finished vertical video. It is the **orchestrator** every project runs, regardless of where the footage comes from. Each phase either does work directly or hands off to a specialist skill.

**Footage is source-agnostic.** A finished video can use any mix of: shots you film yourself, generative shots (Google Veo or any model), found Creative-Commons clips, or motion graphics built in your editor. Generative is optional — many projects use zero Veo. Only load `veo-insert-planner` when you actually generate Veo shots.

**Editor-agnostic.** The skill exports a universal timeline (`edit/<ep>-timeline.json` + `.csv`); assemble the final cut in whatever you use — CapCut, Premiere, DaVinci Resolve, or a code-based renderer. The recipe is identical (see `references/assembly-and-validation.md`).

**Optional companion skills (loaded only when relevant):**

- `veo-insert-planner` — for the generative-footage path (silent Veo prompt briefs).
- `remotion-best-practices` — only if you choose to assemble in a code-based renderer (Remotion). Not required for NLE editors.

## The team — run it solo or delegate it

You can run every phase below yourself. You can also hand the work to the **`hyv-*` subagent team**
that ships with this skill (installed into `.claude/agents/`): `hyv-producer` drives the whole loop
by delegating to specialists — researcher, scriptwriter, script-reviewer, storyboard, the debate
panel + judge, shotlister, voiceover, cc-scout, veo-prompt-smith, veo-runner, assembler. Each owns
one phase, reads the output spec from `project.config.json`, and reports back; independent ones run
in parallel, and you can fan out one producer per topic to produce a backlog at once.

Two rules the team never breaks: **the human confirms the output spec and every gate** (topic lock,
split hook/punchline, spending voiceover or generative credits), and **`hyv-judge` recommends but
never rules** on creative direction. Full roster, decision chain, and config field reference:
`references/subagents.md`.

## Core invariants (never break these)

- **The output spec is read, never assumed.** Aspect, width/height, fps, and editor come from
  `src/<slug>/project.config.json` (template: `references/examples/project.config.example.json`).
  Defaults are vertical 9:16 · 1080×1920 · 30 fps, but 16:9, 1:1, 4:5 and custom are equally
  supported — every script takes `--aspect/--width/--height/--fps`. Confirm the config with the
  user before producing; never hardcode a frame.
- **The voiceover is the master clock.** Every visual's timecode is derived from the *measured* ElevenLabs audio duration — never from the written script's guessed length.
- **All visual clips are silent.** Self-shot, generative, and CC clips are muted on the timeline. Narration is its own audio track; ambience, if any, is one continuous bed under the voice.
- **Image-led, minimal on-screen text.** Thai captions only where they earn their place.
- One project = one `src/<slug>/` folder + assets under `public/<slug>/`; assembled in your editor, rendered to `out/`, packaged to `delivery/<slug>/`.

See `references/pipeline-loop.md` for the one-screen map + phase input/output contract, and `references/naming-conventions.md` for every path and filename pattern.

## The loop

```
0 Research ─▶ 1 Script + punchline debate ─▶ 2 Voiceover (master clock)
                                                      │
                                                      ▼
                                            3 Mock shots (self-shot or
                                              generative) — optional
                                                      │
                                                      ▼
6 Validate+log ◀─ 5 Prepare inserts ◀─ 4 Footage: find CC and/or
        │            onto TC               generate shots
        └─▶ back to 0 for the next topic
```

Phases 3 and 4 are where visuals come from — use whichever sources fit the project (often just one). Phase 2 (voiceover) **must** precede phases 4–5, because insert timing is derived from the measured audio.

---

## Phase 0 — Research the topic

**Goal:** pick one topic and assemble a factual brief.

1. The idea bank is `content-idea-log.md` (dated candidate topics). Add ideas here; pick one to produce.
2. Research it with `WebSearch` / `web_fetch` and any source docs the user provides. Capture sources for later attribution.
3. Write a research brief from `references/research-brief.template.md`: thesis, audience, the one surprising insight, key facts + sources, **subject lock** (the exact named subject so later prompts/visuals never drift), and visual opportunities.

**Output:** a research brief (chat or `src/<slug>/research.md`) and a chosen `slug`.

## Phase 1 — Script + punchline debate (เขียนบท + agent ต่อสู้กัน)

**Goal:** a thesis-driven, TTS-ready narration whose hook and punchline have survived an adversarial debate.

1. Draft `src/<slug>/script-v1.md`: title, one-line thesis, beats, closing. Prose is fine.
2. **Punchline debate** — before locking anything, run the adversarial multi-agent debate in `references/punchline-debate.md`. Spawn opposing reviewers with the `Agent` tool (Hook Maximalist vs Skeptic/Editor vs Target-Viewer), argue each candidate hook and closing line against the rubric, then a Judge pass picks and sharpens the winner. This is the "agents fighting over the punchline" step.
3. Rewrite into TTS-ready narration at `src/<slug>/voiceover-v1.md` following `references/script-and-voiceover-spec.md` — short lines, deliberate breaks for pacing, hook in the first ~3 s, explicit punchline beats. Put the voice-config block (voice id, `model: eleven_v3`, source) at the top.
4. **Build the shotlist** (`src/<slug>/shotlist.xlsx`) — give every beat a category-prefixed shot ID and plan capture/source/coverage. This is the artifact that makes the rest of the workflow easy; see `references/shotlist-format.md`. Scaffold a blank one with `scripts/new-shotlist.py`, or copy `references/examples/chado-NG-shotlist.xlsx`.

**Output:** `script-v1.md`, a locked `voiceover-v1.md`, and `shotlist.xlsx`. The locked hook/punchline gates phase 2.

## The shotlist (planning backbone)

The shotlist is the single artifact that threads phases 3–5: one row per unique shot, with the episodes that reuse it, how to capture or source it, the license, batch capture sessions, per-episode coverage, and a CC source log. Build it in phase 1 and keep its `status` column current as shots get captured/sourced/generated — at a glance you see what's left before assembly. Full column contract and the 5-sheet structure: `references/shotlist-format.md`. Its shot IDs flow straight into the phase-5 insert plan and the attribution list.

## Phase 2 — Voiceover (ลงเสียง) — the master clock

**Goal:** generate the narration and measure its real length; everything downstream times off this.

1. Generate with `scripts/gen-voiceover.mjs` (segmented per episode, reads `voiceover-v1.md`, writes `public/<slug>/voiceover/ep*.mp3`). Env: `ELEVENLABS_API_KEY` from `.env`, `VOICE_ID`, `MODEL=eleven_v3` (see `INSTALL.md` → *Environment & API keys*).
2. Measure every MP3 with `scripts/measure-voiceover.mjs` (uses `ffprobe`) → `src/<slug>/voiceover-durations.json`. Edit length per episode = `audioFrames + TAIL_FRAMES` (default 24 frames at 30 fps).

**Output:** `public/<slug>/voiceover/ep*.mp3` + `voiceover-durations.json`. Ask before spending ElevenLabs credits.

## Phase 3 — Mock shots (ถ่ายเอง หรือ generative) — optional

**Goal:** capture the bespoke shots — either filmed yourself or generated.

- **Self-shot:** raw captures → `public/<slug>/raw/`; review and cut **exact timestamp selects** only → `public/<slug>/select/`. Loose/random clips are rejected.
- **Generative mock:** if you want AI shots here, treat them as a footage source in phase 4 (see the generative path). Mock UI/infographics can instead be motion graphics built in your editor — note them as graphics beats for phase 5.

All selects are silent. **Output:** reviewed silent selects in `public/<slug>/select/`.

## Phase 4 — Footage: find and/or generate (Find footage หรือ generative shot)

**Goal:** assemble the pool of insert clips, from whichever sources fit. See `references/footage-sources.md` for the full matrix and how to choose. The four sources:

1. **Found Creative-Commons** — verify **CC BY** via `yt-dlp` metadata (YouTube's CC filter gives false positives). Download → `public/<slug>/cc/video/`, cut reviewed selects → `public/<slug>/cc/select/`, record credit/license/sourceUrl in `public/<slug>/ATTRIBUTION.md`.
2. **Generative (optional)** — build the silent scene brief from the measured durations (`scripts/gen-veo-briefs.mjs`, or `veo-insert-planner`), render the copy/paste prompt Markdown (`scripts/veo-generate.py --emit-md`; prompt recipe in `references/veo-prompt-guide.md`), generate clips → `public/<slug>/generated/ep*/`. Apply **subject lock** + **anti-loop variation** guards. Strip any audio (`ffmpeg -an`). Use this only when a generated shot beats the alternatives.
3. **Self-shot selects** from phase 3.
4. **Motion graphics** (built in your editor) — the always-available fallback; if no acceptable clip exists for a beat, make the beat a graphic. Never wire loose, unreviewed clips.

**Output:** a reviewed clip pool under `public/<slug>/` from one or more sources.

## Phase 5 — Prepare inserts onto TC + export timeline (เตรียม insert ลง TC)

**Goal:** build the source-agnostic insert plan and export an editor-neutral timeline against the voiceover master clock.

1. Build the **insert plan**: an ordered list per episode where each insert has `start_sec`, `end_sec`, `source` (`shot` | `generative` | `cc` | `graphic`), `file`, and a note. Timecodes are **contiguous** (each `start_sec == previous end_sec`) and the final `end_sec == target edit length` from `voiceover-durations.json`. Validate with `scripts/check-insert-plan.mjs`. (For the generative path, `veo-insert-planner`'s brief already is this plan with `source: generative`.)
2. **Export the timeline** with `scripts/export-timeline.mjs --slug <slug> --episode ep1 --brief <brief.json> --durations voiceover-durations.json` → writes `src/<slug>/edit/ep1-timeline.json` (frames + SMPTE timecode) and `ep1-timeline.csv` (one row per clip).
3. **Assemble in your editor** (see `references/assembly-and-validation.md`) — same recipe everywhere: voiceover mp3 on one audio track (master clock), each clip placed at its `start_tc` and **muted**, 9:16 · 30 fps. Works in CapCut, Premiere, DaVinci, or a code renderer (with `new-project.mjs --remotion` + `remotion-best-practices`).

**Output:** an editor-neutral timeline + a cut ready to render.

## Phase 6 — Validate, package, log

Render the final **mp4** from your editor, then run the editor-agnostic gates in `references/assembly-and-validation.md`: the mp4 exists; `ffprobe` confirms **1080×1920, 30 fps**, duration ≈ target, audio length ≈ video length; and you **eyeball** a few frames (not blank, correct episode, Thai text fits, clips muted). If you assembled in code, also run that tool's checks.

Then **package the deliverable** — the canonical output format (see `references/output-format.md`). The working files are scattered across `src/`, `public/`, and `out/`; `scripts/package-delivery.mjs --slug <slug>` gathers them into one standard `delivery/<slug>/` folder (`video/`, `voiceover/`, `script/`, `briefs/`, `attribution/`, `thumbnails/`) plus a canonical `manifest.json` and a `README.md`. The manifest reports per-episode checks and a `status` of `ready`/`incomplete`; it exits non-zero until every episode is `ready`. That folder is the hand-off.

Finally update `CURRENT_STATE.md` and mark the topic done in `content-idea-log.md`. → loop back to phase 0.

**The outcome of the skill is `delivery/<slug>/` with `manifest.json` reporting `status: ready`** — one folder you can upload or hand off, not scattered files.

---

## Scripts in this skill

Generic, project-agnostic helpers — these generalize the per-project chado `scripts/*` so a new project doesn't copy-paste and edit paths. Each prints `--help`.

Scaffolding / planning:

- `scripts/new-project.mjs` — scaffold `src/<slug>/` (`research.md`, `script-v1.md`, `voiceover-v1.md`, `edit/`, `veo/`) and `public/<slug>/` (`voiceover/`, `raw/`, `select/`, `cc/`, `generated/`). Editor-agnostic; pass `--remotion` to also emit a code-renderer starter.
- `scripts/new-shotlist.py` — blank 5-sheet `shotlist.xlsx` (needs `openpyxl`).

Voiceover (phase 2):

- `scripts/gen-voiceover.mjs` — **generic ElevenLabs generator** (replaces the per-project `gen-<slug>-voiceover.sh`). Reads `voiceover-v1.md` `## EP<n>/VO:` segments, `--voice-id`/`--model`, writes `public/<slug>/voiceover/ep*.mp3`, measures each. Needs Node 18+ and `ELEVENLABS_API_KEY`.
- `scripts/measure-voiceover.mjs` — `ffprobe` a voiceover folder → `voiceover-durations.json` (`audioSec`, `audioFrames`, `sceneFrames`, `targetSec`).

Footage / inserts (phases 4–5):

- `scripts/gen-veo-briefs.mjs` — **config-driven Veo brief builder + guards** (generalizes `gen-chado-veo-briefs.mjs`). Project specifics live in a JSON config (`references/examples/veo-briefs.config.example.json`): subject lock, style descriptors, negative terms, per-episode focuses, and guard thresholds (min none-shots, max subject-shots, max consecutive subject, no-duplicate prompts, reject-term enforcement). Only for the generative path.
- `scripts/veo-generate.py` — **portable Veo clip runner** (generalizes `generate_ep1_veo.py`). Point `--plugin`/`--agent-root` at your Veo provider; `--brief`/`--out` at the episode. Forces silent output, pads to exact duration, supports `--all` batch and `--dry-run`. Also `--emit-md` renders the copy/paste prompt Markdown (`ep*-google-veo-insert-prompts.md`) from a brief — no provider needed; prompt recipe in `references/veo-prompt-guide.md`.
- `scripts/check-insert-plan.mjs` — validate a source-agnostic insert plan vs the durations manifest: contiguous timecodes, final `end_sec == target`, valid `source`, `.mp4`/graphic files, optional subject-lock / anti-loop (`visual_strategy`-aware).
- `scripts/export-timeline.mjs` — turn a brief + durations into an **editor-neutral timeline**: `ep*-timeline.json` (frames + SMPTE timecode) and `ep*-timeline.csv` (one row per clip) for CapCut/Premiere/DaVinci, plus an optional code-renderer snippet. Source-agnostic.

Deliverable (phase 6):

- `scripts/package-delivery.mjs` — gather the scattered working files into the standard `delivery/<slug>/` folder + canonical `manifest.json` + `README.md`, ffprobe-verifying every render. This is the skill's output format (`references/output-format.md`).

## When to stop and ask

Ask the user before: choosing the topic (phase 0), locking the hook/punchline when the debate is split (phase 1), spending ElevenLabs credits (phase 2), and spending generative credits (phase 4). These are the costly or irreversible steps.
