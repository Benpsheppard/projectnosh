// Vite config: React + Tailwind plugins, dev server on :3000, and /api proxied to the Express server.

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// API_URL lets the app talk to an API on another port (e.g. for trying things out on a separate database).
const apiUrl = process.env.API_URL || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': apiUrl,
    },
  },
})
