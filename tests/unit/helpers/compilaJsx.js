import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Il runner di Playwright trasforma i .jsx in oggetti suoi (__pw_type), che il vero React non accetta.
// Per testare componenti React reali, il file va compilato prima con esbuild e importato già pronto.
// L'output sta in tests/.output (ignorato da git); i pacchetti restano esterni, risolti da node_modules.
//
// Ogni worker di Playwright è un processo separato: il file di output include il pid, così due worker
// non si sovrascrivono mentre uno lo sta importando. Dentro lo stesso processo si compila una volta sola.
const cache = new Map();

export function importaJsx(relativePath) {
  const entry = path.resolve(relativePath);
  if (!cache.has(entry)) {
    const nome = path.basename(entry).replace(/\.jsx?$/, '');
    const outfile = path.resolve('tests/.output/compiled', `${nome}.${process.pid}.mjs`);
    cache.set(
      entry,
      build({
        entryPoints: [entry],
        outfile,
        bundle: true,
        packages: 'external',
        format: 'esm',
        platform: 'node',
        jsx: 'automatic',
        loader: { '.js': 'jsx' },
        logLevel: 'silent',
      }).then(() => import(pathToFileURL(outfile).href)),
    );
  }
  return cache.get(entry);
}
