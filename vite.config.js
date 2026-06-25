import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages Base | Uses the repository name during Actions builds and root locally
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const githubPagesBase = repositoryName ? `/${repositoryName}/` : '/'

export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS === 'true' ? githubPagesBase : '/'
})
