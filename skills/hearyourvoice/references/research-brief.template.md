# Research Brief Template (phase 0)

Fill this before writing the script. Keep it to one screen. Save as `src/<slug>/research.md` or paste in chat.

```markdown
# Research Brief — <topic>

slug: <kebab-slug>            # e.g. chado-series, ai-bilge-pump, tourism-demand
format: 9:16 · 1080×1920 · 30fps
episodes: <1, or a list ep1..epN>

## Thesis (one line)
<the single claim the video proves>

## Audience
<who this is for, and what they already believe>

## The one surprising insight
<the non-obvious thing that makes someone stop scrolling — feeds the hook>

## Subject lock
exact subject: <the precise named thing — species + binomial, product + model, place>
look-alikes to REJECT: <the things AI/footage might confuse it with>
# This lock is reused verbatim in every visual prompt and negative prompt downstream.

## Key facts (with sources)
- <fact> — <source URL / doc>
- <fact> — <source URL / doc>
- <fact> — <source URL / doc>

## Visual opportunities
- <beat> → <best source: self-shot | generative | CC | graphic>
- <beat> → <source>

## Constraints / sensitivities
<accuracy traps, things not to claim, licensing limits, cultural notes>

## Sources
- <title> — <url>
```

## Notes

- **Subject lock is the most important field.** In the chado series, locking "Giant Snakehead (Channa micropeltes) / ปลาชะโด" and rejecting "Channa striata / ปลาช่อน / common snakehead" is what stopped generated and sourced footage from drifting to the wrong fish. Define the equivalent for every project.
- The "one surprising insight" becomes the hook candidate that phase 1's debate stress-tests.
- Tag each visual opportunity with a likely source so phase 4 knows what to gather. Generative is just one option — prefer self-shot or CC when they're cheaper and equally good.
- Pull current facts with `WebSearch`; don't rely on memory for anything that changes (prices, seasons, rankings, who-holds-a-role).
