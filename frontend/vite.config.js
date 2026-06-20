import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Use the modern Dart Sass compiler API (eliminates legacy-js-api warning)
        api: 'modern-compiler'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})
