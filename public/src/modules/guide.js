import { esc } from '../lib/esc.js'

const GUIDE_URL = '/guide/guide-debutant-citruscodex.md'
const GUIDE_PDF_URL = '/guide/guide-debutant-citruscodex.pdf'
const LS_BOOKMARKS = 'agrumes_guide_bookmarks'
const LS_LAST_READ = 'agrumes_guide_last_read'
const LS_TOC_VISIBLE = 'agrumes_guide_toc_visible'

let _guideContent = null
let _parsedChapters = null
let _currentChapter = null
let _T = s => s
let _getLang = () => 'fr'

// Anchors built from real ## headings via _slugify
export const NPK_GUIDE_ANCHORS = {
  N:  'chapitre-2-les-elements-nutritifs',
  P:  'chapitre-2-les-elements-nutritifs',
  K:  'chapitre-2-les-elements-nutritifs',
  Ca: 'chapitre-2-les-elements-nutritifs',
  Mg: 'chapitre-2-les-elements-nutritifs',
}
export const CARENCE_GUIDE_ANCHOR = 'chapitre-10-diagnostiquer-et-corriger-les-carences'

// ── CSS ───────────────────────────────────────────────────────────────────────

const _CSS = `
.cca-guide{max-width:1200px;margin:0 auto;padding:16px}
.cca-lang-notice{background:#fff3cd;border:1px solid #ffc107;padding:12px;margin-bottom:16px;border-radius:6px;font-size:.85rem}
.cca-guide-layout{display:grid;grid-template-columns:260px 1fr;gap:20px;transition:grid-template-columns 0.3s ease}
.cca-guide-layout.cca-guide-toc-hidden{grid-template-columns:0 1fr}
.cca-guide-layout.cca-guide-toc-hidden .cca-guide-toc{opacity:0;pointer-events:none;overflow:hidden;padding:0;border:none}
.cca-guide-toc{transition:opacity 0.3s ease,padding 0.3s ease}
.cca-guide-toc-toggle{position:fixed;top:80px;left:8px;z-index:100;background:var(--primary,#2e7d32);color:white;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.cca-guide-toc-toggle:hover{background:var(--primary-dark,#1b5e20)}
@media(max-width:768px){
  .cca-guide-layout{grid-template-columns:1fr}
  .cca-guide-layout.cca-guide-toc-hidden{grid-template-columns:1fr}
  .cca-guide-toc{position:static;max-height:280px;overflow-y:auto;border-right:none;border-bottom:1px solid #e0e0e0;padding-bottom:12px;margin-bottom:12px}
  .cca-guide-layout:not(.cca-guide-toc-hidden) .cca-guide-toc{position:fixed;top:120px;left:0;right:0;bottom:0;background:white;z-index:99;padding:20px;overflow-y:auto;max-height:unset}
}
.cca-guide-toc{position:sticky;top:16px;max-height:calc(100vh - 60px);overflow-y:auto;padding-right:10px;border-right:1px solid #e0e0e0}
.cca-guide-search input{width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;margin-bottom:12px;box-sizing:border-box;font-size:.85rem}
.cca-toc-item{padding:5px 6px;display:flex;justify-content:space-between;align-items:center}
.cca-toc-item a{color:#444;text-decoration:none;font-size:.83rem;flex:1;line-height:1.3}
.cca-toc-item a.active{color:#2e7d32;font-weight:700}
.cca-toc-item a:hover{color:#2e7d32}
.cca-guide-content{min-width:0;line-height:1.75;font-size:.9rem}
.cca-guide-content h1{font-size:1.3rem;border-bottom:3px solid #2e7d32;padding-bottom:8px;margin-top:0}
.cca-guide-content h2{font-size:1.1rem;border-bottom:2px solid #2e7d32;padding-bottom:6px;margin-top:28px;color:#1b5e20}
.cca-guide-content h3{font-size:1rem;color:#2e7d32;margin-top:20px;font-weight:700}
.cca-guide-table{border-collapse:collapse;margin:14px 0;width:100%;font-size:.82rem}
.cca-guide-table th,.cca-guide-table td{border:1px solid #ddd;padding:6px 10px;text-align:left}
.cca-guide-table th{background:#f5f5f5;font-weight:700}
.cca-guide-content blockquote{border-left:4px solid #2e7d32;padding:8px 14px;background:#f5f9f5;margin:14px 0;color:#555;font-style:italic}
.cca-guide-content pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto;font-size:.8rem;line-height:1.5;white-space:pre-wrap}
.cca-guide-actions{margin-top:20px;padding-top:14px;border-top:1px solid #e0e0e0}
.cca-fn-ref{font-size:.72em;vertical-align:super}
.cca-fn-ref a{color:#2e7d32;text-decoration:none;font-weight:700}
.cca-footnotes{margin-top:36px;padding-top:18px;border-top:1px solid #ddd;font-size:.82em;list-style:decimal;padding-left:20px}
.cca-footnotes li{margin-bottom:6px;line-height:1.5}
.cca-fn-backref{text-decoration:none;color:#2e7d32;margin-left:4px}
.cca-no-results{padding:12px;color:#999;font-size:.83rem;font-style:italic}
.cca-guide-error{padding:24px;text-align:center;color:#c62828;font-size:.85rem}
.cca-btn-secondary{display:inline-block;padding:7px 14px;background:#f5f9f5;border:1px solid rgba(46,125,50,.3);border-radius:6px;color:#2e7d32;text-decoration:none;font-size:.83rem;cursor:pointer}
`

let _cssInjected = false
function _injectCSS() {
  if (_cssInjected) return
  const st = document.createElement('style')
  st.textContent = _CSS
  document.head.appendChild(st)
  _cssInjected = true
}

// ── Public API ────────────────────────────────────────────────────────────────

export function mount(container, T, getLang, deepLink = null) {
  _T = T || (s => s)
  _getLang = getLang || (() => 'fr')
  _injectCSS()
  renderGuide(container, { deepLink })
}

export async function renderGuide(container, { deepLink = null } = {}) {
  if (!container) return

  container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted,#999)">⏳ ${esc(_T('guide.title') || 'Guide')}…</div>`

  try {
    await _loadGuide()
  } catch (err) {
    container.innerHTML = `<div class="cca-guide-error">⚠ ${esc(_T('guide.loadError') || 'Impossible de charger le guide.')}</div>`
    return
  }

  const lang = _getLang()
  const showFRNotice = lang !== 'fr'

  container.innerHTML = `
<div class="cca-guide">
  ${showFRNotice ? `<div class="cca-lang-notice">🇫🇷 ${esc(_T('guide.notTranslatedYet') || 'Guide available in French only during beta.')}</div>` : ''}
  <button class="cca-guide-toc-toggle" id="guide-toc-toggle" aria-label="${esc(_T('guide.tocHide') || 'Masquer le sommaire')}">
    <span class="cca-guide-toc-toggle-icon">◀</span>
    <span class="cca-guide-toc-toggle-label">${esc(_T('guide.tocHide') || 'Sommaire')}</span>
  </button>
  <div class="cca-guide-layout">
    <aside class="cca-guide-toc">
      <div class="cca-guide-search">
        <input type="search" id="cca-guide-search" placeholder="${esc(_T('guide.search') || 'Rechercher…')}" autocomplete="off"/>
      </div>
      <nav id="cca-guide-toc-nav"></nav>
      <div class="cca-guide-actions">
        <a href="${GUIDE_PDF_URL}" download class="cca-btn-secondary">
          📄 ${esc(_T('guide.downloadPDF') || 'Télécharger PDF')}
        </a>
      </div>
    </aside>
    <main class="cca-guide-content" id="cca-guide-content"></main>
  </div>
</div>`

  _renderTOC()

  const initial = deepLink || localStorage.getItem(LS_LAST_READ) || (_parsedChapters[0]?.anchor ?? '')
  if (initial) showChapter(initial)

  const searchEl = document.getElementById('cca-guide-search')
  if (searchEl) searchEl.addEventListener('input', _onSearch)

  _attachTOCListeners()
  _initTocToggle()
}

export function showChapter(anchor) {
  const chapter = _parsedChapters?.find(c => c.anchor === anchor)
  if (!chapter) return

  _currentChapter = anchor
  localStorage.setItem(LS_LAST_READ, anchor)

  const content = document.getElementById('cca-guide-content')
  if (!content) return

  content.innerHTML = _renderChapterHTML(chapter)
  content.scrollTop = 0

  document.querySelectorAll('#cca-guide-toc-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-anchor') === anchor)
  })

  _attachFootnoteHandlers(content)
}

export function openGuideChapter(anchor) {
  window.dispatchEvent(new CustomEvent('cca-navigate', { detail: { view: 'guide', deepLink: anchor } }))
}

// ── Loader ────────────────────────────────────────────────────────────────────

async function _loadGuide() {
  if (_guideContent) return _guideContent
  const r = await fetch(GUIDE_URL)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  _guideContent = await r.text()
  _parsedChapters = _parseChapters(_guideContent)
  return _guideContent
}

// ── Parser ────────────────────────────────────────────────────────────────────

function _parseChapters(md) {
  const chapters = []
  const lines = md.split('\n')
  let current = null

  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/)
    const m3 = line.match(/^### (.+)$/)
    if (m2) {
      if (current) chapters.push(current)
      const title = m2[1].trim()
      current = { level: 2, title, anchor: _slugify(title), subs: [], lines: [line] }
    } else if (m3 && current) {
      current.subs.push({ title: m3[1].trim(), anchor: _slugify(m3[1].trim()) })
      current.lines.push(line)
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) chapters.push(current)
  return chapters
}

function _slugify(s) {
  return s.toLowerCase()
    .replace(/[àáâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── TOC ───────────────────────────────────────────────────────────────────────

function _renderTOC(chapters = _parsedChapters) {
  const nav = document.getElementById('cca-guide-toc-nav')
  if (!nav || !chapters) return
  nav.innerHTML = chapters.map(c => `
    <div class="cca-toc-item">
      <a href="#${esc(c.anchor)}" data-anchor="${esc(c.anchor)}">${esc(c.title)}</a>
    </div>`).join('')
}

function _attachTOCListeners() {
  document.querySelectorAll('#cca-guide-toc-nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      showChapter(a.getAttribute('data-anchor'))
    })
  })
}

// ── Chapter rendering ─────────────────────────────────────────────────────────

function _renderChapterHTML(chapter) {
  return _markdownToHTML(chapter.lines.join('\n'))
}

function _markdownToHTML(md) {
  // Extract footnote definitions
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

  // Escape HTML first
  let html = esc(md)

  // Restore footnote placeholders (they contain only safe chars)
  html = html.replace(/\x00FNREF\x00(\w+)\x00(\d+)\x00/g, (_, id, num) => {
    return `<sup class="cca-fn-ref" id="fnref-${id}"><a href="#fn-${id}" data-fn="${id}">[${num}]</a></sup>`
  })

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold / italic
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')

  // Code blocks (``` ... ```)
  html = html.replace(/```[\s\S]*?```/g, m => `<pre><code>${m.replace(/```\w*\n?/g, '').replace(/```/g, '')}</code></pre>`)

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')

  // Blockquotes (escaped as &gt;)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    if (!/^https?:\/\//.test(url) && !url.startsWith('/') && !url.startsWith('#')) return `[${text}](${url})`
    return `<a href="${url}" rel="noopener noreferrer" target="_blank">${text}</a>`
  })

  // Unordered lists
  html = html.replace(/(^- .+$\n?)+/gm, match => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('')
    return `<ul>${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/(^\d+\. .+$\n?)+/gm, match => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')
    return `<ol>${items}</ol>`
  })

  // Markdown tables
  html = html.replace(/(\|.+\|\n\|[-:| ]+\|\n(?:\|.+\|\n?)+)/g, match => {
    const lines = match.trim().split('\n')
    const headers = lines[0].split('|').slice(1, -1).map(c => c.trim())
    const rows = lines.slice(2).map(l => l.split('|').slice(1, -1).map(c => c.trim()))
    let table = '<table class="cca-guide-table"><thead><tr>'
    table += headers.map(h => `<th>${h}</th>`).join('')
    table += '</tr></thead><tbody>'
    rows.forEach(r => { table += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>' })
    table += '</tbody></table>'
    return table
  })

  // Paragraphs
  html = html.split(/\n\n+/).map(p => {
    p = p.trim()
    if (!p) return ''
    if (/^<(h[1-6]|ul|ol|table|blockquote|pre|hr)/.test(p)) return p
    return `<p>${p.replace(/\n/g, '<br>')}</p>`
  }).join('\n')

  // Footnotes section
  if (footnoteOrder.length) {
    html += '<hr/><ol class="cca-footnotes">'
    footnoteOrder.forEach(id => {
      const defHtml = esc(footnoteDefs[id])
      html += `<li id="fn-${id}">${defHtml} <a href="#fnref-${id}" class="cca-fn-backref" data-fnref="${id}">↩</a></li>`
    })
    html += '</ol>'
  }

  return html
}

function _attachFootnoteHandlers(root) {
  root.querySelectorAll('.cca-fn-ref a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      const id = a.getAttribute('data-fn')
      root.querySelector(`#fn-${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })
  root.querySelectorAll('.cca-fn-backref').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      const ref = a.getAttribute('data-fnref')
      root.querySelector(`#fnref-${CSS.escape(ref)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })
}

// ── Search ────────────────────────────────────────────────────────────────────

function _onSearch(e) {
  const q = e.target.value.toLowerCase().trim()
  const nav = document.getElementById('cca-guide-toc-nav')
  if (!nav) return

  if (!q) {
    _renderTOC()
    _attachTOCListeners()
    return
  }

  const matches = (_parsedChapters || []).filter(c =>
    c.title.toLowerCase().includes(q) || c.lines.join(' ').toLowerCase().includes(q)
  )

  if (matches.length) {
    _renderTOC(matches)
    _attachTOCListeners()
  } else {
    nav.innerHTML = `<div class="cca-no-results">${esc(_T('guide.noResults') || 'Aucun résultat')}</div>`
  }
}

// ── TOC toggle ────────────────────────────────────────────────────────────────

function _applyTocVisibility(visible) {
  const toc = document.querySelector('.cca-guide-toc')
  const layout = document.querySelector('.cca-guide-layout')
  const toggle = document.getElementById('guide-toc-toggle')
  if (!toc || !layout) return
  layout.classList.toggle('cca-guide-toc-hidden', !visible)
  if (toggle) {
    const icon = toggle.querySelector('.cca-guide-toc-toggle-icon')
    const label = toggle.querySelector('.cca-guide-toc-toggle-label')
    if (icon) icon.textContent = visible ? '◀' : '☰'
    if (label) label.textContent = visible
      ? (_T('guide.tocHide') || 'Masquer le sommaire')
      : (_T('guide.tocShow') || 'Afficher le sommaire')
  }
}

function _initTocToggle() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const stored = localStorage.getItem(LS_TOC_VISIBLE)
  let tocVisible = stored !== null ? stored === 'true' : !isMobile

  _applyTocVisibility(tocVisible)

  document.getElementById('guide-toc-toggle')?.addEventListener('click', () => {
    tocVisible = !tocVisible
    localStorage.setItem(LS_TOC_VISIBLE, String(tocVisible))
    _applyTocVisibility(tocVisible)
  })
}

// ── Window interop ────────────────────────────────────────────────────────────

window.__CCA_guide = { mount, renderGuide, showChapter, openGuideChapter, NPK_GUIDE_ANCHORS, CARENCE_GUIDE_ANCHOR }
