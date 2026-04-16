/**
 * scan-handlers.mjs — P0 Stabilisation Vite
 * Scanne les handlers inline (onclick, onchange, oninput…) dans les fichiers JS
 * et dans public/index.html pour identifier les fonctions non exposées sur window.
 *
 * Usage :
 *   node scan-handlers.mjs                  # scan src/modules/*.js + public/index.html
 *   node scan-handlers.mjs --html-only      # scan uniquement public/index.html
 *   node scan-handlers.mjs --modules-only   # scan uniquement src/modules/*.js
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const MODULES_DIR = join(ROOT, 'src', 'modules');
const HTML_FILE   = join(ROOT, 'public', 'index.html');
const MODE = process.argv[2] || '';

// Globals natifs à ignorer (ne pas signaler comme "manquants")
const NATIVE_GLOBALS = new Set([
  // Constructeurs / namespaces
  'window','document','console','Math','JSON','parseInt','parseFloat',
  'isNaN','isFinite','String','Number','Boolean','Array','Object','Date',
  'RegExp','Error','Promise','Map','Set','WeakMap','WeakSet','Symbol',
  'Proxy','Reflect','Intl','URL','URLSearchParams','FormData','Blob',
  // API browser
  'setTimeout','setInterval','clearTimeout','clearInterval','requestAnimationFrame',
  'cancelAnimationFrame','requestIdleCallback','queueMicrotask',
  'fetch','localStorage','sessionStorage','navigator','location','history',
  'alert','confirm','prompt','open','print','reload','close',
  'encodeURIComponent','decodeURIComponent','encodeURI','decodeURI',
  'btoa','atob','structuredClone',
  // Mots-clés JS qui trainent dans des lambdas
  'this','event','true','false','null','undefined','Infinity','NaN',
  'if','return','new','typeof','instanceof','void','delete','throw',
  'var','let','const','function','async','await','class',
  // Méthodes Array/String/Object courantes souvent confondues avec des appels
  'forEach','map','filter','find','findIndex','some','every','reduce',
  'reduceRight','flat','flatMap','includes','indexOf','lastIndexOf',
  'join','slice','splice','push','pop','shift','unshift','sort','reverse',
  'concat','fill','copyWithin','entries','keys','values','at',
  'split','replace','replaceAll','trim','trimStart','trimEnd',
  'startsWith','endsWith','padStart','padEnd','repeat','match','matchAll',
  'search','substring','slice','toUpperCase','toLowerCase','charAt',
  'charCodeAt','fromCharCode','normalize','toString','valueOf','toFixed',
  'toLocaleString','toLocaleDateString','getTime','getFullYear',
  // Méthodes DOM/Element
  'getElementById','querySelector','querySelectorAll','closest','matches',
  'getElementsByClassName','getElementsByTagName','getAttribute','setAttribute',
  'removeAttribute','hasAttribute','classList','style','dataset',
  'appendChild','removeChild','insertBefore','replaceChild','cloneNode',
  'addEventListener','removeEventListener','dispatchEvent','scrollIntoView',
  'focus','blur','click','submit','reset','checkValidity',
  'getBoundingClientRect','scrollTo','scrollBy','remove','before','after',
  'append','prepend','replaceWith','insertAdjacentHTML','insertAdjacentElement',
  // Méthodes Event
  'preventDefault','stopPropagation','stopImmediatePropagation',
  // Méthodes Object
  'assign','keys','values','entries','freeze','seal','create','defineProperty',
  'getOwnPropertyNames','hasOwnProperty','has','add','get','set','delete',
  'clear','size','forEach',
  // Méthodes JSON/localStorage
  'stringify','parse','getItem','setItem','removeItem',
  // Méthodes Array constructeur
  'isArray','from','of',
  // CSS / couleurs dans les templates
  'rgba','rgb','hsl','linear-gradient','calc',
  // Faux positifs fréquents dans les templates CCA
  'T','esc','toast','getCfg','setCfg','getProfile','getLang','plants',
]);

// Attributs HTML contenant du JS
const HANDLER_ATTRS = [
  'onclick','onchange','oninput','onsubmit','onkeydown','onkeyup','onfocus','onblur',
  'ondblclick','onmousedown','onmouseup','onmouseover','onmouseout',
  'oncontextmatch','onscroll','onresize','onload',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extrait les chaînes inline handler d'un texte brut (HTML ou JS avec template literals) */
function extractHandlerStrings(src) {
  const results = [];
  // Pattern : attr="..." ou attr='...' ou attr=`...` (dans un template literal)
  const attrPattern = new RegExp(
    `(?:${HANDLER_ATTRS.join('|')})\\s*=\\s*(?:"([^"]*?)"|'([^']*?)'|\`([^\`]*?)\`)`,
    'gi'
  );
  let m;
  while ((m = attrPattern.exec(src)) !== null) {
    const val = m[1] ?? m[2] ?? m[3] ?? '';
    if (val.trim()) results.push(val);
  }
  return results;
}

/** Extrait les noms de fonctions appelées depuis une chaîne de handler.
 *  Exclut les appels de méthodes (précédés d'un point ou crochet). */
function extractCalledFunctions(handlerStr) {
  const fns = new Set();
  // On cherche les appels sans point/crochet précédent (standalone calls)
  // Negative lookbehind : pas de . ou ] ou ) juste avant le nom
  const re = /(?<![.\])])\b([a-zA-Z_$]\w*)\s*\(/g;
  let m;
  while ((m = re.exec(handlerStr)) !== null) {
    const name = m[1];
    if (!NATIVE_GLOBALS.has(name)) fns.add(name);
  }
  return fns;
}

/** Extrait les fonctions DÉFINIES dans un fichier JS (function xxx / const xxx = / let xxx = / var xxx =) */
function extractDefinedFunctions(src) {
  const defined = new Set();
  // function foo(
  const fnDecl = /\bfunction\s+([a-zA-Z_$]\w*)\s*\(/g;
  let m;
  while ((m = fnDecl.exec(src)) !== null) defined.add(m[1]);
  // const/let/var foo = ( ou foo = function ou foo = async (
  const varFn = /\b(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s+)?(?:\(|function\b|async\s*\()/g;
  while ((m = varFn.exec(src)) !== null) defined.add(m[1]);
  return defined;
}

/** Extrait les fonctions exposées via Object.assign(window, {...}) dans un fichier JS */
function extractWindowAssigned(src) {
  const exposed = new Set();
  // Object.assign(window, { foo, bar, baz })
  const re = /Object\.assign\s*\(\s*window\s*,\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const block = m[1];
    const names = /\b([a-zA-Z_$]\w*)\b/g;
    let n;
    while ((n = names.exec(block)) !== null) exposed.add(n[1]);
  }
  // window.foo = ...
  const winProp = /window\.([a-zA-Z_$]\w*)\s*=/g;
  while ((m = winProp.exec(src)) !== null) exposed.add(m[1]);
  return exposed;
}

/** Extrait les imports d'un fichier JS */
function extractImportedNames(src) {
  const imported = new Set();
  // import { foo, bar } from '...'
  const re = /import\s*\{([^}]*)\}\s*from/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const block = m[1];
    const names = /\b([a-zA-Z_$]\w*)\b/g;
    let n;
    while ((n = names.exec(block)) !== null) imported.add(n[1]);
  }
  // import * as foo from '...'
  const star = /import\s*\*\s*as\s+([a-zA-Z_$]\w*)/g;
  while ((m = star.exec(src)) !== null) imported.add(m[1]);
  // import foo from '...'
  const def = /import\s+([a-zA-Z_$]\w+)\s+from/g;
  while ((m = def.exec(src)) !== null) imported.add(m[1]);
  return imported;
}

// ── Analyse d'un fichier JS (module) ─────────────────────────────────────────

function analyzeModule(filePath) {
  const src = readFileSync(filePath, 'utf8');
  const name = basename(filePath);

  const handlerStrings = extractHandlerStrings(src);
  const calledFns = new Set();
  handlerStrings.forEach(h => extractCalledFunctions(h).forEach(f => calledFns.add(f)));

  const defined   = extractDefinedFunctions(src);
  const exposed   = extractWindowAssigned(src);
  const imported  = extractImportedNames(src);
  const available = new Set([...defined, ...exposed, ...imported, ...NATIVE_GLOBALS]);

  const missing = [...calledFns].filter(fn => !available.has(fn)).sort();

  return { name, filePath, handlerCount: handlerStrings.length, calledFns, defined, exposed, missing };
}

// ── Analyse de public/index.html ──────────────────────────────────────────────

function analyzeHtml(filePath) {
  const src = readFileSync(filePath, 'utf8');

  const handlerStrings = extractHandlerStrings(src);
  const calledFns = new Set();
  handlerStrings.forEach(h => extractCalledFunctions(h).forEach(f => calledFns.add(f)));

  // Dans le monolithe, toutes les fonctions déclarées dans les <script> sont globales
  const defined = extractDefinedFunctions(src);
  // Fonctions exposées via Object.assign ou window.xxx =
  const exposed = extractWindowAssigned(src);
  const available = new Set([...defined, ...exposed, ...NATIVE_GLOBALS]);

  const missing = [...calledFns].filter(fn => !available.has(fn)).sort();

  return {
    name: basename(filePath),
    filePath,
    handlerCount: handlerStrings.length,
    calledFns,
    defined,
    exposed,
    missing,
    handlerStrings,  // pour débogage
  };
}

// ── Rapport ───────────────────────────────────────────────────────────────────

function printReport(results) {
  let totalHandlers = 0, totalMissing = 0;
  console.log('\n' + '═'.repeat(72));
  console.log('  P0 SCAN — Handlers inline / Fonctions non exposées sur window');
  console.log('═'.repeat(72));

  for (const r of results) {
    totalHandlers += r.handlerCount;
    totalMissing  += r.missing.length;
    const status = r.missing.length === 0 ? '✅ OK' : `⚠️  ${r.missing.length} manquante(s)`;
    console.log(`\n📄 ${r.name}  [${r.handlerCount} handlers]  ${status}`);
    if (r.missing.length > 0) {
      console.log('   Fonctions appelées mais NON exposées sur window :');
      r.missing.forEach(fn => console.log(`     ✗ ${fn}`));
    }
    if (r.exposed.size > 0) {
      console.log(`   Fonctions déjà sur window : ${[...r.exposed].join(', ')}`);
    }
  }

  console.log('\n' + '─'.repeat(72));
  console.log(`TOTAL  ${totalHandlers} handlers  |  ${totalMissing} fonctions non exposées`);
  if (totalMissing === 0) {
    console.log('🎉 Zéro erreur "is not defined" attendue — window est complet.');
  } else {
    console.log('👉 Action requise : ajouter Object.assign(window, { … }) dans chaque module.');
  }
  console.log('─'.repeat(72) + '\n');

  return { totalHandlers, totalMissing };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const results = [];

if (MODE !== '--html-only' && existsSync(MODULES_DIR)) {
  const files = readdirSync(MODULES_DIR).filter(f => f.endsWith('.js'));
  if (files.length === 0) {
    console.log(`[scan] Aucun fichier JS dans ${MODULES_DIR}`);
  } else {
    for (const f of files) {
      results.push(analyzeModule(join(MODULES_DIR, f)));
    }
  }
}

if (MODE !== '--modules-only' && existsSync(HTML_FILE)) {
  results.push(analyzeHtml(HTML_FILE));
}

const { totalMissing } = printReport(results);

// Exit code non-zero si des fonctions sont manquantes (utilisé dans CI)
process.exit(totalMissing > 0 ? 1 : 0);
