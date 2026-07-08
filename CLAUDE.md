## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

## Critical Rules

- **MAI pushare direttamente su main.** Ogni modifica va fatta su un branch separato, testata, e solo dopo mergiata via PR.
- **Testare sempre su produzione-like prima del merge.** Dopo il deploy su production, verificare con hard refresh (Cmd+Shift+R) che tutto funzioni.
- Per modifiche a configurazioni di build (vite.config.js, prerender, index.html), creare prima un branch e testare su un deploy preview Vercel.
- **Se il sito crasha in produzione, tornare immediatamente all'ultimo commit stabile con `git revert` o `git reset --hard` + force push**, poi fare il deploy via `npx vercel deploy --prod --yes`.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
