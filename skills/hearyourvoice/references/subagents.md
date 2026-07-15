# ทีม Subagent — ใครทำอะไร ใครตัดสิน

`SKILL.md` คือคู่มือ/orchestrator ส่วนไฟล์นี้คือ **ทีมพนักงาน AI** ที่แตกจากคู่มือนั้น — แต่ละตัวรับผิดชอบคนละสเต็ป
ทำเองจนจบในพื้นที่แยก แล้วรายงานกลับ และ **ยิงขนานกันได้**

> **หลักสำคัญ 2 ข้อ**
> 1. **Output ไม่ถูกล็อก** — aspect / fps / resolution / editor ไม่ hardcode ในตัว agent ใด ๆ
>    ทุกตัวอ่านจาก `src/<slug>/project.config.json` ที่ producer ยืนยันกับคนตอนเริ่ม
>    (9:16, 16:9, 1:1, 4:5 หรือ custom — เลือกทีหลังได้)
> 2. **อำนาจตัดสินใจสร้างสรรค์ = มนุษย์** — subagent ทำงานเองได้ในกรอบ แต่เรื่อง "เสียเงิน / ย้อนไม่ได้ /
>    เลือก hook-punchline ตอนเสียงแตก" คนเป็นคนเคาะเสมอ

---

## แผนที่บทบาท

| # | Subagent | ทำอะไร (หน้าที่เดียว ชัด ๆ) | รับเข้า | ส่งออก |
|---|---|---|---|---|
| — | **hyv-producer** | **ผู้กำกับ/หัวหน้าทีม** — วางลำดับงาน, ยืนยัน config, มอบงานให้ทีม, คุม gate. **ไม่ตัดสินสร้างสรรค์เอง** | หัวข้อ / brief | ลำดับงาน + delivery ที่ ready |
| 0 | **hyv-researcher** | Phase 0: research ภายนอกจริง (WebSearch/WebFetch) + verify ≥2 แหล่ง | หัวข้อ | research brief + subject lock |
| 1a | **hyv-scriptwriter** | เขียนบท + narration พร้อมลงเสียง (TTS-ready) | brief | script-v1 + voiceover-v1 |
| 1b | **hyv-script-reviewer** | **ตรวจบท**: fact ตรง brief ไหม, ตรง thesis, พูดลื่นไหม, ยาวเกินไหม | script + brief | pass/fail + จุดที่ต้องแก้ |
| 1c | **hyv-storyboard** | **วาด storyboard**: แตกบทเป็นช็อตทีละช็อต ตาม aspect ใน config | voiceover + config | storyboard ต่อบีต |
| 1d | **debate (4 ตัว)** | เถียงกันเรื่อง hook/punchline (ดูด้านล่าง) | brief + ตัวเลือก | คำแนะนำ + ธง "เสียงแตกไหม" |
| 1e | **hyv-shotlister** | **ทำ shotlist.xlsx** (5 sheet): ให้ shot ID, วางแผน capture/source/coverage | storyboard | shotlist.xlsx |
| 2 | **hyv-voiceover** | **ลงเสียง** ElevenLabs + วัดจริงด้วย ffprobe (= master clock). *Gate: เครดิต* | voiceover-v1 + config | mp3 + durations.json |
| 4a | **hyv-cc-scout** | **ค้นภาพ/วิดีโอ CC** + verify CC BY (yt-dlp) + log ATTRIBUTION | shotlist | คลิป CC ที่เคลียร์สิทธิ์ |
| 4b | **hyv-veo-prompt-smith** | **สร้าง prompt** สำหรับช็อตที่ *ขาดใน shotlist* (subject-lock + anti-loop) — ไม่ต้องมี provider | shotlist + durations | prompt markdown ต่อช็อต |
| 4c | **hyv-veo-runner** | **สั่ง Veo** เรนเดอร์คลิป (บังคับเงียบ, pad ให้พอดี). *Gate: เครดิต* | prompt + config | คลิป generative เงียบ |
| 5–6 | **hyv-assembler** | insert plan → export timeline → ประกอบตาม `config.editor` → package delivery | คลิปพูล + durations + config | delivery/<slug>/ (status ready) |

> **Phase 3 (ถ่ายเอง)** ไม่มี agent เฉพาะ — เป็นงานคนถ่าย แล้วโยน selects เข้า pool ให้ assembler

---

## ใครตัดสิน debate?

**สายการตัดสินใจ = 3 ชั้น** เพื่อไม่ให้ AI ตัดสินรสนิยมเอง:

```
ชั้น 1  ผู้เล่น (เถียงอิสระ, ขนานกัน)
        ├─ hyv-hook-maximalist   ดันตัวเลือกที่สะดุดสายตาที่สุด
        ├─ hyv-skeptic-editor    ไล่บี้ทุกตัวเลือก จับ clickbait/ข้อมูลพลาด
        └─ hyv-target-viewer     สวมบทผู้ชมจริง "แคร์ไหม เข้าใจไหม ไทยลื่นไหม"
                    │  (แต่ละตัวส่ง: จัดอันดับ + จุดอ่อน + rewrite ที่ดีที่สุด)
                    ▼
ชั้น 2  ผู้ตัดสิน (สังเคราะห์ ไม่ใช่เจ้าของรสนิยม)
        └─ hyv-judge  รวมโหวต → "ผู้ชนะ + ความมั่นใจ + ธงว่าเสียงแตกหรือไม่"
                    │
                    ▼
ชั้น 3  คนตัดสินจริง (อำนาจสูงสุด)
        └─ มนุษย์ (ผ่าน hyv-producer)
             • judge มั่นใจ + ไม่แตก  → producer เดินต่อได้เลย
             • judge บอก "เสียงแตก"   → producer หยุด ถามคุณ ให้คุณเคาะ
```

**สรุปประโยคเดียว:** ผู้เล่นเถียง · **judge แนะนำ ไม่ได้ชี้ขาด** · **คนเป็นคนเคาะ โดยเฉพาะตอนเสียงแตก**
เหตุผล: hook/punchline คือหัวใจของแบรนด์และรสนิยม — ปล่อยให้ AI ล็อกเองไม่ได้

---

## producer ต่างจาก researcher ยังไง

| | **hyv-producer** (หัวหน้าทีม) | **hyv-researcher** (นักวิจัย) |
|---|---|---|
| ขอบเขต | ทั้งโปรเจกต์ 0→6 | เฉพาะ Phase 0 |
| ทำเอง | **ไม่** — มอบงานให้ทีม + คุมลำดับ/gate | **ใช่** — ลงมือค้นเอง |
| ตัดสินใจ | คุมว่า *เมื่อไหร่* ทำอะไร, หยุดที่ gate ถามคน | ไม่ตัดสินสร้างสรรค์ แค่ส่งข้อเท็จจริง+แหล่ง |
| output | delivery ที่ ready | research brief |
| เปรียบเป็น | ผู้กำกับ/โปรดิวเซอร์ | ฝ่ายข้อมูล/รีเสิร์ช |

producer เหมือน "ผู้กำกับ" — ไม่ถือกล้องเอง ไม่เขียนบทเอง แต่รู้ว่าต้องเรียกใคร ตอนไหน
และเป็นคนเดียวที่คุยกับคุณเรื่อง gate

---

## `project.config.json` — คู่มือฟิลด์

คัดลอกจาก `references/examples/project.config.example.json` ไปไว้ที่ `src/<slug>/project.config.json`
แล้วแก้ค่า **subagent ทุกตัวอ่าน output spec จากไฟล์นี้ ห้าม hardcode**

| ฟิลด์ | ค่าที่ใช้ได้ | หมายเหตุ |
|---|---|---|
| `output.aspect` | `9:16` · `16:9` · `1:1` · `4:5` · `custom` | ค่าเริ่มต้น `9:16` |
| `output.width` / `height` | ตัวเลข | ใช้เมื่อ `aspect: "custom"` หรือ override preset |
| `output.fps` | ตัวเลข | ปกติ 30 |
| `output.tail_frames` | ตัวเลข | เฟรมเผื่อท้ายคลิปหลังเสียงจบ (ปกติ 24) |
| `output.captions` | `none` · `minimal` · `full` | |
| `editor` | `remotion` · `capcut` · `premiere` · `davinci` | assembler อ่านค่านี้เลือกทางประกอบ |
| `voice.voice_id` | ElevenLabs voice id | ต้องแก้จาก `REPLACE_ME` |
| `footage_policy.priority` | ลำดับแหล่งภาพที่ยอมใช้ | เรียงจากถูก→แพง |
| `footage_policy.veo_price_per_sec_thb` | ตัวเลข | producer ใช้คำนวณราคาโชว์ก่อนขออนุมัติ |
| `gates.*` | `true` / `false` | `true` = หยุดถามคนตรงนั้น |

ค่าเหล่านี้ถูกส่งต่อเป็น flag ของสคริปต์: `--fps`, `--width`, `--height`, `--aspect`, `--tail-frames`

---

## ติดตั้ง & ใช้งาน

agent **ไม่ได้อยู่ในโฟลเดอร์สกิล** — Claude Code อ่าน agent จาก `.claude/agents/` เท่านั้น
ตัวติดตั้งจัดการให้แล้ว:

```bash
npx hearyourvoice install           # skill → ~/.claude/skills/ + agents → ~/.claude/agents/
npx hearyourvoice install project   # ทั้งคู่ลงใน ./.claude/ ของ repo นี้
```

งานเดียว (ให้ producer คุมทั้งสาย):

```
ให้ hyv-producer ผลิตวิดีโอเรื่อง "<หัวข้อ>"
(หยุดถามผมที่ gate: ยืนยัน output spec, ล็อกหัวข้อ, hook/punchline ตอนเสียงแตก, ก่อนจ่ายค่าเสียง/Veo)
```

เรียกทีละตัว (ตอน demo หรือ debug):

```
ให้ hyv-cc-scout หา footage CC สำหรับ shot: TALK-01, CITY-03 จาก shotlist.xlsx
ให้ hyv-veo-prompt-smith ดูช็อตที่ยังไม่มีแหล่งใน shotlist แล้วร่าง prompt ให้
```

ยิงขนาน (สเกล):

```
5 หัวข้อนี้ [...] spawn hyv-researcher 5 ตัวขนานกันไปหาข้อมูลพร้อมกัน
แล้ว spawn hyv-producer ทีละหัวข้อ (แต่ละตัวมี src/<slug> ของตัวเอง ไม่ชนกัน)
```

> **ข้อจำกัดที่ควรรู้:** Claude Code รองรับ subagent ซ้อน subagent ได้ลึกสุด 5 ชั้น
> (`hyv-producer` → specialist = 2 ชั้น ยังเหลือที่เยอะ) และต้องเป็น Claude Code v2.1.172 ขึ้นไป
