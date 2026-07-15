---
name: hearyourvoice
description: The repeatable workflow for short Thai documentary/explainer videos — one topic in, one finished MP4 out. Use when producing a video end to end or running any stage: research a topic, write a script, run an adversarial agent debate over the hook/punchline, generate ElevenLabs voiceover, gather visuals (self-shot, Creative-Commons, or generative), lay timecoded inserts on a timeline, and package a delivery folder. Format-agnostic: aspect/resolution/fps come from a per-project config (9:16, 16:9, 1:1, custom) — nothing is hardcoded. Editor-agnostic: assemble in CapCut, Premiere, DaVinci, or a code renderer from a universal timeline (JSON + CSV). Generative footage (e.g. Veo) is one optional source, never required. Ships a 16-strong `hyv-*` subagent team led by `hyv-producer`, so a video can be delegated whole or fanned out in parallel. The reasoning half runs anywhere; steps that shell out (ffprobe, yt-dlp, ffmpeg, your editor) need Claude Code.
---

# HearYourVOICE

## The recipe — run this, don't read the library first

**A topic and a `.env` with `ELEVENLABS_API_KEY` + `VOICE_ID` is everything you need to start.**
Everything below this section is reference for when a step surprises you. Do not read it up front,
do not open `references/*` to orient, and **never read a script's source to work out how it
behaves — run it with `--help`, or just run it: they all print what they need and refuse safely.**

```bash
HYV=$(ls -d .claude/skills/hearyourvoice ~/.claude/skills/hearyourvoice 2>/dev/null | head -1)

# 0 · scaffold (writes src/<slug>/ + public/<slug>/ + .env if missing)
node "$HYV/scripts/new-project.mjs" --slug <slug> --title "<ชื่อ>"

# 1 · research → write src/<slug>/research.md yourself
#     3 facts, ≥2 INDEPENDENT sources each, ≤6 WebFetch. Then stop and write.

# 2 · script → write src/<slug>/voiceover-v1.md yourself
#     Format: "## EP1 - <title>" then a blank line, "VO:", blank line, the narration.

# 3 · voiceover — the gate prints the bill and exits 2; that is the gate working
node "$HYV/scripts/gen-voiceover.mjs" --slug <slug>          # shows characters billed
node "$HYV/scripts/gen-voiceover.mjs" --slug <slug> --yes    # only after a human OK

# 4 · the master clock (this file is what every later timecode is built from)
node "$HYV/scripts/measure-voiceover.mjs" --dir public/<slug>/voiceover \
     --out src/<slug>/voiceover-durations.json
```

**Voice, model and format come from `.env` on their own.** Don't pass `--voice-id` unless the
human named a specific voice — an empty `voice_id` in the config means "use `.env`", and passing
the config's empty/placeholder value overrides `.env` and breaks the call.

That is the whole `voice` mode. Stop there and hand it back: they hear the script before anyone
builds visuals for it. `full` mode continues at [phase 4](#phase-4--footage-find-andor-generate-find-footage-หรือ-generative-shot).

**Budget your reading.** Every file you open before starting is wall-clock the human waits
through. One measured run spent **5 of its 16 minutes** reading templates, `--help` output and
script source before its first search. The recipe above is the orientation; anything else, open it
when you hit the thing it explains.

---

The end-to-end loop that turns one topic into one finished video, in whatever format the project config asks for. It is the **orchestrator** every project runs, regardless of where the footage comes from. Each phase either does work directly or hands off to a specialist.

**Footage is source-agnostic.** A finished video can use any mix of: shots you film yourself, generative shots (Google Veo or any model), found Creative-Commons clips, or motion graphics built in your editor. Generative is optional — many projects use zero Veo. Only load `veo-insert-planner` when you actually generate Veo shots.

**Editor-agnostic.** The skill exports a universal timeline (`edit/<ep>-timeline.json` + `.csv`); assemble the final cut in whatever you use — CapCut, Premiere, DaVinci Resolve, or a code-based renderer. The recipe is identical (see `references/assembly-and-validation.md`).

**Optional companion skills (loaded only when relevant):**

- `veo-insert-planner` — for the generative-footage path (silent Veo prompt briefs).
- `remotion-best-practices` — only if you choose to assemble in a code-based renderer (Remotion). Not required for NLE editors.

## First move: one worker per video — including you

**One video? Do it yourself.** Follow the recipe above. Do not spawn a chain of specialists to
hand one script down a line: research → script → hook → voice can't overlap, so splitting it adds
a fresh context per link and buys nothing. **Measured: solo 4:38 to a real voiceover; the same job
through a delegation chain hadn't finished at 13 minutes.**

**Several videos? *That's* what the team is for.** One `hyv-producer` per topic, in parallel, each
doing its own whole chain in its own `src/<slug>/`. Three videos in roughly the time of one —
three workers, not one worker under three foremen.

**Spawn ACROSS, never DOWN.**

```
down   A → B → C          3 handoffs · 3× the time · same one answer
across A ∥ A ∥ A → pick   0 handoffs · 1× the time · best of three
```

Down a chain, agents lose: every link is a fresh context re-reading what the last one knew.
**Across the same input they win, and it costs no wall clock at all** — three agents on one brief
finish in the time of one, and you keep the best. You pay tokens, not minutes.

So spawn for **competition**:

1. **Three `hyv-scriptwriter` on one brief, in ONE message** — three angles, then
   `hyv-script-reviewer` (the บก) picks one and names its fixes. This is not theory: the hook
   debate already works this way and produced *"ในคน 100 คนที่คิดแบบนี้ เป็นไซนัสจริง แค่ 3 คน — แล้วอีก 97 คนล่ะ"*,
   which no single writer here came up with.
2. **The debate panel** — `hyv-hook-maximalist` ∥ `hyv-skeptic-editor` ∥ `hyv-target-viewer` →
   `hyv-judge`, when the winning hook is still contested. Independence *is* the product: each must
   argue without seeing the others, impossible in one context. Three in ONE message, then the judge.
3. **The human named a specialist.**

The rest of the `hyv-*` files are worth their weight as **spec** — how each phase is done, its
gates, what it must never fake. **Read the spec; don't hire the agent** for a step you can do
yourself with the brief already in your context.

Don't go looking for agents on disk: they arrive by several routes (`.claude/agents/`, a plugin, a
marketplace), and a missing file proves nothing except that you looked in the wrong place.

**The phase numbers are a data order, not a queue.** Spawn everything whose inputs already exist,
at once. In particular **`cc-scout`, graphics and your own filming don't need the audio** — they
read the shotlist, so start them *with* phase 2, not after it. One is a slow API call, the other
slow web search; running them back to back pays for both. (The generative branch is the one real
exception: a Veo prompt must state its exact seconds, so `prompt-smith` waits for the measured
clock — `gen-veo-briefs.mjs` requires `--durations`.) Phase 5 waits by nature: it joins the clock
to the clip pool.

Delegating keeps each phase's noise — search results, ffprobe output, clip listings — out of the
main conversation; you get the summary, not the logs. **If no `hyv-*` subagent is available to
you, run the phases below yourself and say so once**, so the user knows they got the solo path.
Everything works solo; the team is an accelerator, not a requirement. To add it:
`npx hearyourvoice install` (Claude Code) or install the plugin. Full roster and decision chain:
`references/subagents.md`.

Two rules that hold either way: **the human confirms the output spec and every gate** (topic lock,
split hook/punchline, spending voiceover or generative credits), and **`hyv-judge` recommends but
never rules** on creative direction.

## Know what you can actually run — then say so

Half this loop is pure reasoning. The other half shells out to real binaries on a real machine.
Which half you can do depends on where you are running, so check before you promise:

| Work | Needs | Runs where |
|---|---|---|
| research · script · review · storyboard · debate panel · judge | reasoning (+ web search) | anywhere — chat, Cowork, Claude Code |
| **shotlister** (`new-shotlist.py`, openpyxl) · **voiceover** (ffprobe) · **cc-scout** (yt-dlp) · **veo-runner** · **assembler** (ffmpeg + your editor) | a local shell + binaries + your files | **Claude Code only** |

Note `hyv-shotlister` is phase 1 but still needs Python — **the line is drawn by tool dependency,
not by phase number**.

> ### 🛑 Hard stop — never simulate the machine half
>
> If you cannot run shell commands, you **cannot** do the second row. Do not fake it:
>
> - **Never invent durations** or write a `voiceover-durations.json` you did not measure with
>   `ffprobe`. The master clock is measured audio — a guessed number silently breaks every
>   timecode downstream and the error is invisible until the render is wrong.
> - **Never claim** a file was generated, a clip downloaded, a license verified, or a video
>   rendered unless you ran the command and saw it succeed.
>
> Stop instead, say which step needs a local shell, and tell the user to run it in Claude Code
> (`npx hearyourvoice install`). A correct refusal beats a plausible fabrication.

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

## How far to go — ask, then stop there

**Not every request wants a finished video.** How far you run is a dial the human sets, and each
stop is a real deliverable, not a half-done run — every mode's output is exactly the input the
next one needs:

| Mode | You stop after | They get | Measured |
|---|---|---|---|
| **`script`** | phase 1e | research brief · script with a ranked hook · `shotlist.xlsx` | ~8–10 min |
| **`voice`** ← ask for this if unsure | phase 2 | the above **+ real voiceover mp3 + the measured clock** | ~12–15 min |
| **`full`** | phase 6 | the above **+ footage + timeline + rendered mp4 + `delivery/`** | ~25–30 min |

**Quote these honestly.** Every specialist is ~2–3 minutes of wall clock, and a chain of eight is
20+ minutes however much runs in parallel — parallelism makes *three topics* finish together, it
does not shorten one chain. Add ~4 min if the debate runs, and skip nothing to make a number look
better. Telling someone "6 minutes" and delivering 25 is worse than saying 25.

**`voice` is the useful default when the human hasn't said.** The voiceover is the master clock,
so it is also the natural checkpoint: they hear whether the script actually works before anyone
spends time sourcing twenty images for it. A script that sounds wrong out loud should die at
6 minutes, not at 15 — and the audio is what tells you.

**`script` hands the work to the human on purpose.** The shotlist is a work order: one row per
shot, how to capture or source it, the licence. Phase 3 already has no agent — nobody can hold
your camera — and phase 4 can work the same way when the human would rather pick the visuals
themselves. Stopping there is a finished job, so report it as one.

Say which mode you are running, once, before you start. When they only asked for "a video about
X", ask which they want rather than assuming `full` — it is the most expensive answer to a
question they may not have asked.

## The loop

```
0a Ideas ─▶ ══ you pick ══ ─▶ 0b Research (may kill the premise)
                                     │
                                     ▼
   1 Script + punchline debate ─▶ ══ hook locked ══
                                                     │
                        ┌────────────────────────────┴────────────────────────┐
                        ▼                                                     ▼
              2 Voiceover (master clock)                      3 Mock shots — optional, you film
                generate ─▶ ffprobe                           4 Footage — find CC · graphics
                        │                                        (need no audio: start now)
                        └────────────────────────────┬────────────────────────┘
                                                     ▼
                                       4' Generative shots — optional
                                          prompts need the measured seconds,
                                          so this branch waits for 2
                                                     │
                                                     ▼  join: measured clock + clip pool
                                          5 Prepare inserts onto TC
                                                     │
                                                     ▼
                                          6 Validate + package
                                                     │
                                                     └─▶ back to 0 for the next topic

Left and right start together — CC scouting and graphics never touch the audio. Only the
generative branch and 5 have to wait.
```

Phases 3 and 4 are where visuals come from — use whichever sources fit the project (often just one). Phase 2 (voiceover) **must** precede phases 4–5, because insert timing is derived from the measured audio.

---

## Phase 0 — Find the story (ideas → pick → research)

**Goal:** end up with one topic and a factual brief you can build on. Two steps, and a human between them.

**0a · Ideate** (`hyv-ideator` — cheap, no search, no verification)

Generate 5–10 fully-shaped candidates into `content-idea-log.md`. Each one carries a **hook**, 3–5 **แก่นเรื่อง** points, **มุมเล่า** (why the viewer cares), an **เปรียบเทียบ** analogy, a **Format**, the **B-roll** it needs — and **`ต้องตรวจ`: the claims it stands on.** Fan out one ideator per pillar.

**Ideas before research, on purpose.** Ideas are cheap; research is not. Ten ideas → the human keeps one → you verify only that one. Research first and you pay for nine briefs you throw away. But the trade only holds if you treat an unverified idea as what it is: **a hypothesis.** Never state a figure as fact at this stage — write it under `ต้องตรวจ`.

**0c · Debate which idea** (the panel's highest-value use — **skip it when the human named the topic**)

When more than one idea is live and you can't separate them, run the panel **on the ideas**: all three in ONE message (`hyv-hook-maximalist`, `hyv-skeptic-editor`, `hyv-target-viewer`), then `hyv-judge`. Their three questions already are the right ones for choosing what to make — most stopping power / can we actually pay it off / would I care.

**This beats debating the hook, and it's not close.** 0c decides *whether the video exists*; a hook debate polishes one line of a video already being made. **A perfect hook on a topic nobody cares about is a competent boring video** — and you never find out, because it shipped. Four minutes spent choosing what to make is worth more than four minutes spent on its first sentence, which is why the phase-1 hook debate is now `contested`-only.

> ### ══ GATE — the human picks ══
> Ideas are pitched, never chosen, by an agent. The panel *recommends*; `hyv-judge` flags a split; **you** pick. Same rule the hook debate lives under.

**0b · Research the winner** (`hyv-researcher` — real WebSearch)

1. **Verify the `ต้องตรวจ` claims first.** They're what the hook rests on. If one is false the idea is dead — **research is allowed to kill it**, and should say what the real number is; a corrected premise often beats the pitch.
2. Research with `WebSearch` / `WebFetch` and any source docs the user provides. Every key fact needs **≥2 independent sources**; capture them for later attribution.
   **Depth is a dial, and it defaults shallow: `normal` lands 3 facts on ≤6 fetches** — that is all a 90s script has room for. Pass `deep` (up to 8 facts, ≤12 fetches) only when the user asks for it or a contested premise needs it. Topics with unlimited literature (medicine, law, economics) will happily absorb an afternoon; the cap is what stops them, so treat it as a stop rather than a target to browse past.
3. Write a research brief from `references/research-brief.template.md`: thesis, audience, the one surprising insight, key facts + sources, **subject lock** (the exact named subject so later prompts/visuals never drift), and visual opportunities.

**Output:** a research brief (chat or `src/<slug>/research.md`) and a chosen `slug`.

## Phase 1 — Script + punchline debate (เขียนบท + agent ต่อสู้กัน)

**Goal:** a thesis-driven, TTS-ready narration whose hook and punchline have survived an adversarial debate.

1. Draft `src/<slug>/script-v1.md`: title, one-line thesis, beats, closing. Prose is fine.
2. **Punchline debate — only when the hook is contested.** `hyv-scriptwriter` returns its hook candidates *ranked*, plus `contested: yes|no`. On `no`, take its top hook, say so in your report, and move on — no panel. On `yes` (or when the human asks for a debate), run the adversarial panel in `references/punchline-debate.md`. This is the "agents fighting over the punchline" step, and it costs ~4 minutes and four agents: spend it on the hook that could really go two ways, not as a rubber stamp for one that's already obviously the winner.

   **When it does run, spawn all three panelists in ONE message — three `Agent` calls in the same block, not three messages.** `hyv-hook-maximalist`, `hyv-skeptic-editor` and `hyv-target-viewer` never read each other's work: each one only reads the brief and argues its own corner, so queueing them makes the debate three times slower for nothing. Only `hyv-judge` waits — it needs all three verdicts, so it goes in the next message.

   **`hyv-script-reviewer` runs on every video, and nothing is voiced before it passes.** This is the documentary process, not ceremony: research → draft → **the editor raises issues → you fix → you resubmit → approved** → *then* you record. It sits at the last moment the script is still cheap to change. After it, voice costs money, a fix means paying twice, and the voiceover is the master clock — re-record and every downstream timecode moves. Loop until `VERDICT: pass`; it fails on any Facts or Overpromise issue and names the line.
3. Rewrite into TTS-ready narration at `src/<slug>/voiceover-v1.md` following `references/script-and-voiceover-spec.md` — short lines, deliberate breaks for pacing, hook in the first ~3 s, explicit punchline beats. Put the voice-config block (voice id, `model: eleven_v3`, source) at the top.
4. **Build the shotlist** (`src/<slug>/shotlist.xlsx`) — give every beat a category-prefixed shot ID and plan capture/source/coverage. This is the artifact that makes the rest of the workflow easy; see `references/shotlist-format.md`. Scaffold a blank one with `scripts/new-shotlist.py`, or copy `references/examples/chado-NG-shotlist.xlsx`.
   **Build it straight from the script + the brief's `Visual opportunities`** (which already names 5–8 concrete shots with a likely source each). `hyv-storyboard` is a separate optional pass, worth it only when the visuals must be *composed* — a sequence that has to build — rather than *sourced* from CC, stock or graphics, which is most videos.

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
3. **Assemble in the editor named in `project.config.json`** (see `references/assembly-and-validation.md`) — the recipe is identical everywhere: voiceover mp3 on one audio track (master clock), each clip placed at its `start_tc` and **muted**, at the config's aspect and fps. Works in CapCut, Premiere, DaVinci, or a code renderer (`editor: "remotion"` → scaffold with `new-project.mjs --remotion`, then load `remotion-best-practices`).

**Output:** an editor-neutral timeline + a cut ready to render.

## Phase 6 — Validate, package, log

Render the final **mp4** from your editor, then run the editor-agnostic gates in `references/assembly-and-validation.md`: the mp4 exists; `ffprobe` confirms **the width×height and fps from `project.config.json`**, duration ≈ target, audio length ≈ video length; and you **eyeball** a few frames (not blank, correct episode, Thai text fits, clips muted). If you assembled in code, also run that tool's checks.

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

- `scripts/fetch-cc-images.mjs` — **find, licence-check and download Creative-Commons stills** from Openverse + Wikimedia Commons (`--query`, Thai works; `--dry-run`, `--json`). Reads the licence from each item's metadata rather than trusting a search filter, rejects ND (a cut is a derivative) and NC by default, downloads to `public/<slug>/cc/images/`, and appends creator/licence/source to `ATTRIBUTION.md`. Free, no key — **the first thing to try for a beat**, ahead of any text card.
- `scripts/gen-veo-briefs.mjs` — **config-driven Veo brief builder + guards** (generalizes `gen-chado-veo-briefs.mjs`). Project specifics live in a JSON config (`references/examples/veo-briefs.config.example.json`): subject lock, style descriptors, negative terms, per-episode focuses, and guard thresholds (min none-shots, max subject-shots, max consecutive subject, no-duplicate prompts, reject-term enforcement). Only for the generative path.
- `scripts/veo-generate.py` — **portable Veo clip runner** (generalizes `generate_ep1_veo.py`). Point `--plugin`/`--agent-root` at your Veo provider; `--brief`/`--out` at the episode. Forces silent output, pads to exact duration, supports `--all` batch and `--dry-run`. Also `--emit-md` renders the copy/paste prompt Markdown (`ep*-google-veo-insert-prompts.md`) from a brief — no provider needed; prompt recipe in `references/veo-prompt-guide.md`.
- `scripts/check-insert-plan.mjs` — validate a source-agnostic insert plan vs the durations manifest: contiguous timecodes, final `end_sec == target`, valid `source`, `.mp4`/graphic files, optional subject-lock / anti-loop (`visual_strategy`-aware).
- `scripts/export-timeline.mjs` — turn a brief + durations into an **editor-neutral timeline**: `ep*-timeline.json` (frames + SMPTE timecode) and `ep*-timeline.csv` (one row per clip) for CapCut/Premiere/DaVinci, plus an optional code-renderer snippet. Source-agnostic.

Deliverable (phase 6):

- `scripts/package-delivery.mjs` — gather the scattered working files into the standard `delivery/<slug>/` folder + canonical `manifest.json` + `README.md`, ffprobe-verifying every render. This is the skill's output format (`references/output-format.md`).

## When to stop and ask

Ask the user before: choosing the topic (phase 0), locking the hook/punchline when the debate is split (phase 1), spending ElevenLabs credits (phase 2), and spending generative credits (phase 4). These are the costly or irreversible steps.

### Money: the gate is in the code, not in this paragraph

The two scripts that spend real money **refuse by default**. Run them normally and they call
nothing, print exactly what would be billed, and exit 2:

| Script | Without `--yes` | Cost shown |
|---|---|---|
| `gen-voiceover.mjs` | no API call, no mp3 | segments + characters billed |
| `veo-generate.py` | no clips, provider not even loaded | clips, total seconds, ~THB estimate |

**Exit 2 there is the gate doing its job — it is not an error to debug or work around.** Show the
output to the user verbatim, get an explicit OK, then re-run the *same* command with `--yes`
appended. Never put `--yes` on a first run, and never decide to spend on the user's behalf.

### Keys: ask, don't assume — and never need one you don't

**No key is required to get real work done.** Research, script, the punchline debate, storyboard
and shotlist need nothing. Both paid steps have a free twin that produces the *prompts* — and
**hands them to the human**, who generates them wherever they like (their own ElevenLabs account,
another TTS, another video model) and drops the results back in:

| Instead of paying here | Run this | You get |
|---|---|---|
| `gen-voiceover.mjs --yes` | `gen-voiceover.mjs --emit-md` | a TTS sheet: voice settings, each segment, the filename to save it as, how to bring the audio back |
| `veo-generate.py --yes` | `veo-generate.py --emit-md` | copy/paste generation prompts per shot |

> ### 🚫 Never synthesize a stand-in voice
>
> `--emit-md` hands a sheet to **the human**. It is *not* a licence to voice the script yourself
> with whatever TTS is lying around — not `say`, not a system voice, not a local model. If there
> is no working key, the sheet **is** the deliverable for that step. Stop and hand it back.
>
> A robot placeholder is not a preview of anything:
>
> - **It sounds broken.** Anyone who opens the file judges the whole tool by it, and a file sitting in `out/` looks like the deliverable no matter what you named the folder.
> - **Its timing is a lie anyway.** Measured on one real project: the same script ran **107.0 s** through the macOS Thai voice and **82.1 s** through the real ElevenLabs voice — **25 seconds, 23% apart.** Every insert placed against the placeholder clock has to be thrown away, so the "preview" previews nothing.
>
> **Need to prove the render pipeline before spending?** Render against **silence** at the target
> length (`ffmpeg -f lavfi -i anullsrc -t <sec>`). It proves exactly what a fake voice proves —
> that frames come out at the right size, fps and duration — and it can never be mistaken for a
> finished video.

Offer the `--emit-md` path *before* asking anyone for an API key. Many users should never need one.

**When a key genuinely is needed** (the user chose to generate here), set it up properly:

1. Check first — `npx hearyourvoice doctor` reports which keys are set without printing values.
2. Missing? Copy the template: `cp <skill>/references/examples/env.example .env`, then **ask the
   user for the value** and write it into `.env` yourself.
3. **Never echo a key back** into the conversation, a commit, a log, or a filename. Read it from
   `.env`; don't repeat it. Confirm `.env` is gitignored before writing (it is, in this repo's
   template) and never commit it.
4. Don't invent a key, don't guess a `VOICE_ID`, and don't proceed on a placeholder — stop and ask.

`ELEVENLABS_API_KEY` + `VOICE_ID` cover phase 2. `VEO_PLUGIN_PATH` points at the user's own
provider for phase 4 — this skill ships none. Full list with comments: `references/examples/env.example`.
