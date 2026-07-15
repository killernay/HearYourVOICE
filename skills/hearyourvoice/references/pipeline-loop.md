# Pipeline Loop — map + phase contract

One topic in, one finished MP4 out — in whatever format `project.config.json` asks for (defaults 9:16). Footage source is flexible; generative is optional.

```
        ┌──────────────────────────────────────────────────────────────┐
        │                      HEARYOURVOICE LOOP                       │
        └──────────────────────────────────────────────────────────────┘

 0 Research ─▶ 1 Script + punchline debate ─▶ 2 Voiceover (master clock)
                  (agents fight over hook)          (ElevenLabs + ffprobe)
                                                            │
                                                            ▼
                                              3 Mock shots (optional)
                                                 self-shot / generative
                                                            │
                                                            ▼
                                              4 Footage pool
                                                 find CC  ·  generate (Veo)
                                                 self-shot ·  graphics
                                                            │
                                                            ▼
 6 Validate + log  ◀──────  5 Prepare inserts onto TC  ◀────┘
   lint · stills · ffprobe       (contiguous timecodes,
   update CURRENT_STATE.md        editor assembly)
        │
        └─▶ next topic
```

## Phase contract

| # | Phase | Input | Output | Skill to load |
|---|-------|-------|--------|---------------|
| 0 | Research | topic from `content-idea-log.md` | research brief + `slug` + subject lock | — (WebSearch) |
| 1 | Script + punchline debate | research brief | `script-v1.md`, locked `voiceover-v1.md`, `shotlist.xlsx` | `Agent` (debate) |
| 2 | Voiceover | locked `voiceover-v1.md` | `public/<slug>/voiceover/ep*.mp3`, `voiceover-durations.json` | — (ElevenLabs) |
| 3 | Mock shots *(opt)* | shot list | reviewed selects `public/<slug>/select/` | — |
| 4 | Footage | durations + beats | clip pool (`cc/select`, `generated/`, `select/`, graphics) | `veo-insert-planner` *(only if generative)* |
| 5 | Prepare inserts → TC | clip pool + durations | insert plan + editor timeline | your editor |
| 6 | Validate + package + log | composition | **`delivery/<slug>/` + `manifest.json`** (the deliverable), updated `CURRENT_STATE.md` | your editor |

**The outcome** is the `delivery/<slug>/` folder (see `output-format.md`): one place with `video/`, `voiceover/`, `script/`, `briefs/`, `attribution/`, and a canonical `manifest.json` reporting `status: ready`. Built by `package-delivery.mjs`.

**Planning backbone:** the `shotlist.xlsx` (built in phase 1, see `shotlist-format.md`) threads phases 3–5 — one row per shot, reuse across episodes, capture/source/license, batch sessions, per-episode coverage. Keep its `status` current.

## Hard ordering rules

- **2 before 4 and 5.** Insert timecodes are derived from the *measured* voiceover, so the audio must exist and be measured first.
- **1's punchline debate before 2.** Don't spend an ElevenLabs generation on an un-stress-tested hook.
- **4's reviewed selects before 5.** Never wire loose/unreviewed clips into the timeline; fall back to graphics instead.

## Footage source matrix (phase 4)

| Source | When to use | Lives in | Silent? |
|--------|-------------|----------|---------|
| Self-shot mock | you can film it cheaply / authenticity matters | `public/<slug>/select/` | yes |
| Generative (Veo) | shot is impossible/expensive to film; needs exact framing | `public/<slug>/generated/ep*/` | yes (strip audio) |
| Found CC BY | real-world action exists on YouTube under CC BY | `public/<slug>/cc/select/` | yes (muted) |
| Motion graphics | data/diagrams/typography, or nothing acceptable found | built in your editor | n/a |

A single episode may mix several sources. Generative is never required.

## Gate checklist between phases

- After 2: every episode has an MP3 and a measured duration in the manifest.
- After 4: every beat has either a reviewed clip or a planned graphic — no gaps, no loose clips.
- After 5: `check-insert-plan.mjs` passes (contiguous, final `end_sec == target`).
- After 6: lint passes, stills inspected, full render `ffprobe`-verified, `CURRENT_STATE.md` updated.
