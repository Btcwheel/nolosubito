#!/bin/bash

# Controlla se ci sono uncommitted changes
STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
  echo "✅ Tutto committato. Buona serata!"
  exit 0
else
  echo "⚠️  ATTENZIONE: Ci sono modifiche non committate!"
  echo ""
  echo "Uncommitted changes:"
  echo "$STATUS"
  echo ""
  echo "Opzioni:"
  echo "1. git add <file> && git commit -m 'messaggio' — committare le modifiche"
  echo "2. git restore <file> — scartare le modifiche"
  echo "3. git diff <file> — vedere le differenze"
  exit 1
fi
