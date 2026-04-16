#!/usr/bin/env node
/**
 * migrate-onclick-collection.js
 * Migrates inline onclick handlers in the collection page (renderColl,
 * openCollectionSwitcher, renderFertPage) and fiche plante (renderDetail)
 * to data-action attributes.
 *
 * Skips: patterns using event.stopPropagation(), confirm(), or complex
 *        multi-arg calls that need special handling.
 */

const fs   = require('fs');
const path = require('path');
const HTML = path.join(__dirname, '..', 'public', 'index.html');

let content = fs.readFileSync(HTML, 'utf8');
const lines = content.split('\n');

function countOnclick(src) { return (src.match(/onclick=/g)||[]).length; }

function replaceRegexInRange(src, s, e, pattern, replacement) {
  const lns = src.split('\n');
  let count = 0;
  for (let i = s-1; i <= e-1 && i < lns.length; i++) {
    const orig = lns[i];
    const next = orig.replace(pattern, (...args) => { count++; return typeof replacement === 'function' ? replacement(...args) : replacement; });
    lns[i] = next;
  }
  return [lns.join('\n'), count];
}

const before = countOnclick(content);
console.log('onclick before collection migration:', before);

// ── Determine ranges ────────────────────────────────────────────────────────
const rcStart   = lines.findIndex(l => /^function renderColl\(\)/.test(l.trim())) + 1;
const fertEnd   = lines.findIndex(l => /^function renderFertCal/.test(l.trim())); // after renderFertPage
const detStart  = lines.findIndex(l => /^function renderDetail\(\)/.test(l.trim())) + 1;
const detEnd    = lines.findIndex(l => /^function renderEvEntry/.test(l.trim())); // after renderDetail

if (rcStart <= 0) { console.error('renderColl not found'); process.exit(1); }
console.log(`Collection range: ${rcStart}–${fertEnd}`);
console.log(`Fiche range:      ${detStart}–${detEnd}`);

// Ranges: [start, end] pairs (1-indexed)
const RANGES = [
  [rcStart, fertEnd],
  [detStart, detEnd],
];

// ── Pattern list ────────────────────────────────────────────────────────────
// (More specific patterns first)
const replacements = [
  // ── Collection view tabs ──
  [/onclick="collView='([^']+)';render\(\)"/g,
   (_, v) => `data-action="coll-view" data-view="${v}"`],

  // ── Fert view tabs ──
  [/onclick="fertView='([^']+)';render\(\)"/g,
   (_, v) => `data-action="fert-view" data-view="${v}"`],

  // ── Collection switcher ──
  [/onclick="switchCollection\('([^']+)'\);closeModal\(\)"/g,
   (_, id) => `data-action="switch-coll" data-id="${id}"`],
  [/onclick="switchCollection\(null\);closeModal\(\)"/g,
   `data-action="switch-coll-default"`],
  [/onclick="closeModal\(\);openNewCollectionModal\(\)"/g,
   `data-action="open-new-coll-modal"`],
  [/onclick="openNewCollectionModal\(\)"/g,
   `data-action="open-new-coll-modal"`],
  [/onclick="openCollectionSwitcher\(\)"/g,
   `data-action="open-coll-switcher"`],
  [/onclick="_doCreateCollection\(\)"/g,
   `data-action="do-create-coll"`],
  [/onclick="_doRenameCollection\('([^']+)'\)"/g,
   (_, id) => `data-action="do-rename-coll" data-id="${id}"`],
  [/onclick="deleteCollection\('([^']+)'\);closeModal\(\);render\(\)"/g,
   (_, id) => `data-action="del-coll" data-id="${id}"`],

  // ── Filters ──
  [/onclick="openAdvFilters\(\)"/g, `data-action="open-adv-filters"`],
  [/onclick="saveAdvFilter\(\)"/g,  `data-action="save-adv-filter"`],
  [/onclick="_applyAdvFilters\(\)"/g, `data-action="apply-adv-filters"`],
  [/onclick="advFilters=\[\];window\._afDraft=\[\];closeModal\(\);rGrid\(\)"/g,
   `data-action="clear-adv-filters"`],

  // ── Fiche plante detail buttons ──
  [/onclick="saveDetail\(\)"/g,     `data-action="save-detail"`],
  [/onclick="confDel\('([^']+)'\)"/g,
   (_, id) => `data-action="conf-del" data-id="${id}"`],
  [/onclick="openAddEvent\('([^']+)'\)"/g,
   (_, id) => `data-action="open-add-event" data-id="${id}"`],
  [/onclick="openDiag\('([^']+)'\)"/g,
   (_, id) => `data-action="open-diag" data-id="${id}"`],
  [/onclick="openPdfMenu\('([^']+)'\)"/g,
   (_, id) => `data-action="open-pdf-menu" data-id="${id}"`],
  [/onclick="exportINaturalist\('([^']+)'\)"/g,
   (_, id) => `data-action="export-inat" data-id="${id}"`],

  // ── Event form ──
  [/onclick="delEv\('([^']+)','([^']+)'\)"/g,
   (_, pid, eid) => `data-action="del-ev" data-pid="${pid}" data-eid="${eid}"`],
  [/onclick="submitEV\('([^']+)'\)"/g,
   (_, id) => `data-action="submit-ev" data-id="${id}"`],
  [/onclick="submitAP\(\)"/g, `data-action="submit-ap"`],

  // ── Culture type switches ──
  [/onclick="switchCT\('pot'\)"/g,    `data-action="switch-ct" data-ct="pot"`],
  [/onclick="switchCT\('terre'\)"/g,  `data-action="switch-ct" data-ct="terre"`],
  [/onclick="apSwitchCT\('pot'\)"/g,   `data-action="ap-switch-ct" data-ct="pot"`],
  [/onclick="apSwitchCT\('terre'\)"/g, `data-action="ap-switch-ct" data-ct="terre"`],

  // ── Generic closeModal (must come after multi-action closeModal patterns) ──
  [/onclick="closeModal\(\)"/g, `data-action="close-modal"`],
  [/onclick="closeModal\(\);showPage\('([^']+)'\)"/g,
   (_, pg) => `data-action="close-modal-nav" data-page="${pg}"`],

  // ── Determination ──
  [/onclick="submitNewDetermination\(\)"/g, `data-action="submit-determination"`],
  [/onclick="openNewDetermination\(\)"/g,   `data-action="open-new-determination"`],

  // ── GPS / location ──
  [/onclick="getLocationGPS\(\)"/g, `data-action="get-location-gps"`],
];

let total = 0;
for (const [start, end] of RANGES) {
  for (const [pattern, replacement] of replacements) {
    const [next, count] = replaceRegexInRange(content, start, end, pattern, replacement);
    if (count > 0) {
      console.log(`  [${start}-${end}] ${count}× ${String(pattern).slice(1,65)}`);
      content = next;
      total += count;
    }
  }
}
console.log(`Total replacements: ${total}`);
console.log('onclick remaining:', countOnclick(content));

// ── Extend the global action handler with collection actions ────────────────
const COLLECTION_CASES = `
    // ── Collection view ──
    case 'coll-view':
      collView = el.dataset.view || 'list';
      render();
      break;
    case 'open-coll-switcher': openCollectionSwitcher(); break;
    case 'open-new-coll-modal': openNewCollectionModal(); break;
    case 'open-adv-filters':   openAdvFilters();   break;
    case 'save-adv-filter':    saveAdvFilter();    break;
    case 'apply-adv-filters':  _applyAdvFilters(); break;
    case 'clear-adv-filters':
      advFilters=[]; window._afDraft=[];
      closeModal(); if(typeof rGrid==='function') rGrid();
      break;
    // ── Collection switcher modal ──
    case 'switch-coll':
      if(typeof switchCollection==='function'){
        switchCollection(el.dataset.id || null);
        closeModal();
      }
      break;
    case 'switch-coll-default':
      if(typeof switchCollection==='function'){ switchCollection(null); closeModal(); }
      break;
    case 'do-create-coll': if(typeof _doCreateCollection==='function') _doCreateCollection(); break;
    case 'do-rename-coll': if(typeof _doRenameCollection==='function' && el.dataset.id) _doRenameCollection(el.dataset.id); break;
    case 'del-coll':
      if(typeof deleteCollection==='function' && el.dataset.id){
        deleteCollection(el.dataset.id); closeModal(); render();
      }
      break;
    // ── Fert view ──
    case 'fert-view':
      fertView = el.dataset.view || 'cal';
      render();
      break;
    // ── Modal ──
    case 'close-modal': closeModal(); break;
    case 'close-modal-nav': closeModal(); showPage(el.dataset.page || 'dashboard'); break;
    // ── Fiche plante ──
    case 'save-detail':  if(typeof saveDetail==='function')  saveDetail();  break;
    case 'conf-del':     if(typeof confDel==='function' && el.dataset.id)    confDel(el.dataset.id);    break;
    case 'open-add-event': if(typeof openAddEvent==='function' && el.dataset.id) openAddEvent(el.dataset.id); break;
    case 'open-diag':    if(typeof openDiag==='function' && el.dataset.id)   openDiag(el.dataset.id);   break;
    case 'open-pdf-menu':if(typeof openPdfMenu==='function' && el.dataset.id) openPdfMenu(el.dataset.id); break;
    case 'export-inat':  if(typeof exportINaturalist==='function' && el.dataset.id) exportINaturalist(el.dataset.id); break;
    // ── Events ──
    case 'del-ev':
      if(typeof delEv==='function' && el.dataset.pid && el.dataset.eid) delEv(el.dataset.pid, el.dataset.eid);
      break;
    case 'submit-ev':
      if(typeof submitEV==='function' && el.dataset.id) submitEV(el.dataset.id);
      break;
    case 'submit-ap': if(typeof submitAP==='function') submitAP(); break;
    // ── Culture type ──
    case 'switch-ct':
      if(typeof switchCT==='function') switchCT(el.dataset.ct || 'pot');
      break;
    case 'ap-switch-ct':
      if(typeof apSwitchCT==='function') apSwitchCT(el.dataset.ct || 'pot');
      break;
    // ── Determination ──
    case 'submit-determination': if(typeof submitNewDetermination==='function') submitNewDetermination(); break;
    case 'open-new-determination': if(typeof openNewDetermination==='function') openNewDetermination(); break;
    // ── GPS ──
    case 'get-location-gps': if(typeof getLocationGPS==='function') getLocationGPS(); break;
`;

// Inject collection cases into the existing handler, before the closing `}` of switch
const handlerMarker = '// ── Global action dispatcher';
const switchClose = '\n  }\n});\n})();';

if (!content.includes(handlerMarker)) {
  console.error('Cannot find action handler to extend. Skipping extension.');
} else if (content.includes("case 'coll-view'")) {
  console.log('Collection cases already in handler, skipping extension.');
} else {
  content = content.replace(switchClose, COLLECTION_CASES + switchClose);
  console.log('Handler extended with collection cases.');
}

fs.writeFileSync(HTML, content, 'utf8');
console.log('\nDone. Run: npm run build');
