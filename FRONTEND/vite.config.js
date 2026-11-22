import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'

export default defineConfig({
  // Pages uses /TEXTICODE/; other hosts keep their existing root path.
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    https: {
      key: fs.readFileSync('./certs/localhost.key'),
      cert: fs.readFileSync('./certs/localhost.crt')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
