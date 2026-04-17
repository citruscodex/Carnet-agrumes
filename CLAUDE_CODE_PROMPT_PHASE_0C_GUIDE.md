# CLAUDE CODE — PHASE 0C — Intégration guide débutant

## Contexte

Lire `CLAUDE.md` avant toute action.

Le guide débutant fertilisation (`guide-debutant-citruscodex.md`, 11 chapitres + 3 annexes, sources INRAE/UF-IFAS/IAC Campinas/IVIA) existe en markdown à la racine du projet et en PDF 25 pages livré. Cette phase l'intègre dans l'app avec 4 points d'entrée contextuels permettant un accès rapide au chapitre pertinent.

**Prérequis bloquant** : Phase 0A et 0B terminées. Le guide est en **français uniquement pour la beta**. Pour les autres locales, afficher un message bilingue expliquant que le guide est en cours de traduction et redirige vers le contenu FR.

**Prérequis d'envoi serveur** : le fichier `guide-debutant-citruscodex.md` et `guide-debutant-citruscodex.pdf` doivent être déployés sur Scaleway dans `/var/www/citruscodex/guide/` via Caddy route statique.

## Zones protégées — NE PAS TOUCHER

PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes

- `addEventListener` exclusivement
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues pour strings UI (le contenu du guide reste FR)
- `node --check` + `npm run build` après chaque étape
- Parser markdown sécurisé (pas de XSS, pas d'injection HTML arbitraire)

---

## Plan

1. Déploiement fichiers sources guide (markdown + PDF)
2. Module `src/modules/guide.js` (rendu markdown, TOC, recherche, bookmarks, notes)
3. Point d'entrée 1 : onglet "📚 Guide" dans page Fertilisation
4. Point d'entrée 2 : bouton 📖 sur chaque gauge NPK (deep-link chapitre)
5. Point d'entrée 3 : bouton 📖 sur chaque alerte carence (deep-link chapitre 10)
6. Point d'entrée 4 : remplacement bouton "Guide jauges" dans Réglages profil
7. Bouton "📄 Version PDF" téléchargeable
8. Fallback i18n pour non-FR
9. Tests

---

## ÉTAPE 1 — Déploiement fichiers sources

### Sur Scaleway

```bash
# Depuis la machine locale
scp guide-debutant-citruscodex.md root@62.210.237.49:/var/www/citruscodex/guide/
scp guide-debutant-citruscodex.pdf root@62.210.237.49:/var/www/citruscodex/guide/
```

### Caddy config

Ajouter dans `/etc/caddy/Caddyfile` avant la directive `handle` générique :

```caddy
handle_path /guide/* {
    root * /var/www/citruscodex/guide
    file_server
    header Cache-Control "public, max-age=3600"
    header Access-Control-Allow-Origin "*"
}
```

Puis `sudo systemctl reload caddy`.

### Validation

```bash
curl -I https://citruscodex.fr/guide/guide-debutant-citruscodex.md
# 200 OK, content-type: text/markdown ou text/plain

curl -I https://citruscodex.fr/guide/guide-debutant-citruscodex.pdf
# 200 OK, content-type: application/pdf
```

---

## ÉTAPE 2 — Module `src/modules/guide.js`

### Fichier

`src/modules/guide.js`

### Architecture

```javascript
import { esc, T, currentLang } from '../lib/util.js'

const GUIDE_URL = '/guide/guide-debutant-citruscodex.md'
const GUIDE_PDF_URL = '/guide/guide-debutant-citruscodex.pdf'
const LS_BOOKMARKS = 'agrumes_guide_bookmarks'
const LS_LAST_READ = 'agrumes_guide_last_read'

let _guideContent = null  // Cache en mémoire
let _parsedChapters = null
let _currentChapter = null

// ── Public API ─────────────────────────────────────────────────────

export async function loadGuide() {
  if (_guideContent) return _guideContent
  const r = await fetch(GUIDE_URL)
  if (!r.ok) throw new Error(`Failed to load guide: HTTP ${r.status}`)
  _guideContent = await r.text()
  _parsedChapters = _parseChapters(_guideContent)
  return _guideContent
}

export async function renderGuide(container, { deepLink = null } = {}) {
  try {
    await loadGuide()
  } catch (err) {
    container.innerHTML = `<div class="cca-error-state">${esc(T('guide.loadError'))}</div>`
    return
  }
  
  // Fallback langue
  const lang = currentLang()
  const showFRNotice = lang !== 'fr'
  
  container.innerHTML = `
    <div class="cca-guide">
      ${showFRNotice ? `
        <div class="cca-info-box cca-lang-notice">
          <p>${esc(T('guide.notTranslatedYet'))}</p>
        </div>` : ''}
      <div class="cca-guide-layout">
        <aside class="cca-guide-toc">
          <div class="cca-guide-search">
            <input type="search" id="guide-search" placeholder="${esc(T('guide.search'))}" />
          </div>
          <nav id="guide-toc"></nav>
          <div class="cca-guide-actions">
            <a href="${GUIDE_PDF_URL}" download class="cca-btn-secondary">
              📄 ${esc(T('guide.downloadPDF'))}
            </a>
          </div>
        </aside>
        <main class="cca-guide-content" id="guide-content"></main>
      </div>
    </div>`
  
  _renderTOC()
  
  // Chapitre initial
  const initial = deepLink || localStorage.getItem(LS_LAST_READ) || _parsedChapters[0]?.anchor
  if (initial) showChapter(initial)
  
  // Events
  document.getElementById('guide-search').addEventListener('input', _onSearch)
  document.querySelectorAll('#guide-toc a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      showChapter(a.getAttribute('data-anchor'))
    })
  })
}

export function showChapter(anchor) {
  const chapter = _parsedChapters?.find(c => c.anchor === anchor)
  if (!chapter) return
  
  _currentChapter = anchor
  localStorage.setItem(LS_LAST_READ, anchor)
  
  const content = document.getElementById('guide-content')
  if (!content) return
  
  content.innerHTML = _renderChapterHTML(chapter)
  content.scrollTop = 0
  
  // Highlight TOC
  document.querySelectorAll('#guide-toc a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-anchor') === anchor)
  })
  
  // Event listeners pour notes internes
  _attachFootnoteHandlers(content)
}

// Deep-link public : appelé depuis les boutons NPK/carences
export function openGuideChapter(anchor) {
  // Navigate to guide view then show chapter
  window.dispatchEvent(new CustomEvent('cca-navigate', { detail: { view: 'guide', deepLink: anchor } }))
}

// ── Parser ────────────────────────────────────────────────────────

function _parseChapters(md) {
  const chapters = []
  const lines = md.split('\n')
  let current = null
  
  lines.forEach((line, idx) => {
    // Détecter titres niveau 1 et 2 comme chapitres
    const m1 = line.match(/^## (.+)$/)
    const m2 = line.match(/^### (.+)$/)
    if (m1) {
      if (current) chapters.push(current)
      const title = m1[1].trim()
      current = {
        level: 2,
        title,
        anchor: _slugify(title),
        subs: [],
        lines: [line]
      }
    } else if (m2 && current) {
      current.subs.push({
        title: m2[1].trim(),
        anchor: _slugify(m2[1].trim()),
        lineIdx: idx
      })
      current.lines.push(line)
    } else if (current) {
      current.lines.push(line)
    }
  })
  if (current) chapters.push(current)
  
  return chapters
}

function _slugify(s) {
  return s.toLowerCase()
    .replace(/[àáâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── TOC rendering ─────────────────────────────────────────────────

function _renderTOC() {
  const nav = document.getElementById('guide-toc')
  if (!nav || !_parsedChapters) return
  
  const bookmarks = JSON.parse(localStorage.getItem(LS_BOOKMARKS) || '[]')
  
  const html = _parsedChapters.map(c => {
    const bookmarked = bookmarks.includes(c.anchor)
    return `
      <div class="cca-toc-item">
        <a href="#${esc(c.anchor)}" data-anchor="${esc(c.anchor)}">${esc(c.title)}</a>
        ${bookmarked ? '<span class="cca-bookmark">⭐</span>' : ''}
      </div>`
  }).join('')
  
  nav.innerHTML = html
}

// ── Chapter rendering ─────────────────────────────────────────────

function _renderChapterHTML(chapter) {
  const md = chapter.lines.join('\n')
  return _markdownToHTML(md)
}

function _markdownToHTML(md) {
  // Extraire footnotes d'abord
  const footnoteDefs = {}
  md = md.replace(/^\[\^(\w+)\]:\s*(.+?)(?=\n\[\^|\n\n|$)/gms, (_, id, content) => {
    footnoteDefs[id] = content.trim()
    return ''
  })
  
  let footnoteOrder = []
  md = md.replace(/\[\^(\w+)\]/g, (_, id) => {
    if (!footnoteDefs[id]) return `[^${id}]`
    if (!footnoteOrder.includes(id)) footnoteOrder.push(id)
    const num = footnoteOrder.indexOf(id) + 1
    return `\x00FNREF\x00${id}\x00${num}\x00`
  })
  
  // Escape HTML entrée
  let html = esc(md)
  
  // Titres
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 id="$1">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  
  // Gras / italique
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  
  // Code inline
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  
  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
  
  // Liens
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    if (!/^https?:\/\//.test(url) && !url.startsWith('/') && !url.startsWith('#')) 
      return `[${text}](${url})`
    return `<a href="${url}" rel="noopener" target="_blank">${text}</a>`
  })
  
  // Listes à puces
  html = html.replace(/(^- .+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => l.replace(/^- /, '')).map(l => `<li>${l}</li>`).join('')
    return `<ul>${items}</ul>`
  })
  
  // Listes numérotées
  html = html.replace(/(^\d+\. .+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => l.replace(/^\d+\. /, '')).map(l => `<li>${l}</li>`).join('')
    return `<ol>${items}</ol>`
  })
  
  // Tableaux markdown (simplifié)
  html = html.replace(/(\|.+\|\n\|[-:| ]+\|\n(?:\|.+\|\n?)+)/g, (match) => {
    const lines = match.trim().split('\n')
    const headers = lines[0].split('|').slice(1, -1).map(c => c.trim())
    const rows = lines.slice(2).map(l => l.split('|').slice(1, -1).map(c => c.trim()))
    let table = '<table class="cca-guide-table"><thead><tr>'
    table += headers.map(h => `<th>${h}</th>`).join('')
    table += '</tr></thead><tbody>'
    rows.forEach(r => {
      table += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>'
    })
    table += '</tbody></table>'
    return table
  })
  
  // Paragraphes
  html = html.split(/\n\n+/).map(p => {
    p = p.trim()
    if (!p) return ''
    // Ne pas wrapper les blocs déjà HTML
    if (/^<(h[1-6]|ul|ol|table|blockquote|hr)/.test(p)) return p
    return `<p>${p.replace(/\n/g, '<br>')}</p>`
  }).join('\n')
  
  // Réinjecter les refs footnotes
  html = html.replace(/\x00FNREF\x00(\w+)\x00(\d+)\x00/g, (_, id, num) => {
    return `<sup class="cca-fn-ref" id="fnref-${esc(id)}"><a href="#fn-${esc(id)}" data-fn="${esc(id)}">[${num}]</a></sup>`
  })
  
  // Bloc footnotes en fin
  if (footnoteOrder.length) {
    html += '<hr/><ol class="cca-footnotes">'
    footnoteOrder.forEach(id => {
      const defHtml = _markdownToHTML(footnoteDefs[id]).replace(/<\/?p>/g, '')
      html += `<li id="fn-${esc(id)}">${defHtml} 
        <a href="#fnref-${esc(id)}" class="cca-fn-backref" data-fnref="${esc(id)}">↩</a></li>`
    })
    html += '</ol>'
  }
  
  return html
}

function _attachFootnoteHandlers(root) {
  root.querySelectorAll('.cca-fn-ref a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const id = a.getAttribute('data-fn')
      root.querySelector(`#fn-${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })
  root.querySelectorAll('.cca-fn-backref').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const ref = a.getAttribute('data-fnref')
      root.querySelector(`#fnref-${CSS.escape(ref)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })
}

// ── Search ────────────────────────────────────────────────────────

function _onSearch(e) {
  const q = e.target.value.toLowerCase().trim()
  const nav = document.getElementById('guide-toc')
  if (!nav) return
  
  if (!q) {
    _renderTOC()
    return
  }
  
  const matches = _parsedChapters.filter(c => {
    return c.title.toLowerCase().includes(q) 
        || c.lines.join(' ').toLowerCase().includes(q)
  })
  
  nav.innerHTML = matches.length 
    ? matches.map(c => `<div class="cca-toc-item">
        <a href="#${esc(c.anchor)}" data-anchor="${esc(c.anchor)}">${esc(c.title)}</a>
      </div>`).join('')
    : `<div class="cca-no-results">${esc(T('guide.noResults'))}</div>`
  
  // Reattach listeners
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      showChapter(a.getAttribute('data-anchor'))
    })
  })
}

// ── Utils ─────────────────────────────────────────────────────────

function currentLang() {
  return localStorage.getItem('agrumes_lang') || 'fr'
}
```

### CSS

```css
.cca-guide { max-width: 1200px; margin: 0 auto; padding: 20px; }
.cca-lang-notice { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; margin-bottom: 20px; border-radius: 4px; }
.cca-guide-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
@media (max-width: 768px) {
  .cca-guide-layout { grid-template-columns: 1fr; }
  .cca-guide-toc { position: static; max-height: 300px; overflow-y: auto; }
}
.cca-guide-toc { position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow-y: auto; padding-right: 12px; border-right: 1px solid #e0e0e0; }
.cca-guide-search input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 16px; }
.cca-toc-item { padding: 6px 8px; display: flex; justify-content: space-between; align-items: center; }
.cca-toc-item a { color: #333; text-decoration: none; font-size: 14px; flex: 1; }
.cca-toc-item a.active { color: var(--primary, #2e7d32); font-weight: 600; }
.cca-toc-item a:hover { background: #f5f5f5; }
.cca-guide-content { min-width: 0; line-height: 1.7; }
.cca-guide-content h2 { border-bottom: 2px solid #2e7d32; padding-bottom: 8px; margin-top: 32px; }
.cca-guide-content h3 { color: #2e7d32; margin-top: 24px; }
.cca-guide-table { border-collapse: collapse; margin: 16px 0; width: 100%; }
.cca-guide-table th, .cca-guide-table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
.cca-guide-table th { background: #f5f5f5; font-weight: 600; }
.cca-guide-content blockquote { border-left: 4px solid #2e7d32; padding: 8px 16px; background: #f5f9f5; margin: 16px 0; color: #555; }
.cca-guide-actions { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
.cca-fn-ref { font-size: 0.75em; }
.cca-fn-ref a { color: var(--primary, #2e7d32); text-decoration: none; font-weight: bold; }
.cca-footnotes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; }
.cca-fn-backref { text-decoration: none; color: var(--primary, #2e7d32); margin-left: 4px; }
```

### i18n 5 langues

```javascript
// fr.js
guide: {
  title: 'Guide du débutant',
  search: 'Rechercher dans le guide…',
  noResults: 'Aucun résultat',
  downloadPDF: 'Télécharger en PDF',
  loadError: 'Impossible de charger le guide. Vérifiez votre connexion.',
  notTranslatedYet: '🇫🇷 Le guide débutant est actuellement disponible uniquement en français. Les traductions EN/IT/ES/PT seront publiées après la beta.',
  openChapter: 'Ouvrir le chapitre',
  readMore: '📖 Comprendre'
}
```

EN :
```javascript
guide: {
  title: 'Beginner\'s guide',
  search: 'Search in the guide…',
  noResults: 'No results',
  downloadPDF: 'Download PDF',
  loadError: 'Unable to load the guide. Check your connection.',
  notTranslatedYet: '🇫🇷 The beginner guide is currently available in French only. EN/IT/ES/PT translations will be published after the beta.',
  openChapter: 'Open chapter',
  readMore: '📖 Learn more'
}
```

IT/ES/PT : traductions équivalentes, avec le message `notTranslatedYet` bilingue (commence par le drapeau FR puis explique dans la langue locale).

---

## ÉTAPE 3 — Point d'entrée 1 : onglet Guide dans Fertilisation

### Fichier à modifier

`src/modules/fertilization.js` (ou équivalent)

### Action

Ajouter un onglet "📚 Guide" dans la vue Fertilisation :

```javascript
function renderFertilizationTabs() {
  return `
    <div class="cca-tabs">
      <button data-tab="jauges" class="active">Jauges NPK</button>
      <button data-tab="historique">Historique</button>
      <button data-tab="calculateur">Calculateur</button>
      <button data-tab="guide">📚 Guide</button>
    </div>
    <div id="fert-tab-content"></div>`
}

// Sur click onglet guide :
document.querySelector('[data-tab="guide"]').addEventListener('click', async () => {
  const { renderGuide } = await import('./guide.js')
  const container = document.getElementById('fert-tab-content')
  await renderGuide(container)
})
```

---

## ÉTAPE 4 — Point d'entrée 2 : bouton 📖 sur gauges NPK

### Mapping anchors chapitres

Extraire les ancres précises du markdown source :

- Gauge N (azote) → ancre chapitre 2 « L'azote »  → slug probable : `l-azote-n`
- Gauge P (phosphore) → chapitre 2 « Le phosphore » → `le-phosphore-p`
- Gauge K (potassium) → chapitre 2 « Le potassium » → `le-potassium-k`
- Gauge Mg (magnésium) → chapitre 2 « Le magnésium » → `le-magnesium-mg`
- Ratios/équilibre → chapitre 4 « Choisir son engrais » → `choisir-son-engrais`
- Calcul dose → chapitre 5 « Calcul des doses » → `calcul-des-doses`

**Note importante** : demander à Claude Code de lire le vrai fichier `guide-debutant-citruscodex.md`, identifier les titres réels niveau `##`, et construire la map `{nutriment → anchor slug}` à partir des vrais titres (pas des supposés).

### Modification

Dans le composant qui rend les jauges NPK, ajouter à côté de chaque gauge un bouton 📖 :

```javascript
function renderNPKGauge(nutrient, currentValue, targetValue) {
  const anchor = NPK_GUIDE_ANCHORS[nutrient]  // Map construite depuis lecture du guide
  return `
    <div class="cca-npk-gauge" data-nutrient="${esc(nutrient)}">
      <div class="cca-gauge-header">
        <span class="cca-gauge-label">${esc(nutrient)}</span>
        <button class="cca-gauge-help" data-guide-anchor="${esc(anchor)}" 
                title="${esc(T('guide.openChapter'))}" aria-label="${esc(T('guide.openChapter'))}">
          📖
        </button>
      </div>
      <div class="cca-gauge-bar">...</div>
    </div>`
}

// Event delegation au niveau parent
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.cca-gauge-help[data-guide-anchor]')
  if (!btn) return
  const anchor = btn.getAttribute('data-guide-anchor')
  import('./guide.js').then(m => m.openGuideChapter(anchor))
})
```

### Router update

Dans le routeur principal (`src/app.js` ou `src/modules/router.js`), écouter `cca-navigate` :

```javascript
window.addEventListener('cca-navigate', async (e) => {
  const { view, deepLink } = e.detail
  if (view === 'guide') {
    await navigateTo('guide')  // Fonction existante du router
    // Attendre que le DOM du guide soit prêt, puis deep-link
    setTimeout(async () => {
      const container = document.getElementById('guide-container') 
                     || document.querySelector('[data-view="guide"]')
      if (container && deepLink) {
        const { renderGuide } = await import('./modules/guide.js')
        await renderGuide(container, { deepLink })
      }
    }, 100)
  }
})
```

---

## ÉTAPE 5 — Point d'entrée 3 : bouton 📖 sur alertes carences

### Fichier

Le module qui affiche les alertes carences (probablement dans `src/modules/diagnostic.js` ou section dashboard).

### Action

Chaque alerte carence reçoit un bouton "Comprendre" :

```javascript
function renderCarenceAlert(carence) {
  return `
    <div class="cca-alert cca-alert-carence">
      <strong>${esc(T('alerts.carence.' + carence.type))}</strong>
      <p>${esc(carence.message)}</p>
      <button class="cca-btn-link" data-guide-anchor="les-carences">
        ${esc(T('guide.readMore'))}
      </button>
    </div>`
}

document.querySelectorAll('.cca-alert-carence [data-guide-anchor]').forEach(btn => {
  btn.addEventListener('click', () => {
    import('./guide.js').then(m => m.openGuideChapter(btn.getAttribute('data-guide-anchor')))
  })
})
```

L'ancre `les-carences` pointe vers le chapitre 10 du guide « Les carences nutritives » (titre réel à extraire du markdown).

---

## ÉTAPE 6 — Point d'entrée 4 : Réglages profil

### Fichier

Probablement `src/modules/profile.js` ou `src/modules/settings.js`.

### Action

Identifier le bouton actuel "Guide jauges" (libellé exact à confirmer dans le code) dans les Réglages profil, et :
- Renommer en "📚 Guide nutrition complet"
- Changer l'action : au lieu d'ouvrir un petit modal explicatif jauges, ouvrir la vue guide complète (`openGuideChapter('la-fertilisation-des-agrumes')` ou premier chapitre)

```javascript
// Avant
<button id="btn-guide-jauges">Guide jauges</button>
// ... handler qui ouvre modal simple

// Après
<button id="btn-guide-complet">📚 ${T('guide.fullGuide')}</button>
document.getElementById('btn-guide-complet').addEventListener('click', () => {
  import('./guide.js').then(m => m.openGuideChapter(''))  // anchor vide = premier chapitre
})
```

### i18n

Ajouter `guide.fullGuide: 'Guide nutrition complet'` en FR, traductions équivalentes.

---

## ÉTAPE 7 — Bouton "📄 Version PDF"

Déjà inclus dans le module guide (ÉTAPE 2, section `<div class="cca-guide-actions">`). Vérifier que le PDF est bien téléchargé au clic et non affiché inline dans le navigateur (attribut `download`).

---

## ÉTAPE 8 — Fallback i18n non-FR

Le guide reste entièrement en français pour la beta. Pour les users EN/IT/ES/PT :

- La bannière `cca-lang-notice` apparaît en tête du guide
- Le TOC et le contenu s'affichent en français malgré la langue UI
- Le bouton PDF télécharge le PDF FR
- Les points d'entrée (gauges NPK, alertes) fonctionnent toujours (ouvrent le guide en FR avec bannière)

Le message `notTranslatedYet` doit être bilingue (commencer par le texte dans la langue de l'user, puis l'expliquer en français avec le drapeau).

---

## ÉTAPE 9 — Tests

### Playwright

`tests/phase0c-guide.spec.js`

```javascript
const { test, expect } = require('@playwright/test')

test.describe('Phase 0C — Guide débutant', () => {
  
  test('T1 accès guide depuis onglet Fertilisation', async ({ page }) => {
    await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await page.click('text=Fertilisation')
    await page.click('button[data-tab="guide"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('.cca-guide-toc')).toBeVisible()
    await expect(page.locator('.cca-guide-content h1, .cca-guide-content h2').first()).toBeVisible()
  })
  
  test('T2 deep-link depuis gauge NPK', async ({ page }) => {
    await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await page.click('text=Fertilisation')
    // Cliquer sur le bouton 📖 de la gauge N
    await page.click('.cca-npk-gauge[data-nutrient="N"] .cca-gauge-help')
    await page.waitForTimeout(1000)
    // Doit être sur la vue guide, chapitre azote ouvert
    await expect(page.locator('.cca-guide-content')).toBeVisible()
    // Le TOC doit avoir l'azote en surbrillance
    await expect(page.locator('#guide-toc a.active')).toContainText(/[Aa]zote/)
  })
  
  test('T3 deep-link depuis alerte carence', async ({ page }) => {
    await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
    // Provoquer une alerte carence test — ou vérifier dashboard
    // Cliquer sur bouton "Comprendre"
    await page.click('.cca-alert-carence [data-guide-anchor]').catch(() => {
      // Si pas d'alerte : skip test
      test.skip('No carence alert present')
    })
    await page.waitForTimeout(1000)
    await expect(page.locator('.cca-guide-content')).toBeVisible()
  })
  
  test('T4 recherche dans le guide', async ({ page }) => {
    await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await page.click('text=Fertilisation')
    await page.click('button[data-tab="guide"]')
    await page.waitForTimeout(2000)
    await page.fill('#guide-search', 'azote')
    await page.waitForTimeout(300)
    const results = await page.locator('#guide-toc .cca-toc-item').count()
    expect(results).toBeGreaterThan(0)
  })
  
  test('T5 téléchargement PDF', async ({ page }) => {
    await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await page.click('text=Fertilisation')
    await page.click('button[data-tab="guide"]')
    await page.waitForTimeout(2000)
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('a:has-text("Télécharger en PDF")')
    ])
    
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
  })
  
  test('T6 bannière FR pour langue EN', async ({ page }) => {
    await page.goto('http://localhost:5173')
    // Forcer langue EN
    await page.evaluate(() => localStorage.setItem('agrumes_lang', 'en'))
    await page.reload()
    await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await page.click('text=Fertilization, text=Fertilisation')  // fallback
    await page.click('button[data-tab="guide"]')
    await page.waitForTimeout(2000)
    await expect(page.locator('.cca-lang-notice')).toBeVisible()
  })
})

async function _login(page, email, password) {
  await page.goto('http://localhost:5173')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForSelector('[data-view="dashboard"], .dashboard, #dashboard', { timeout: 15000 })
}
```

### Tests manuels

1. Ouvrir Fertilisation → onglet Guide → TOC visible avec ≥11 chapitres
2. Cliquer gauge N → redirect vers vue guide, chapitre azote actif
3. Cliquer alerte carence (si présente) → redirect vers chapitre 10
4. Taper "azote" dans la recherche → filtrage TOC
5. Cliquer "Télécharger PDF" → fichier PDF téléchargé
6. Changer langue en EN → retour guide → bannière bilingue visible, contenu toujours FR
7. Cliquer note `[1]` dans un chapitre → scroll vers footnote → cliquer ↩ → retour position

---

## Livrables

- `src/modules/guide.js` (nouveau, ~400 lignes)
- `src/modules/fertilization.js` (modifié : onglet Guide)
- `src/modules/<npk-gauges>.js` (modifié : bouton 📖 par gauge)
- `src/modules/diagnostic.js` ou équivalent (modifié : bouton alertes carences)
- `src/modules/profile.js` ou `settings.js` (modifié : bouton Guide complet)
- `src/app.js` (modifié : listener `cca-navigate`)
- 5 fichiers i18n (bloc `guide.*`)
- CSS dédiée (dans `src/styles/` ou inline module)
- `tests/phase0c-guide.spec.js`
- Serveur : fichiers déployés dans `/var/www/citruscodex/guide/`, Caddy configuré

## Critères de réussite

- [ ] Guide se charge et s'affiche avec TOC sidebar + content area
- [ ] 4 points d'entrée fonctionnels (onglet Fert / gauges NPK / alertes / Réglages)
- [ ] Recherche TOC filtre correctement
- [ ] PDF téléchargeable depuis le guide
- [ ] Notes `[^N]` rendues en `[N]` cliquables avec retour ↩
- [ ] Bannière FR-only pour langue non-FR
- [ ] Aucun deep-link cassé (toutes les ancres existent dans le md)
- [ ] 6/6 tests Playwright passent (T3 peut être skip selon présence alerte)
- [ ] `node --check` OK
- [ ] `npm run build` OK

## Livraison

ZIP final : `cca_phase_0c_guide.zip`
