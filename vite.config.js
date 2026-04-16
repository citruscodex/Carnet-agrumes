import { defineConfig } from 'vite';

export default defineConfig({
  // public/ est la racine web — index.html s'y trouve directement
  root: 'public',
  publicDir: false,
  build: {
    outDir: '../build',
    emptyOutDir: true,
    rollupOptions: {
      // relatif à root ('public')
      input: 'index.html',
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
