#!/usr/bin/env bash
# HearYourVOICE installer — copies the skill into your agent's skills directory.
#
# Usage:
#   ./install.sh                 # default: Claude Code (~/.claude/skills)
#   ./install.sh claude|codex|hermes|project
#   ./install.sh /path/to/skills # any skills directory
set -euo pipefail

SKILL="hearyourvoice"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/skills/$SKILL" && pwd)"
target="${1:-claude}"

case "$target" in
  claude)  DEST="$HOME/.claude/skills/$SKILL" ;;
  codex)   DEST="$HOME/.codex/skills/$SKILL" ;;
  hermes)  DEST="$HOME/.hermes/skills/$SKILL" ;;
  project) DEST="$(pwd)/.claude/skills/$SKILL" ;;
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

echo "✅ Installed HearYourVOICE -> $DEST"
echo "   Try:  node \"$DEST/scripts/measure-voiceover.mjs\" --help"
