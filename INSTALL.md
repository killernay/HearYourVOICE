# Installing HearYourVOICE

HearYourVOICE is a folder skill: a `SKILL.md` plus `references/` and `scripts/`. "Installing" means copying `skills/hearyourvoice/` into your agent's skills directory. Use `npx` (recommended), the bash `install.sh`, or copy by hand.

## With npx (recommended)

```bash
npx hearyourvoice install <target>      # published
# or, from a local checkout of this repo:
cd HearYourVOICE && npx . install <target>
```

| target | installs to | scope |
|--------|-------------|-------|
| (none) / `claude` | `~/.claude/skills/hearyourvoice` | **global** — Claude Code, whole machine |
| `codex` | `~/.codex/skills/hearyourvoice` | **global** — Codex |
| `hermes` | `~/.hermes/skills/hearyourvoice` | **global** — Hermes / openclaws |
| `project` | `./.claude/skills/hearyourvoice` | **project** — only the repo you're in |
| any path | `<path>/hearyourvoice` | any other skills dir |

### Whole machine (global)

```bash
npx hearyourvoice install            # ~/.claude/skills/hearyourvoice
npx hearyourvoice install codex      # ~/.codex/skills/hearyourvoice
npx hearyourvoice install hermes     # ~/.hermes/skills/hearyourvoice
```

### Project-level (working path)

Run it from inside the repo you want it scoped to:

```bash
cd ~/path/to/your-video-repo
npx hearyourvoice install project    # → ./.claude/skills/hearyourvoice (this repo only)
# or target a specific repo without cd-ing in:
npx hearyourvoice install ~/path/to/your-video-repo/.claude/skills
```

Check your toolchain: `npx hearyourvoice doctor`.

## With bash (fallback, same targets)

```bash
./install.sh                 # global Claude Code (default)
./install.sh codex
./install.sh hermes
./install.sh project         # ./.claude/skills, this repo
./install.sh ~/path/to/your-video-repo/.claude/skills
```

## By hand

```bash
# global
cp -R skills/hearyourvoice ~/.claude/skills/hearyourvoice
# project-level (from your repo root)
cp -R /path/to/HearYourVOICE/skills/hearyourvoice ./.claude/skills/hearyourvoice
```

> Path note: any agent that loads `SKILL.md` folders can use this — only the directory differs. Project-level wins over global when both exist.

## Verify

```bash
ls ~/.claude/skills/hearyourvoice            # SKILL.md, references/, scripts/
node ~/.claude/skills/hearyourvoice/scripts/measure-voiceover.mjs --help
```

In a session, the skill triggers on requests like *"produce a video about &lt;topic&gt;"*, *"write the script and run the punchline debate"*, or *"package the delivery folder"*. Or invoke it by name (`hearyourvoice`).

## Dependencies

Checked per tool — install what each step needs:

- **Node 18+** — every `*.mjs` (uses global `fetch`). `node --version`.
- **Python 3** + **openpyxl** — `new-shotlist.py` (`pip install openpyxl`); `veo-generate.py`.
- **ffmpeg / ffprobe** — timing measurement, render verification, silent-clip stripping.
- **A video editor** — CapCut, Premiere, DaVinci Resolve, or a code renderer (e.g. Remotion). 9:16 · 1080×1920 · 30fps. The assembly target (phase 5–6); `export-timeline.mjs` hands it a JSON + CSV.
- **ElevenLabs API key** — voiceover (phase 2). See *Environment & API keys* below.
- **Veo provider plugin** — *only* if you generate footage (phase 4 generative path). See *Environment & API keys* below.

## Environment & API keys

The keys you need depend on which optional paths you run. Scripts read these from the shell environment or a project `.env`. This is the canonical list — other docs point here.

**Voiceover (phase 2, `gen-voiceover.mjs`):**

| var | required | default | notes |
|-----|----------|---------|-------|
| `ELEVENLABS_API_KEY` | yes (to generate) | — | from shell env or `.env` (`--env <path>`, default `./.env`) |
| `VOICE_ID` | yes (to generate) | — | or pass `--voice-id`; keep the project's id in `voiceover-v1.md` |
| `MODEL` | no | `eleven_v3` | or pass `--model` |

**Generative footage (phase 4, `veo-generate.py`) — only if you generate:**

| var | required | default | notes |
|-----|----------|---------|-------|
| *(provider key)* | yes (to generate) | — | lives in the `.env` your **plugin** reads; the var name is plugin-defined (e.g. `GEMINI_API_KEY`) |
| `VEO_PLUGIN_PATH` | yes | — | your Veo provider plugin (or `--plugin`) |
| `VEO_AGENT_ROOT` | plugin-dependent | — | path added to `sys.path` for the plugin (or `--agent-root`) |
| `VEO_ENV_PATH` | no | `.env` | the `.env` the plugin loads its key from (or `--env`) |
| `VEO_MODEL` | no | `veo-3.1-generate-preview` | or `--model` |

`veo-generate.py` exposes more tuning knobs (`VEO_SEED`, `VEO_STYLE_BIBLE`, `VEO_PROMPT_PREFIX`, `VEO_BEAT_IDS`, `VEO_MAX_WORKERS`, …) as both env vars and flags — run `python3 veo-generate.py --help` for the full list. No keys are needed if you don't run the generative path.

## Companion skills (optional)

HearYourVOICE hands off to these when present in the same agent:

- `veo-insert-planner` — only for the generative footage path.
- `remotion-best-practices` — only if you assemble in a code renderer (Remotion). Not needed for NLE editors (CapCut/Premiere/DaVinci).

## Uninstall

```bash
rm -rf ~/.claude/skills/hearyourvoice   # (or the path you installed to)
```
