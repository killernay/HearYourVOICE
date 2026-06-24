# hearyourvoice

The complete, repeatable production workflow for short vertical Thai documentary/explainer videos — idea → finished 9:16 MP4. Editor-agnostic: it exports a universal timeline (JSON + CSV) you assemble in CapCut, Premiere, DaVinci Resolve, or a code renderer. Footage is source-agnostic (self-shot, generative, found CC, or graphics); generative is optional.

Start at `SKILL.md`. It optionally orchestrates two companion skills when present:

- `veo-insert-planner` — only when generating Google Veo shots.
- `remotion-best-practices` — only if you assemble in a code renderer (Remotion); not needed for NLE editors.

## Layout

```
SKILL.md                         the orchestrator (phases 0–6)
references/
  pipeline-loop.md               one-screen map + phase contract
  research-brief.template.md     phase 0
  script-and-voiceover-spec.md   phase 1 (TTS-ready narration)
  punchline-debate.md            phase 1 (agents fight over hook/punchline)
  shotlist-format.md             the planning backbone (5-sheet xlsx)
  footage-sources.md             phase 4 (find vs generate vs self-shot vs graphics)
  veo-prompt-guide.md            phase 4 (Google Veo prompt recipe — generative path)
  assembly-and-validation.md     phases 5–6 (assembly wiring, any editor, + gates)
  output-format.md               the deliverable: delivery/<slug>/ + manifest.json
  naming-conventions.md          slugs, paths, shot-ID taxonomy
  examples/chado-NG-shotlist.xlsx   worked shotlist example
scripts/
  new-project.mjs                scaffold src/<slug> + public/<slug> (+ code-renderer starter with --remotion)
  new-shotlist.py                blank 5-sheet shotlist.xlsx (needs openpyxl)
  gen-voiceover.mjs              generic ElevenLabs VO generator (replaces gen-<slug>-voiceover.sh)
  measure-voiceover.mjs          ffprobe mp3s -> voiceover-durations.json
  gen-veo-briefs.mjs             config-driven Veo brief builder + guards
  veo-generate.py                portable Veo clip runner (pluggable provider)
  check-insert-plan.mjs          validate insert plan vs durations
  export-timeline.mjs            brief + durations -> editor-neutral timeline (JSON + CSV)
  package-delivery.mjs           gather scattered files -> delivery/<slug>/ + manifest.json
references/examples/
  chado-NG-shotlist.xlsx         worked shotlist example
  veo-briefs.config.example.json worked brief-builder config (chado, generalized)
  project.manifest.example.json  worked deliverable manifest
```

The skill's outcome is one folder: `delivery/<slug>/` with `video/*.mp4` + `manifest.json` (status ready). See `references/output-format.md`.

Every script prints `--help`. The `.mjs` need Node 18+; `new-shotlist.py`/`veo-generate.py` need Python 3 (openpyxl for the shotlist).

**API keys / env:** voiceover needs `ELEVENLABS_API_KEY` (+ `VOICE_ID`, `MODEL` default `eleven_v3`); generative footage needs your Veo provider key plus `VEO_PLUGIN_PATH`/`VEO_AGENT_ROOT` — only if you run that path. Scripts read these from the shell env or a project `.env`. Canonical list: `INSTALL.md` → *Environment & API keys* (or each script's `--help`).

## The loop

0 Research → 1 Script + punchline debate → 2 Voiceover (master clock) → 3 Mock shots (optional) → 4 Footage (find/generate) → 5 Prepare inserts onto TC → 6 Validate + log → back to 0.
