#!/usr/bin/env bash
# HearYourVOICE installer — copies the skill into your agent's skills directory.
#
# Usage:
#   ./install.sh                 # default: Claude Code (~/.claude/skills)
#   ./install.sh claude|codex|hermes|project
#   ./install.sh /path/to/skills # any skills directory
set -euo pipefail

SKILL="hearyourvoice"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/skills/$SKILL"
AGENTS_SRC="$ROOT/agents"
target="${1:-claude}"

# agents live in .claude/agents/ (a different tree than skills) and only Claude Code reads them
AGENTS_DEST=""
case "$target" in
  claude)  DEST="$HOME/.claude/skills/$SKILL"; AGENTS_DEST="$HOME/.claude/agents" ;;
  codex)   DEST="$HOME/.codex/skills/$SKILL" ;;
  hermes)  DEST="$HOME/.hermes/skills/$SKILL" ;;
  project) DEST="$(pwd)/.claude/skills/$SKILL"; AGENTS_DEST="$(pwd)/.claude/agents" ;;
  -h|--help)
    sed -n '3,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *)
    if [[ "$target" == */* || -d "$target" ]]; then
      DEST="${target%/}/$SKILL"
    else
      echo "Unknown target '$target'. Use: claude | codex | hermes | project | <path>" >&2
      exit 1
    fi ;;
esac

if [[ ! -f "$SRC/SKILL.md" ]]; then
  echo "Error: cannot find skill payload at $SRC" >&2; exit 1
fi

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST"

echo "✅ Installed HearYourVOICE"
echo "   skill  -> $DEST"

# The agents dir is shared with your own agents — only ever touch our hyv-* files.
if [[ -n "$AGENTS_DEST" && -d "$AGENTS_SRC" ]]; then
  mkdir -p "$AGENTS_DEST"
  rm -f "$AGENTS_DEST"/hyv-*.md
  cp "$AGENTS_SRC"/hyv-*.md "$AGENTS_DEST"/
  n=$(ls -1 "$AGENTS_SRC"/hyv-*.md | wc -l | tr -d ' ')
  echo "   agents -> $AGENTS_DEST  ($n hyv-* subagents)"
else
  echo "   agents -> skipped (only Claude Code reads .claude/agents/)"
fi
echo "   Try:  node \"$DEST/scripts/measure-voiceover.mjs\" --help"
