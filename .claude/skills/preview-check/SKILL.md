---
name: preview-check
description: Verifica pre-merge: lint, typecheck, build e deploy preview Vercel (mai su main).
disable-model-invocation: true
---

Verifica pre-merge, come richiesto da CLAUDE.md:

1. `git branch --show-current`: se è `main`, fermati e proponi un branch.
2. Esegui `npm run lint`, `npm run typecheck` e `npm run build`; riporta gli errori reali, senza minimizzarli.
3. Se tutto passa, chiedi conferma e poi crea un deploy preview con `npx vercel deploy --yes` (NON `--prod`).
4. Restituisci l'URL di preview e ricorda di controllare le pagine toccate. Dopo il merge e il deploy in produzione: hard refresh (Cmd+Shift+R).
5. Per modifiche a `vite.config.js`, prerender o `index.html` il test su preview è obbligatorio.
