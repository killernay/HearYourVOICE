<a id="english"></a>
# 🎙️ HearYourVOICE

**English** · [ภาษาไทย ↓](#thai)

**The complete, repeatable workflow for short Thai documentary/explainer videos — from a topic to a finished MP4, in whatever format you ship.**

HearYourVOICE is an **agent skill + a 15-strong subagent team** — a `SKILL.md`, its `references/` and `scripts/`, and the `hyv-*` specialists that do the work. Drop a topic in, and it walks the whole loop: research → script → an adversarial *agent debate* over the hook/punchline → ElevenLabs voiceover → gather visuals (self-shot, found Creative-Commons, or generative) → lay timecoded inserts on an editor timeline → validate → **package one clean `delivery/<slug>/` folder**.

## The point: the harness, not the model

Stop asking *"which LLM is smarter."* It's the wrong question.

**You** are the one in command. You define the format, the process, the standard — and the model follows it. An LLM is just a brain you can swap out: Claude today, something else tomorrow. What stays is the **harness** — the skill, the scripts, the guardrails that reliably *do the work you guide them to do.*

A good AI agent isn't the one that wins a chat-window argument about which model is best. It's the one with a harness complete enough to pick up a real task and finish it. If your AI ability ends at chatting and ranking models, you're about two years behind where this is already going.

HearYourVOICE is that harness for video. `SKILL.md` is production know-how made executable — and any brain in the world can run it.

## The team — run it solo, or delegate the whole thing

Run the phases yourself, or hand them to the team that ships with the skill. `hyv-producer` is the director: it delegates to the specialists, holds the gates, and is the only one that talks to you about them.

```
hyv-producer  ← the director: delegates, holds gates, never decides taste
  ├─ hyv-researcher       phase 0 · real WebSearch, every claim ≥2 sources
  ├─ hyv-scriptwriter     phase 1 · script + TTS-ready narration
  ├─ hyv-script-reviewer  phase 1 · strict pass/fail against the brief
  ├─ hyv-storyboard       phase 1 · shot-by-shot, at the config's aspect
  ├─ debate panel         phase 1 · hook-maximalist vs skeptic-editor vs target-viewer
  │   └─ hyv-judge          synthesizes · RECOMMENDS, never rules
  ├─ hyv-shotlister       phase 1 · the 5-sheet shotlist.xlsx backbone
  ├─ hyv-voiceover        phase 2 · ElevenLabs + ffprobe = the master clock
  ├─ hyv-cc-scout         phase 4 · finds CC footage, verifies the license itself
  ├─ hyv-veo-prompt-smith phase 4 · prompts for the gaps · spends nothing
  ├─ hyv-veo-runner       phase 4 · renders generative clips · costs money
  └─ hyv-assembler        phase 5–6 · timeline → editor → delivery/
```

**Two rules the team never breaks.** Creative authority is human: `hyv-judge` recommends and flags a split, but *you* pick the hook and punchline. And every gate stops for you — output spec, topic lock, split debate, and any spend (voiceover or generative credits).

Fan them out to scale: one `hyv-researcher` per topic in parallel, then one `hyv-producer` per video — each in its own `src/<slug>/`, no collisions. Full roster + decision chain: [`references/subagents.md`](skills/hearyourvoice/references/subagents.md).

## Nothing is hardcoded

Aspect, resolution, fps, and editor live in `src/<slug>/project.config.json` — confirmed with you before anything is produced. **9:16 is the default, not a law**: 16:9, 1:1, 4:5, and custom work the same way, and every script takes `--aspect/--width/--height/--fps`.

## The loop

```
0 Research → 1 Script + punchline debate → 2 Voiceover (master clock)
   → 3 Mock shots (optional) → 4 Footage (find/generate) → 5 Inserts onto TC
   → 6 Validate + package → delivery/<slug>/ (manifest.json: status ready)
```

## What you get out (the output format)

One folder, not scattered files:

```
delivery/<slug>/
  manifest.json     ← canonical index (per-episode checks + status)
  README.md         ← human summary
  video/            ← final renders
  voiceover/        ← narration mp3s
  script/           ← voiceover-v1.md + shotlist.xlsx
  briefs/           ← per-episode insert plans
  attribution/      ← credits & licenses
  thumbnails/
```

"Done" = `manifest.json` reports `status: "ready"`.

## What's inside

```
skills/hearyourvoice/
  SKILL.md                       the orchestrator (phases 0–6)
  references/                    pipeline-loop · research-brief · script+VO spec ·
                                 punchline-debate · subagents · shotlist-format ·
                                 footage-sources · veo-prompt-guide ·
                                 assembly+validation · output-format · naming · examples/
  scripts/                       new-project · new-shotlist · gen-voiceover ·
                                 measure-voiceover · gen-veo-briefs · veo-generate ·
                                 check-insert-plan · export-timeline · package-delivery
agents/                          the 15 hyv-* subagents
```

Editor-agnostic: it exports a universal timeline (JSON + CSV) you assemble in **CapCut, Premiere, DaVinci Resolve, or a code renderer** — then packages a clean delivery folder. It can optionally orchestrate `veo-insert-planner` (generative footage) and `remotion-best-practices` (only if you assemble in code).

## Three ways to run this

This loop has two halves, and they have very different needs:

- **The thinking half** — research, script, the punchline debate, storyboard, shotlist planning. Pure reasoning. No binaries, no keys, no money.
- **The machine half** — measuring the voiceover with `ffprobe`, pulling footage with `yt-dlp`, building the workbook with Python, and cutting in **your** CapCut/Premiere/DaVinci. This needs a real shell on a real machine with your files on it.

Which half you get depends on where you run it. Pick your tier:

| | **Basic** | **Advance** | **Production** |
|---|---|---|---|
| **Where** | Chat — web or the app's Chat tab | **Cowork** | **Claude Code** — CLI or the app's Code tab |
| **Install** | the plugin | the plugin | `npx hearyourvoice install` |
| **The team** | ❌ agents are greyed out in chat | ✅ **all 15 fan out in parallel** | ✅ all 15 |
| **Thinking half** | ✅ | ✅ | ✅ |
| **Machine half** | ❌ no shell | ❌ — see below | ✅ |
| **Good for** | one topic, thinking it through | **researching and scripting a whole backlog at once** | finishing an actual video |

**Basic** gives you one Claude with the whole method loaded — plenty for taking one idea from topic to a debated hook.

**Advance** is where it gets interesting: hand Cowork three topics and `hyv-producer` fans the specialists out across all of them at once — researchers verifying sources in parallel, the debate panel arguing each hook, `hyv-judge` flagging where it's split. No terminal required. *(Verified by running it: the team spawns and works in parallel in Cowork.)*

**Production** is the only tier that finishes a video, because only your own machine has your ffmpeg, your footage, and your editor.

They compose. Think and debate in Cowork across a backlog, then bring the winners into Claude Code to produce.

### Why Cowork can't do the machine half

Cowork's shell "execute[s] inside a dedicated Linux VM, isolated from the host operating system by the platform's hypervisor" — so even in local mode it cannot reach the ffmpeg installed on *your* Mac, and Anthropic doesn't document what's preinstalled in that VM. Either way, the final cut happens in your editor, on your machine.

That's not a wall — it's the seam. Cowork does the thinking half well; Claude Code does the rest.

<details>
<summary>What we tested, and what's still unverified</summary>

**Observed:** the plugin installs in Cowork, `hyv-producer` is invoked by name, and the specialists fan out in parallel across multiple topics.

**Not tested:** whether Cowork's VM has `node`/`ffmpeg`/`python` at all, and how the paid steps behave there. The spending gates are enforced in the scripts themselves (they refuse without `--yes`), but that behaviour hasn't been watched on Cowork's VM — so treat phase 2+ as Claude Code's job until someone checks.

Earlier versions of this README claimed Cowork couldn't run any of this. That was wrong, and it was written from docs rather than from running it.

</details>

<details>
<summary>The old table, if you're mapping surfaces</summary>

| Where | Thinking half | Machine half |
|---|---|---|
| **Claude Code CLI** (`claude` in a terminal) | ✅ | ✅ |
| **Claude app → Code tab → Environment: Local** | ✅ | ✅ — same `~/.claude/`, all 15 agents |
| Claude app → Code tab → Environment: **Remote/cloud** | ✅ | ❌ — cloud sessions are sandboxed |
| **Cowork** (plugin) | ✅ + the team, in parallel | ❌ — isolated VM |
| Claude app → **Chat** tab · **claude.ai** web (plugin) | ✅ — no team | ❌ — no shell |

Two things from the docs explain the shape of that table:

1. **Why the team only lives in Cowork:** plugins "bundle skills, connectors, and sub-agents", and "the skills bundled in a plugin work across all three. **Hooks and sub-agents run only in Cowork**, so they appear greyed out in chat." That's why Basic gets the method but not the roster.
2. **Why the Code tab is Claude Code:** "the desktop app reads the same settings files as the CLI", so one `npx hearyourvoice install` serves both.

</details>

**Rule of thumb:** think in Cowork, finish in Claude Code. If Claude can't reach your ffmpeg and your editor, it cannot finish a video — no matter how good the skill is.

## Install — Basic & Advance (the plugin, no terminal at all)

One plugin covers both: the skill works in chat, and the whole team wakes up in Cowork.

1. **Build the bundle** (or grab it from a release):
   ```bash
   node bin/build-bundles.mjs        # writes hearyourvoice-plugin-<v>.zip to your Desktop
   ```
2. **Claude → Customize → Plugins → upload** that zip.
3. **Use it** — just ask. In Cowork, hand it a backlog:
   > *"/hearyourvoice ทำ 3 เรื่องนี้พร้อมกัน: ค่าไฟแพง, ฝุ่น PM2.5, หนี้ครัวเรือนไทย — เอาแค่ research + เขียนบท + ดีเบต hook"*

   `hyv-producer` picks it up and fans the specialists across all three.

> **Uploading to *Skills* instead of *Plugins*?** That channel takes a different shape and carries no agents — `build-bundles.mjs` also emits `hearyourvoice-skill-<v>.zip` for it. You get the method, not the team. Install **one or the other**, not both, or you'll end up with `hearyourvoice` and `hearyourvoice:hearyourvoice` side by side and won't know which one is answering.

## Install — Production (Claude Code)

You never have to open a separate terminal — the app has one built in.

1. **Download the app** — [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect) or [Windows](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect), then sign in. *(Windows also needs [Git for Windows](https://git-scm.com/downloads/win); restart the app after installing it.)* Or just use the `claude` CLI.
2. **Click the `Code` tab** (not Chat, not Cowork).
3. **Set Environment to `Local`** — this is the step people get wrong. Remote runs in the cloud and can't touch your files.
4. **Pick your project folder** — the folder where your videos will live.
5. **Open the built-in terminal** — `Ctrl` + `` ` `` — and paste one line:
   ```bash
   npx hearyourvoice install
   ```
6. **Check what's missing** — `npx hearyourvoice doctor` reports Node / Python / ffmpeg and which API keys are set (never their values).
7. **Use it** — type `/hearyourvoice` and describe the video. It delegates to the team on its own; you don't have to name `hyv-producer`.

That's it — the CLI and the app share the same install, so doing this once covers both.

### Where to install it: global or project

Both are Claude Code installs — this is only about *scope*.

**Global — whole machine** (available in every session):

```bash
npx hearyourvoice install          # skill → ~/.claude/skills/ · agents → ~/.claude/agents/
npx hearyourvoice install codex    # → ~/.codex/skills/hearyourvoice   (skill only)
npx hearyourvoice install hermes   # → ~/.hermes/skills/hearyourvoice  (skill only)
```

**Project-level — only the repo you're working in** (run from its root):

```bash
cd ~/path/to/your-video-repo
npx hearyourvoice install project  # → ./.claude/skills/ + ./.claude/agents/
```

The installer only ever touches its own `hyv-*.md` files — your other agents are left alone. Codex and Hermes get the skill only, since `.claude/agents/` is a Claude Code construct.

### Global or project — which should you pick?

|  | **Global** (`install`) | **Project** (`install project`) |
|---|---|---|
| Lives in | `~/.claude/skills/` + `~/.claude/agents/` | `./.claude/` inside the repo |
| Works in | every session on the machine | only that repo |
| Goes into git | no | yes, if you commit `.claude/` |
| Version | one, for everything | pinned per repo |
| Best for | your own machine, many videos, one version | a team sharing one repo, or running versions side by side |

**Default to global.** It's one command, it's there in every session, and updating it updates everything: `npx hearyourvoice install`.

**Choose project when** your teammates should get the exact same version by cloning the repo (commit `.claude/` and they have it — no install step), or when different repos need different versions.

### The one gotcha: skills and agents resolve in *opposite* directions

Claude Code doesn't treat these two the same, and it will surprise you:

- **Skills** — a **global skill wins over a project skill** of the same name. ("Enterprise overrides personal, and personal overrides project.")
- **Agents** — a **project agent wins** a name clash, but global agents still load in *every* project — they add on top rather than being replaced.

Two practical consequences:

1. **A global install silently defeats a project install.** If HearYourVOICE is installed globally, a project copy of the skill is ignored — *even if the project's is newer*. Installing per-repo versions only works when there is **no global copy**.
2. **Global agents follow you everywhere.** Install the team globally and `hyv-*` shows up in every project, including ones where you wanted the skill alone.

So: **pick one scope and stay in it.** If you need per-repo versions (or want to demo two versions side by side), keep the global install off entirely and use `install project` in each.

Check your toolchain anytime: `npx hearyourvoice doctor` (Node / Python / ffmpeg).

> From a local checkout it's the same, via `npx .`:
> `cd HearYourVOICE && npx . install project`  •  or use the bash fallback `./install.sh <target>`.

Then start a session and say *"produce a video about &lt;topic&gt; with HearYourVOICE"*, or hand it straight to the team: *"ให้ hyv-producer ผลิตวิดีโอเรื่อง &lt;topic&gt;"*. See **INSTALL.md** for details, dependencies, and the full **Environment & API keys** list.

## Requirements

- **Node 18+** (the `.mjs` tools), **Python 3** + `openpyxl` (shotlist), **ffmpeg/ffprobe** (timing & render checks).
- The subagent team needs **Claude Code v2.1.172+** (nested subagents). The skill itself runs anywhere.
- For the final cut: **a video editor of your choice** (CapCut, Premiere, DaVinci, or a code renderer), an **ElevenLabs** API key (voiceover), and — only if you use generative footage — your own **Veo** provider plugin.

## 💸 Cost & ethics — read before phase 4

**Generative footage (Google Veo) is expensive.** At roughly **$0.75 per second (≈ ฿30/sec)**, a single 6-second insert is about **$4.5 (≈ ฿180)**, and a 90-second episode made *entirely* of Veo clips runs about **$67 (≈ ฿2,700)**. *(Pricing changes over time — check the current rate before you commit.)*

Generative is **one optional source, not the default.** Don't reach for it unless a shot is impossible to film or find — graphics + self-shot + Creative-Commons cover most videos. Use Veo only when you genuinely must, or when you have the budget to spare. `hyv-veo-runner` will show you the estimate and wait for your approval before spending a baht.

**Where this skill earns its keep:** if your goal is producing content *at scale* — say a hundred pieces a day — a repeatable harness is exactly what makes that volume possible without quality collapsing. That's who this is built for.

**Don't steal anyone's footage.** For found footage, search **Creative Commons (CC / NC) only** — verify the license yourself (YouTube's "CC" filter gives false positives), record credit + source URL in `ATTRIBUTION.md`, and discard anything you can't clear. `hyv-cc-scout` does exactly this and drops whatever it can't clear. Ripping someone's work is not a footage strategy.

## License

MIT — see `LICENSE`.

## Origin — in memory of VOICE TV

The name **HearYourVOICE** is a tribute to **VOICE TV** — a station that "planted ideas" (*ปลูกความคิด*) in Thai society for 15 years (2009–2024).

I, **Chanon Ngernthongdee**, started there in my very first role: *Head of Research and Development*, from the day the station was founded. This project is an attempt to take the *know-how* we used in the VOICE TV newsroom and production floor and turn it into a `SKILL.md` — so the way we made quality content becomes something *repeatable* in the age of AI.

Yesterday I spoke with **Khun Songsak Premsuk**, the station's co-founder and managing director. He told me, *"If we'd had AI back then, the world of TV could have gone so much further."* It's true that VOICE TV no longer broadcasts today — but its way of thinking and working doesn't have to end with it, because `SKILL.md` can be carried on by **any brain in the world**, human or AI.

I hope the structure of this project helps anyone pick it up and bring quality content and quality issues into Thai society.

> *Hear your voice — because every good idea deserves a place to be heard.*

---

<a id="thai"></a>
# 🎙️ HearYourVOICE — ภาษาไทย

[English ↑](#english) · **ภาษาไทย**

**เวิร์กโฟลว์ครบวงจรและทำซ้ำได้ สำหรับคลิปสารคดี/อธิบายความภาษาไทยสั้น ๆ — จากแค่ "หัวข้อ" ไปจนเป็นไฟล์ MP4 ที่เสร็จสมบูรณ์ ในสัดส่วนไหนก็ได้ที่คุณจะปล่อย**

HearYourVOICE คือ **agent skill + ทีม subagent 15 ตัว** — ประกอบด้วย `SKILL.md` พร้อม `references/`, `scripts/` และทีม `hyv-*` ที่ลงมือทำจริง แค่โยนหัวข้อเข้าไป มันจะเดินครบทั้งลูป: research → เขียนสคริปต์ → ให้ *agent ดีเบต* แย้งกันเรื่อง hook/punchline → ทำเสียงพากย์ด้วย ElevenLabs → หาภาพ (ถ่ายเอง, Creative-Commons, หรือ generative) → วาง insert ตาม timecode บน timeline ของ editor → ตรวจสอบ → **แพ็กเป็นโฟลเดอร์ `delivery/<slug>/` ที่สะอาดหนึ่งชุด**

## หัวใจ: harness ไม่ใช่ตัวโมเดล

เลิกถามว่า *"LLM ตัวไหนเก่งกว่ากัน"* — มันคือคำถามที่ผิด

**คุณ** ต่างหากที่เป็นคนสั่ง คุณคือคนกำหนด format กำหนดกระบวนการ กำหนดมาตรฐาน แล้วโมเดลทำตาม LLM เป็นแค่ "มันสมอง" ที่สลับเปลี่ยนได้ — วันนี้ Claude พรุ่งนี้อาจเป็นตัวอื่น สิ่งที่อยู่คงทนคือ **harness** — ตัว skill, สคริปต์, และ guardrail ที่ *หยิบงานไปทำตามที่เรา guide ได้จริงอย่างเชื่อถือได้*

AI agent ที่ดี ไม่ใช่ตัวที่ชนะการเถียงในหน้าแชตว่าโมเดลไหนเก่งกว่า แต่คือตัวที่มี harness สมบูรณ์พอจะหยิบงานจริงไปทำจนจบ ถ้าความสามารถด้าน AI ของคุณจบอยู่แค่การแชตและจัดอันดับโมเดล คุณกำลังช้ากว่าโลก AI ไปแล้วประมาณสองปี

HearYourVOICE คือ harness ตัวนั้นสำหรับงานวิดีโอ — `SKILL.md` คือ know-how การผลิตที่ถูกทำให้ "สั่งทำงานได้จริง" และมันสมองใด ๆ ในโลกก็รันมันต่อได้

## ทีมงาน — ทำเองก็ได้ หรือมอบให้ทีมทั้งสาย

จะเดินทีละเฟสเองก็ได้ หรือโยนให้ทีมที่มากับสกิล `hyv-producer` คือผู้กำกับ — มอบงานให้ลูกทีม คุม gate และเป็นคนเดียวที่คุยกับคุณเรื่อง gate

```
hyv-producer  ← ผู้กำกับ: มอบงาน คุม gate ไม่ตัดสินรสนิยมเอง
  ├─ hyv-researcher       เฟส 0 · ค้นจริง ทุกข้ออ้าง ≥2 แหล่ง
  ├─ hyv-scriptwriter     เฟส 1 · บท + narration พร้อมลงเสียง
  ├─ hyv-script-reviewer  เฟส 1 · ตรวจบท pass/fail เทียบ brief
  ├─ hyv-storyboard       เฟส 1 · แตกช็อต ตาม aspect ใน config
  ├─ ทีมดีเบต             เฟส 1 · hook-maximalist vs skeptic-editor vs target-viewer
  │   └─ hyv-judge          สังเคราะห์ · แนะนำ ไม่ชี้ขาด
  ├─ hyv-shotlister       เฟส 1 · shotlist.xlsx 5 sheet
  ├─ hyv-voiceover        เฟส 2 · ElevenLabs + ffprobe = master clock
  ├─ hyv-cc-scout         เฟส 4 · หาภาพ CC + ตรวจสัญญาอนุญาตเอง
  ├─ hyv-veo-prompt-smith เฟส 4 · ร่าง prompt เฉพาะช็อตที่ขาด · ไม่เสียเงิน
  ├─ hyv-veo-runner       เฟส 4 · เรนเดอร์ generative · เสียเงิน
  └─ hyv-assembler        เฟส 5–6 · timeline → editor → delivery/
```

**กฎ 2 ข้อที่ทีมไม่มีวันฝ่าฝืน:** อำนาจสร้างสรรค์เป็นของคน — `hyv-judge` แค่แนะนำและบอกว่า "เสียงแตก" แต่ **คุณ** เป็นคนเลือก hook/punchline และทุก gate ต้องหยุดถามคุณ — ยืนยัน output spec, ล็อกหัวข้อ, ดีเบตเสียงแตก, และทุกครั้งที่จะจ่ายเงิน (ค่าเสียง/generative)

ยิงขนานเพื่อสเกล: `hyv-researcher` หนึ่งตัวต่อหนึ่งหัวข้อพร้อมกัน แล้ว `hyv-producer` หนึ่งตัวต่อหนึ่งคลิป — แต่ละตัวมี `src/<slug>/` ของตัวเอง ไม่ชนกัน ดูรายชื่อเต็ม + สายการตัดสินใจที่ [`references/subagents.md`](skills/hearyourvoice/references/subagents.md)

## ไม่มีอะไรถูก hardcode

aspect, resolution, fps และ editor อยู่ใน `src/<slug>/project.config.json` — ยืนยันกับคุณก่อนเริ่มผลิตเสมอ **9:16 เป็นแค่ค่าเริ่มต้น ไม่ใช่กฎ**: 16:9, 1:1, 4:5 และ custom ใช้ได้เหมือนกันหมด และทุกสคริปต์รับ `--aspect/--width/--height/--fps`

## ลูปการทำงาน

```
0 Research → 1 เขียนสคริปต์ + ดีเบต punchline → 2 เสียงพากย์ (master clock)
   → 3 ถ่าย mock (ถ้าต้องการ) → 4 ภาพ (หา/generate) → 5 วาง insert ลง TC
   → 6 ตรวจสอบ + แพ็ก → delivery/<slug>/ (manifest.json: status ready)
```

## สิ่งที่ได้ออกมา (รูปแบบผลลัพธ์)

หนึ่งโฟลเดอร์ ไม่ใช่ไฟล์กระจัดกระจาย:

```
delivery/<slug>/
  manifest.json     ← ดัชนีหลัก (เช็กรายตอน + สถานะ)
  README.md         ← สรุปสำหรับคนอ่าน
  video/            ← ไฟล์เรนเดอร์สุดท้าย
  voiceover/        ← ไฟล์เสียงพากย์ mp3
  script/           ← voiceover-v1.md + shotlist.xlsx
  briefs/           ← แผน insert รายตอน
  attribution/      ← เครดิตและสัญญาอนุญาต
  thumbnails/
```

"เสร็จ" = `manifest.json` รายงาน `status: "ready"`

## ข้างในมีอะไร

```
skills/hearyourvoice/
  SKILL.md                       ตัว orchestrator (phase 0–6)
  references/                    pipeline-loop · research-brief · script+VO spec ·
                                 punchline-debate · subagents · shotlist-format ·
                                 footage-sources · veo-prompt-guide ·
                                 assembly+validation · output-format · naming · examples/
  scripts/                       new-project · new-shotlist · gen-voiceover ·
                                 measure-voiceover · gen-veo-briefs · veo-generate ·
                                 check-insert-plan · export-timeline · package-delivery
agents/                          ทีม subagent hyv-* ทั้ง 15 ตัว
```

ไม่ผูกกับ editor ตัวใดตัวหนึ่ง: มัน export timeline กลาง (JSON + CSV) ที่คุณเอาไปประกอบใน **CapCut, Premiere, DaVinci Resolve, หรือ code renderer** ก็ได้ — แล้วแพ็กเป็นโฟลเดอร์ส่งมอบที่สะอาด สามารถเรียกใช้ `veo-insert-planner` (ภาพ generative) และ `remotion-best-practices` (เฉพาะถ้าประกอบด้วยโค้ด) เป็น option ได้

## 3 วิธีรันสกิลนี้

ลูปนี้มี **สองครึ่ง** ที่ต้องการคนละอย่างกันมาก:

- **ครึ่งที่คิด** — research, เขียนบท, ดีเบต punchline, storyboard ใช้แค่การให้เหตุผล **รันที่ไหนก็ได้**
- **ครึ่งที่ใช้เครื่อง** — วัดเสียงด้วย `ffprobe`, ดึงฟุตเทจด้วย `yt-dlp`, ทำ shotlist ด้วย Python, ตัดต่อใน **CapCut/Premiere/DaVinci ของคุณ** อันนี้ต้องมี shell จริงบนเครื่องจริงที่มีไฟล์คุณอยู่

ได้ครึ่งไหนขึ้นกับว่ารันที่ไหน — เลือกชั้นที่ใช่:

| | **Basic** | **Advance** | **Production** |
|---|---|---|---|
| **ที่ไหน** | Chat — เว็บ หรือ tab Chat ในแอป | **Cowork** | **Claude Code** — CLI หรือ tab Code |
| **ติดตั้ง** | plugin | plugin | `npx hearyourvoice install` |
| **ทีม** | ❌ agent เป็นสีเทาในแชท | ✅ **ครบ 15 ตัว แตกงานขนานกัน** | ✅ ครบ 15 ตัว |
| **ครึ่งที่คิด** | ✅ | ✅ | ✅ |
| **ครึ่งที่ใช้เครื่อง** | ❌ ไม่มี shell | ❌ — ดูเหตุผลข้างล่าง | ✅ |
| **เหมาะกับ** | หัวข้อเดียว คิดให้ตกผลึก | **research + เขียนบท ทีละหลายเรื่องพร้อมกัน** | ทำวิดีโอให้เสร็จจริง |

**Basic** = Claude ตัวเดียวที่มีวิธีการทั้งหมดอยู่ในหัว พอสำหรับพาหนึ่งไอเดียจากหัวข้อไปจนได้ hook ที่ผ่านการดีเบต

**Advance** = จุดที่สนุก โยน 3 หัวข้อให้ Cowork แล้ว `hyv-producer` แตกลูกทีมออกไปทำทั้ง 3 เรื่องพร้อมกัน — researcher ยืนยันแหล่งข่าวขนานกัน ทีมดีเบตเถียงเรื่อง hook ของแต่ละเรื่อง `hyv-judge` บอกว่าเรื่องไหนเสียงแตก **ไม่ต้องมี terminal เลย** *(ทดสอบจริงแล้ว: ทีมแตกงานขนานกันใน Cowork ได้)*

**Production** = ชั้นเดียวที่ทำวิดีโอจบได้ เพราะมีแต่เครื่องคุณเท่านั้นที่มี ffmpeg ของคุณ ฟุตเทจของคุณ และโปรแกรมตัดต่อของคุณ

**และมันต่อกันได้** — คิดกับดีเบตหลายเรื่องรวดใน Cowork แล้วเอาเรื่องที่ชนะเข้า Claude Code เพื่อผลิตจริง

### ทำไม Cowork ทำครึ่งที่ใช้เครื่องไม่ได้

shell ของ Cowork *"execute[s] inside a dedicated Linux VM, isolated from the host operating system by the platform's hypervisor"* — ต่อให้เป็นโหมด local มันก็เอื้อมไม่ถึง ffmpeg ที่ลงไว้บน **Mac ของคุณ** และ Anthropic ไม่เคยระบุว่าใน VM นั้นมีอะไรติดมาบ้าง ยังไงขั้นตัดต่อสุดท้ายก็จบที่โปรแกรมบนเครื่องคุณอยู่ดี

**นี่ไม่ใช่กำแพง แต่คือรอยต่อ** — Cowork เก่งครึ่งที่คิด Claude Code รับช่วงที่เหลือ

<details>
<summary>ทดสอบอะไรไปแล้ว และอะไรที่ยังไม่รู้</summary>

**เห็นกับตา:** plugin ติดตั้งใน Cowork ได้ · `hyv-producer` ถูกเรียกด้วยชื่อจริง · ลูกทีมแตกงานขนานกันหลายหัวข้อ

**ยังไม่ได้ทดสอบ:** VM ของ Cowork มี `node`/`ffmpeg`/`python` ไหม และขั้นที่เสียเงินจะเป็นยังไงบนนั้น — gate เรื่องเงินอยู่ในตัวสคริปต์แล้ว (ไม่มี `--yes` = ไม่จ่าย) แต่ยังไม่มีใครเห็นพฤติกรรมนั้นบน VM ของ Cowork เพราะงั้นถือว่า phase 2 เป็นต้นไปเป็นงานของ Claude Code ไปก่อน

README เวอร์ชันก่อนหน้าเคยเขียนว่า Cowork ทำอะไรไม่ได้เลย — **อันนั้นผิด** และมันเขียนจากการอ่าน docs ไม่ใช่จากการลองจริง

</details>

**จำง่าย ๆ: คิดใน Cowork ทำให้จบใน Claude Code** ถ้า Claude เอื้อมไม่ถึง ffmpeg กับโปรแกรมตัดต่อของคุณ มันก็ทำวิดีโอไม่จบ ต่อให้สกิลดีแค่ไหนก็ตาม

## ติดตั้ง — Basic & Advance (ใช้ plugin ไม่ต้องแตะ terminal เลย)

plugin ตัวเดียวได้ทั้งสองชั้น: skill ทำงานในแชท และทีมทั้งกองตื่นขึ้นมาใน Cowork

1. **สร้างไฟล์** (หรือโหลดจาก release):
   ```bash
   node bin/build-bundles.mjs        # ได้ hearyourvoice-plugin-<v>.zip ไว้บน Desktop
   ```
2. **Claude → Customize → Plugins → upload** ไฟล์ zip นั้น
3. **ใช้งาน** — สั่งเป็นภาษาคนได้เลย ถ้าอยู่ใน Cowork โยนหลายเรื่องรวดได้:
   > *"/hearyourvoice ทำ 3 เรื่องนี้พร้อมกัน: ค่าไฟแพง, ฝุ่น PM2.5, หนี้ครัวเรือนไทย — เอาแค่ research + เขียนบท + ดีเบต hook"*

   `hyv-producer` จะรับงานแล้วแตกลูกทีมไปทำทั้ง 3 เรื่อง

> **ถ้าจะอัปเข้าช่อง *Skills* แทน *Plugins*:** คนละโครงกัน และ**ไม่พา agent ไปด้วย** — `build-bundles.mjs` สร้าง `hearyourvoice-skill-<v>.zip` ไว้ให้ด้วย ได้วิธีการแต่ไม่ได้ทีม **เลือกอย่างใดอย่างหนึ่ง อย่าอัปทั้งคู่** ไม่งั้นจะมี `hearyourvoice` กับ `hearyourvoice:hearyourvoice` ซ้อนกัน แล้วคุณจะไม่รู้ว่าตัวไหนกำลังตอบ

## ติดตั้ง — Production (Claude Code)

ไม่ต้องเปิด terminal แยกเลย เพราะแอปมี terminal ในตัวอยู่แล้ว

1. **โหลดแอป** — [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect) หรือ [Windows](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect) แล้วล็อกอิน *(Windows ต้องลง [Git for Windows](https://git-scm.com/downloads/win) ด้วย แล้วรีสตาร์ทแอป)* หรือใช้ `claude` CLI ก็ได้
2. **กด tab `Code`** (ไม่ใช่ Chat ไม่ใช่ Cowork)
3. **ตั้ง Environment เป็น `Local`** — ข้อนี้คนพลาดกันบ่อยสุด ถ้าเลือก Remote มันจะไปรันบนคลาวด์ แตะไฟล์ในเครื่องคุณไม่ได้
4. **เลือกโฟลเดอร์โปรเจกต์** — โฟลเดอร์ที่จะเก็บงานวิดีโอของคุณ
5. **เปิด terminal ในแอป** — กด `Ctrl` + `` ` `` แล้ววางบรรทัดเดียว:
   ```bash
   npx hearyourvoice install
   ```
6. **เช็กว่าขาดอะไร** — `npx hearyourvoice doctor` บอกทั้ง Node / Python / ffmpeg และ API key ตัวไหนตั้งแล้วบ้าง (ไม่พิมพ์ค่า key ออกมา)
7. **ใช้งาน** — พิมพ์ `/hearyourvoice` แล้วบอกว่าจะทำวิดีโอเรื่องอะไร มันแตกทีมให้เอง ไม่ต้องเรียกชื่อ `hyv-producer`

จบแล้ว — CLI กับแอปใช้ที่ติดตั้งร่วมกัน ทำครั้งเดียวได้ทั้งสองทาง

### จะลงไว้ตรงไหน: global หรือ project

ทั้งคู่คือการติดตั้งของ Claude Code เหมือนกัน — ต่างกันแค่ *ขอบเขต*

**ทั้งเครื่อง (global)** — ใช้ได้ทุก session:

```bash
npx hearyourvoice install          # skill → ~/.claude/skills/ · agents → ~/.claude/agents/
npx hearyourvoice install codex    # → ~/.codex/skills/hearyourvoice   (เฉพาะ skill)
npx hearyourvoice install hermes   # → ~/.hermes/skills/hearyourvoice  (เฉพาะ skill)
```

**ระดับโปรเจค** — เฉพาะ repo ที่กำลังทำ (รันจาก root ของมัน):

```bash
cd ~/path/to/your-video-repo
npx hearyourvoice install project  # → ./.claude/skills/ + ./.claude/agents/
```

ตัวติดตั้งแตะเฉพาะไฟล์ `hyv-*.md` ของตัวเอง — agent ตัวอื่นของคุณไม่ถูกแตะต้อง ส่วน Codex/Hermes ได้เฉพาะ skill เพราะ `.claude/agents/` เป็นของ Claude Code

### เลือก global หรือ project ดี?

|  | **Global** (`install`) | **Project** (`install project`) |
|---|---|---|
| อยู่ที่ | `~/.claude/skills/` + `~/.claude/agents/` | `./.claude/` ใน repo |
| ใช้ได้ที่ | ทุก session ในเครื่อง | เฉพาะ repo นั้น |
| ขึ้น git ไหม | ไม่ | ได้ ถ้า commit `.claude/` |
| เวอร์ชัน | ตัวเดียว ใช้ทุกที่ | pin แยกต่อ repo |
| เหมาะกับ | เครื่องตัวเอง ทำหลายคลิป เวอร์ชันเดียว | ทีมที่แชร์ repo เดียวกัน หรืออยากรันหลายเวอร์ชันคู่กัน |

**ไม่รู้จะเลือกอะไร → เอา global** คำสั่งเดียว ใช้ได้ทุก session อัปเดตทีเดียวได้หมด: `npx hearyourvoice install`

**เลือก project เมื่อ** อยากให้เพื่อนร่วมทีมได้เวอร์ชันเดียวกันเป๊ะแค่ clone repo (commit `.claude/` ไปด้วย เขาไม่ต้องติดตั้งเลย) หรือเมื่อคนละ repo ต้องใช้คนละเวอร์ชัน

### กับดักข้อเดียวที่ต้องรู้: skill กับ agent ตัดสินกลับด้านกัน

Claude Code ปฏิบัติกับสองอย่างนี้ไม่เหมือนกัน และมันจะทำให้คุณงงถ้าไม่รู้:

- **skill** — **global ชนะ project** ถ้าชื่อซ้ำกัน (docs: *"enterprise overrides personal, and personal overrides project"*)
- **agent** — **project ชนะ** ถ้าชื่อชนกัน แต่ agent ที่ลง global ยัง**โผล่ในทุกโปรเจกต์** — มันเพิ่มเข้าไป ไม่ได้ถูกแทนที่

ผลที่ตามมาจริง 2 ข้อ:

1. **ลง global ทีเดียว = ลบล้าง project แบบเงียบ ๆ** ถ้ามี HearYourVOICE ตัว global อยู่ สกิลที่ลงไว้ใน project จะถูกมองข้าม — **ต่อให้ตัวใน project ใหม่กว่าก็ตาม** การลงแยกเวอร์ชันต่อ repo จะได้ผลก็ต่อเมื่อ**ไม่มีตัว global เลย**
2. **agent ตัว global ตามคุณไปทุกที่** ถ้าลงทีมแบบ global แล้ว `hyv-*` จะโผล่ในทุกโปรเจกต์ รวมถึงอันที่คุณอยากได้แค่ skill เปล่า ๆ

สรุป: **เลือก scope เดียวแล้วอยู่กับมัน** ถ้าต้องการเวอร์ชันแยกต่อ repo (หรืออยากเดโมสองเวอร์ชันเทียบกัน) ให้**ไม่ลง global เลย** แล้วใช้ `install project` ในแต่ละที่แทน

เช็ก toolchain ได้ทุกเมื่อ: `npx hearyourvoice doctor` (Node / Python / ffmpeg)

> ใช้จาก local checkout ก็เหมือนกัน ผ่าน `npx .`:
> `cd HearYourVOICE && npx . install project`  •  หรือใช้ bash fallback `./install.sh <target>`

จากนั้นเปิด session แล้วพิมพ์ *"ทำวิดีโอเรื่อง &lt;หัวข้อ&gt; ด้วย HearYourVOICE"* หรือโยนให้ทีมเลย: *"ให้ hyv-producer ผลิตวิดีโอเรื่อง &lt;หัวข้อ&gt;"* ดูรายละเอียด, dependency, และรายการ **Environment & API keys** ฉบับเต็มได้ใน **INSTALL.md**

## สิ่งที่ต้องมี

- **Node 18+** (เครื่องมือ `.mjs`), **Python 3** + `openpyxl` (shotlist), **ffmpeg/ffprobe** (วัดเวลา & ตรวจเรนเดอร์)
- ทีม subagent ต้องใช้ **Claude Code v2.1.172+** (รองรับ subagent ซ้อน) ส่วนตัว skill รันที่ไหนก็ได้
- สำหรับตัดต่อขั้นสุดท้าย: **editor ที่คุณถนัด** (CapCut, Premiere, DaVinci, หรือ code renderer), **ElevenLabs** API key (เสียงพากย์), และ — เฉพาะถ้าใช้ภาพ generative — Veo provider plugin ของคุณเอง

## 💸 ต้นทุน & จริยธรรม — อ่านก่อนทำ phase 4

**ภาพ generative (Google Veo) แพงมาก** ราคาประมาณ **$0.75 ต่อวินาที (≈ ฿30/วินาที)** หมายความว่า insert สั้น ๆ แค่ 6 วินาที ก็ตกราว **$4.5 (≈ ฿180)** และถ้าทำคลิปยาว 90 วินาทีด้วย Veo *ล้วน ๆ* จะตกราว **$67 (≈ ฿2,700)** *(ราคาเปลี่ยนได้ตามเวลา — เช็กเรตปัจจุบันก่อนตัดสินใจเสมอ)*

generative เป็นแค่ **แหล่งภาพหนึ่งที่เป็น option ไม่ใช่ค่าตั้งต้น** อย่าเพิ่งคว้ามันมาใช้ถ้าไม่จำเป็น — กราฟิก + ถ่ายเอง + Creative-Commons ครอบคลุมงานส่วนใหญ่ได้แล้ว ใช้ Veo เฉพาะตอนที่จำเป็นจริง ๆ หรือมีงบพอเท่านั้น `hyv-veo-runner` จะโชว์ราคาประเมินและรอคุณอนุมัติก่อนจ่ายทุกบาท

**แต่ skill นี้คุ้มตรงไหน:** ถ้าเป้าหมายคุณคือผลิตคอนเทนต์ *ปริมาณมาก* — เช่นวันละร้อยชิ้น — harness ที่ทำซ้ำได้คือสิ่งที่ทำให้ปริมาณระดับนั้นเป็นไปได้โดยคุณภาพไม่พัง นี่แหละคือคนที่ skill นี้ถูกสร้างมาเพื่อ

**อย่าขโมย footage ใคร** ภาพที่ไปหามา ให้ค้นเฉพาะ **Creative Commons (CC / NC) เท่านั้น** — ตรวจสัญญาอนุญาตด้วยตัวเอง (ตัวกรอง "CC" ของ YouTube ให้ผลหลอกได้), บันทึกเครดิต + URL ต้นทางไว้ใน `ATTRIBUTION.md`, และทิ้งทุกอย่างที่เคลียร์สิทธิ์ไม่ได้ — `hyv-cc-scout` ทำแบบนี้เป๊ะ ๆ และทิ้งทุกอย่างที่เคลียร์ไม่ได้ การก๊อปงานคนอื่นมาใช้ ไม่ใช่กลยุทธ์หา footage

## สัญญาอนุญาต

MIT — ดูที่ `LICENSE`

## ที่มา — ระลึกถึง VOICE TV

ชื่อ **HearYourVOICE** ตั้งขึ้นเพื่อระลึกถึง **VOICE TV** — สถานีที่ "ปลูกความคิด" ให้สังคมไทยตลอด 15 ปี (พ.ศ. 2552–2567)

ผม **ชานนท์ เงินทองดี** เริ่มต้นที่นี่ในตำแหน่งแรกคือ *Head of Research and Development* ตั้งแต่วันก่อตั้งสถานี โปรเจคนี้คือความตั้งใจถอด *know-how* ที่เราใช้กันในห้องข่าวและงานโปรดักชันของ VOICE TV ออกมาเป็น `SKILL.md` — เปลี่ยนวิธีคิดและกระบวนการทำคอนเทนต์คุณภาพ ให้กลายเป็นสิ่งที่ "ทำซ้ำได้" ในยุค AI

เมื่อวานผมได้คุยกับ **คุณทรงศักดิ์ เปรมสุข** ผู้ร่วมก่อตั้งและกรรมการผู้อำนวยการสถานี ท่านบอกว่า — *"ถ้าวันนั้นเรามี AI โลกของทีวีคงไปได้ไกลกว่านี้อีกเยอะ"* จริงอยู่ที่วันนี้ VOICE TV ไม่ได้ออกอากาศแล้ว แต่วิธีคิดและวิธีทำงานของมันไม่จำเป็นต้องจบลงตามไปด้วย เพราะ `SKILL.md` สืบทอดต่อได้ด้วยมันสมองใด ๆ ก็ได้ในโลก ไม่ว่าจะเป็นของคนหรือของ AI

หวังว่าโครงสร้างของโปรเจคนี้ จะช่วยให้ใครก็ตามหยิบไปสร้างคอนเทนต์และประเด็นคุณภาพ ออกสู่สังคมไทยได้ต่อไป

> *Hear your voice — เพราะทุกความคิดที่ดี ควรมีพื้นที่ให้ได้ยิน*
