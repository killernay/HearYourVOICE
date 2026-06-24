# Naming Conventions

One project = one `slug`. Everything hangs off it.

## Slug

`kebab-case`, stable for the life of the project. Examples in the repo: `chado-series`, `ai-bilge-pump`, `tourism-demand`, `trip-cost`, `water-sports-review`, `thai-hornbill`, `broadbill`, `liveaboard-packing`.

## Folders & files

```
src/<slug>/
  research.md                       # research brief
  script-v1.md                      # thinking draft
  voiceover-v1.md                   # TTS-ready narration (ElevenLabs reads this)
  voiceover-durations.json          # measured audio → frames (master clock)
  shotlist.xlsx                     # the planning shotlist (see shotlist-format.md)
  edit/                             # exported timelines for your editor
    ep*-timeline.json               # frames + SMPTE timecode
    ep*-timeline.csv                # one row per clip (CapCut/Premiere/DaVinci)
  veo/                              # only if using the generative path
    ep*-veo-insert-brief.json
    ep*-google-veo-insert-prompts.md
    generation-log.json
  config.ts, <Name>.tsx             # OPTIONAL — only if assembling in a code renderer

public/<slug>/
  voiceover/ep1.mp3 … epN.mp3       # narration tracks
  raw/                              # self-shot raw captures (working pool)
  select/                          # reviewed self-shot timestamp selects
  cc/video/                        # downloaded CC BY sources (pool)
  cc/select/                       # reviewed CC timestamp selects (active)
  generated/ep*/                   # silent generative clips
  ATTRIBUTION.md                   # credit/license for all sourced footage

scripts/gen-voiceover.mjs           # ElevenLabs generator (generic, project-agnostic)
out/<slug>-<id>[-fN].(mp4|png)      # renders & stills
```

## IDs

- Episode ids: `ep1`…`epN` (lowercase) in data; `EP1`…`EPN` for display; composition ids `…EP01`…`…EP10` (zero-padded).
- Scene/insert ids: `<slug-or-ep>-NNN` zero-padded, e.g. `ep1-003`.
- Output filenames: `<asset_name>.mp4`, lowercase kebab, e.g. `ep1-003-underwater.mp4`.

## Shot IDs (shotlist taxonomy)

Each shot in the shotlist gets a category-prefixed id, reused across every episode that needs it. These same ids appear in the insert plan and in the "Episode Coverage" sheet. Prefixes used in the chado shotlist:

| Prefix | Category (หมวด) | Typical source |
|--------|-----------------|----------------|
| `UW-`  | Underwater | CC / stock / controlled tank / generative |
| `SUR-` | Surface (ผิวน้ำ) | self-shot golden hour / CC |
| `HAB-` | Habitat / mood | self-shot drone/gimbal |
| `LRM-` | Lure — macro (เหยื่อ close-up) | self-shot studio |
| `LRA-` | Lure — action (เหยื่อทำงาน) | self-shot pond / CC |
| `ACT-` | Action (จับ/กัด/รอก) | CC / self-shot |
| `GFX-` | Graphics (ทำใน post) | editor-native |

Define the prefix set per project from its categories (a cooking video might use `PREP-`, `COOK-`, `PLATE-`, `GFX-`). Keep ids stable so reuse and coverage tracking stay correct.

## Voice config

`VOICE_ID` per project, `MODEL=eleven_v3`, key from `.env`. Keep a project's voice id in the `voiceover-v1.md` config block. Don't overwrite one take with a different voice — keep both if undecided.
