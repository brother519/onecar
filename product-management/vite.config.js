import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          dnd: ['react-dnd', 'react-dnd-html5-backend'],
          virtualized: ['react-virtualized', 'react-window'],
          monaco: ['@monaco-editor/react'],
          qrcode: ['qrcode', 'qrcode.react'],
          redux: ['@reduxjs/toolkit', 'react-redux']
        }
      }
    }
  }
})