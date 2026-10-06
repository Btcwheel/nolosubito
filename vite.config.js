import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs/promises'
import compression from 'vite-plugin-compression'

const publicEntriesToCopy = [
  '.well-known',
  'brands',
  'fonts',
  'favicon.png',
  'gigi-images.json',
  'images',
  'logo-bianco.png',
  'logo-blu.png',
  'llms.txt',
  'logo-blu.svg',
  'og-image.png',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'vehicle-catalog.json',
];

/**
 * Deferisce solo CSS esterni (Google Fonts). Il CSS principale dell'app
 * NON viene differito per evitare FOUC (Flash of Unstyled Content).
 */
function deferExternalCssPlugin() {
  return {
    name: 'defer-external-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link [^>]*rel="stylesheet"[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g,
          (match, href) => {
            if (href.includes('fonts.googleapis.com')) {
              return `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'">` +
                     `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
            }
            return match;
          }
        );
      },
    },
  };
}

function copyLeanPublicPlugin() {
  return {
    name: 'copy-lean-public',
    apply: 'build',
    async writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'dist');
      await Promise.all(publicEntriesToCopy.map(async entry => {
        const source = path.resolve(__dirname, 'public', entry);
        const target = path.resolve(outDir, entry);
        try {
          await fs.cp(source, target, { recursive: true });
        } catch (error) {
          if (error?.code !== 'ENOENT') throw error;
        }
      }));
    },
  };
}

/**
 * Genera dist/app.html: come index.html ma senza il guscio hero della home.
 * vercel.json lo usa per il fallback SPA di tutte le rotte diverse da "/", così i crawler
 * senza JS non vedono l'h1 della home su ogni pagina.
 */
function spaFallbackPlugin() {
  return {
    name: 'spa-fallback-html',
    apply: 'build',
    async writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'dist');
      const html = await fs.readFile(path.resolve(outDir, 'index.html'), 'utf8');
      const stripped = html.replace(/[ \t]*<!--hero-shell:start-->[\s\S]*?<!--hero-shell:end-->\n?/g, '');
      if (stripped === html || stripped.includes('hero-shell')) {
        throw new Error('spa-fallback-html: marcatori hero-shell non trovati o rimozione incompleta');
      }
      await fs.writeFile(path.resolve(outDir, 'app.html'), stripped);
    },
  };
}

export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  plugins: [
    react(),
    deferExternalCssPlugin(),
    copyLeanPublicPlugin(),
    spaFallbackPlugin(),
    // Genera file .gz e .br pre-compressi durante il build
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: { toplevel: true },
      format: { comments: false },
    },
    modulePreload: {
      resolveDependencies(filename, deps, { hostId, hostType }) {
        if (hostType === 'html') {
          // Escludi solo chunk pesanti usati solo in backoffice/admin
          return deps.filter(dep =>
            !dep.includes('charts') &&
            !dep.includes('pdf-render') &&
            !dep.includes('pdf-libs') &&
            !dep.includes('canvas')
          );
        }
        return deps;
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep only broad, always-needed vendor groups manual.
          // Route-specific dependencies should stay with their lazy route chunks.
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/react-pdf')) return 'pdf-render';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfmake')) return 'pdf-libs';
          if (id.includes('node_modules/html2canvas')) return 'canvas';
          // Solo runtime React + router: il vecchio test su 'node_modules/react' catturava anche
          // react-quill, react-markdown, react-smooth... (quill ~515 KB) e li precaricava su ogni pagina.
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run\/router)\//.test(id)) return 'core-react';
        }
      }
    }
  }
}))
