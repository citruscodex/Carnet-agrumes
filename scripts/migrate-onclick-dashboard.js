#!/usr/bin/env node
/**
 * migrate-onclick-dashboard.js
 * Migrates inline onclick handlers in render() + renderDash + _renderDashXxx
 * to data-action attributes, then adds a global event delegation handler.
 *
 * Lines targeted (1-indexed):  4088–4390 (render + all dash render functions)
 *                               4164–4186 (_dashWeatherGelBlock sortisBanner)
 * Delegation handler injected: just before main </script> (line 21143)
 */

const fs   = require('fs');
const path = require('path');
const HTML = path.join(__dirname, '..', 'public', 'index.html');

let content = fs.readFileSync(HTML, 'utf8');
const lines = content.split('\n');

// ── Helpers ────────────────────────────────────────────────────────────────
function countOnclick(src) {
  return (src.match(/onclick=/g) || []).length;
}

// Replace within a line-range only. Returns modified content + replacement count.
function replaceInRange(src, startLine, endLine, find, replace) {
  const lns = src.split('\n');
  let count = 0;
  for (let i = startLine - 1; i <= endLine - 1 && i < lns.length; i++) {
    const orig = lns[i];
    const next = orig.split(find).join(replace);
    if (next !== orig) { count += (orig.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length; lns[i] = next; }
  }
  return [lns.join('\n'), count];
}

function replaceRegexInRange(src, startLine, endLine, pattern, replacement) {
  const lns = src.split('\n');
  let count = 0;
  for (let i = startLine - 1; i <= endLine - 1 && i < lns.length; i++) {
    const orig = lns[i];
    const next = orig.replace(pattern, (...args) => { count++; return typeof replacement === 'function' ? replacement(...args) : replacement; });
    lns[i] = next;
  }
  return [lns.join('\n'), count];
}

const before = countOnclick(content);
console.log('onclick before migration:', before);

// ── RANGE: render() … _renderDashConservatoire (inclusive) ────────────────
// From render() start through the end of all _renderDashXxx functions
const R1 = lines.findIndex(l => /^function render\(\)/.test(l.trim())) + 1;
// R2: line AFTER _renderDashConservatoire closing brace (first fn after it)
const R2 = lines.findIndex(l => /^function _renderWishlist/.test(l.trim()));
if (R1 <= 0 || R2 <= 0) { console.error('Cannot locate render/dash range'); process.exit(1); }
console.log(`Dashboard range: lines ${R1}–${R2} (render → _renderDashConservatoire)`);

// ── Pattern replacements (order matters: more specific first) ──────────────
const replacements = [
  // 1. open-plant: showPage('collection');openDetail('${...}')
  [/onclick="showPage\('collection'\);openDetail\('([^']+)'\)"/g,
   (_, id) => `data-action="open-plant" data-id="${id}"`],

  // 2. sel + open: selId='${...}';showPage('collection');openDetail('${...}')
  [/onclick="selId='([^']+)';showPage\('collection'\);openDetail\('([^']+)'\)"/g,
   (_, sid) => `data-action="open-plant" data-id="${sid}"`],

  // 3. sel-plant: selId='${...}';render()
  [/onclick="selId='([^']+)';render\(\)"/g,
   (_, id) => `data-action="sel-plant" data-id="${id}"`],

  // 4. nav pro + nursView (2 vars)
  [/onclick="proView='([^']+)';nursView='([^']+)';showPage\('pro'\)"/g,
   (_, pv, nv) => `data-action="nav" data-page="pro" data-pro-view="${pv}" data-nurs-view="${nv}"`],

  // 5. nav pro only
  [/onclick="proView='([^']+)';showPage\('pro'\)"/g,
   (_, pv) => `data-action="nav" data-page="pro" data-pro-view="${pv}"`],

  // 6. nav consView
  [/onclick="consView='([^']+)';showPage\('pro'\)"/g,
   (_, cv) => `data-action="nav" data-page="pro" data-cons-view="${cv}"`],

  // 7. nav collView
  [/onclick="collView='([^']+)';showPage\('collection'\)"/g,
   (_, cv) => `data-action="nav" data-page="collection" data-coll-view="${cv}"`],

  // 8. nav fert + fertView
  [/onclick="showPage\('fert'\);fertView='([^']+)';render\(\)"/g,
   (_, fv) => `data-action="nav" data-page="fert" data-fert-view="${fv}"`],

  // 9. nav showPage (generic — must be after specific nav patterns)
  [/onclick="showPage\('([^']+)'\)"/g,
   (_, pg) => `data-action="nav" data-page="${pg}"`],

  // 10. showPage with escaped quotes (inside JS strings: showPage(\'settings\'))
  [/onclick="showPage\(\\'([^']+)\\'\)"/g,
   (_, pg) => `data-action="nav" data-page="${pg}"`],

  // 11. Conservatoire special actions
  [/onclick="_consLabelPDF\(\)"/g,  `data-action="cons-label-pdf"`],
  [/onclick="_exportBGCI\(\)"/g,    `data-action="export-bgci"`],

  // 12. render() action bar specifics
  [/onclick="openInfographic\(\)"/g,        `data-action="open-infographic"`],
  [/onclick="openAddFert\(\)"/g,            `data-action="open-add-fert"`],
  [/onclick="openEcoEntry\(null,'cost'\)"/g, `data-action="open-eco-entry" data-entry-type="cost"`],
  [/onclick="wikiView='admin';renderCommunityPage\(\)"/g, `data-action="wiki-admin"`],
  [/onclick="renderBugAdmin\(\)"/g,   `data-action="refresh-bug-admin"`],
  [/onclick="renderAdminUsers\(\)"/g, `data-action="refresh-admin-users"`],
  [/onclick="enterSelMode\(\)"/g,     `data-action="enter-sel-mode"`],
  [/onclick="openAddPlant\(\)"/g,     `data-action="open-add-plant"`],
];

let total = 0;
for (const [pattern, replacement] of replacements) {
  const [next, count] = replaceRegexInRange(content, R1, R2, pattern, replacement);
  if (count > 0) {
    console.log(`  Replaced ${count}× ${pattern.source ? pattern.source.slice(0, 60) : String(pattern).slice(0, 60)}`);
    content = next;
    total += count;
  }
}
console.log(`Total replacements in render/dash range: ${total}`);

// Also handle showPage('collection') standalone in _dashWeatherGelBlock / sortisBanner
// (a few lines around the function)
const dashWeatherLine = lines.findIndex(l => l.includes('function _dashWeatherGelBlock')) + 1;
if (dashWeatherLine > 0) {
  const [c2, n2] = replaceRegexInRange(content, dashWeatherLine, dashWeatherLine + 20,
    /onclick="showPage\('collection'\)"/g,
    `data-action="nav" data-page="collection"`);
  if (n2 > 0) { console.log(`  +${n2} sortisBanner nav`); content = c2; total += n2; }
}

const after = countOnclick(content);
console.log(`onclick after range migration: ${after} (reduced by ${before - after})`);

// ── Add global event delegation handler ────────────────────────────────────
const HANDLER = `
// ── Global action dispatcher — migrated from inline onclick (Étape 3) ──────
(function(){
document.addEventListener('click', function _gad(e){
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  switch(action){
    // ── Navigation ──
    case 'nav':{
      const pg = el.dataset.page || 'dashboard';
      if(el.dataset.proView  !== undefined) proView  = el.dataset.proView;
      if(el.dataset.nursView !== undefined) nursView = el.dataset.nursView;
      if(el.dataset.consView !== undefined) consView = el.dataset.consView;
      if(el.dataset.collView !== undefined) collView = el.dataset.collView;
      if(el.dataset.fertView !== undefined) fertView = el.dataset.fertView;
      showPage(pg);
      if(el.dataset.fertView !== undefined) render();
      break;
    }
    // ── Plant detail ──
    case 'open-plant':
      if(el.dataset.id){ showPage('collection'); openDetail(el.dataset.id); }
      break;
    case 'sel-plant':
      if(el.dataset.id){ selId = el.dataset.id; render(); }
      break;
    // ── Conservatoire ──
    case 'cons-label-pdf': if(typeof _consLabelPDF==='function') _consLabelPDF(); break;
    case 'export-bgci':    if(typeof _exportBGCI==='function')   _exportBGCI();   break;
    // ── Dashboard action bar ──
    case 'open-infographic': if(typeof openInfographic==='function') openInfographic(); break;
    case 'open-add-fert':    if(typeof openAddFert==='function')     openAddFert();     break;
    case 'open-eco-entry':   if(typeof openEcoEntry==='function')    openEcoEntry(null, el.dataset.entryType||'cost'); break;
    case 'wiki-admin':
      wikiView='admin';
      if(typeof renderCommunityPage==='function') renderCommunityPage();
      break;
    case 'refresh-bug-admin':   if(typeof renderBugAdmin==='function')   renderBugAdmin();   break;
    case 'refresh-admin-users': if(typeof renderAdminUsers==='function') renderAdminUsers(); break;
    case 'enter-sel-mode': if(typeof enterSelMode==='function') enterSelMode(); break;
    case 'open-add-plant': if(typeof openAddPlant==='function') openAddPlant(); break;
  }
});
})();
`;

// Inject just before the closing </script> of the main script
// Guard: skip if already injected
if (content.includes('Global action dispatcher')) {
  console.log('Event delegation handler already present, skipping injection.');
} else {
  const mainScriptEnd = '</script>\n<!-- 3D — Module phénologie BBCH';
  if (!content.includes(mainScriptEnd)) {
    console.error('ERROR: Could not find main </script> boundary. Aborting.');
    process.exit(1);
  }
  content = content.replace(mainScriptEnd, HANDLER.trimEnd() + '\n' + mainScriptEnd);
  console.log('Event delegation handler injected.');
}

fs.writeFileSync(HTML, content, 'utf8');
console.log('\nDone. Run: npm run build');
