# Veo prompt guide — silent documentary inserts

How this skill writes Google Veo prompts for **silent visual inserts** that drop onto an already-recorded voiceover. This is the prompt *recipe*; the timing/ratio/subject-lock doctrine lives in `footage-sources.md` and `research-brief.template.md` — this page points there rather than restating it.

Only for the **generative footage path** (phase 4). Many videos never need it (graphics + self-shot + CC).

## Two artifacts, one source of truth

| file | what | who writes it |
|------|------|---------------|
| `src/<slug>/veo/ep*-veo-insert-brief.json` | **canonical** machine-readable scene brief (one object per scene) | `scripts/gen-veo-briefs.mjs` (config-driven) — or `veo-insert-planner` (hand-authored) |
| `src/<slug>/veo/ep*-google-veo-insert-prompts.md` | the **copy/paste** prompt version for the Veo UI | `scripts/veo-generate.py --emit-md` (renders it from the brief) |

The Markdown is *derived* from the brief — never hand-edit it; change the config/brief and re-render. Render with:

```bash
python3 scripts/veo-generate.py --brief src/<slug>/veo/ep1-veo-insert-brief.json --emit-md
python3 scripts/veo-generate.py --brief-dir src/<slug>/veo --all --emit-md   # whole series
```

`--emit-md` needs no Veo provider — it's a documentation step. To actually generate the clips, run `veo-generate.py` without `--emit-md` (point `--plugin`/`--agent-root` at your provider), or paste each scene block into the Veo UI by hand.

## Prompt anatomy

Every scene's prompt = a shared **silent-insert prefix** + six per-scene parts, all built in `veo-generate.py` (`GENERIC_PREFIX` + `scene_prompt_parts()`). The copy/paste block embeds the full prefix in every scene so each pastes independently.

**Global prefix** (the silent-insert contract — every line earns its place):

```text
Create a silent vertical video insert for an existing narrated documentary.
Use Google Veo to generate video only. Do not generate narration, dialogue,
music, ambience, or sound effects. The output video must be silent; if audio
is an option, disable it. The voiceover is already generated separately and the
reference line below is only for visual timing and meaning — do not read it aloud.
Aspect ratio: vertical 9:16. No text, subtitles, captions, logo, watermark, UI,
letters, typography, or labels.
```

Why each rule: the voiceover is the **master clock** and already exists, so Veo must add *no* audio (strip it anyway with `ffmpeg -an`); the format is locked 9:16; on-screen text/logos/UI break the documentary look and fight the editor's own captions.

**Per-scene parts** (each maps to a brief field):

| line in the prompt | brief field | purpose |
|--------------------|-------------|---------|
| `Generate exactly N seconds.` | `insert_duration_sec` | exact clip length off the measured voice timeline — never shorter |
| `Voiceover reference, do not read aloud: …` | `vo_line` | meaning/timing only, so the visual matches the words under it |
| `Visual: …` | `visual_prompt` | the shot itself + subject lock + the *unique shot design* (anti-loop) |
| `Camera: …` | `camera_motion` | e.g. `slow forward drift`, `locked-off observational shot` |
| `Composition: …` | `edit_note` | timecode + what the shot supports |
| `Avoid: …` | `negative_prompt` | reject look-alikes, loops, on-screen text, gore, stock-footage look |

## The two guards that make generated footage usable

These are the difference between a clean cut and a drifting, looping mess. Full rules + per-project ratios: `footage-sources.md`; the subject definition: `research-brief.template.md`.

- **Subject lock** — every `subject` shot names the exact subject; the negative prompt rejects look-alikes. The brief carries this in `visual_prompt`/`negative_prompt`; `gen-veo-briefs.mjs` enforces it and `check-insert-plan.mjs` validates it. *Chado example:* lock `Giant Snakehead (Channa micropeltes) / ปลาชะโด`, reject `Channa striata / ปลาช่อน / common snakehead` — this is what stopped footage drifting to the wrong fish.
- **Anti-loop variation** — each scene has a `visual_strategy` (`subject`, `none`/`no_fish`, or `context`). Cap consecutive `subject` shots and interleave no-subject/context shots, or Veo returns the same shot circling. *Chado EP1 guard:* ≥8 `none` scenes, ≤6 `subject` scenes, ≤2 consecutive `subject`, no duplicate prompts. Set the equivalent ratio per project.

## Worked example (chado EP1, Scene 001)

Brief object → rendered block:

```text
… (global prefix) …

Generate exactly 6 seconds.
Voiceover reference, do not read aloud: ใต้ผิวน้ำสีชา ของเมืองไทย มีนักล่าตัวหนึ่ง รออยู่เงียบ ๆ …
Visual: realistic cinematic wildlife documentary, Thai freshwater habitat, dark tea-colored water, … no fish visible in this shot, unique shot design: wide empty habitat establishing shot …
Camera: slow forward drift
Composition: 00:00-00:06 Visual supports: ใต้ผิวน้ำสีชา …
Avoid: text, subtitles, captions, logo, …, common snakehead, Channa striata, ปลาช่อน, …, repetitive circling fish, aquarium loop, …, visible fish
```

Note `visual_strategy: no_fish` → the prompt actively asks for an empty habitat and the `Avoid` list bans visible fish. That single empty-establishing shot is what buys the anti-loop budget for the `subject` shots elsewhere.

## End-to-end (phase 4 generative path)

1. `gen-veo-briefs.mjs --config <cfg>` → writes the JSON brief(s) with subject-lock + anti-loop baked in.
2. `check-insert-plan.mjs` → validate timing contiguity, subject lock, anti-loop ratios.
3. `veo-generate.py --emit-md` → the copy/paste prompt Markdown (this guide's artifact).
4. Generate: `veo-generate.py` (your provider plugin) **or** paste each block into the Veo UI.
5. Strip audio (`ffmpeg -an`), drop clips onto the timeline at their timecodes.

> `veo-insert-planner` (optional companion skill) is an alternative front end: it can hand-author the brief and render the same Markdown. The skill works fully without it via the scripts above.
