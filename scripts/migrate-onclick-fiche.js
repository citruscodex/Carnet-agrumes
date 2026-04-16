#!/usr/bin/env node
/**
 * migrate-onclick-fiche.js
 * Handles remaining onclick patterns specific to fiche plante (renderDetail)
 * that weren't covered by the collection migration.
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
console.log('onclick before fiche migration:', before);

// Range: renderDetail + a bit beyond (L7901-8100)
const detStart  = lines.findIndex(l => /^function renderDetail\(\)/.test(l.trim())) + 1;
const detEnd    = detStart + 200;
console.log('Fiche range:', detStart, '-', detEnd);

const replacements = [
  // Photo gallery open (two args: plantId + index)
  [/onclick="openPhGallery\('([^']+)',(\d+|\$\{[^}]+\})\)"/g,
   (_, pid, idx) => `data-action="open-ph-gallery" data-pid="${pid}" data-idx="${idx}"`],

  // GBIF search (fixed args)
  [/onclick="searchGBIF\('ed-sp','gbif-sp-res'\)"/g,
   `data-action="search-gbif"`],

  // Toggle det history
  [/onclick="_detHistOpen=!_detHistOpen;render\(\)"/g,
   `data-action="toggle-det-hist"`],

  // proView+nursView nav (appeared in fiche range too)
  [/onclick="proView='([^']+)';nursView='([^']+)';showPage\('pro'\)"/g,
   (_, pv, nv) => `data-action="nav" data-page="pro" data-pro-view="${pv}" data-nurs-view="${nv}"`],

  // Wiki article (conditional pattern)
  [/onclick="if\(window\.__CCA_wiki\)window\.__CCA_wiki\.openArticle\('([^']+)'\);showPage\('wiki'\)"/g,
   (_, slug) => `data-action="open-wiki-article" data-slug="${slug}"`],

  // Drip detail
  [/onclick="if\(window\.__CCA_drip\)window\.__CCA_drip\.openDetail\('([^']+)'\);showPage\('drip'\)"/g,
   (_, id) => `data-action="open-drip-detail" data-id="${id}"`],

  // Graft reprise modal (without event.stopPropagation)
  [/onclick="openGraftRepriseModal\('([^']+)','([^']+)'\)"/g,
   (_, pid, eid) => `data-action="open-graft-reprise" data-pid="${pid}" data-eid="${eid}"`],

  // Save graft reprise
  [/onclick="saveGraftReprise\('([^']+)','([^']+)'\)"/g,
   (_, pid, eid) => `data-action="save-graft-reprise" data-pid="${pid}" data-eid="${eid}"`],
];

let total = 0;
for (const [pattern, replacement] of replacements) {
  const [next, count] = replaceRegexInRange(content, detStart, detEnd, pattern, replacement);
  if (count > 0) {
    console.log(`  ${count}× ${String(pattern).slice(1,60)}`);
    content = next;
    total += count;
  }
}
console.log(`Total replacements: ${total}`);
console.log('onclick remaining:', countOnclick(content));

// Extend handler with fiche-specific cases
const FICHE_CASES = `
    // ── Fiche plante extras ──
    case 'open-ph-gallery':
      if(typeof openPhGallery==='function' && el.dataset.pid)
        openPhGallery(el.dataset.pid, parseInt(el.dataset.idx||'0',10));
      break;
    case 'search-gbif':
      if(typeof searchGBIF==='function') searchGBIF('ed-sp','gbif-sp-res');
      break;
    case 'toggle-det-hist':
      window._detHistOpen = !window._detHistOpen;
      render();
      break;
    case 'open-wiki-article':
      if(window.__CCA_wiki && el.dataset.slug) window.__CCA_wiki.openArticle(el.dataset.slug);
      showPage('wiki');
      break;
    case 'open-drip-detail':
      if(window.__CCA_drip && el.dataset.id) window.__CCA_drip.openDetail(el.dataset.id);
      showPage('drip');
      break;
    case 'open-graft-reprise':
      if(typeof openGraftRepriseModal==='function' && el.dataset.pid && el.dataset.eid)
        openGraftRepriseModal(el.dataset.pid, el.dataset.eid);
      break;
    case 'save-graft-reprise':
      if(typeof saveGraftReprise==='function' && el.dataset.pid && el.dataset.eid)
        saveGraftReprise(el.dataset.pid, el.dataset.eid);
      break;
`;

const switchClose = '\n  }\n});\n})();';
if (!content.includes("case 'open-ph-gallery'")) {
  content = content.replace(switchClose, FICHE_CASES + switchClose);
  console.log('Handler extended with fiche cases.');
} else {
  console.log('Fiche cases already present, skipping.');
}

fs.writeFileSync(HTML, content, 'utf8');
console.log('\nDone. Run: npm run build');
