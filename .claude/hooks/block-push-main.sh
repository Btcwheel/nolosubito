#!/bin/sh
# PreToolUse(Bash): blocca `git push` diretto su main (regola di CLAUDE.md).
CMD=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
case "$CMD" in
  *"git push"*|*"git -C"*" push"*) ;;
  *) exit 0 ;;
esac
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$BRANCH" = "main" ] || echo "$CMD" | grep -Eq '(:|[[:space:]])(main|master)([[:space:]]|$)|HEAD:(main|master)'; then
  echo "Bloccato: MAI pushare direttamente su main. Crea un branch, apri una PR e fai il merge da lì (vedi CLAUDE.md)." >&2
  exit 2
fi
exit 0
