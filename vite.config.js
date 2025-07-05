import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
      external: []
    }
  },
  server: {
    host: true,
    port: 3000
  },
  preview: {
    host: true,
    port: 4173
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'axios',
      'leaflet',
      'react-leaflet'
    ]
  }
})