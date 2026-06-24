# Script & Voiceover Spec (phase 1 → phase 2)

Two files per project:

- `src/<slug>/script-v1.md` — the thinking draft: title, thesis, beats, closing. Prose OK.
- `src/<slug>/voiceover-v1.md` — the **TTS-ready** narration ElevenLabs actually reads. Not raw prose.

## voiceover-v1.md format

The generator (`scripts/gen-voiceover.mjs`) parses each segment by this exact shape: a heading `## EP<n> - <title>`, then a line `VO:`, then a blank line, then the narration lines until the next `## ` heading.

```markdown
# <Series> Voiceover v1

Source text for ElevenLabs TTS into `public/<slug>/voiceover/`.

Voice pass:

- Voice id: `<voice-id>`
- Model: `eleven_v3`
- Source: `<origin doc, if any>`
- Direction: performance-ready Thai narration. Short lines, clear pauses,
  strong hook, strong punchline. Do not treat as raw prose.

## EP1 - <episode title>

VO:

<hook line — lands in the first ~3 seconds>

<short line>

<short line>

<punchline beat — the line the whole episode pays off>

## EP2 - <episode title>

VO:

...
```

## TTS-ready writing rules

- **Short lines.** One breath per line. Break long sentences across several lines — the line breaks are pacing.
- **Hook first.** The opening 1–2 lines must earn the next 3 seconds. Use the "one surprising insight" from the research brief.
- **Punchline beats.** Mark the payoff line(s) — the thesis restated with force. Every episode has at least one. These are what the phase-1 debate sharpens.
- **Speakable Thai.** Write how it's said, not how it's written. Read it aloud; if you stumble, rewrite.
- **No on-screen-text crutches.** The narration must stand alone in audio; visuals illustrate, they don't carry meaning the voice skipped.
- **Pauses.** A blank line is a beat. Use them before a punchline and after the hook.
- Keep each episode within its planned length band (the chado series runs ~72–113 s/episode). Length is confirmed by measurement in phase 2, not guessed here.

## Voice config

- Model `eleven_v3`, output `mp3_44100_128`, default `stability 0.45`, `similarity 0.8` (tune by ear).
- Pick/record the `VOICE_ID` once per project and keep it in the config block. Don't overwrite an existing take with a different voice — keep both if undecided (see `CURRENT_STATE.md` "Previous Notes" on keeping two voice ids).
- `ELEVENLABS_API_KEY` comes from project `.env`. Never hardcode it.

## Handoff to phase 2

Once the hook and punchline are locked by the debate, `voiceover-v1.md` is frozen for this pass. Generate, then measure — the measured duration, not this file, drives all downstream timing.
