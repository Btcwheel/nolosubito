#!/bin/sh
# PostToolUse(Edit|Write): ESLint (solo errori) sui file JS/JSX modificati.
FILE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
case "$FILE" in
  */src/*.js|*/src/*.jsx|*/api/*.js) ;;
  *) exit 0 ;;
esac
[ -x node_modules/.bin/eslint ] || exit 0
OUT=$(node_modules/.bin/eslint --quiet "$FILE" 2>&1) || { echo "$OUT" >&2; exit 2; }
exit 0
