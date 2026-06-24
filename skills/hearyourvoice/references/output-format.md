# Output Format — the HearYourVOICE deliverable

The working files live scattered across `src/<slug>/`, `public/<slug>/`, and `out/` (that's normal for a video project). The **deliverable** is a single consolidated folder, `delivery/<slug>/`, assembled by `scripts/package-delivery.mjs`. That folder — not the scattered working files — is what you hand off, archive, or upload.

This is the canonical output format of the skill. "Done" = a `delivery/<slug>/` whose `manifest.json` reports `status: "ready"`.

## Folder structure (fixed)

```
delivery/<slug>/
  manifest.json            ← canonical machine-readable index (see schema below)
  README.md                ← auto-generated human summary (episodes, durations, status)
  video/
    <slug>-ep01.mp4        ← final renders, zero-padded ids
    …
    <slug>-epNN.mp4
    <slug>-series.mp4      ← full series (if rendered)
  thumbnails/
    ep01.png …             ← one poster frame per episode (optional)
  voiceover/
    ep01.mp3 …             ← the narration tracks
  script/
    voiceover-v1.md        ← locked TTS narration (hook + punchline)
    script-v1.md           ← the draft (optional)
    shotlist.xlsx          ← the planning shotlist
  briefs/
    ep01-insert-brief.json … ← the per-episode insert plans
  attribution/
    ATTRIBUTION.md         ← credits + licenses for any sourced footage
```

Everything a downstream person needs is under one folder, in predictable subfolders. No hunting through `src/` and `public/`.

## manifest.json schema (`format: hearyourvoice-deliverable`, v1)

```jsonc
{
  "format": "hearyourvoice-deliverable",
  "formatVersion": 1,
  "slug": "chado-series",
  "title": "ชะโด: นักล่าแห่งผืนน้ำ",
  "video": { "aspect": "9:16", "width": 1080, "height": 1920, "fps": 30 },
  "subjectLock": { "exact": "Giant Snakehead (Channa micropeltes)", "rejectTerms": ["Channa striata", "ปลาช่อน"] },
  "generatedAt": "2026-06-24T00:00:00Z",
  "status": "ready",                 // "ready" | "incomplete"
  "summary": { "episodes": 10, "ready": 10, "incomplete": 0 },
  "episodes": [
    {
      "id": "ep1",
      "title": "นักล่าที่ไม่ได้ฆ่าเพราะหิว",
      "voiceFile": "voiceover/ep01.mp3",
      "voiceSec": 86.99,
      "targetSec": 88,
      "durationInFrames": 2634,
      "insertCount": 15,
      "sources": { "generative": 15, "cc": 0, "shot": 0, "graphic": 0 },
      "brief": "briefs/ep01-insert-brief.json",
      "render": { "file": "video/chado-series-ep01.mp4", "exists": true,
                  "width": 1080, "height": 1920, "fps": 30, "durationSec": 88.0, "audioSec": 88.02 },
      "checks": { "contiguous": true, "endMatchesTarget": true, "audioMatchesVideo": true },
      "status": "ready",
      "issues": []
    }
  ]
}
```

The manifest is the single source of truth: it lists every episode, where its render is, how long it is, where the inserts came from, the licensing, and whether each validation check passed.

## Definition of done (per episode)

An episode is `ready` when all of these hold (the packager checks them and records `issues` when they don't):

1. `voiceFile` exists and `voiceSec` measured.
2. `brief` exists, is contiguous, and its final `end_sec == targetSec`.
3. `render.file` exists and `ffprobe` confirms `width×height` and `fps` match the project, `durationSec ≈ targetSec`, and `audioSec ≈ durationSec`.
4. Any `cc` insert has an attribution row.

The project is `ready` when every episode is `ready`.

## How it's produced

Run after phase 6 renders:

```bash
node scripts/package-delivery.mjs --slug <slug> \
  --root . --dest delivery \
  --durations src/<slug>/voiceover-durations.json \
  --briefs src/<slug>/veo --renders out --voiceover public/<slug>/voiceover
```

It copies the scattered files into `delivery/<slug>/`, ffprobe-verifies every render, writes `manifest.json` + `README.md`, and exits non-zero if `status != ready` (so it can gate CI / a release). Re-run any time; it's idempotent.
