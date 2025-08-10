import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If GHPAGES env var is set in the CI workflow, set a base path.
// Replace REPO_NAME automatically if user sets VITE_REPO_NAME env or fall back to process.env.npm_package_name.
// Hardcode base to GitHub Pages repo path to avoid env timing issues.
const repoBase = '/BibleReader_SmartSearch/';

export default defineConfig(() => ({
  base: process.env.GITHUB_ACTIONS ? repoBase : '/',
  plugins: [react()],
}));
