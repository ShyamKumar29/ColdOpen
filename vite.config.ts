import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@engines': fileURLToPath(new URL('./src/engines', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@ai': fileURLToPath(new URL('./src/ai', import.meta.url)),
      '@schema': fileURLToPath(new URL('./src/schema', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@scenes': fileURLToPath(new URL('./src/scenes', import.meta.url)),
      '@design': fileURLToPath(new URL('./src/design', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@app-types': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
})
