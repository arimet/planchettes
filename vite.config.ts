import { defineConfig } from 'vite'

export default defineConfig({
  // relative URLs: the build works under any sub-path (GitHub Pages)
  base: './',
  build: { chunkSizeWarningLimit: 700 },
})
