import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Im echten Projekt: Django-Backend unter /api durchreichen
    proxy: { '/api': 'http://localhost:8000' },
  },
})
