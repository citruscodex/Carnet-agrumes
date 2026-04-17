# CLAUDE CODE — PHASE 0B — Bugs bloquants + Wiki v2 unique

## Contexte

Lire `CLAUDE.md` avant toute action.

Cette phase corrige **4 points bloquants** identifiés en conditions réelles sur la beta actuelle :
1. Observatoire communautaire — marqueurs non affichés sur la carte
2. Bug tracker — erreurs 404 sur routes admin et user
3. Wiki v1 (localStorage, solo) à supprimer au profit du wiki v2 (PostgreSQL, collaboratif)
4. Wiki v2 — notes de bas de page non fonctionnelles (pas d'édition, pas de rendu)

**Prérequis bloquant** : Phase 0A (sync serveur) terminée et validée en production. Vérifier que la sync cross-device fonctionne avant de commencer.

**Règle sur le wiki** : le wiki v2 est **collaboratif et en ligne** — toutes les contributions sont visibles par tous les membres, partagées via backend PostgreSQL. Le wiki v1 stockait chaque user dans son propre localStorage (solo, non partagé) — c'est précisément pourquoi il est remplacé. **Aucun wiki local n'a de sens** après cette phase.

## Zones protégées — NE PAS TOUCHER

PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes

- `addEventListener` exclusivement — zéro `onclick` inline nouveau
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues (FR/EN/IT/ES/PT)
- `node --check` après chaque modification JS
- Tests en conditions réelles obligatoires, pas seulement `npm run build`

---

## Plan

1. Observatoire — fix rendu markers Leaflet
2. Bug tracker — fix routes 404 (enregistrement plugin + guards admin)
3. Wiki v2 devient unique — suppression bouton bottom nav + purge v1 + export backup temporaire
4. Wiki v2 — notes de bas de page (parser + éditeur toolbar + rendu ancré)
5. Tests Playwright

Gate `node --check` + `npm run build` + tests entre chaque chantier.

---

## CHANTIER 1 — Observatoire : marqueurs sur la carte

### Diagnostic attendu

Le module `src/modules/community.js` contient déjà `_renderObservatoire()` qui fetch `/api/observatoire/map`. Les données arrivent (vérifier avec DevTools Network) mais les markers Leaflet ne s'affichent pas. Causes probables (à investiguer dans cet ordre) :

1. **Map pas encore montée dans le DOM au moment du `L.map(...)`** → il faut attendre que le container `#observatoire-map` soit visible
2. **`map.invalidateSize()` jamais appelé** après injection dans un container caché puis affiché (switch d'onglet)
3. **Markers créés mais avec `lat/lng` nuls ou swappés** (lng/lat au lieu de lat/lng)
4. **Couche markers non ajoutée à la map** (`marker.addTo(map)` oublié)

### Fix attendu

Dans `src/modules/community.js`, fonction `_renderObservatoire(container)` :

```javascript
async function _renderObservatoire(container) {
  container.innerHTML = `
    <div class="cca-observatoire">
      <div id="observatoire-map" style="height:500px;width:100%"></div>
      <div id="observatoire-stats"></div>
      <div id="observatoire-legend"></div>
    </div>`
  
  // 1. Attendre que le container soit dans le DOM et visible
  await new Promise(r => requestAnimationFrame(r))
  
  const mapEl = document.getElementById('observatoire-map')
  if (!mapEl) return
  
  // 2. Initialiser Leaflet
  const map = L.map(mapEl, { 
    center: [46.5, 2.5],  // Centre France
    zoom: 5,
    preferCanvas: true
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map)
  
  // 3. CRITICAL : forcer recalcul des dimensions après injection
  setTimeout(() => map.invalidateSize(), 100)
  
  // 4. Fetcher les observations
  const token = loadToken()
  try {
    const r = await fetch('/api/observatoire/map', { 
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const observations = await r.json()
    
    // 5. Vérifier qu'on a des données
    if (!observations || !observations.length) {
      document.getElementById('observatoire-stats').innerHTML = 
        `<div class="cca-empty-state">${esc(T('observatoire.noData'))}</div>`
      return
    }
    
    // 6. Créer les markers — ATTENTION à l'ordre lat, lng
    const markerGroup = L.layerGroup()
    observations.forEach(obs => {
      const lat = parseFloat(obs.lat_approx || obs.lat)
      const lng = parseFloat(obs.lng_approx || obs.lng)
      if (isNaN(lat) || isNaN(lng)) return
      
      const icon = _getMarkerIcon(obs.event_type)
      const marker = L.marker([lat, lng], { icon })  // [lat, lng] bien dans cet ordre
      marker.bindPopup(`
        <strong>${esc(obs.event_type)}</strong><br>
        ${esc(obs.region || '')}<br>
        ${esc(T('observatoire.count'))}: ${obs.count}<br>
        ${esc(T('observatoire.lastSeen'))}: ${_formatDate(obs.last_seen)}
      `)
      markerGroup.addLayer(marker)
    })
    markerGroup.addTo(map)
    
    // 7. Fit bounds sur les markers
    const bounds = L.latLngBounds(observations
      .filter(o => !isNaN(parseFloat(o.lat_approx)) && !isNaN(parseFloat(o.lng_approx)))
      .map(o => [parseFloat(o.lat_approx), parseFloat(o.lng_approx)]))
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] })
    
    // 8. Stats bar chart
    _renderObservatoireStats(observations)
    
  } catch (err) {
    console.error('[observatoire] fetch failed', err)
    document.getElementById('observatoire-stats').innerHTML = 
      `<div class="cca-error-state">${esc(T('observatoire.loadError'))}</div>`
  }
}

function _getMarkerIcon(eventType) {
  const colors = {
    floraison: '#ff6f00',
    recolte: '#2e7d32',
    gel: '#1565c0',
    maladie: '#c62828',
    ravageur: '#6a1b9a'
  }
  const color = colors[eventType] || '#757575'
  return L.divIcon({
    className: 'cca-obs-marker',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  })
}
```

### Seed de test

Avant de tester, seeder 3 observations test en DB pour l'user courant :

```sql
INSERT INTO observations (user_id, event_type, region, lat_approx, lng_approx, observed_at, is_public) VALUES
  ((SELECT id FROM users WHERE email='tristan@citruscodex.fr'), 'floraison', 'Paris', 48.85, 2.35, NOW() - INTERVAL '5 days', true),
  ((SELECT id FROM users WHERE email='tristan@citruscodex.fr'), 'recolte', 'Nice', 43.70, 7.27, NOW() - INTERVAL '10 days', true),
  ((SELECT id FROM users WHERE email='tristan@citruscodex.fr'), 'gel', 'Lyon', 45.75, 4.85, NOW() - INTERVAL '30 days', true);
```

### Validation

Navigation : Communauté → Observatoire → **3 marqueurs visibles** avec popups fonctionnels.

Test Playwright :
```javascript
test('observatoire affiche markers', async ({ page }) => {
  await _login(page, 'tristan@citruscodex.fr', '...')
  await page.click('text=Communauté')
  await page.click('text=Observatoire')
  await page.waitForTimeout(2000)
  const markers = await page.locator('.leaflet-marker-icon, .cca-obs-marker').count()
  expect(markers).toBeGreaterThanOrEqual(3)
})
```

---

## CHANTIER 2 — Bug tracker : fix 404

### Diagnostic attendu

Les routes `/api/bugs` ont été livrées en Module C (752 handlers, 0 erreur selon Claude Code) mais elles retournent 404 en production. Causes possibles :

1. **Plugin non enregistré** dans `server.js` : vérifier `fastify.register(bugsRoutes)` présent
2. **Plugin chargé avant `fastify.authenticate`** : les routes échouent silencieusement au boot
3. **Caddy CSP block** : vérifier que `connect-src` autorise `/api/bugs*`
4. **Build Vite non déployé** : frontend pointe vers routes qui existent en code local mais pas en prod
5. **Path mismatch** : client appelle `/api/bugs` mais backend expose `/bugs` ou inversement

### Fix attendu

**Étape 1** — Vérifier `server/server.js`

```javascript
import bugsRoutes from './routes/bugs.js'

// ORDRE IMPORTANT : auth plugin AVANT routes qui l'utilisent
await fastify.register(authPlugin)
await fastify.register(userDataRoutes)
await fastify.register(userSyncRoutes)
await fastify.register(userAccountRoutes)
await fastify.register(bugsRoutes)  // ← doit être présent
```

**Étape 2** — Vérifier `server/routes/bugs.js`

Si le fichier existe mais les routes ne sont pas préfixées correctement :

```javascript
import fp from 'fastify-plugin'

export default fp(async function(fastify) {
  const { pool, authenticate } = fastify
  const requireAuth = { preHandler: [authenticate] }
  const requireAdmin = { preHandler: [authenticate, (req, reply, done) => {
    if (!['admin','moderator'].includes(req.user.role)) {
      return reply.code(403).send({ error: 'Forbidden' })
    }
    done()
  }]}
  
  // User routes
  fastify.post('/api/bugs', requireAuth, async (req, reply) => {
    const { title, description, severity, browser, url } = req.body
    if (!title || !description) return reply.code(400).send({ error: 'title and description required' })
    
    // Rate limit: 5/day/user
    const count = await pool.query(
      `SELECT COUNT(*) FROM bug_reports WHERE user_id=$1 AND created_at > NOW() - INTERVAL '1 day'`,
      [req.user.id])
    if (parseInt(count.rows[0].count) >= 5) {
      return reply.code(429).send({ error: 'Rate limit: 5 bugs/day max' })
    }
    
    const r = await pool.query(
      `INSERT INTO bug_reports (user_id, title, description, severity, browser, url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open') RETURNING *`,
      [req.user.id, title.slice(0, 200), description.slice(0, 5000), 
       severity || 'normal', browser || null, url || null])
    return reply.code(201).send(r.rows[0])
  })
  
  fastify.get('/api/bugs/mine', requireAuth, async (req) => {
    const r = await pool.query(
      `SELECT * FROM bug_reports WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.user.id])
    return r.rows
  })
  
  fastify.get('/api/bugs/:id', requireAuth, async (req, reply) => {
    const r = await pool.query(
      `SELECT * FROM bug_reports WHERE id=$1 AND (user_id=$2 OR $3)`,
      [req.params.id, req.user.id, ['admin','moderator'].includes(req.user.role)])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })
  
  // Admin routes
  fastify.get('/api/admin/bugs', requireAdmin, async (req) => {
    const status = req.query.status || 'all'
    const where = status === 'all' ? '' : `WHERE status='${status.replace(/'/g, '')}'`
    const r = await pool.query(
      `SELECT b.*, u.email AS user_email 
       FROM bug_reports b JOIN users u ON u.id=b.user_id ${where}
       ORDER BY b.created_at DESC LIMIT 200`)
    return r.rows
  })
  
  fastify.put('/api/admin/bugs/:id', requireAdmin, async (req, reply) => {
    const { status, admin_notes } = req.body
    if (!['open','in_progress','resolved','closed','duplicate'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' })
    }
    const r = await pool.query(
      `UPDATE bug_reports SET status=$1, admin_notes=$2, updated_at=NOW() 
       WHERE id=$3 RETURNING *`,
      [status, admin_notes || null, req.params.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })
  
  fastify.delete('/api/admin/bugs/:id', requireAdmin, async (req, reply) => {
    await pool.query(`DELETE FROM bug_reports WHERE id=$1`, [req.params.id])
    return { ok: true }
  })
})
```

**Étape 3** — Vérifier que le client appelle les bons paths

Chercher dans `src/modules/` tous les `fetch('/api/bugs...)` et s'assurer qu'ils matchent les paths backend.

### Validation

```bash
# 1. Test route user
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Test bug","description":"Test description","severity":"normal"}' \
  https://citruscodex.fr/api/bugs
# Attendu : 201 + objet bug

# 2. Test liste user
curl -H "Authorization: Bearer $TOKEN" https://citruscodex.fr/api/bugs/mine
# Attendu : 200 + array

# 3. Test admin (avec token admin)
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://citruscodex.fr/api/admin/bugs
# Attendu : 200 + array complet
```

Test Playwright :
```javascript
test('bug tracker soumission + admin visibilité', async ({ page, browser }) => {
  // User soumet
  await page.goto('http://localhost:5173')
  await _login(page, 'testsync1@citruscodex.fr', 'TestSync1234!')
  await page.click('button[aria-label="Signaler un bug"]')  // Bouton 🐛
  await page.fill('[name="title"]', 'Test bug Phase 0B')
  await page.fill('[name="description"]', 'Description détaillée du bug')
  await page.click('button:has-text("Envoyer")')
  await expect(page.locator('text=Bug envoyé')).toBeVisible({ timeout: 5000 })
  
  // Admin consulte
  const ctxAdmin = await browser.newContext()
  const pageAdmin = await ctxAdmin.newPage()
  await pageAdmin.goto('http://localhost:5173')
  await _login(pageAdmin, 'tristan@citruscodex.fr', '<admin_password>')
  await pageAdmin.click('text=Admin')
  await pageAdmin.click('text=Bugs')
  await expect(pageAdmin.locator('text=Test bug Phase 0B')).toBeVisible({ timeout: 5000 })
})
```

---

## CHANTIER 3 — Wiki v2 devient unique

### Contexte

Le wiki v2 est déjà déployé en DB (tables `wiki_pages`, `wiki_revisions`) et accessible via `/api/wiki/*`. Il est collaboratif (toutes les contributions sont visibles par tous les membres connectés, avec historique centralisé).

Le wiki v1 coexiste encore dans le code : stockage localStorage solo (pages non partagées entre membres), accès via bouton dédié de la bottom nav et onglet dans Communauté. C'est incohérent — on supprime v1.

### Actions

**Action 1 — Supprimer le bouton Wiki de la bottom nav**

Identifier le fichier de la bottom nav (probablement `src/modules/nav.js` ou `bottom-nav.js`). Retirer l'entrée Wiki. La bottom nav doit avoir **5 entrées max** : Dashboard, Collection, Calendrier, Communauté, Plus/Profil.

**Action 2 — Dans `community.js`, supprimer tout le code wiki v1**

Rechercher et retirer toutes les fonctions préfixées `_renderWikiV1*`, le store `wikiPages_v1`, les appels à `localStorage.wikiPages_v1`, etc. L'onglet "Citrus Wiki" dans Communauté pointe uniquement vers wiki v2.

**Action 3 — Backup + purge localStorage wiki v1**

Au premier login post-déploiement, une fonction silencieuse :

```javascript
// Dans src/modules/wiki-v1-migration.js (nouveau)

export function migrateWikiV1IfNeeded() {
  const v1Raw = localStorage.getItem('wikiPages_v1') || localStorage.getItem('agrumes_wikiPages')
  if (!v1Raw) return
  
  const migrationDone = localStorage.getItem('wikiV1_archived_at')
  if (migrationDone) return  // Déjà traité
  
  try {
    const pages = JSON.parse(v1Raw)
    
    // Sauvegarder en backup avec timestamp
    const backup = {
      archived_at: new Date().toISOString(),
      pages: pages,
      note: 'Archive wiki v1 (local, solo). Le wiki collaboratif en ligne est désormais dans Communauté → Citrus Wiki.'
    }
    localStorage.setItem('wikiV1_backup', JSON.stringify(backup))
    localStorage.setItem('wikiV1_archived_at', backup.archived_at)
    
    // Supprimer l'ancien stockage actif
    localStorage.removeItem('wikiPages_v1')
    localStorage.removeItem('agrumes_wikiPages')
    
    // Purge définitive programmée à J+30 (vérifiée à chaque login)
    console.log('[wiki-v1] Archived', pages.length || 0, 'local pages to wikiV1_backup. Purge scheduled at J+30.')
  } catch (err) {
    console.error('[wiki-v1] migration failed', err)
  }
  
  // Purge à J+30 si backup existe
  const backup = JSON.parse(localStorage.getItem('wikiV1_backup') || '{}')
  if (backup.archived_at) {
    const ageDays = (Date.now() - new Date(backup.archived_at).getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > 30) {
      localStorage.removeItem('wikiV1_backup')
      console.log('[wiki-v1] Backup purged after 30 days')
    }
  }
}
```

Appelée une fois au démarrage de l'app dans `src/app.js`.

**Action 4 — Bouton "Télécharger archive wiki v1 (temporaire, 30 jours)"**

Dans Réglages → Données, un bouton qui n'apparaît QUE si `localStorage.wikiV1_backup` existe :

```javascript
function renderWikiV1BackupSection() {
  const backup = localStorage.getItem('wikiV1_backup')
  if (!backup) return ''
  
  const parsed = JSON.parse(backup)
  const archivedDate = new Date(parsed.archived_at)
  const purgeDate = new Date(archivedDate.getTime() + 30 * 24 * 3600 * 1000)
  const daysLeft = Math.ceil((purgeDate - Date.now()) / (1000 * 60 * 60 * 24))
  
  return `
    <div class="cca-info-box">
      <h3>${esc(T('wikiV1.backupTitle'))}</h3>
      <p>${esc(T('wikiV1.backupIntro', { days: daysLeft }))}</p>
      <button id="download-wikiv1" class="cca-btn-secondary">
        ${esc(T('wikiV1.downloadBackup'))}
      </button>
    </div>`
}

// Bouton :
document.getElementById('download-wikiv1')?.addEventListener('click', () => {
  const backup = localStorage.getItem('wikiV1_backup')
  const blob = new Blob([backup], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `citruscodex_wikiV1_archive_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
})
```

### i18n

```javascript
wikiV1: {
  backupTitle: 'Archive de l\'ancien wiki personnel',
  backupIntro: 'L\'ancien wiki stocké localement sur cet appareil a été archivé. Les contributions partagées se trouvent désormais dans Communauté → Citrus Wiki. Cette archive personnelle sera supprimée dans {days} jours — téléchargez-la si vous souhaitez conserver vos notes.',
  downloadBackup: 'Télécharger l\'archive JSON'
}
```

Traductions EN/IT/ES/PT identiques en sens.

### Validation

1. Bouton Wiki absent de la bottom nav
2. Onglet Communauté → Citrus Wiki fonctionne et affiche pages serveur
3. Pas de code wiki v1 actif dans `community.js`
4. Réglages → Données affiche la section archive v1 (si présente)
5. Téléchargement JSON archive fonctionne
6. Après J+30, plus d'archive et plus de section

---

## CHANTIER 4 — Wiki v2 : notes de bas de page

### Diagnostic

Les notes `[^N]` en syntaxe markdown ne sont pas parsées ni rendues côté client. Il faut :
1. Bouton toolbar dans l'éditeur pour insérer une note
2. Parseur markdown qui transforme `[^N]` en `<sup><a href="#fn-N">N</a></sup>` + bloc `<ol class="cca-footnotes">` en fin d'article
3. Navigation cliquable : clic sur la note → scroll vers le bloc footnotes ; clic sur la référence du footnote → retour à la position

### Fichier à modifier

`src/modules/community.js` (ou le module wiki v2 spécifique s'il existe)

### Parser

```javascript
function renderWikiMarkdown(md) {
  // 1. Extraire les définitions de notes : [^N]: contenu multi-ligne
  const footnoteDefs = {}
  md = md.replace(/^\[\^(\w+)\]:\s*(.+?)(?=\n\[\^|\n\n|$)/gms, (_, id, content) => {
    footnoteDefs[id] = content.trim()
    return ''  // Retire la définition du corps
  })
  
  // 2. Remplacer les références [^N] par des <sup> cliquables
  let footnoteOrder = []
  md = md.replace(/\[\^(\w+)\]/g, (_, id) => {
    if (!footnoteDefs[id]) return `[^${id}]`  // Note non définie, laisser tel quel
    if (!footnoteOrder.includes(id)) footnoteOrder.push(id)
    const num = footnoteOrder.indexOf(id) + 1
    return `<sup class="cca-fn-ref" id="fnref-${esc(id)}"><a href="#fn-${esc(id)}" data-fn="${esc(id)}">[${num}]</a></sup>`
  })
  
  // 3. Rendu markdown standard (titres, gras, listes, liens, etc.)
  // Utiliser le parseur markdown existant du projet ou une impl simple
  let html = basicMarkdownToHTML(md)
  
  // 4. Ajouter le bloc footnotes en fin
  if (footnoteOrder.length) {
    html += '<hr/><ol class="cca-footnotes">'
    footnoteOrder.forEach(id => {
      html += `<li id="fn-${esc(id)}">${basicMarkdownToHTML(footnoteDefs[id])} 
        <a href="#fnref-${esc(id)}" class="cca-fn-backref" data-fnref="${esc(id)}" title="${esc(T('wiki.backToText'))}">↩</a>
      </li>`
    })
    html += '</ol>'
  }
  
  return html
}

function basicMarkdownToHTML(md) {
  // Parseur minimal : titres, gras, italique, listes, liens, code inline
  // ATTENTION à la sécurité : échapper le HTML d'entrée avant de reconstruire
  let out = esc(md)  // Escape all first
  
  // Titres
  out = out.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  out = out.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  out = out.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  
  // Gras / italique
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  // Code inline
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Liens [texte](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    // Sanitize URL
    if (!/^https?:\/\//.test(url) && !url.startsWith('/') && !url.startsWith('#')) return `[${text}](${url})`
    return `<a href="${url}" rel="noopener">${text}</a>`
  })
  
  // Paragraphes (doubles newlines)
  out = out.split(/\n\n+/).map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '').join('')
  
  // Réinjecter le HTML des notes (sup) qui a été échappé
  out = out.replace(/&lt;sup class=&quot;cca-fn-ref&quot;[^&]*&gt;[^&]*&lt;\/sup&gt;/g, (m) => {
    return m.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  })
  
  return out
}
```

**Note importante** : si le projet utilise déjà une lib markdown (comme `marked` ou une impl maison), l'adapter plutôt que réécrire. Le bloc ci-dessus est une ref fonctionnelle si aucune lib n'existe.

### Éditeur toolbar

Ajouter un bouton "📝 Note" dans la toolbar de l'éditeur wiki :

```javascript
function renderWikiEditorToolbar(textarea) {
  const toolbar = document.createElement('div')
  toolbar.className = 'cca-wiki-toolbar'
  toolbar.innerHTML = `
    <button data-md="bold"><b>B</b></button>
    <button data-md="italic"><i>I</i></button>
    <button data-md="h2">H2</button>
    <button data-md="link">🔗</button>
    <button data-md="footnote">📝 ${esc(T('wiki.footnote'))}</button>
  `
  
  toolbar.querySelector('[data-md="footnote"]').addEventListener('click', () => {
    const id = _nextFootnoteId(textarea.value)
    const cursorPos = textarea.selectionStart
    const before = textarea.value.slice(0, cursorPos)
    const after = textarea.value.slice(cursorPos)
    
    // Insert reference at cursor + definition at end
    textarea.value = `${before}[^${id}]${after}\n\n[^${id}]: ${T('wiki.footnotePlaceholder')}`
    
    // Place cursor in the definition
    const defPos = textarea.value.lastIndexOf(`[^${id}]: `) + `[^${id}]: `.length
    textarea.focus()
    textarea.setSelectionRange(defPos, defPos + T('wiki.footnotePlaceholder').length)
  })
  
  // Autres boutons... bold/italic/h2/link
  
  return toolbar
}

function _nextFootnoteId(md) {
  const used = [...md.matchAll(/\[\^(\w+)\]:/g)].map(m => m[1])
  let n = 1
  while (used.includes(String(n))) n++
  return String(n)
}
```

### Event handlers pour navigation note ↔ texte

```javascript
// Sur un article wiki rendu
document.querySelectorAll('.cca-fn-ref a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault()
    const id = a.getAttribute('data-fn')
    document.getElementById(`fn-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
})

document.querySelectorAll('.cca-fn-backref').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault()
    const ref = a.getAttribute('data-fnref')
    document.getElementById(`fnref-${ref}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
})
```

### CSS

```css
.cca-fn-ref { font-size: 0.75em; }
.cca-fn-ref a { color: var(--primary, #2e7d32); text-decoration: none; font-weight: bold; }
.cca-footnotes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; }
.cca-footnotes li { margin-bottom: 8px; }
.cca-fn-backref { text-decoration: none; color: var(--primary, #2e7d32); margin-left: 4px; }
```

### i18n

```javascript
wiki: {
  footnote: 'Note',
  footnotePlaceholder: 'Contenu de la note',
  backToText: 'Retour au texte'
}
```

### Validation

Test manuel :
1. Créer page wiki → bouton Note → référence `[^1]` insérée + définition en bas
2. Éditer contenu note → sauvegarder
3. Recharger article → note `[1]` visible en sup bleue → clic → scroll vers note → clic ↩ → retour à la position initiale

Test Playwright :
```javascript
test('wiki notes de bas de page fonctionnelles', async ({ page }) => {
  await _login(page, 'tristan@citruscodex.fr', '...')
  await page.click('text=Communauté')
  await page.click('text=Citrus Wiki')
  await page.click('button:has-text("Nouvelle page")')
  
  await page.fill('[name="title"]', 'Test Notes')
  await page.fill('[name="content"]', 'Contenu principal.')
  await page.click('button[data-md="footnote"]')
  
  await page.click('button:has-text("Publier")')
  await page.waitForTimeout(1000)
  
  const sup = page.locator('.cca-fn-ref').first()
  await expect(sup).toBeVisible()
  await sup.click()
  
  const footnote = page.locator('.cca-footnotes li').first()
  await expect(footnote).toBeInViewport()
})
```

---

## Livrables

- `src/modules/community.js` (modifié : observatoire + wiki v2 + notes + purge v1)
- `src/modules/wiki-v1-migration.js` (nouveau)
- `src/modules/nav.js` ou équivalent (modifié : retrait bouton wiki)
- `src/modules/settings.js` (modifié : section archive wiki v1)
- `src/app.js` (modifié : appel `migrateWikiV1IfNeeded()`)
- `server/routes/bugs.js` (vérifié/corrigé)
- `server/server.js` (modifié si besoin : register bugsRoutes)
- `src/i18n/*.js` (blocs `wiki.*` + `wikiV1.*` + `observatoire.*` 5 langues)
- `tests/phase0b-bugs-wiki.spec.js`

## Critères de réussite

- [ ] Observatoire affiche ≥3 markers avec popups (test avec seed)
- [ ] POST `/api/bugs` → 201 et bug listé dans admin
- [ ] Bouton Wiki absent de la bottom nav
- [ ] Aucun appel `localStorage.wikiPages_v1` dans le code actif
- [ ] Archive wiki v1 téléchargeable depuis Réglages → Données (si backup présent)
- [ ] Notes wiki éditables et cliquables (test aller-retour)
- [ ] `node --check` OK
- [ ] `npm run build` OK
- [ ] Tests Playwright passent (4 tests minimum)

## Livraison

ZIP final : `cca_phase_0b_bugs_wiki.zip`
