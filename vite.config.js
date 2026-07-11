import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
  },
  server: {
    // Dev-only stand-in for the Cloudflare Worker's GitHub API proxy
    proxy: {
      '/api/github': {
        target: 'https://api.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github/, ''),
      },
    },
  },
  preview: {
    // Keep `vite preview` (and CI e2e) hermetic — no live GitHub API calls
    proxy: {},
  },
});
