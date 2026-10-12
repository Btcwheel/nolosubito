#!/usr/bin/env bash
set -euo pipefail

# Pubblica una nuova versione dell'app su GitHub Releases.
# Uso: ./scripts/release.sh [arm|intel|universal]
# L'app non e' firmata: gli utenti devono usare "clic destro -> Apri" al primo avvio.

ARCH="${1:-arm}"

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./package.json').version")
TAG="operator-v${VERSION}"
TITLE="Nolosubito Operator v${VERSION}"

echo "==> Build macOS (${ARCH})..."
case "$ARCH" in
  arm)       npm run electron:build:mac:arm ;;
  intel)     npm run electron:build:mac:intel ;;
  universal) npm run electron:build:mac:universal ;;
  *) echo "Arch sconosciuta: $ARCH (usare arm, intel o universal)"; exit 1 ;;
esac

ARTIFACT=$(ls dist-electron/*.dmg 2>/dev/null | head -1)
if [[ -z "$ARTIFACT" ]]; then
  echo "Nessun DMG trovato in dist-electron/"
  exit 1
fi

echo "==> Pubblico release $TAG..."
if gh release view "$TAG" >/dev/null 2>&1; then
  gh release delete "$TAG" --yes --cleanup-tag
fi
gh release create "$TAG" "$ARTIFACT" \
  --title "$TITLE" \
  --notes "Installazione: scarica il DMG, aprilo e trascina **Nolosubito Operator** in Applicazioni.

Primo avvio (app non firmata): **clic destro sull'app → Apri → Apri**. Solo la prima volta."

URL=$(gh release view "$TAG" --json url -q .url)
echo ""
echo "Release pronta:"
echo "  $URL"
echo "Invia questo link agli operatori."
