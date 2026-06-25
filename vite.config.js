import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages Build | Relative assets allow the committed docs folder to work under the repository path
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
})
