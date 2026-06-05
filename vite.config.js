import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
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
          // Separate chunks per ridurre JS unused
          if (id.includes('node_modules/framer-motion')) return 'motion';
          if (id.includes('node_modules/recharts')) return 'charts';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/@radix-ui')) return 'radix';
          if (id.includes('node_modules/react-pdf')) return 'pdf-render';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfmake')) return 'pdf-libs';
          if (id.includes('node_modules/html2canvas')) return 'canvas';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/react') && !id.includes('@')) return 'core-react';
        }
      }
    }
  }
})
