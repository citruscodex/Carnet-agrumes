#!/usr/bin/env node
/**
 * extract-css.js — Extracts the main <style> block (lines 21-1435) from
 * public/index.html and splits it into per-section CSS files in
 * public/src/styles/.
 *
 * Usage: node scripts/extract-css.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const HTML_FILE  = path.join(ROOT, 'public', 'index.html');
const STYLES_DIR = path.join(ROOT, 'public', 'src', 'styles');

const content = fs.readFileSync(HTML_FILE, 'utf8');
const lines   = content.split('\n');

// ── Locate main <style> block ──────────────────────────────────────────────
// First <style> is on line 21 (1-indexed = index 20)
const STYLE_START = 20;  // 0-indexed, line 21
const STYLE_END   = 1434; // 0-indexed, line 1435 (</style>)

// The CSS content is between the <style> and </style> tags
// line 20 = '<style>*,*::before...'  → strip leading '<style>'
// line 1434 = '</style>'             → skip

// Extract raw CSS lines (between <style> and </style>)
// Line 20: '<style>...' — strip '<style>'
// Lines 21-1433: raw CSS
// Line 1434: '</style>' — skip

let cssLines = [];
// Handle first line: strip leading '<style>'
const firstLine = lines[STYLE_START].replace(/^<style>/, '');
if (firstLine.trim()) cssLines.push(firstLine);
// Middle lines
for (let i = STYLE_START + 1; i < STYLE_END; i++) {
  cssLines.push(lines[i]);
}

const css = cssLines.join('\n');

// ── Section boundaries (line numbers are 1-indexed in HTML, matching comments)
// We define slices using the CSS line array (0-indexed within cssLines)
// Comment markers we found:
//  line 32  = /* ── Design system v2 */           → css index ~11
//  line 106 = /* ── Skeleton screens */            → css index ~85
//  line 132 = /* ── Composant tab canonique */     → css index ~111
//  line 150 = /* ── Composants génériques */       → css index ~129
//  line 174 = .evrow (calendar events)
//  line 181 = .wx-today-bar (weather = dashboard)
//  line 267 = .fg-card (collection graphs)
//  line 304 = .frow (filters)
//  line 309 = :root{--plan-bg} (pro/verger)
//  line 535 = /* ── Module Phénologie */           → css index ~514
//  line 604 = /* ── Module Wiki */                 → css index ~583
//  line 639 = /* ── Module Étiquettes muséales */  → css index ~618
//  line 651 = /* ── Module Observatoire */         → css index ~630
//  line 669 = /* ── Module Drip */                 → css index ~648
//  line 700 = /* ── Module Bug */                  → css index ~679
//  line 1358 = /* ── Wiki & Communauté */          → css index ~1337

// Helper: find line index in cssLines matching a pattern
function findCssLine(pattern, startFrom = 0) {
  for (let i = startFrom; i < cssLines.length; i++) {
    if (pattern.test(cssLines[i])) return i;
  }
  throw new Error('Pattern not found: ' + pattern);
}

const iDesignSystem  = findCssLine(/\/\*.*Design system/);
const iSkeleton      = findCssLine(/\/\*.*Skeleton/);
const iTabCanon      = findCssLine(/\/\*.*Composant tab/);
const iGenerics      = findCssLine(/\/\*.*Composants génériques/);
const iCalendar      = findCssLine(/^\.evrow\{/);
const iDashboard     = findCssLine(/^\.wx-today-bar\{/);
const iCollGraphs    = findCssLine(/^\.fg-card\{/);
const iPro           = findCssLine(/^:root\{--plan-bg/);
const iPhenology     = findCssLine(/\/\*.*Phénologie BBCH/);
const iWiki          = findCssLine(/\/\*.*Module Wiki/);
const iLabels        = findCssLine(/\/\*.*Étiquettes muséales/);
const iObs           = findCssLine(/\/\*.*Module Observatoire/);
const iDrip          = findCssLine(/\/\*.*Module Drip/);
const iBug           = findCssLine(/\/\*.*Module Bug/);
const iWikiCommunity = findCssLine(/\/\*.*Wiki.*Communauté/);
const iEnd           = cssLines.length;

console.log('CSS section boundaries (0-indexed within CSS):');
console.log('  Base/design system:', iDesignSystem, '(HTML line', STYLE_START + 1 + iDesignSystem + 1, ')');
console.log('  Skeleton:', iSkeleton);
console.log('  Tab canon:', iTabCanon);
console.log('  Generics:', iGenerics);
console.log('  Calendar (evrow):', iCalendar);
console.log('  Dashboard (wx):', iDashboard);
console.log('  Collection graphs (fg):', iCollGraphs);
console.log('  Pro (plan-bg):', iPro);
console.log('  Phenology:', iPhenology);
console.log('  Wiki:', iWiki);
console.log('  Labels:', iLabels);
console.log('  Observatoire:', iObs);
console.log('  Drip:', iDrip);
console.log('  Bug:', iBug);
console.log('  Wiki & Communauté:', iWikiCommunity);
console.log('  End:', iEnd);

// ── Extract a slice of cssLines ─────────────────────────────────────────────
function slice(from, to) {
  return cssLines.slice(from, to).join('\n').trim();
}

// ── Build file contents ─────────────────────────────────────────────────────
fs.mkdirSync(STYLES_DIR, { recursive: true });

// 1. base.css — Reset + design system + skeleton + tabs + shared generic components
//    Lines up to calendar start (evrow)
const baseCss = [
  '/* === Base: reset, design system, skeleton screens, shared components === */',
  slice(0, iCalendar),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'base.css'), baseCss, 'utf8');
console.log('base.css:', (baseCss.length / 1024).toFixed(1), 'KB');

// 2. calendar.css — Event row display (evrow, evdot, evpl, evds, evdt)
//    Lines iCalendar up to iDashboard
const calendarCss = [
  '/* === Calendar: event row display === */',
  slice(iCalendar, iDashboard),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'calendar.css'), calendarCss, 'utf8');
console.log('calendar.css:', (calendarCss.length / 1024).toFixed(1), 'KB');

// 3. dashboard.css — Weather (wx-*), gel alerts (gel-*), sw toggle
//    Lines iDashboard up to iCollGraphs
const dashboardCss = [
  '/* === Dashboard: weather widget, gel alerts, toggle switch === */',
  slice(iDashboard, iCollGraphs),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'dashboard.css'), dashboardCss, 'utf8');
console.log('dashboard.css:', (dashboardCss.length / 1024).toFixed(1), 'KB');

// 4. collection.css — Fertilization graph (fg-*), watering graph (wg-*), filters
//    Lines iCollGraphs up to iPro
const collectionCss = [
  '/* === Collection: fertilization graph, watering graph, filter bar === */',
  slice(iCollGraphs, iPro),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'collection.css'), collectionCss, 'utf8');
console.log('collection.css:', (collectionCss.length / 1024).toFixed(1), 'KB');

// 5. pro.css — Verger/map (verger-*, v-*, plan-*), parcel mgmt (emp-*), knowledge base (kb-*)
//    Lines iPro up to iPhenology
const proCss = [
  '/* === Pro: verger map, plan, parcel management, knowledge base === */',
  slice(iPro, iPhenology),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'pro.css'), proCss, 'utf8');
console.log('pro.css:', (proCss.length / 1024).toFixed(1), 'KB');

// 6. phenology.css — BBCH phenology module (cca-pheno-*)
//    Lines iPhenology up to iWiki
const phenologyCss = [
  '/* === Phenology: BBCH module (cca-pheno-*) === */',
  slice(iPhenology, iWiki),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'phenology.css'), phenologyCss, 'utf8');
console.log('phenology.css:', (phenologyCss.length / 1024).toFixed(1), 'KB');

// 7. print.css — Museum labels (cca-label-*) + @media print
//    Lines iLabels up to iObs
// (interleaved between wiki and obs — extract separately)
const printCss = [
  '/* === Print: museum labels (cca-label-*), @media print === */',
  slice(iLabels, iObs),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'print.css'), printCss, 'utf8');
console.log('print.css:', (printCss.length / 1024).toFixed(1), 'KB');

// 8. wiki.css — Wiki module (cca-wiki-*) + Observatoire (cca-obs-*) + Wiki & Communauté section
//    Sections: iWiki..iLabels + iObs..iDrip + iWikiCommunity..iEnd
const wikiCss = [
  '/* === Wiki: wiki module (cca-wiki-*) === */',
  slice(iWiki, iLabels),
  '',
  '/* === Community / Observatoire (cca-obs-*) === */',
  slice(iObs, iDrip),
  '',
  '/* === Wiki & Communauté section === */',
  slice(iWikiCommunity, iEnd),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'wiki.css'), wikiCss, 'utf8');
console.log('wiki.css:', (wikiCss.length / 1024).toFixed(1), 'KB');

// 9. drip.css — Drip irrigation module (cca-drip-*)
//    Lines iDrip up to iBug
const dripCss = [
  '/* === Drip: irrigation module (cca-drip-*) === */',
  slice(iDrip, iBug),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'drip.css'), dripCss, 'utf8');
console.log('drip.css:', (dripCss.length / 1024).toFixed(1), 'KB');

// 10. bug.css — Bug tracker module (cca-bug-*)
//     Lines iBug up to iWikiCommunity
const bugCss = [
  '/* === Bug tracker module (cca-bug-*) === */',
  slice(iBug, iWikiCommunity),
].join('\n');
fs.writeFileSync(path.join(STYLES_DIR, 'bug.css'), bugCss, 'utf8');
console.log('bug.css:', (bugCss.length / 1024).toFixed(1), 'KB');

// ── Remove main <style>...</style> block from index.html ────────────────────
// Replace lines STYLE_START..STYLE_END (inclusive) with link tags
const linkTags = [
  '  <link rel="stylesheet" href="src/styles/base.css">',
  '  <link rel="stylesheet" href="src/styles/calendar.css">',
  '  <link rel="stylesheet" href="src/styles/dashboard.css">',
  '  <link rel="stylesheet" href="src/styles/collection.css">',
  '  <link rel="stylesheet" href="src/styles/pro.css">',
  '  <link rel="stylesheet" href="src/styles/phenology.css">',
  '  <link rel="stylesheet" href="src/styles/print.css">',
  '  <link rel="stylesheet" href="src/styles/wiki.css">',
  '  <link rel="stylesheet" href="src/styles/drip.css">',
  '  <link rel="stylesheet" href="src/styles/bug.css">',
];

const before   = lines.slice(0, STYLE_START);
const after    = lines.slice(STYLE_END + 1);
const newLines = [...before, ...linkTags, ...after];

fs.writeFileSync(HTML_FILE, newLines.join('\n'), 'utf8');
console.log('\nindex.html updated: replaced <style> block with', linkTags.length, '<link> tags');
console.log('Lines before:', lines.length, '→ after:', newLines.length);
