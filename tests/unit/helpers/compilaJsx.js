import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Il runner di Playwright trasforma i .jsx in oggetti suoi (__pw_type), che il vero React non accetta.
// Per testare componenti React reali, il file va compilato prima con esbuild e importato già pronto.
// L'output sta in tests/.output (ignorato da git); i pacchetti restano esterni, risolti da node_modules.
export async function importaJsx(relativePath) {
  const entry = path.resolve(relativePath);
  const outfile = path.resolve('tests/.output/compiled', path.basename(entry).replace(/\.jsx?$/, '.mjs'));
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    packages: 'external',
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    loader: { '.js': 'jsx' },
    logLevel: 'silent',
  });
  return import(pathToFileURL(outfile).href);
}
