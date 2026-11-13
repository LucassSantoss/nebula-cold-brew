import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Social previews need an absolute image URL. Vercel exposes the production
// domain at build time; locally the tag falls back to a root-relative path.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
process.env.VITE_SITE_URL ??= productionHost ? `https://${productionHost}` : ''

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js alone is ~700 kB minified. It ships in its own lazy chunk (the
    // WebGL scene), so the default 500 kB warning is expected there, not a regression.
    chunkSizeWarningLimit: 1000,
  },
})
