import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Plugin: inject const LANGS={...} as an inline non-module <script> in <head>
// Source of truth: public/src/i18n/*.json
function inlineLangsPlugin() {
  const I18N_DIR = path.resolve('public/src/i18n');
  const LANGS_CODES = ['fr', 'en', 'it', 'es', 'pt'];

  return {
    name: 'inline-langs',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const LANGS = {};
        for (const code of LANGS_CODES) {
          const filePath = path.join(I18N_DIR, `${code}.json`);
          LANGS[code] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        const script = `<script>var LANGS=${JSON.stringify(LANGS)};window.LANGS=LANGS;</script>`;
        // Inject right before </head>
        return html.replace('</head>', `${script}\n</head>`);
      },
    },
  };
}

export default defineConfig({
  // public/ est la racine web — index.html s'y trouve directement
  root: 'public',
  publicDir: false,
  plugins: [inlineLangsPlugin()],
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
