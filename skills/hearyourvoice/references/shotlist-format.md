# Shotlist Format — the planning backbone

The shotlist is the single artifact that makes the whole workflow easy. It is built **after the script (phase 1)** and **drives capture (phase 3), sourcing (phase 4), and the insert plan (phase 5).** One row per unique shot, reused across every episode that needs it. Lives at `src/<slug>/shotlist.xlsx`.

A worked example ships with this skill: `references/examples/chado-NG-shotlist.xlsx`. Generate a blank one with `scripts/new-shotlist.py` (or copy the example and edit).

It is a 5-sheet workbook. Each sheet has one job.

## Sheet 1 — Shot List (the master)

One row per unique shot. Columns (Thai headers from the chado example):

| Column | Meaning |
|--------|---------|
| `ID` | category-prefixed shot id (`UW-01`, `LRM-07`, `GFX-03`) — stable, reused |
| `หมวด` | category (Underwater / Surface / Habitat / Lure-macro / Lure-action / Action / Graphics) |
| `ช็อต (Shot)` | one-line description of the shot |
| `ตอน (EP)` | which episodes use it, e.g. `EP1,2,5` — this is the **reuse** column |
| `ลำดับ` | priority `P1` (must-have) / `P2` (nice) |
| `วิธีถ่าย / โน้ต` | how to capture / direction note (e.g. "UW housing, slow-mo 120fps") |
| `สถานะ` | status: `ยังไม่ถ่าย` / `ถ่ายแล้ว` / `sourced` / `generated` |
| `ที่หมาย / วันถ่าย` | location / shoot date |
| `แหล่ง Footage แนะนำ` | recommended source (self-shot / CC / stock / generative / graphics) |
| `ลิงก์/Keyword` | candidate URL or search keyword |
| `License/หมายเหตุ` | license + note (e.g. "CC BY verified", "stock — buy license", "DM creator") |

Why it makes work easy: every shot is named once, you immediately see which episodes share it (shoot/source it once, reuse many times), and each row already says how to get it and whether the license is clear.

## Sheet 2 — Capture Plan (batch the self-shot work)

Groups shots into **shooting sessions** so you capture efficiently and find inserts ahead of time. Each session block lists: session name, when/conditions, and the shot IDs in that batch. From the chado example:

- เซสชัน A — สตูดิโอ / Macro เหยื่อ: shoot anytime, controlled light → `LRM-01..LRM-18 + ACT-04`.
- เซสชัน B — ผิวน้ำ + เหยื่อทำงาน (golden hour): `SUR-*`, `LRA-*`.
- (continue per project)

Use this to plan one studio day, one golden-hour day, etc., instead of chasing shots one at a time.

## Sheet 3 — Episode Coverage (no gaps)

Per episode: `ตอน`, `ชื่อตอน`, `ช็อตที่ต้องใช้` (the shot IDs), `จำนวน` (count). This is the checklist that proves every episode's beats are covered before assembly. A `*` marks a shared/reused shot.

## Sheet 4 — YouTube CC Sources (verified found footage)

The CC sourcing log: `Priority`, `Use case`, `Title`, `Channel`, `Length`, `URL`, `Matched EP/Shot`, `License note`. Only rows with **verified CC BY** (`yt-dlp` metadata or manual check) are usable. Maps each source back to the shot IDs it covers. Feeds phase 4's found-CC path and the `footage[]`/`ATTRIBUTION.md` records.

## Sheet 5 — Source Strategy (the per-project source matrix)

Per image type → best source → note. The chado example:

| ประเภทภาพ | แหล่งที่เหมาะ | หมายเหตุ |
|-----------|----------------|----------|
| Hero behavior (strike/ครอก/จิบ) | YouTube CC + creator permission + seasonal shoot | CC ok w/ credit; DM if prominent |
| ใต้น้ำ/close-up | stock + farm/tank | stock = buy license |
| Macro เหยื่อ | self-shot studio | cheapest, best control |
| Lure action | self-shot pond/tank | no real fish needed |
| Habitat/mood | self-shot golden hour + drone | keeps series tone consistent |
| Graphics | made in your editor (motion graphics) | for shots too hard to film |

This is the project-specific instance of the footage-source matrix in `footage-sources.md`.

## How the shotlist threads the workflow

```
phase 1 script  ──beats──▶  Shot List (give each beat a shot ID)
                                │
              ┌─────────────────┼───────────────────┐
              ▼                 ▼                   ▼
   Capture Plan (phase 3)  Source sheets (phase 4)  Episode Coverage (gate)
              │                 │                   │
              └─────────────────┴───────────────────┘
                                ▼
              shot IDs  ──▶  insert plan + attribution (phase 5)
```

Keep `status` current as shots get captured/sourced/generated — at a glance you see what's left before assembly.
