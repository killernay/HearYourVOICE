# Installing HearYourVOICE

HearYourVOICE is a folder skill (a `SKILL.md` plus `references/` and `scripts/`) **and a team of 15 `hyv-*` subagents**. "Installing" means copying `skills/hearyourvoice/` into your agent's skills directory, and — for Claude Code — copying `agents/hyv-*.md` into `.claude/agents/`, which is a **separate tree**. Use `npx` (recommended), the bash `install.sh`, or copy by hand.

> The installer only ever adds/replaces its own `hyv-*.md` files; your other agents are never touched. Codex and Hermes get the skill alone — `.claude/agents/` is a Claude Code construct.

## With npx (recommended)

```bash
npx hearyourvoice install <target>      # published
# or, from a local checkout of this repo:
cd HearYourVOICE && npx . install <target>
```

| target | skill → | subagents → | scope |
|--------|---------|-------------|-------|
| (none) / `claude` | `~/.claude/skills/hearyourvoice` | `~/.claude/agents/hyv-*.md` | **global** — Claude Code, whole machine |
| `codex` | `~/.codex/skills/hearyourvoice` | — | **global** — Codex |
| `hermes` | `~/.hermes/skills/hearyourvoice` | — | **global** — Hermes / openclaws |
| `project` | `./.claude/skills/hearyourvoice` | `./.claude/agents/hyv-*.md` | **project** — only the repo you're in |
| any path | `<path>/hearyourvoice` | — | any other skills dir |

**Which scope?** Default to **global** — one command, works in every session, one version to update. Use **project** when teammates should get the exact version by cloning the repo (commit `.claude/`), or when different repos need different versions. See the README's *Global or project* section for the full comparison.

> ### ⚠️ Global and project don't mix — skills and agents resolve in opposite directions
>
> - **Skills**: a **global skill overrides a project skill** of the same name — *even if the project's copy is newer*. Claude Code's rule is "enterprise overrides personal, personal overrides project."
> - **Agents**: a **project agent wins** a name clash, but global agents still load in *every* project — they add on top rather than being replaced.
>
> So a global install silently defeats a project install, and globally-installed `hyv-*` agents follow you into every repo. **Pick one scope and stay in it.** Running versions side by side (or demoing v1 vs v2) only works with **no global copy** — use `install project` in each folder.

### Whole machine (global)

```bash
npx hearyourvoice install            # skill + 15 agents
npx hearyourvoice install codex      # ~/.codex/skills/hearyourvoice   (skill only)
npx hearyourvoice install hermes     # ~/.hermes/skills/hearyourvoice  (skill only)
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
# global — skill, then the subagents (separate tree)
cp -R skills/hearyourvoice ~/.claude/skills/hearyourvoice
mkdir -p ~/.claude/agents && cp agents/hyv-*.md ~/.claude/agents/
# project-level (from your repo root)
cp -R /path/to/HearYourVOICE/skills/hearyourvoice ./.claude/skills/hearyourvoice
mkdir -p .claude/agents && cp /path/to/HearYourVOICE/agents/hyv-*.md .claude/agents/
```

> Path note: any agent that loads `SKILL.md` folders can use the skill — only the directory differs. Project-level wins over global when both exist (for skills and agents alike).

## Verify

```bash
ls ~/.claude/skills/hearyourvoice            # SKILL.md, references/, scripts/
ls ~/.claude/agents/hyv-*.md                 # 16 subagents
node ~/.claude/skills/hearyourvoice/scripts/measure-voiceover.mjs --help
```

In a Claude Code session, `/agents` lists the team. The subagents need **Claude Code v2.1.172+** (nested subagents); the skill itself has no such requirement.

In a session, the skill triggers on requests like *"produce a video about &lt;topic&gt;"*, *"write the script and run the punchline debate"*, or *"package the delivery folder"*. Or invoke it by name (`hearyourvoice`).

## Dependencies

Checked per tool — install what each step needs:

- **Node 18+** — every `*.mjs` (uses global `fetch`). `node --version`.
- **Python 3** + **openpyxl** — `new-shotlist.py` (`pip install openpyxl`); `veo-generate.py`.
- **ffmpeg / ffprobe** — timing measurement, render verification, silent-clip stripping.
- **A video editor** — CapCut, Premiere, DaVinci Resolve, or a code renderer (e.g. Remotion). The assembly target (phase 5–6); `export-timeline.mjs` hands it a JSON + CSV. Aspect/resolution/fps come from `src/<slug>/project.config.json` (default 9:16 · 1080×1920 · 30fps), not from the tools.
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
