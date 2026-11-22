import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The scene chunk is three.js plus fiber (~270 kB gzip). It is lazy-loaded
    // after the text paints, so its size doesn't hold up the page.
    chunkSizeWarningLimit: 1100,
  },
})
