import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs/promises'
import compression from 'vite-plugin-compression'

const publicEntriesToCopy = [
  'brands',
  'fonts',
  'favicon.png',
  'gigi-images.json',
  'logo-bianco.png',
  'logo-blu.png',
  'logo-blu.svg',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'vehicle-catalog.json',
];

/**
 * Carica il CSS principale con preload (alta priorità) ma senza bloccare il rendering.
 * I CSS esterni (Google Fonts) usano media="print" per non bloccare.
 * Il CSS principale viene preloadato invece di essere render-blocking,
 * così la pagina può iniziare a renderizzare prima che il CSS sia completo.
 * L'inline style minimal in index.html evita il Flash of Unstyled Content
 * per lo sfondo e il caricamento iniziale.
 */
function deferCssPlugin() {
  return {
    name: 'defer-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link ([^>]*)rel="stylesheet"([^>]*)href="([^"]+)"([^>]*)>/g,
          (match, before, middle, href, after) => {
            if (href.includes('fonts.googleapis.com')) {
              return `<link ${before}rel="stylesheet"${middle}href="${href}" media="print" onload="this.media='all'">` +
                     `<noscript><link ${before}rel="stylesheet"${middle}href="${href}"></noscript>`;
            }
            if (href.includes('.css')) {
              return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
                     `<noscript><link ${before}rel="stylesheet"${middle}href="${href}"></noscript>`;
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

export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  plugins: [
    react(),
    deferCssPlugin(),
    copyLeanPublicPlugin(),
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
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/react-pdf')) return 'pdf-render';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfmake')) return 'pdf-libs';
          if (id.includes('node_modules/html2canvas')) return 'canvas';
          if (id.includes('node_modules/react') && !id.includes('@')) return 'core-react';
        }
      }
    }
  }
}))
