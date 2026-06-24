<a id="english"></a>
# 🎙️ HearYourVOICE

**English** · [ภาษาไทย ↓](#thai)

**The complete, repeatable workflow for short vertical Thai documentary/explainer videos — from a topic to a finished 9:16 MP4.**

HearYourVOICE is an **agent skill** — a `SKILL.md` plus `references/` and `scripts/`. Drop a topic in, and it walks the whole loop: research → script → an adversarial *agent debate* over the hook/punchline → ElevenLabs voiceover → gather visuals (self-shot, found Creative-Commons, or generative) → lay timecoded inserts on an editor timeline → validate → **package one clean `delivery/<slug>/` folder**.

## The point: the harness, not the model

Stop asking *"which LLM is smarter."* It's the wrong question.

**You** are the one in command. You define the format, the process, the standard — and the model follows it. An LLM is just a brain you can swap out: Claude today, something else tomorrow. What stays is the **harness** — the skill, the scripts, the guardrails that reliably *do the work you guide them to do.*

A good AI agent isn't the one that wins a chat-window argument about which model is best. It's the one with a harness complete enough to pick up a real task and finish it. If your AI ability ends at chatting and ranking models, you're about two years behind where this is already going.

HearYourVOICE is that harness for video. `SKILL.md` is production know-how made executable — and any brain in the world can run it.

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
  video/            ← final 9:16 renders
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
                                 punchline-debate · shotlist-format · footage-sources ·
                                 veo-prompt-guide · assembly+validation · output-format · naming · examples/
  scripts/                       new-project · new-shotlist · gen-voiceover ·
                                 measure-voiceover · gen-veo-briefs · veo-generate ·
                                 check-insert-plan · export-timeline · package-delivery
```

Editor-agnostic: it exports a universal timeline (JSON + CSV) you assemble in **CapCut, Premiere, DaVinci Resolve, or a code renderer** — then packages a clean delivery folder. It can optionally orchestrate `veo-insert-planner` (generative footage) and `remotion-best-practices` (only if you assemble in code).

## Quick install (`npx`)

**Global — whole machine** (available in every session):

```bash
npx hearyourvoice install          # → ~/.claude/skills/hearyourvoice
npx hearyourvoice install codex    # → ~/.codex/skills/hearyourvoice
npx hearyourvoice install hermes   # → ~/.hermes/skills/hearyourvoice  (Hermes / openclaws)
```

**Project-level — only the repo you're working in** (run from its root):

```bash
cd ~/path/to/your-video-repo
npx hearyourvoice install project  # → ./.claude/skills/hearyourvoice
```

Check your toolchain anytime: `npx hearyourvoice doctor` (Node / Python / ffmpeg).

> Not published to npm yet? From a local checkout it's the same, via `npx .`:
> `cd HearYourVOICE && npx . install project`  •  or use the bash fallback `./install.sh <target>`.

Then start a session and say *"produce a video about &lt;topic&gt; with HearYourVOICE"*. See **INSTALL.md** for details, dependencies, and the full **Environment & API keys** list.

## Requirements

- **Node 18+** (the `.mjs` tools), **Python 3** + `openpyxl` (shotlist), **ffmpeg/ffprobe** (timing & render checks).
- For the final cut: **a video editor of your choice** (CapCut, Premiere, DaVinci, or a code renderer), an **ElevenLabs** API key (voiceover), and — only if you use generative footage — your own **Veo** provider plugin.

## 💸 Cost & ethics — read before phase 4

**Generative footage (Google Veo) is expensive.** At roughly **$0.75 per second (≈ ฿30/sec)**, a single 6-second insert is about **$4.5 (≈ ฿180)**, and a 90-second episode made *entirely* of Veo clips runs about **$67 (≈ ฿2,700)**. *(Pricing changes over time — check the current rate before you commit.)*

Generative is **one optional source, not the default.** Don't reach for it unless a shot is impossible to film or find — graphics + self-shot + Creative-Commons cover most videos. Use Veo only when you genuinely must, or when you have the budget to spare.

**Where this skill earns its keep:** if your goal is producing content *at scale* — say a hundred pieces a day — a repeatable harness is exactly what makes that volume possible without quality collapsing. That's who this is built for.

**Don't steal anyone's footage.** For found footage, search **Creative Commons (CC / NC) only** — verify the license yourself (YouTube's "CC" filter gives false positives), record credit + source URL in `ATTRIBUTION.md`, and discard anything you can't clear. Ripping someone's work is not a footage strategy.

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

**เวิร์กโฟลว์ครบวงจรและทำซ้ำได้ สำหรับคลิปสารคดี/อธิบายความ แนวตั้งภาษาไทยสั้น ๆ — จากแค่ "หัวข้อ" ไปจนเป็นไฟล์ MP4 9:16 ที่เสร็จสมบูรณ์**

HearYourVOICE คือ **agent skill** — ประกอบด้วย `SKILL.md` พร้อม `references/` และ `scripts/` แค่โยนหัวข้อเข้าไป มันจะเดินครบทั้งลูป: research → เขียนสคริปต์ → ให้ *agent ดีเบต* แย้งกันเรื่อง hook/punchline → ทำเสียงพากย์ด้วย ElevenLabs → หาภาพ (ถ่ายเอง, Creative-Commons, หรือ generative) → วาง insert ตาม timecode บน timeline ของ editor → ตรวจสอบ → **แพ็กเป็นโฟลเดอร์ `delivery/<slug>/` ที่สะอาดหนึ่งชุด**

## หัวใจ: harness ไม่ใช่ตัวโมเดล

เลิกถามว่า *"LLM ตัวไหนเก่งกว่ากัน"* — มันคือคำถามที่ผิด

**คุณ** ต่างหากที่เป็นคนสั่ง คุณคือคนกำหนด format กำหนดกระบวนการ กำหนดมาตรฐาน แล้วโมเดลทำตาม LLM เป็นแค่ "มันสมอง" ที่สลับเปลี่ยนได้ — วันนี้ Claude พรุ่งนี้อาจเป็นตัวอื่น สิ่งที่อยู่คงทนคือ **harness** — ตัว skill, สคริปต์, และ guardrail ที่ *หยิบงานไปทำตามที่เรา guide ได้จริงอย่างเชื่อถือได้*

AI agent ที่ดี ไม่ใช่ตัวที่ชนะการเถียงในหน้าแชตว่าโมเดลไหนเก่งกว่า แต่คือตัวที่มี harness สมบูรณ์พอจะหยิบงานจริงไปทำจนจบ ถ้าความสามารถด้าน AI ของคุณจบอยู่แค่การแชตและจัดอันดับโมเดล คุณกำลังช้ากว่าโลก AI ไปแล้วประมาณสองปี

HearYourVOICE คือ harness ตัวนั้นสำหรับงานวิดีโอ — `SKILL.md` คือ know-how การผลิตที่ถูกทำให้ "สั่งทำงานได้จริง" และมันสมองใด ๆ ในโลกก็รันมันต่อได้

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
  video/            ← ไฟล์เรนเดอร์ 9:16 สุดท้าย
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
                                 punchline-debate · shotlist-format · footage-sources ·
                                 veo-prompt-guide · assembly+validation · output-format · naming · examples/
  scripts/                       new-project · new-shotlist · gen-voiceover ·
                                 measure-voiceover · gen-veo-briefs · veo-generate ·
                                 check-insert-plan · export-timeline · package-delivery
```

ไม่ผูกกับ editor ตัวใดตัวหนึ่ง: มัน export timeline กลาง (JSON + CSV) ที่คุณเอาไปประกอบใน **CapCut, Premiere, DaVinci Resolve, หรือ code renderer** ก็ได้ — แล้วแพ็กเป็นโฟลเดอร์ส่งมอบที่สะอาด สามารถเรียกใช้ `veo-insert-planner` (ภาพ generative) และ `remotion-best-practices` (เฉพาะถ้าประกอบด้วยโค้ด) เป็น option ได้

## ติดตั้งเร็ว (`npx`)

**ทั้งเครื่อง (global)** — ใช้ได้ทุก session:

```bash
npx hearyourvoice install          # → ~/.claude/skills/hearyourvoice
npx hearyourvoice install codex    # → ~/.codex/skills/hearyourvoice
npx hearyourvoice install hermes   # → ~/.hermes/skills/hearyourvoice  (Hermes / openclaws)
```

**ระดับโปรเจค** — เฉพาะ repo ที่กำลังทำ (รันจาก root ของมัน):

```bash
cd ~/path/to/your-video-repo
npx hearyourvoice install project  # → ./.claude/skills/hearyourvoice
```

เช็ก toolchain ได้ทุกเมื่อ: `npx hearyourvoice doctor` (Node / Python / ffmpeg)

> ยังไม่ได้ publish ขึ้น npm? ใช้จาก local checkout ได้เหมือนกัน ผ่าน `npx .`:
> `cd HearYourVOICE && npx . install project`  •  หรือใช้ bash fallback `./install.sh <target>`

จากนั้นเปิด session แล้วพิมพ์ *"ทำวิดีโอเรื่อง &lt;หัวข้อ&gt; ด้วย HearYourVOICE"* ดูรายละเอียด, dependency, และรายการ **Environment & API keys** ฉบับเต็มได้ใน **INSTALL.md**

## สิ่งที่ต้องมี

- **Node 18+** (เครื่องมือ `.mjs`), **Python 3** + `openpyxl` (shotlist), **ffmpeg/ffprobe** (วัดเวลา & ตรวจเรนเดอร์)
- สำหรับตัดต่อขั้นสุดท้าย: **editor ที่คุณถนัด** (CapCut, Premiere, DaVinci, หรือ code renderer), **ElevenLabs** API key (เสียงพากย์), และ — เฉพาะถ้าใช้ภาพ generative — Veo provider plugin ของคุณเอง

## 💸 ต้นทุน & จริยธรรม — อ่านก่อนทำ phase 4

**ภาพ generative (Google Veo) แพงมาก** ราคาประมาณ **$0.75 ต่อวินาที (≈ ฿30/วินาที)** หมายความว่า insert สั้น ๆ แค่ 6 วินาที ก็ตกราว **$4.5 (≈ ฿180)** และถ้าทำคลิปยาว 90 วินาทีด้วย Veo *ล้วน ๆ* จะตกราว **$67 (≈ ฿2,700)** *(ราคาเปลี่ยนได้ตามเวลา — เช็กเรตปัจจุบันก่อนตัดสินใจเสมอ)*

generative เป็นแค่ **แหล่งภาพหนึ่งที่เป็น option ไม่ใช่ค่าตั้งต้น** อย่าเพิ่งคว้ามันมาใช้ถ้าไม่จำเป็น — กราฟิก + ถ่ายเอง + Creative-Commons ครอบคลุมงานส่วนใหญ่ได้แล้ว ใช้ Veo เฉพาะตอนที่จำเป็นจริง ๆ หรือมีงบพอเท่านั้น ถ้าไม่จำเป็นหรือเงินไม่ถึง — อย่าใช้เลย

**แต่ skill นี้คุ้มตรงไหน:** ถ้าเป้าหมายคุณคือผลิตคอนเทนต์ *ปริมาณมาก* — เช่นวันละร้อยชิ้น — harness ที่ทำซ้ำได้คือสิ่งที่ทำให้ปริมาณระดับนั้นเป็นไปได้โดยคุณภาพไม่พัง นี่แหละคือคนที่ skill นี้ถูกสร้างมาเพื่อ

**อย่าขโมย footage ใคร** ภาพที่ไปหามา ให้ค้นเฉพาะ **Creative Commons (CC / NC) เท่านั้น** — ตรวจสัญญาอนุญาตด้วยตัวเอง (ตัวกรอง "CC" ของ YouTube ให้ผลหลอกได้), บันทึกเครดิต + URL ต้นทางไว้ใน `ATTRIBUTION.md`, และทิ้งทุกอย่างที่เคลียร์สิทธิ์ไม่ได้ การก๊อปงานคนอื่นมาใช้ ไม่ใช่กลยุทธ์หา footage

## สัญญาอนุญาต

MIT — ดูที่ `LICENSE`

## ที่มา — ระลึกถึง VOICE TV

ชื่อ **HearYourVOICE** ตั้งขึ้นเพื่อระลึกถึง **VOICE TV** — สถานีที่ "ปลูกความคิด" ให้สังคมไทยตลอด 15 ปี (พ.ศ. 2552–2567)

ผม **ชานนท์ เงินทองดี** เริ่มต้นที่นี่ในตำแหน่งแรกคือ *Head of Research and Development* ตั้งแต่วันก่อตั้งสถานี โปรเจคนี้คือความตั้งใจถอด *know-how* ที่เราใช้กันในห้องข่าวและงานโปรดักชันของ VOICE TV ออกมาเป็น `SKILL.md` — เปลี่ยนวิธีคิดและกระบวนการทำคอนเทนต์คุณภาพ ให้กลายเป็นสิ่งที่ "ทำซ้ำได้" ในยุค AI

เมื่อวานผมได้คุยกับ **คุณทรงศักดิ์ เปรมสุข** ผู้ร่วมก่อตั้งและกรรมการผู้อำนวยการสถานี ท่านบอกว่า — *"ถ้าวันนั้นเรามี AI โลกของทีวีคงไปได้ไกลกว่านี้อีกเยอะ"* จริงอยู่ที่วันนี้ VOICE TV ไม่ได้ออกอากาศแล้ว แต่วิธีคิดและวิธีทำงานของมันไม่จำเป็นต้องจบลงตามไปด้วย เพราะ `SKILL.md` สืบทอดต่อได้ด้วยมันสมองใด ๆ ก็ได้ในโลก ไม่ว่าจะเป็นของคนหรือของ AI

หวังว่าโครงสร้างของโปรเจคนี้ จะช่วยให้ใครก็ตามหยิบไปสร้างคอนเทนต์และประเด็นคุณภาพ ออกสู่สังคมไทยได้ต่อไป

> *Hear your voice — เพราะทุกความคิดที่ดี ควรมีพื้นที่ให้ได้ยิน*
