import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Genera file .gz e .br pre-compressi durante il build
    // Vercel li serve automaticamente al browser che li supporta
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
