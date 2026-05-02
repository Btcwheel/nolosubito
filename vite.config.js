import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import compression from 'vite-plugin-compression'

/**
 * Plugin che converte i tag CSS render-blocking in caricamento asincrono.
 * Trasforma: <link rel="stylesheet" href="...">
 * In:        <link rel="preload" href="..." as="style" onload="this.onload=null;this.rel='stylesheet'">
 *            <noscript><link rel="stylesheet" href="..."></noscript>
 *
 * Questo rimuove il CSS dal critical rendering path:
 * il browser inizia a scaricare il CSS senza aspettarlo prima di disegnare.
 */
function deferCssPlugin() {
  return {
    name: 'defer-non-critical-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Trasforma tutti i <link rel="stylesheet"> (tranne quelli Google Fonts che già gestiamo)
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
          (_, href) =>
            `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" href="${href}"></noscript>`
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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', '@tanstack/react-query'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
})
