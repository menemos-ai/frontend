import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      NEXT_PUBLIC_DEMO_MODE: 'true',
      NEXT_PUBLIC_MARKETPLACE_ADDRESS: '0x0000000000000000000000000000000000000001',
      NEXT_PUBLIC_REGISTRY_ADDRESS: '0x0000000000000000000000000000000000000002',
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
