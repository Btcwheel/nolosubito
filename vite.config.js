import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import compression from 'vite-plugin-compression'

/**
 * Plugin che converte i tag CSS render-blocking in caricamento asincrono.
 * Usa il trick: media="print" onload="this.media='all'"
 * È il metodo più affidabile per caricare CSS in modo non bloccante senza FOUC pesante.
 */
function deferCssPlugin() {
  return {
    name: 'defer-non-critical-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Match any stylesheet link (Vite assets or Google Fonts)
        return html.replace(
          /<link [^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
          (match, href) => {
            // Apply defer only to CSS files or Fonts
            if (href.includes('.css') || href.includes('fonts.googleapis.com')) {
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

export default defineConfig({
  plugins: [
    react(),
    deferCssPlugin(),
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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
        }
      }
    }
  }
})
