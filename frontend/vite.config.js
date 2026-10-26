import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, proxy /api to the FastAPI backend so the frontend can call it
// without CORS issues (backend runs on http://localhost:8000).
export default defineConfig({
  plugins: [react()],
  // Served from https://<user>.github.io/SIP_calculator/ on GitHub Pages,
  // so assets must be referenced under that sub-path.
  base: '/SIP_calculator/',
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
