#!/usr/bin/env node
/**
 * extract-langs.js — Extracts the LANGS object from index.html and writes
 * one JSON file per language to public/src/i18n/
 *
 * Usage: node scripts/extract-langs.js
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT      = path.join(__dirname, '..');
const HTML_FILE = path.join(ROOT, 'public', 'index.html');
const I18N_DIR  = path.join(ROOT, 'public', 'src', 'i18n');

// ── 1. Locate the LANGS block ──────────────────────────────────────────────
const content = fs.readFileSync(HTML_FILE, 'utf8');
const lines   = content.split('\n');

const startIdx = lines.findIndex(l => l.trim().startsWith('const LANGS={'));
if (startIdx === -1) throw new Error('LANGS block not found');

// The block ends at the first line after the opening that matches the closing
// pattern "} };" — which is the sole line containing only "} };"
// Walk forward tracking brace depth to find the end
let depth = 0;
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  if (endIdx !== -1) break;
}
if (endIdx === -1) throw new Error('Could not find end of LANGS block');

console.log(`LANGS block: lines ${startIdx + 1}–${endIdx + 1} (${endIdx - startIdx + 1} lines)`);

// ── 2. Evaluate the block in an isolated context ───────────────────────────
// Wrap in an IIFE so the const binding is returned explicitly
const langsSource = lines.slice(startIdx, endIdx + 1).join('\n');
// Replace "const LANGS=" with an assignment to sandbox.__LANGS
const wrappedSource = '(function(){ ' + langsSource.replace(/^const LANGS=/, '__LANGS=') + '; return __LANGS; })()';
const sandbox = { __LANGS: undefined };
const LANGS = vm.runInNewContext(wrappedSource, sandbox);

if (!LANGS || typeof LANGS !== 'object') throw new Error('LANGS did not evaluate to an object');
const langs = Object.keys(LANGS);
console.log('Languages found:', langs);

// ── 3. Write one JSON file per language ──────────────────────────────────
fs.mkdirSync(I18N_DIR, { recursive: true });
for (const code of langs) {
  const filePath = path.join(I18N_DIR, `${code}.json`);
  fs.writeFileSync(filePath, JSON.stringify(LANGS[code], null, 2), 'utf8');
  const size = fs.statSync(filePath).size;
  console.log(`  Wrote ${code}.json (${(size / 1024).toFixed(1)} KB)`);
}

console.log('\nDone. Next step: update vite.config.js to inject LANGS from these files.');
console.log(`LANGS block spans lines ${startIdx + 1}–${endIdx + 1} (0-indexed ${startIdx}–${endIdx})`);
