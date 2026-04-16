# CLAUDE CODE — Observatoire + Irrigation Collection + Bug Tracker Beta

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt couvre 3 modules distincts à implémenter séquentiellement.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement — zéro `onclick` inline
- `esc()` sur tout innerHTML dynamique
- CSS préfixé par module (`cca-obs-*`, `cca-drip-*`, `cca-bug-*`)
- `window.__CCA_xxx` pour exposition routeur
- i18n 5 langues (FR/EN/IT/ES/PT)
- `node --check` après chaque modification
- Backend Fastify + PostgreSQL sur Scaleway (citruscodex.fr)

---

## MODULE A — Observatoire CitrusCodex (refonte)

### Problèmes actuels à corriger
1. **Marqueurs carte ne s'affichent pas** — les coordonnées `lat_approx`/`lng_approx` du backend sont soit nulles, soit le parsing `parseFloat` échoue. Vérifier le flux complet : API → données → L.circleMarker.
2. **Rendu sous la carte inutile** — le bar chart et le journal brut sont visuellement pauvres. Remplacer par des statistiques structurées.

### Carte — corrections

1. Vérifier que `wikiOpenObservatoire()` (ou la fonction de rendu) :
   - Fait bien `parseFloat()` sur lat/lng
   - Filtre les points sans coordonnées (`if (!pt.lat_approx || !pt.lng_approx) return`)
   - Appelle `obsMap.invalidateSize()` après un `setTimeout` de 200ms (conteneur pas encore dimensionné)
2. Si le backend renvoie des coordonnées entières (ex: `lat_approx: 46`), utiliser un random offset ±0.3° pour dé-superposer les points
3. Ajouter un cluster layer si Leaflet.markercluster est disponible, sinon agrandir les `circleMarker` (rayon 8px, opacité 0.7)

### Sous la carte — refonte complète

Remplacer le bar chart + journal brut par deux blocs de statistiques :

#### Bloc 1 — Statistiques de la saison en cours

```
┌──────────────────────────────────────────────┐
│ 📊 Saison en cours ({saison} {année})         │
├──────────────────────────────────────────────┤
│ 🌸 Floraisons signalées      12              │
│ 🍊 Récoltes                   8              │
│ ❄️ Alertes gel                 3              │
│ 🦠 Alertes phyto               5              │
│ 📍 Régions actives             7              │
│ 👥 Contributeurs               15             │
└──────────────────────────────────────────────┘
```

Calculer la saison courante via la même logique que `getSz()` dans le dashboard. Filtrer les observations par date de début/fin de saison.

#### Bloc 2 — Statistiques de l'année en cours

```
┌──────────────────────────────────────────────┐
│ 📊 Année {année}                              │
├──────────────────────────────────────────────┤
│ Total observations             45             │
│ Espèce la plus observée        C. sinensis    │
│ Région la plus active          PACA            │
│ Pic floraison                  Mars-Avril     │
│ GJC moyen national             832             │
└──────────────────────────────────────────────┘
```

Agréger depuis les données `GET /api/observatoire/journal` (ou le store local si offline).

#### Journal condensé

Garder un journal mais en format condensé : dernières 10 observations, une ligne par observation, cliquable pour détails. Pas de paragraphes — format tableau compact.

### Fallback offline

Si le backend est injoignable (fetch échoue), afficher un message "📡 Observatoire indisponible en mode hors-ligne" avec bouton "Réessayer". Ne pas afficher d'erreurs techniques.

---

## MODULE B — Système d'irrigation goutte-à-goutte par collection

### Contexte
Le module drip existant fonctionne **par plante individuelle** (`plant.drip`). La demande est un système de **groupes d'irrigation** : plusieurs plantes arrosées ensemble par un même circuit goutte-à-goutte.

### Modèle de données

```js
// Clé localStorage : agrumes_drip_systems
[{
  id: 'drip_001',
  name: 'Circuit serre A',
  emitterFlow: 2.0,       // L/h par émetteur
  emittersPerPlant: 2,     // émetteurs par plante
  pressure: 1.5,           // bar (informatif)
  filterType: 'disque',    // disque | sable | tamis (informatif)
  timerEnabled: false,     // programmateur ?
  timerSchedule: '',       // ex: "06:00, 18:00"
  plantIds: ['id1', 'id2', 'id3'],  // plantes du circuit
  notes: '',
  createdAt: '2026-04-14T10:00:00Z'
}]
```

### Fonctions

```js
export function renderDripSystems()           // Liste des circuits
export function renderDripSystemDetail(id)    // Détail d'un circuit + calcul global
export function addPlantToSystem(systemId, plantId)
export function removePlantFromSystem(systemId, plantId)
export function calcSystemIrrigation(system)  // Calcul agrégé
```

### `calcSystemIrrigation(system)`

```
Pour chaque plante du circuit :
  1. Calculer ETc individuelle via getETPForPlant(plant) (existant)
  2. Calculer le volume individuel via calcDripRecommendation(plant) (existant)
  3. Le volume le plus exigeant du groupe détermine la durée du circuit

Retourne : {
  plants: [{ id, name, species, volL, etcMm }],
  maxVolL: number,          // volume de la plante la plus exigeante
  durationMin: number,      // durée = maxVolL / (emitterFlow × emittersPerPlant) × 60
  totalVolL: number,        // somme des volumes individuels
  overIrrigated: [{ id, name, excessL }],  // plantes qui reçoivent trop
  underIrrigated: []        // plantes qui ne reçoivent pas assez (si limitation matérielle)
}
```

**Point clé :** dans un circuit partagé, la durée est dictée par la plante la plus assoiffée. Les autres reçoivent potentiellement trop. Le système doit afficher l'excès par plante et recommander de séparer les plantes aux besoins très différents.

### UI

#### Page principale (accessible depuis le menu ou les réglages)

```
┌──────────────────────────────────────────────┐
│ 💧 Systèmes d'irrigation            [+ Nouveau] │
├──────────────────────────────────────────────┤
│ 🔵 Circuit serre A          3 plantes        │
│    Durée recommandée : 45 min  │  12.5 L     │
│    ⚠ 1 plante en sur-arrosage                │
├──────────────────────────────────────────────┤
│ 🔵 Circuit terrasse          5 plantes       │
│    Durée recommandée : 30 min  │  8.2 L      │
└──────────────────────────────────────────────┘
```

#### Détail d'un circuit

```
┌──────────────────────────────────────────────┐
│ 💧 Circuit serre A                  [✏️] [🗑] │
│ Émetteurs : 2 L/h × 2/plante                │
├──────────────────────────────────────────────┤
│ Plante          ETc    Volume    Durée   ⚠   │
│ Oranger doux    3.2mm  4.5L     68min        │
│ Citronnier      4.1mm  5.8L     87min        │ ← dicte la durée
│ Kumquat         1.8mm  2.5L     38min   ⚠+3.3L│
├──────────────────────────────────────────────┤
│ 📊 Durée circuit : 87 min │ Total : 12.8 L   │
│ ⚠ Kumquat recevra 3.3L en excès             │
│                                              │
│ [+ Ajouter une plante]                       │
└──────────────────────────────────────────────┘
```

#### Ajout de plante

Modal avec select des plantes de la collection (filtré : exclure celles déjà dans un circuit). Possibilité d'ajouter plusieurs d'un coup (checkboxes).

### Intégration

- Lien depuis la fiche plante : "💧 Circuit : {nom}" si la plante est dans un système
- Lien depuis le dashboard : widget "💧 Irrigation" avec les systèmes et durées du jour
- Navigation : item dans le menu ou sous-page des réglages

---

## MODULE C — Système de rapport de bugs (Beta)

### Architecture

**Backend Fastify + PostgreSQL** (sur Scaleway, même serveur que l'app).

```sql
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'bug',  -- bug | feature | ui | perf | other
  severity VARCHAR(20) DEFAULT 'medium',  -- low | medium | high | critical
  status VARCHAR(20) DEFAULT 'open',  -- open | acknowledged | in_progress | resolved | closed | wont_fix
  page_context VARCHAR(100),  -- page/vue où le bug a été constaté
  browser_info TEXT,  -- navigator.userAgent
  screen_size VARCHAR(20),  -- ex: "375x812"
  app_version VARCHAR(20),  -- APP_VERSION
  admin_notes TEXT,  -- notes internes admin (invisible membre)
  resolution_notes TEXT,  -- notes de résolution (visible membre)
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bug_status ON bug_reports(status);
CREATE INDEX idx_bug_user ON bug_reports(user_id);
```

### API Fastify

```
POST   /api/bugs          → créer un rapport (auth requise)
GET    /api/bugs/mine      → mes rapports (auth requise)
GET    /api/bugs/:id       → détail d'un rapport (auth: propriétaire ou admin)
PATCH  /api/bugs/:id       → modifier statut/notes (auth: admin uniquement)
GET    /api/bugs           → tous les rapports (auth: admin uniquement)
GET    /api/bugs/stats     → compteurs par statut (auth: admin uniquement)
```

### Sécurité
- Auth JWT obligatoire sur toutes les routes
- Rate limiting : 5 rapports/jour/utilisateur
- Sanitization des inputs (pas de HTML, longueur max)
- Les membres ne voient QUE leurs propres rapports
- Les admins voient tout + peuvent modifier le statut
- Rôle admin = champ `role: 'admin'` dans la table `users`

### Frontend — Bouton flottant

**CRITIQUE : le bouton actuel empêche l'accès à d'autres boutons.**

Remplacer le bouton fixe par un **FAB (Floating Action Button)** :

```css
.cca-bug-fab {
  position: fixed;
  bottom: 80px;   /* au-dessus de la navbar mobile */
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--cca-accent, #c75b2a);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  font-size: 20px;
  cursor: pointer;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.cca-bug-fab:hover { transform: scale(1.1); }
/* Draggable pour ne pas gêner */
.cca-bug-fab.dragging { opacity: 0.7; }
```

Le FAB est **draggable** : l'utilisateur peut le déplacer s'il gêne. Position persistée dans `localStorage('agrumes_bug_fab_pos')`.

Tap sur le FAB → ouvre le formulaire de rapport.

### Frontend — Formulaire de rapport

Modal avec :
- Titre (obligatoire, max 200 chars)
- Description (obligatoire, textarea)
- Catégorie : Bug / Demande de fonctionnalité / Problème d'interface / Performance / Autre
- Sévérité : Faible / Moyenne / Haute / Critique
- Capture automatique (pré-rempli, non éditable) : page courante, navigateur, taille écran, version app

Bouton "Envoyer" → POST /api/bugs → toast "Rapport envoyé ✓" ou "Hors-ligne — rapport sauvegardé localement" (queue offline dans localStorage, flush au retour en ligne).

### Frontend — Vue membre ("Mes signalements")

Accessible depuis Réglages ou le menu :

```
┌──────────────────────────────────────────────┐
│ 🐛 Mes signalements                          │
├──────────────────────────────────────────────┤
│ 🔴 Bouton X ne fonctionne pas     Ouvert     │
│    il y a 2 jours                             │
├──────────────────────────────────────────────┤
│ 🟡 Ajouter un tri par date       En cours    │
│    il y a 5 jours                             │
│    💬 "Prévu pour la v3.1"                    │
├──────────────────────────────────────────────┤
│ 🟢 Export PDF cassé               Résolu ✓   │
│    il y a 2 semaines                          │
│    💬 "Corrigé dans la v3.0.1"               │
└──────────────────────────────────────────────┘
```

Le membre voit le statut et les `resolution_notes` mais **pas** les `admin_notes`.

### Frontend — Vue admin

Page dédiée admin (`/admin/bugs` ou `page='admin-bugs'`) :

```
┌──────────────────────────────────────────────┐
│ 🐛 Gestion des bugs          Stats: 12 ouv. │
│ [Tous] [Ouverts] [En cours] [Résolus]        │
├──────────────────────────────────────────────┤
│ 🔴 CRITIQUE  Bouton X...     @user123        │
│    Page: collection  │  Chrome 120  │  v3.0  │
│    [Acknowledger] [En cours] [Résolu] [WONTFIX]│
│    Notes admin: ___________                   │
│    Notes résolution: ___________              │
├──────────────────────────────────────────────┤
│ ...                                           │
└──────────────────────────────────────────────┘
```

Fonctionnalités admin :
- Filtres par statut, sévérité, catégorie
- Modifier le statut (transition: open→acknowledged→in_progress→resolved/closed/wont_fix)
- Ajouter des notes admin (internes)
- Ajouter des notes de résolution (visibles par le membre)
- Compteurs en temps réel par statut

### Queue offline

Si le backend est injoignable au moment de l'envoi :
1. Stocker le rapport dans `localStorage('agrumes_bug_queue')`
2. Afficher un toast "Rapport sauvegardé localement"
3. À chaque lancement de l'app (`launchApp()`), tenter de flush la queue
4. Supprimer de la queue après succès du POST

---

## i18n

```
obs.title          → "Observatoire CitrusCodex" / "CitrusCodex Observatory" / "Osservatorio CitrusCodex" / "Observatorio CitrusCodex" / "Observatório CitrusCodex"
obs.season         → "Saison en cours" / "Current season" / "Stagione corrente" / "Temporada actual" / "Temporada atual"
obs.year           → "Année {year}" / "Year {year}" / "Anno {year}" / "Año {year}" / "Ano {year}"
obs.blooms         → "Floraisons" / "Blooms" / "Fioriture" / "Floraciones" / "Florações"
obs.harvests       → "Récoltes" / "Harvests" / "Raccolti" / "Cosechas" / "Colheitas"
obs.frostAlerts    → "Alertes gel" / "Frost alerts" / "Allerte gelo" / "Alertas helada" / "Alertas geada"
obs.phytoAlerts    → "Alertes phyto" / "Phyto alerts" / "Allerte fitosanitarie" / "Alertas fito" / "Alertas fito"
obs.activeRegions  → "Régions actives" / "Active regions" / "Regioni attive" / "Regiones activas" / "Regiões ativas"
obs.contributors   → "Contributeurs" / "Contributors" / "Contributori" / "Contribuidores" / "Contribuidores"
obs.offline        → "Observatoire indisponible hors-ligne" / "Observatory unavailable offline" / "Osservatorio non disponibile offline" / "Observatorio no disponible sin conexión" / "Observatório indisponível offline"
obs.retry          → "Réessayer" / "Retry" / "Riprova" / "Reintentar" / "Tentar novamente"
obs.topSpecies     → "Espèce la plus observée" / "Most observed species" / "Specie più osservata" / "Especie más observada" / "Espécie mais observada"
obs.topRegion      → "Région la plus active" / "Most active region" / "Regione più attiva" / "Región más activa" / "Região mais ativa"
obs.peakBloom      → "Pic floraison" / "Peak bloom" / "Picco fioritura" / "Pico de floración" / "Pico de floração"

drip.title         → "Systèmes d'irrigation" / "Irrigation systems" / "Sistemi di irrigazione" / "Sistemas de riego" / "Sistemas de irrigação"
drip.newSystem     → "Nouveau circuit" / "New circuit" / "Nuovo circuito" / "Nuevo circuito" / "Novo circuito"
drip.name          → "Nom du circuit" / "Circuit name" / "Nome circuito" / "Nombre circuito" / "Nome circuito"
drip.flow          → "Débit émetteur (L/h)" / "Emitter flow (L/h)" / "Portata emettitore (L/h)" / "Caudal emisor (L/h)" / "Caudal emissor (L/h)"
drip.emitters      → "Émetteurs par plante" / "Emitters per plant" / "Emettitori per pianta" / "Emisores por planta" / "Emissores por planta"
drip.duration      → "Durée recommandée" / "Recommended duration" / "Durata raccomandata" / "Duración recomendada" / "Duração recomendada"
drip.totalVol      → "Volume total" / "Total volume" / "Volume totale" / "Volumen total" / "Volume total"
drip.overIrrig     → "⚠ Sur-arrosage" / "⚠ Over-irrigation" / "⚠ Eccesso irrigazione" / "⚠ Sobre-riego" / "⚠ Sobre-rega"
drip.excessL       → "+{n}L en excès" / "+{n}L excess" / "+{n}L in eccesso" / "+{n}L en exceso" / "+{n}L em excesso"
drip.addPlant      → "Ajouter une plante" / "Add a plant" / "Aggiungi pianta" / "Añadir planta" / "Adicionar planta"
drip.circuit       → "Circuit : {name}" / "Circuit: {name}" / "Circuito: {name}" / "Circuito: {name}" / "Circuito: {name}"
drip.separateHint  → "Séparer les plantes aux besoins très différents" / "Separate plants with very different needs" / "Separare piante con necessità molto diverse" / "Separar plantas con necesidades muy diferentes" / "Separar plantas com necessidades muito diferentes"

bug.fab            → "🐛" (pas de texte, icône seule)
bug.title          → "Signaler un problème" / "Report a problem" / "Segnala un problema" / "Reportar un problema" / "Reportar um problema"
bug.titleField     → "Titre" / "Title" / "Titolo" / "Título" / "Título"
bug.descField      → "Description" / "Description" / "Descrizione" / "Descripción" / "Descrição"
bug.category       → "Catégorie" / "Category" / "Categoria" / "Categoría" / "Categoria"
bug.severity       → "Sévérité" / "Severity" / "Gravità" / "Severidad" / "Gravidade"
bug.send           → "Envoyer" / "Send" / "Invia" / "Enviar" / "Enviar"
bug.sent           → "Rapport envoyé ✓" / "Report sent ✓" / "Report inviato ✓" / "Reporte enviado ✓" / "Relatório enviado ✓"
bug.savedLocally   → "Sauvegardé localement" / "Saved locally" / "Salvato localmente" / "Guardado localmente" / "Guardado localmente"
bug.myReports      → "Mes signalements" / "My reports" / "I miei report" / "Mis reportes" / "Os meus relatórios"
bug.status.open          → "Ouvert" / "Open" / "Aperto" / "Abierto" / "Aberto"
bug.status.acknowledged  → "Pris en compte" / "Acknowledged" / "Preso in carico" / "Reconocido" / "Reconhecido"
bug.status.in_progress   → "En cours" / "In progress" / "In corso" / "En progreso" / "Em progresso"
bug.status.resolved      → "Résolu" / "Resolved" / "Risolto" / "Resuelto" / "Resolvido"
bug.status.closed        → "Fermé" / "Closed" / "Chiuso" / "Cerrado" / "Fechado"
bug.status.wont_fix      → "Ne sera pas corrigé" / "Won't fix" / "Non verrà corretto" / "No se corregirá" / "Não será corrigido"
bug.adminPanel     → "Gestion des bugs" / "Bug management" / "Gestione bug" / "Gestión de bugs" / "Gestão de bugs"
bug.cat.bug        → "Bug" / "Bug" / "Bug" / "Bug" / "Bug"
bug.cat.feature    → "Fonctionnalité" / "Feature" / "Funzionalità" / "Funcionalidad" / "Funcionalidade"
bug.cat.ui         → "Interface" / "Interface" / "Interfaccia" / "Interfaz" / "Interface"
bug.cat.perf       → "Performance" / "Performance" / "Prestazioni" / "Rendimiento" / "Desempenho"
bug.cat.other      → "Autre" / "Other" / "Altro" / "Otro" / "Outro"
bug.sev.low        → "Faible" / "Low" / "Bassa" / "Baja" / "Baixa"
bug.sev.medium     → "Moyenne" / "Medium" / "Media" / "Media" / "Média"
bug.sev.high       → "Haute" / "High" / "Alta" / "Alta" / "Alta"
bug.sev.critical   → "Critique" / "Critical" / "Critica" / "Crítica" / "Crítica"
```

---

## Ordre d'exécution

1. **Module A** — Observatoire : corrections carte + statistiques saison/année
2. **Module B** — Systèmes d'irrigation goutte-à-goutte par collection
3. **Module C** — Bug tracker beta (backend + frontend)

Gate `node --check` + `npm run build` entre chaque module.

## Validation

Module A :
- Carte affiche les marqueurs (vérifier avec données mock si backend indisponible)
- Statistiques saison et année affichées sous la carte
- Fallback offline propre

Module B :
- Créer un circuit avec 3 plantes → durée calculée = celle de la plante la plus exigeante
- Alerte sur-arrosage visible pour les plantes avec excès
- Lien depuis la fiche plante vers son circuit

Module C :
- FAB draggable, ne bloque aucun bouton
- Rapport envoyé → visible dans "Mes signalements"
- Admin voit tous les rapports, peut changer le statut
- Hors-ligne → rapport en queue, flush au retour en ligne
