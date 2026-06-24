# Punchline Debate (phase 1) — agents fight over the hook & punchline

The point: never ship a hook or closing line that hasn't survived an argument. Run an adversarial multi-agent debate, then a judge picks and sharpens the winner. Do this *before* generating voiceover.

## Inputs

- The research brief (thesis, audience, the one surprising insight).
- 2–4 **candidate hooks** (opening line/s) and 2–4 **candidate punchlines** (closing line/s). If you only have one of each, generate alternatives first — a debate needs contenders.

## Roles (spawn with the `Agent` tool)

Run these as parallel subagents (one message, multiple `Agent` calls) so they argue independently, then collect their verdicts:

1. **Hook Maximalist** — argues for maximum stopping power. Pushes the boldest, most curiosity-opening option. Watches for: is it scroll-stopping in 3 seconds? Does it open a loop the video closes?
2. **Skeptic / Editor** — attacks every option. Watches for: clickbait that the body can't pay off, vague claims, clichés, anything inaccurate or overpromised, hooks that don't match the thesis.
3. **Target Viewer** (optional but recommended) — role-plays the actual audience from the brief. Watches for: "do I care?", "do I get it?", cultural fit, does the Thai land naturally when spoken.

Each gets the brief + the candidate lists and returns: a ranked vote on hooks, a ranked vote on punchlines, the single biggest weakness of each option, and one concrete rewrite that would make their top pick stronger.

### Prompt template for each debater

```text
You are <ROLE> reviewing the hook and punchline for a short vertical Thai
<genre> video.

Thesis: <thesis>
Audience: <audience>
Surprising insight: <insight>

Candidate hooks:
1. <hook A>
2. <hook B>
3. <hook C>

Candidate punchlines:
1. <punchline A>
2. <punchline B>
3. <punchline C>

Judge strictly from your role's priorities. Score each candidate on the rubric
below (0–5 each), give the single biggest weakness of each, then give ONE
rewrite of your top hook and ONE rewrite of your top punchline that fixes its
weakness. Be specific and ruthless. Output:

- Hook ranking with scores + one-line reason each
- Punchline ranking with scores + one-line reason each
- Your strongest rewrite (hook) and (punchline)
```

## Rubric (score each candidate 0–5)

| Criterion | Hook | Punchline |
|-----------|------|-----------|
| Stops the scroll in 3 s | ✓ | — |
| Opens a curiosity loop | ✓ | closes it |
| True to the thesis (no overpromise) | ✓ | ✓ |
| Concrete, not vague/cliché | ✓ | ✓ |
| Speakable Thai, lands when read aloud | ✓ | ✓ |
| Emotional/aha payoff | — | ✓ |

Disqualifiers (auto-reject regardless of score): inaccurate, can't be paid off by the body, generic enough to belong to any video, or awkward to speak.

## Judge pass

After the debaters return, do a final Judge synthesis yourself (or one more `Agent`):

1. Tally the rankings; note where debaters disagree.
2. Pick the winning hook and winning punchline. They may be a debater's rewrite, not an original candidate.
3. Sharpen once more: cut a word, strengthen a verb, tighten the Thai.
4. **If the vote is split or no option clears the disqualifiers, stop and ask the user** with the top 2 options and the tradeoff. This is one of the "stop and ask" gates.

## Output

Write the locked lines into `src/<slug>/voiceover-v1.md` (hook as the opening, punchline at the relevant beat) and record a one-line rationale in `CURRENT_STATE.md`. The chado series captured this as voiceover "rewritten ... with stronger punchline beats before audio generation" — keep that trace.

## Lightweight mode

For a single short video with an obvious winner, you don't need three subagents — run the rubric yourself against 2–3 options and pick. Escalate to the full debate when the hook really matters or options are close. The `rubric` is the part you never skip.
