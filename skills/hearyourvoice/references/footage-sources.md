# Footage Sources (phase 4) — find or generate, your choice

A finished video's inserts can come from any mix of four sources. Generative is **optional** — pick the cheapest source that gives the shot you need. Default preference for most beats: **self-shot or CC > generative**, with graphics as the always-available fallback.

## 0. Found Creative-Commons stills — try these first

Free, and they look like a video. A real photo of the thing you're discussing, with the beat's line over it, beats a black card with text in every way that matters.

```bash
node scripts/fetch-cc-images.mjs --slug <slug> --query "air pollution bangkok" --limit 5
node scripts/fetch-cc-images.mjs --slug <slug> --query "ฝุ่น" --source wikimedia --dry-run
```

- **Sources:** [Openverse](https://openverse.org) (Creative Commons' own index — Flickr et al) and **Wikimedia Commons** (huge; Thai queries work). Both expose the licence in their API. No key needed.
- **The licence is read, never filtered for.** Google Images' "CC" filter has the same false positives as YouTube's — it filters the open web, it doesn't read a licence. This script takes the licence from each item's metadata and drops anything it can't read.
- **ND is rejected outright.** You are cutting the image into a video: that *is* a derivative. NC is rejected too unless you pass `--allow-nc` and know that applies to you.
- Downloads to `public/<slug>/cc/images/` and appends creator + licence + source URL to `ATTRIBUTION.md` as it goes — BY and BY-SA *require* that credit.
- In the plan: `source: "cc"`, `file: "<slug>/cc/images/x.jpg"`, and keep the beat's `note` — the caption renders over the photo, and the code renderer gives a still a slow push so it doesn't read as a slideshow.
- Exit 3 = nothing cleared for that query. Reword it before you fall back to a graphic.

## 1. Found Creative-Commons footage

Real-world action that already exists on YouTube under CC BY (the only CC license YouTube supports).

- **Verify license with `yt-dlp`, not the YouTube CC filter.** The filter URL (`sp=EgIYAQ==`) returns false positives. Trust only: `yt-dlp` metadata reporting `Creative Commons Attribution license (reuse allowed)`, or a manual check (Show more → license line).
- Download to `public/<slug>/cc/video/`.
- **Cut exact timestamp selects** — never wire a whole raw download. Reviewed selects go to `public/<slug>/cc/select/`. The chado repo's hard lesson: "a bad first footage pass used loose/random early clips" → corrected to "only visually reviewed timestamp selects are active."
- Record attribution in two places: your editor's footage list and `public/<slug>/ATTRIBUTION.md`.
- Build a sourcing table like `src/<slug>/.../cc-footage-sourcing.md`: per-beat needs, ✅ confirmed / 🟡 verify / 🔗 still-needed, and reliable CC channels.

## 2. Generative shots (optional) — Google Veo via `veo-insert-planner`

Use when a shot is impossible or expensive to film and you need exact framing.

- Build the silent scene brief: either `veo-insert-planner` (hand-authored), or `scripts/gen-veo-briefs.mjs --config <cfg>` (config-driven, with subject-lock + anti-loop guards baked in — see `examples/veo-briefs.config.example.json`).
- Render the copy/paste prompt Markdown with `scripts/veo-generate.py --emit-md` (or `veo-insert-planner`) — prompt recipe in `veo-prompt-guide.md`. Then generate clips with `scripts/veo-generate.py` (portable; point `--plugin`/`--agent-root` at your Veo provider, `--brief`/`--out` at the episode; `--all` batches the series, `--dry-run` writes prompts only). Clips land in `public/<slug>/generated/ep*/<output_filename>`.
- **Silent only.** If Veo emits audio, strip it: `ffmpeg -i in.mp4 -an -c:v copy out.mp4`.
- **Subject lock** (from the research brief): every subject shot names the exact subject; negative prompts reject look-alikes. Discard any clip that drifts.
- **Anti-loop variation**: cap consecutive subject shots and interleave context / no-subject shots, or the model returns the same shot circling. Chado EP1's guard: ≥8 `no_fish` scenes, ≤6 `subject` scenes, ≤2 consecutive subject scenes, no duplicate prompts. Set the equivalent ratio per project.

## 3. Self-shot selects (from phase 3)

Your own captures, already reviewed to exact selects in `public/<slug>/select/`. Cheapest when you can film it and authenticity helps.

## 4. motion graphics (always available)

Data, diagrams, typography, mock UI, metaphor animations — built in code in `src/<slug>/`. This is the fallback when no acceptable clip exists for a beat, and the primary source for explainer/infographic videos (e.g. `ai-bilge-pump` "uses generated editor-native B-roll metaphors and mock UI, not sourced footage"). Build them in your editor (NLE keyframes/templates, or a code renderer).

## Choosing per beat

For each beat in the research brief, pick the source by this order of questions:

1. Can I film it cheaply and would real footage help? → **self-shot**.
2. Does authentic real-world action exist under CC BY? → **found CC**.
3. Is it data/concept/typography? → **graphics**.
4. Is it a specific shot none of the above can give? → **generative**.
5. Nothing acceptable? → **graphics fallback**. Never wire loose/unreviewed clips.

## Output of phase 4

A reviewed clip pool under `public/<slug>/` (any of `select/`, `cc/select/`, `generated/ep*/`) plus planned graphic beats. Every beat is covered by a reviewed clip or a graphic — no gaps before phase 5.
