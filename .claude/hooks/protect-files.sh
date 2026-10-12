#!/bin/sh
# PreToolUse(Edit|Write): blocca la scrittura di .env* e lock file.
FILE=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
case "$(basename "$FILE")" in
  .env|.env.*|package-lock.json|yarn.lock|pnpm-lock.yaml)
    echo "Bloccato: $FILE è protetto (segreti o lock file). Modificalo a mano o usa npm." >&2
    exit 2 ;;
esac
exit 0
