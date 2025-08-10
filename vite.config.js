import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If GHPAGES env var is set in the CI workflow, set a base path.
// Replace REPO_NAME automatically if user sets VITE_REPO_NAME env or fall back to process.env.npm_package_name.
const repoName = process.env.VITE_REPO_NAME || process.env.npm_package_name || '';

export default defineConfig(() => ({
  base: process.env.GHPAGES ? `/${repoName}/` : '/',
  plugins: [react()],
}));
