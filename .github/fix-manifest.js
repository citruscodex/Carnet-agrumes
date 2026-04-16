#!/usr/bin/env node
// Fixe la référence manifest hashée dans build/index.html → /manifest.json stable
const fs = require('fs');
const html = fs.readFileSync('build/index.html', 'utf8');
const fixed = html.replace(
  /href="\/assets\/manifest-[^"]+\.json"/,
  'href="/manifest.json"'
);
if (fixed === html) {
  console.warn('WARNING: manifest href pattern not found in build/index.html');
  // Continuer quand même — la référence peut déjà être correcte
}
fs.writeFileSync('index.html', fixed);
console.log('index.html écrit avec manifest href stable');
