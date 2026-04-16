/**
 * wiki.js — Module Wiki Scientifique Agrumes
 * Offline-first, localStorage. addEventListener exclusivement.
 * Citrus Codex — F-WIKI
 */

const WIKI_KEY = 'agrumes_wiki_pages';

const WIKI_CATS = [
  { slug: 'especes',  icon: '🍊', color: '#e65100' },
  { slug: 'culture',  icon: '🌱', color: '#388e3c' },
  { slug: 'maladies', icon: '🦠', color: '#c62828' },
  { slug: 'greffage', icon: '✂️',  color: '#6a1b9a' },
  { slug: 'histoire', icon: '📜', color: '#1565c0' },
  { slug: 'general',  icon: '📄', color: '#546e7a' },
];
const CAT_COLOR = Object.fromEntries(WIKI_CATS.map(c => [c.slug, c.color]));
const CAT_ICON  = Object.fromEntries(WIKI_CATS.map(c => [c.slug, c.icon]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _gid() { return 'w' + Math.random().toString(36).slice(2, 10); }
function _now() { return new Date().toISOString(); }

function _relTime(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return 'à l\'instant';
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 7)  return `il y a ${days}j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

function _catLabel(slug, T) {
  if (T) { const v = T('wiki.cat.' + slug); if (v && v !== 'wiki.cat.' + slug) return v; }
  return { especes:'Espèces', culture:'Culture', maladies:'Maladies',
           greffage:'Greffage', histoire:'Histoire', general:'Général' }[slug] || slug;
}

function _wT(key, T, fallback) {
  if (!T) return fallback;
  const v = T(key);
  return (v && v !== key) ? v : fallback;
}

// ── Markdown parser ───────────────────────────────────────────────────────────

export function parseMarkdown(md) {
  if (!md) return '';

  // 1. Escape HTML first — XSS prevention
  let s = _esc(md);

  // 2. Footnote markers [^key] → <sup>[n]</sup>
  const refMap = {};
  let refN = 0;
  s = s.replace(/\[\^([^\]]+)\]/g, (_, key) => {
    if (!refMap[key]) refMap[key] = ++refN;
    return `<sup class="cca-wiki-sup">[${refMap[key]}]</sup>`;
  });

  // 3. Headers
  s = s.replace(/^#### (.+)$/gm, '<h4 class="cca-wiki-h4">$1</h4>');
  s = s.replace(/^### (.+)$/gm, '<h3 class="cca-wiki-h3">$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2 class="cca-wiki-h2">$1</h2>');

  // 4. Bold/Italic (order matters)
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 5. Inline code
  s = s.replace(/`([^`]+)`/g, '<code class="cca-wiki-code">$1</code>');

  // 6. Links — http/https only
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safe = /^https?:\/\//.test(url) ? url : '#';
    return `<a href="${_esc(safe)}" target="_blank" rel="noopener noreferrer" class="cca-wiki-link">${text}</a>`;
  });

  // 7. Horizontal rule
  s = s.replace(/^---$/gm, '<hr class="cca-wiki-hr"/>');

  // 8. Bullet lists
  s = s.replace(/((?:^- .+(?:\n|$))+)/gm, block => {
    const items = block.trim().split('\n')
      .map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul class="cca-wiki-ul">${items}</ul>`;
  });

  // 9. Paragraphs (double newline → block split)
  const blocks = s.split(/\n{2,}/);
  s = blocks.map(b => {
    b = b.trim();
    if (!b) return '';
    if (/^<(h[2-4]|ul|hr|div|p)/.test(b)) return b;
    return `<p class="cca-wiki-p">${b.replace(/\n/g, ' ')}</p>`;
  }).join('\n');

  return s;
}

// ── Store ─────────────────────────────────────────────────────────────────────

function _load() {
  try { const r = localStorage.getItem(WIKI_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function _save(pages) {
  try { localStorage.setItem(WIKI_KEY, JSON.stringify(pages)); } catch {}
}

export function getAllPages() {
  let pages = _load();
  if (!pages) { _initSeed(); pages = _load() || []; }
  return pages;
}
export function getPage(slug) {
  return getAllPages().find(p => p.slug === slug) || null;
}
export function createPage(data) {
  const pages = getAllPages();
  const now = _now();
  const slug = (data.slug || data.title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).slice(0, 80);
  const page = {
    id: slug, slug, title: data.title, category: data.category || 'general',
    createdBy: 'local', createdAt: now,
    revisions: [{ id: _gid(), content: data.content || '', author: 'local',
                  createdAt: now, summary: data.summary || 'Création de la page' }],
    refs: data.refs || {}
  };
  pages.unshift(page);
  _save(pages);
  return page;
}
export function saveRevision(slug, content, summary) {
  const pages = getAllPages();
  const i = pages.findIndex(p => p.slug === slug);
  if (i === -1) return false;
  pages[i].revisions.push({ id: _gid(), content, author: 'local',
                             createdAt: _now(), summary: summary || 'Modification' });
  _save(pages);
  return true;
}
export function restoreRevision(slug, revId) {
  const pages = getAllPages();
  const page = pages.find(p => p.slug === slug);
  if (!page) return false;
  const rev = page.revisions.find(r => r.id === revId);
  if (!rev) return false;
  page.revisions.push({ id: _gid(), content: rev.content, author: 'local',
    createdAt: _now(),
    summary: `Restauration — ${rev.createdAt.slice(0,10)} (${_esc(rev.summary)})` });
  _save(pages);
  return true;
}
export function searchPages(query) {
  if (!query) return getAllPages();
  const q = query.toLowerCase();
  return getAllPages().filter(p => {
    const last = p.revisions[p.revisions.length - 1];
    return p.title.toLowerCase().includes(q) ||
      p.category.includes(q) ||
      (last?.content || '').toLowerCase().includes(q);
  });
}

// ── 5 Articles de base ────────────────────────────────────────────────────────

function _initSeed() {
  const now = _now();
  const mk = (slug, title, cat, content, refs) => ({
    id: slug, slug, title, category: cat,
    createdBy: 'local', createdAt: now,
    revisions: [{ id: _gid(), content, author: 'local', createdAt: now, summary: 'Article initial' }],
    refs: refs || {}
  });

  _save([
    mk('citrus-sinensis', 'Citrus sinensis', 'especes',
`## Oranger doux

L'oranger doux (*Citrus sinensis*) est l'une des espèces d'agrumes les plus cultivées au monde. Originaire d'Asie du Sud-Est, il est aujourd'hui dominant dans les pays méditerranéens, au Brésil et aux États-Unis.

## Description botanique

Arbre sempervirent de 5 à 10 m, à feuilles ovales à pétiole ailé. Fleurs blanches très odorantes. Fruit globuleux à écorce lisse, orange à maturité, pulpe sucrée non amère.

## Principales variétés

- **Navel** — ombilic caractéristique, sans pépin, récolte précoce (nov.–jan.)
- **Valencia** — tardive (avr.–juin), référence mondiale pour le jus industriel
- **Blood Oranges** (Moro, Tarocco, Sanguinello) — chair rouge-violacée anthocyanique

## Culture en pot

Substrat drainant obligatoire (pH 5,5–6,5). Exposition plein soleil (>6 h/j). Hivernage hors-gel impératif (> 5 °C). Fertilisation azotée au printemps et en été [^bain1958].

## Maladies principales

Sensible au HLB (*Candidatus Liberibacter asiaticus*), à la tristeza (CTV) sur bigaradier, et à la gomme de Phytophthora en sol lourd.`,
      { bain1958: { authors: ['Bain J.M.'], year: 1958,
          title: 'Morphological, anatomical and physiological changes in the developing fruit of the Valencia orange',
          journal: 'Australian Journal of Botany', vol: '6', pages: '1–24' } }),

    mk('citrus-limon', 'Citrus limon', 'especes',
`## Citronnier

*Citrus limon* est un hybride ancien, probablement issu du croisement entre un cédrat (*C. medica*) et une lime (*C. aurantifolia*). Cultivé depuis l'Antiquité en Méditerranée pour ses fruits acides riches en vitamine C [^tolkowsky1938].

## Description

Petit arbre semi-épineux (3–6 m). Feuilles vert clair à bord légèrement denté. Fleurs blanc-rosé teintées de violet à l'extérieur. Fruits ovoïdes jaunes à écorce rugueuse, pulpe très acide (6–8 % d'acide citrique).

## Variétés principales

- **Eureka** — production quasi continue, très commerciale, peu de graines
- **Lisbon** — plus épineuse, tolère mieux la chaleur sèche
- **Menton** (IGP) — citron de luxe, très aromatique, peau utilisée en gastronomie
- **Lunario** (4 Saisons) — remontante, floraison continue toute l'année

## Exigences culturales

Moins rustique que l'oranger : gèle dès −3 °C. Sol bien drainé, pH 5,5–6,5. Sensible à la chlorose ferrique en sol calcaire — apport de chélate de fer en végétation.

## Composition

Vitamine C (50–80 mg/100 mL), flavonoïdes (hespéridine, ériocitrine), huiles essentielles (limonène 65–70 %) dans l'écorce.`,
      { tolkowsky1938: { authors: ['Tolkowsky S.'], year: 1938,
          title: 'Hesperides: A History of the Culture and Use of Citrus Fruits',
          journal: 'John Bale, Sons & Curnow, London', vol: '', pages: '' } }),

    mk('citrus-reticulata', 'Citrus reticulata', 'especes',
`## Mandarinier

*Citrus reticulata* est l'espèce la plus diverse du genre, regroupant mandarines, clémentines, satsumas et tangerines. Plus de 200 cultivars sont répertoriés à ce jour [^swingle1943].

## Principaux sous-groupes

- **Satsuma** (*C. unshiu*) — la plus rustique (−7 °C), sans pépins, origine japonaise
- **Clémentine** — hybride mandarine × oranger, sans pépins si bien isolée
- **Tangerine** — groupe américain, peau lâche, facile à éplucher
- **Tangor** — hybride mandarine × oranger (Temple, Ortanique) aux arômes complexes

## Culture

Légèrement plus rustique que l'oranger. Les hivers frais favorisent la coloration orangée des fruits. Porte-greffe recommandé : *Poncirus trifoliata* en zone froide, Troyer Citrange en standard.

## Valeur nutritionnelle

Riche en bêta-carotène (provitamine A), vitamine C et flavonoïdes spécifiques : nobiletine et tangérétine, aux propriétés anti-inflammatoires documentées.`,
      { swingle1943: { authors: ['Swingle W.T.', 'Reece P.C.'], year: 1943,
          title: 'The botany of Citrus and its wild relatives',
          journal: 'The Citrus Industry, Vol. 1', vol: '', pages: '129–474' } }),

    mk('greffe-ecusson', 'Greffe en écusson (T-budding)', 'greffage',
`## Technique

La greffe en écusson, ou *T-budding*, est la méthode de multiplication végétative la plus utilisée pour les agrumes. Elle consiste à insérer un œil (écusson) prélevé sur la variété désirée sous l'écorce d'un porte-greffe compatible [^castle1987].

## Période optimale

**Printemps** (avril–mai) et **fin d'été** (août–sept.) : l'écorce se décole facilement et la sève est en circulation active.

## Matériel nécessaire

- Greffoir à lame courbe propre et désinfectée
- Ruban de greffage (PVC ou raphia)
- Baguettes de bois du cultivar (rameaux semi-aoûtés, non feuillus)

## Protocole pas à pas

1. Choisir un porte-greffe en végétation active, diamètre ≥ 8 mm
2. Inciser en forme de **T** sur l'écorce, à 20–25 cm du sol
3. Prélever l'écusson sur la baguette (2 cm de longueur, avec fine tranche de bois)
4. Glisser l'écusson sous les lèvres du T sans dessécher
5. Ligaturer hermétiquement en laissant l'œil visible
6. **3–4 semaines plus tard** : vérifier la reprise (écusson vert et turgescent), décapiter le porte-greffe au-dessus de la greffe

## Taux de reprise

80–95 % en conditions optimales. L'échec principal vient d'un mauvais contact cambial ou d'un porte-greffe hors végétation active [^grosser2000].`,
      {
        castle1987: { authors: ['Castle W.S.'], year: 1987,
          title: 'Citrus rootstocks', journal: 'Rootstocks for Fruit Crops — Wiley',
          vol: '', pages: '361–399' },
        grosser2000: { authors: ['Grosser J.W.', 'Gmitter F.G.'], year: 2000,
          title: 'Protoplast fusion for production of tetraploids and triploids: Applications for scion and rootstock improvement in citrus',
          journal: 'HortScience', vol: '35', pages: '1040–1042' }
      }),

    mk('hlb-greening', 'Huanglongbing (HLB — Greening)', 'maladies',
`## La maladie la plus destructrice des agrumes

Le HLB (*Huanglongbing*, « maladie du dragon jaune ») est causé par la bactérie *Candidatus Liberibacter asiaticus* (CLas). Transmise par le psylle *Diaphorina citri*, elle est présente dans plus de 40 pays et dévaste les vergers de Floride, du Brésil et d'Asie du Sud-Est [^gottwald2010].

## Symptômes caractéristiques

- **Jaunissement asymétrique** des feuilles (*blotchy mottle*) — pathognomonique
- Fruits petits, asymétriques, amers, avec graines avortées
- Chute prématurée des fruits
- Dépérissement progressif irréversible en 3–8 ans

## Vecteur principal : *Diaphorina citri*

Psylle de 3–4 mm. Se reproduit exclusivement sur les jeunes pousses (*flush*) d'agrumes. Un seul individu infectieux peut contaminer de nombreux arbres lors de sa vie.

## Stratégies de lutte

- Utiliser exclusivement du **matériel végétal certifié** (CAC, DRS)
- Surveillance régulière des *flush* : plaque jaune englué, filets anti-insectes
- Traitement insecticide systémique préventif (imidaclopride, spirotetramat) selon AMM locale
- **Arracher et détruire** les arbres confirmés positifs — aucune guérison connue [^bove2006]

## Situation en Europe (2026)

Absent du continent européen. Foyer détecté aux Açores (île de São Jorge) en 2023. Surveillance phytosanitaire européenne renforcée aux frontières et dans les serres d'importation.`,
      {
        gottwald2010: { authors: ['Gottwald T.R.'], year: 2010,
          title: 'Current Epidemiological Understanding of Citrus Huanglongbing',
          journal: 'Annual Review of Phytopathology', vol: '48', pages: '119–139' },
        bove2006: { authors: ['Bové J.M.'], year: 2006,
          title: 'Huanglongbing: A Destructive, Newly-Emerging, Century-Old Disease of Citrus',
          journal: 'Journal of Plant Pathology', vol: '88', pages: '7–37' }
      })
  ]);
}

// ── Render : Liste (home) ─────────────────────────────────────────────────────

export function renderWikiPage(T) {
  const pages = getAllPages();
  const byCat = {};
  WIKI_CATS.forEach(c => { byCat[c.slug] = 0; });
  pages.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });

  const catCards = WIKI_CATS.map(cat => {
    const cnt = byCat[cat.slug] || 0;
    return `<div class="wiki-cat-card" data-action="go-cat" data-slug="${cat.slug}">
      <div class="wiki-cat-icon">${cat.icon}</div>
      <div><div class="wiki-cat-label">${_esc(_catLabel(cat.slug, T))}</div><div class="wiki-cat-count">${cnt} article${cnt !== 1 ? 's' : ''}</div></div>
    </div>`;
  }).join('');

  const recent = [...pages].sort((a, b) => {
    const la = a.revisions.at(-1)?.createdAt || a.createdAt;
    const lb = b.revisions.at(-1)?.createdAt || b.createdAt;
    return lb.localeCompare(la);
  }).slice(0, 12).map(p => {
    const col = CAT_COLOR[p.category] || '#546e7a';
    return `<div class="wiki-page-row" data-action="go-article" data-slug="${_esc(p.slug)}">
      <div class="wiki-page-cat-dot" style="background:${col}"></div>
      <div class="wiki-page-title">${_esc(p.title)}</div>
      <div class="wiki-page-meta">${_relTime(p.revisions.at(-1)?.createdAt)}</div>
    </div>`;
  }).join('');

  return `<div class="wiki-home">
<div class="wiki-search-bar">
  <input id="cca-wiki-search" type="text" placeholder="${_esc(_wT('wiki.search', T, 'Rechercher…'))}"/>
  <button class="wiki-search-btn" data-action="do-search">→</button>
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px 0">
  <div class="wiki-section-title" style="padding:0;margin:0">Catégories</div>
  <button class="btn btn-sm" style="font-size:.75rem" data-action="new-article">+ ${_esc(_wT('wiki.newArticle', T, 'Nouvel article'))}</button>
</div>
<div class="wiki-cats">${catCards}</div>
<div class="wiki-section-title">Articles récents</div>
<div class="wiki-page-list">${recent || `<div style="padding:12px 16px;color:var(--muted);font-size:.82rem">${_esc(_wT('wiki.noArticles', T, 'Aucun article'))}</div>`}</div>
</div>`;
}

// ── Render : Article ──────────────────────────────────────────────────────────

export function renderWikiArticle(slug, T) {
  const page = getPage(slug);
  if (!page) return `<div style="padding:20px;color:var(--muted)">Article introuvable : ${_esc(slug)}</div>`;
  const last = page.revisions.at(-1);
  const cat = WIKI_CATS.find(c => c.slug === page.category);

  // Footnotes
  const refEntries = Object.entries(page.refs || {});
  const footnotes = refEntries.length ? `<div class="cca-wiki-refs">
  <div class="cca-wiki-refs-title">${_esc(_wT('wiki.references', T, 'Notes et références'))}</div>
  ${refEntries.map(([, r], i) =>
    `<div class="cca-wiki-ref-item"><sup>[${i + 1}]</sup> ${_esc((r.authors || []).join(', '))} (${r.year || ''}). <em>${_esc(r.title || '')}</em>. ${_esc(r.journal || '')}${r.vol ? ', ' + r.vol : ''}${r.pages ? ', p.\u00a0' + r.pages : ''}.</div>`
  ).join('')}
</div>` : '';

  return `<div class="wiki-article">
<div style="background:var(--g1);color:var(--white);padding:12px 16px">
  <div style="font-size:.72rem;color:rgba(255,255,255,.6);cursor:pointer;margin-bottom:4px" data-action="go-home">
    ← Wiki${cat ? ' › ' + cat.icon + ' ' + _catLabel(cat.slug, T) : ''}
  </div>
  <div style="font-size:1.05rem;font-weight:700">${_esc(page.title)}</div>
  <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
    <button class="wiki-search-btn" data-action="edit-article" data-slug="${_esc(slug)}" style="font-size:.75rem;padding:4px 10px">${_esc(_wT('wiki.edit', T, 'Modifier'))} ✏</button>
    <button class="wiki-search-btn" data-action="go-history" data-slug="${_esc(slug)}" style="font-size:.75rem;padding:4px 10px;background:rgba(255,255,255,.15)">${_esc(_wT('wiki.history', T, 'Historique'))} 🕐</button>
    <span style="font-size:.72rem;color:rgba(255,255,255,.5);margin-left:auto">${page.revisions.length} rév. · ${_relTime(last?.createdAt)}</span>
  </div>
</div>
<div class="cca-wiki-body" style="padding:14px 16px 30px">
  ${parseMarkdown(last?.content || '')}
  ${footnotes}
</div>
</div>`;
}

// ── Render : Éditeur ──────────────────────────────────────────────────────────

export function renderWikiEditor(slug, T) {
  const page = slug ? getPage(slug) : null;
  const last = page?.revisions.at(-1);
  const isNew = !page;

  const catOptions = WIKI_CATS.map(c =>
    `<option value="${c.slug}">${c.icon} ${_catLabel(c.slug, T)}</option>`
  ).join('');

  return `<div style="padding-bottom:80px">
<div style="background:var(--g1);color:var(--white);padding:12px 16px;display:flex;align-items:center;gap:10px">
  <button data-action="${isNew ? 'go-home' : 'go-article'}" data-slug="${_esc(slug || '')}"
    style="background:rgba(255,255,255,.15);color:white;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem">←</button>
  <div style="font-size:.9rem;font-weight:700">${isNew ? _esc(_wT('wiki.newArticle', T, 'Nouvel article')) : _esc(page.title)}</div>
</div>
<div style="padding:12px 16px;display:flex;flex-direction:column;gap:10px">
  ${isNew ? `
  <div>
    <label style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Titre *</label>
    <input id="cca-wiki-title" type="text" placeholder="Titre de l'article"
      style="width:100%;padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.88rem;margin-top:3px"/>
  </div>
  <div>
    <label style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Catégorie</label>
    <select id="cca-wiki-cat"
      style="width:100%;padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.88rem;margin-top:3px">${catOptions}</select>
  </div>` : ''}
  <div style="display:flex;gap:5px;flex-wrap:wrap">
    <button class="btn btn-sm" data-action="md-bold"   style="font-weight:700;font-size:.78rem">G</button>
    <button class="btn btn-sm" data-action="md-italic" style="font-style:italic;font-size:.78rem">I</button>
    <button class="btn btn-sm" data-action="md-h2"     style="font-size:.78rem">H2</button>
    <button class="btn btn-sm" data-action="md-bullet" style="font-size:.78rem">• Liste</button>
    <button class="btn btn-sm" data-action="md-link"   style="font-size:.78rem">🔗 Lien</button>
    <button class="btn btn-sm" data-action="md-ref"    style="font-size:.78rem">📚 Réf</button>
  </div>
  <textarea id="cca-wiki-content"
    style="width:100%;min-height:280px;padding:10px;border:1px solid var(--cream3);border-radius:7px;font-size:.84rem;font-family:'JetBrains Mono',monospace;resize:vertical;line-height:1.55;box-sizing:border-box"
    placeholder="Rédigez en Markdown… (## Titre, **gras**, *italique*, [^ref])">${_esc(last?.content || '')}</textarea>
  <div>
    <label style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">${_esc(_wT('wiki.summary', T, 'Résumé de la modification'))} *</label>
    <input id="cca-wiki-summary" type="text"
      placeholder="${_esc(_wT('wiki.summaryPh', T, 'Décrivez vos changements…'))}"
      style="width:100%;padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.88rem;margin-top:3px"/>
  </div>
  <div id="cca-wiki-preview" style="display:none;padding:12px 14px;border:1.5px solid var(--cream3);border-radius:8px;background:var(--cream2)"></div>
  <div style="display:flex;gap:8px">
    <button class="btn" data-action="preview-toggle" style="flex:1">${_esc(_wT('wiki.preview', T, 'Prévisualiser'))}</button>
    <button class="btn btn-a" data-action="save-article" data-slug="${_esc(slug || '')}" style="flex:1.5">${_esc(_wT('wiki.save', T, 'Enregistrer'))}</button>
    <button class="btn" data-action="${isNew ? 'go-home' : 'go-article'}" data-slug="${_esc(slug || '')}"
      style="flex:1;background:var(--cream3);color:var(--text)">${_esc(_wT('wiki.cancel', T, 'Annuler'))}</button>
  </div>
</div>
</div>`;
}

// ── Render : Historique ───────────────────────────────────────────────────────

export function renderWikiHistory(slug, T) {
  const page = getPage(slug);
  if (!page) return `<div style="padding:20px;color:var(--muted)">Article introuvable.</div>`;

  const rows = [...page.revisions].reverse().map((rev, i) => {
    const isCurrent = i === 0;
    return `<div style="padding:10px 0;border-bottom:1px solid var(--cream3)">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
    <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted)">${rev.createdAt.slice(0, 16).replace('T', ' ')}</span>
    ${isCurrent ? '<span style="font-size:.7rem;background:rgba(45,90,61,.1);color:var(--text-accent);padding:1px 6px;border-radius:5px;font-weight:600">Actuelle</span>' : ''}
  </div>
  <div style="font-size:.82rem;color:var(--text);margin-bottom:5px">${_esc(rev.summary || '—')}</div>
  <div style="display:flex;gap:6px">
    <button class="btn btn-sm" data-action="view-rev" data-revid="${_esc(rev.id)}" data-slug="${_esc(slug)}" style="font-size:.72rem">Voir</button>
    ${!isCurrent ? `<button class="btn btn-sm" data-action="restore-rev" data-revid="${_esc(rev.id)}" data-slug="${_esc(slug)}"
      style="font-size:.72rem;background:rgba(45,90,61,.08);color:var(--text-accent)">${_esc(_wT('wiki.restore', T, 'Restaurer'))}</button>` : ''}
  </div>
</div>`;
  }).join('');

  return `<div style="padding-bottom:40px">
<div style="background:var(--g1);color:var(--white);padding:12px 16px;display:flex;align-items:center;gap:10px">
  <button data-action="go-article" data-slug="${_esc(slug)}"
    style="background:rgba(255,255,255,.15);color:white;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem">← ${_esc(page.title)}</button>
  <div style="font-size:.9rem;font-weight:700">${_esc(_wT('wiki.history', T, 'Historique'))}</div>
</div>
<div id="cca-wiki-rev-content" style="display:none;padding:12px 16px;background:var(--cream2);border-bottom:1px solid var(--cream3)"></div>
<div style="padding:0 16px">${rows}</div>
</div>`;
}

// ── Render : Recherche ────────────────────────────────────────────────────────

export function renderWikiSearch(query, T) {
  const results = searchPages(query);
  const rows = results.map(p => {
    const last = p.revisions.at(-1);
    const raw = (last?.content || '').replace(/#+\s|[*_`]/g, '');
    const qi = raw.toLowerCase().indexOf((query || '').toLowerCase());
    const snippet = qi >= 0
      ? '…' + raw.slice(Math.max(0, qi - 40), qi + 70) + '…'
      : raw.slice(0, 90) + '…';
    const col = CAT_COLOR[p.category] || '#546e7a';
    return `<div class="wiki-page-row" data-action="go-article" data-slug="${_esc(p.slug)}">
  <div class="wiki-page-cat-dot" style="background:${col}"></div>
  <div style="flex:1;min-width:0">
    <div class="wiki-page-title">${_esc(p.title)}</div>
    <div style="font-size:.72rem;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(snippet)}</div>
  </div>
  <div class="wiki-page-meta">${CAT_ICON[p.category] || ''}</div>
</div>`;
  }).join('');

  return `<div>
<div style="padding:10px 16px;display:flex;align-items:center;gap:8px">
  <button data-action="go-home" class="btn btn-sm" style="font-size:.75rem">← Wiki</button>
  <div style="font-size:.85rem;font-weight:600">${results.length} résultat${results.length !== 1 ? 's' : ''} pour « ${_esc(query)} »</div>
</div>
<div class="wiki-page-list">${rows || `<div style="padding:16px 16px;text-align:center;color:var(--muted);font-size:.82rem">${_esc(_wT('wiki.noArticles', T, 'Aucun article'))}</div>`}</div>
</div>`;
}

// ── Mount & routing ───────────────────────────────────────────────────────────

let _view      = 'home';
let _slug      = null;
let _searchQuery = '';
let _noReset   = false;  // set by openArticle to survive the showPage resetView call

export function resetView() {
  if (_noReset) { _noReset = false; return; }
  _view = 'home'; _slug = null; _searchQuery = '';
}

/** Navigates to a specific article on next mount() call (survives showPage reset). */
export function openArticle(slug) { _view = 'article'; _slug = slug; _noReset = true; }

export function mount(rootEl, T) {
  if (!rootEl) return;
  _renderView(rootEl, T);
}

function _renderView(rootEl, T) {
  if      (_view === 'article' && _slug) rootEl.innerHTML = renderWikiArticle(_slug, T);
  else if (_view === 'editor')           rootEl.innerHTML = renderWikiEditor(_slug, T);
  else if (_view === 'history' && _slug) rootEl.innerHTML = renderWikiHistory(_slug, T);
  else if (_view === 'search')           rootEl.innerHTML = renderWikiSearch(_searchQuery, T);
  else if (_view === 'cat'    && _slug)  _renderCatView(rootEl, _slug, T);
  else                                   rootEl.innerHTML = renderWikiPage(T);
  _attachEvents(rootEl, T);
}

function _renderCatView(rootEl, catSlug, T) {
  const pages = getAllPages().filter(p => p.category === catSlug);
  const cat = WIKI_CATS.find(c => c.slug === catSlug) || { icon: '📄', slug: catSlug };
  const rows = pages.map(p => `<div class="wiki-page-row" data-action="go-article" data-slug="${_esc(p.slug)}">
  <div class="wiki-page-title">${cat.icon} ${_esc(p.title)}</div>
  <div class="wiki-page-meta">${p.revisions.length} rév. · ${_relTime(p.revisions.at(-1)?.createdAt)}</div>
</div>`).join('');
  rootEl.innerHTML = `<div>
<div style="background:var(--g1);color:var(--white);padding:12px 16px">
  <button data-action="go-home" style="background:rgba(255,255,255,.15);color:white;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem">← Wiki</button>
  <div style="font-size:.95rem;font-weight:700;margin-top:6px">${cat.icon} ${_esc(_catLabel(catSlug, T))}</div>
</div>
<div class="wiki-page-list">${rows || `<div style="padding:16px;color:var(--muted);font-size:.82rem">Aucun article dans cette catégorie.</div>`}</div>
<div style="padding:10px 16px">
  <button class="btn btn-sm" data-action="new-article" style="font-size:.75rem">+ ${_esc(_wT('wiki.newArticle', T, 'Nouvel article'))}</button>
</div>
</div>`;
}

function _attachEvents(rootEl, T) {
  // Event delegation — single listener on root
  rootEl.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    e.stopPropagation();
    const action = el.dataset.action;
    const slug   = el.dataset.slug  || null;
    const revId  = el.dataset.revid || null;

    switch (action) {
      case 'go-home':    _view = 'home';    _slug = null; _renderView(rootEl, T); break;
      case 'go-article': _view = 'article'; _slug = slug; _renderView(rootEl, T); break;
      case 'go-cat':     _view = 'cat';     _slug = slug; _renderView(rootEl, T); break;
      case 'go-history': _view = 'history'; _slug = slug; _renderView(rootEl, T); break;
      case 'new-article':  _view = 'editor'; _slug = null; _renderView(rootEl, T); break;
      case 'edit-article': _view = 'editor'; _slug = slug; _renderView(rootEl, T); break;
      case 'do-search':
        _searchQuery = rootEl.querySelector('#cca-wiki-search')?.value?.trim() || '';
        _view = 'search'; _renderView(rootEl, T);
        break;
      case 'save-article':    _handleSave(rootEl, T, slug); break;
      case 'preview-toggle':  _handlePreview(rootEl); break;
      case 'restore-rev':     _handleRestore(rootEl, T, slug, revId); break;
      case 'view-rev':        _handleViewRev(rootEl, slug, revId); break;
      case 'md-bold':   _insertMd(rootEl, '**', '**'); break;
      case 'md-italic': _insertMd(rootEl, '*', '*'); break;
      case 'md-h2':     _insertMd(rootEl, '\n## ', '\n'); break;
      case 'md-bullet': _insertMd(rootEl, '\n- ', ''); break;
      case 'md-link':   _insertMd(rootEl, '[', '](https://)'); break;
      case 'md-ref':    _insertMd(rootEl, '[^', ']'); break;
    }
  });

  // Search on Enter
  const si = rootEl.querySelector('#cca-wiki-search');
  if (si) {
    si.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      _searchQuery = si.value.trim();
      _view = 'search'; _renderView(rootEl, T);
    });
  }
}

function _handleSave(rootEl, T, slug) {
  const content = rootEl.querySelector('#cca-wiki-content')?.value?.trim() || '';
  const summary = rootEl.querySelector('#cca-wiki-summary')?.value?.trim() || '';
  if (!content) { alert('Contenu requis'); return; }
  if (!summary) { alert(_wT('wiki.summary', T, 'Résumé requis')); return; }
  if (slug) {
    saveRevision(slug, content, summary);
    _view = 'article'; _slug = slug;
  } else {
    const title    = rootEl.querySelector('#cca-wiki-title')?.value?.trim() || '';
    const category = rootEl.querySelector('#cca-wiki-cat')?.value || 'general';
    if (!title) { alert('Titre requis'); return; }
    const page = createPage({ title, category, content, summary });
    _view = 'article'; _slug = page.slug;
  }
  _renderView(rootEl, T);
}

function _handlePreview(rootEl) {
  const preview = rootEl.querySelector('#cca-wiki-preview');
  const content = rootEl.querySelector('#cca-wiki-content')?.value || '';
  if (!preview) return;
  const hidden = preview.style.display === 'none';
  if (hidden) { preview.innerHTML = parseMarkdown(content); preview.style.display = 'block'; }
  else        { preview.style.display = 'none'; }
}

function _handleRestore(rootEl, T, slug, revId) {
  if (!confirm(_wT('wiki.restore', T, 'Restaurer cette révision ?'))) return;
  restoreRevision(slug, revId);
  _view = 'article'; _slug = slug;
  _renderView(rootEl, T);
}

function _handleViewRev(rootEl, slug, revId) {
  const page = getPage(slug);
  const rev  = page?.revisions.find(r => r.id === revId);
  const box  = rootEl.querySelector('#cca-wiki-rev-content');
  if (!rev || !box) return;
  if (box.dataset.revid === revId && box.style.display !== 'none') {
    box.style.display = 'none'; return;
  }
  box.innerHTML =
    `<div style="font-size:.75rem;font-weight:600;color:var(--muted);margin-bottom:8px">${rev.createdAt.slice(0,16).replace('T',' ')} — ${_esc(rev.summary)}</div>` +
    parseMarkdown(rev.content);
  box.dataset.revid = revId;
  box.style.display = 'block';
}

function _insertMd(rootEl, before, after) {
  const ta = rootEl.querySelector('#cca-wiki-content');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.slice(s, e);
  ta.value = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
  ta.focus();
  ta.selectionStart = s + before.length;
  ta.selectionEnd   = s + before.length + sel.length;
}
