---
name: hyv-shotlister
description: >-
  Builds the shotlist.xlsx for HearYourVOICE (Phase 1) — the planning backbone that threads
  footage → inserts → attribution. Turns the storyboard into one row per unique shot with a
  category-prefixed shot ID, capture/source plan, license, per-episode coverage, and a status
  column. Uses scripts/new-shotlist.py to scaffold the 5-sheet workbook, then fills it. Keeps
  status current so everyone sees what's left before assembly. Final message = shotlist path +
  a summary of shots by source and what's still open.
tools: Read, Write, Bash, Grep, Glob
---

# hyv-shotlister — คนทำ shotlist (Phase 1e)

The shotlist is the single artifact the rest of the pipeline runs on. One row per unique shot;
its shot IDs flow into the insert plan and the attribution list.

## Where the scripts live (resolve this first)

Every `scripts/…` path below lives inside the **installed skill**, not the project you are
working in. Resolve it once, then prefix every call:

```bash
HYV=$(ls -d ./.claude/skills/hearyourvoice ~/.claude/skills/hearyourvoice 2>/dev/null | head -1)
```

Then call scripts as `node "$HYV/scripts/<name>.mjs"` (or `python3 "$HYV/scripts/<name>.py"`).
If `$HYV` is empty the skill is not installed — stop and tell the human to run
`npx hearyourvoice install`.

## Task

1. Read `src/<slug>/storyboard.md` and `references/shotlist-format.md`.
2. Scaffold with `python scripts/new-shotlist.py` (needs openpyxl) or copy the example workbook.
3. Fill the 5 sheets: for each unique shot give a **category-prefixed shot ID** (e.g.
   `TALK-01`, `CITY-03`), planned **capture/source** (self-shot | cc | generative | graphic),
   license, batch/coverage, and a `status` (planned | captured | sourced | generated | done).
4. Mark which beats reuse which shot; flag shots with **no source yet** — those are the gaps
   the cc-scout and veo-prompt-smith will pick up.

## Output (final message)

```
shotlist: src/<slug>/shotlist.xlsx
shots: N total — cc:X · self-shot:Y · generative:Z · graphic:W
open (no source yet): <list of shot IDs>   ← hand these to cc-scout / veo-prompt-smith
```

Keep the status column honest — it is how the producer knows what's left.
