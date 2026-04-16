# CLAUDE CODE — Features F1-F11 Structurelles

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt implémente les features structurelles F1-F11 définies dans la roadmap. Elles touchent le modèle de données, les migrations localStorage, les filtres et les exports. **Exécuter dans l'ordre indiqué** — chaque feature peut dépendre de la précédente.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues
- `node --check` après chaque modification
- Chaque migration doit être idempotente (vérification "déjà fait" avant d'agir)

---

## F11 — APP_VERSION + Migrations localStorage (FAIRE EN PREMIER)

### Fichier : `src/lib/migrations.js`

```js
export const APP_VERSION = '3.0.0';
const MIGRATIONS = [
  { version: '3.0.0', migrate: migrateV300 }
];
export function runMigrations() { /* ... */ }
```

### Logique
1. Lire `localStorage.getItem('agrumes_app_version')` 
2. Si absent ou < version courante → exécuter les migrations séquentiellement
3. Chaque migration reçoit les données courantes et les transforme
4. Écrire la nouvelle version dans `agrumes_app_version`
5. Appeler `runMigrations()` au tout début de `launchApp()`, avant tout `loadXxx()`

### Migration V3.0.0
- Ajouter `accessionId` (CCA-YYYY-NNNN) à chaque plant existant qui n'en a pas
- Ajouter `datePrecision: 'full'` aux dates existantes
- Ajouter `provenance: {}` vide aux plants sans provenance

---

## F1 — Accession ID normalisé

### Format : `CCA-{YYYY}-{NNNN}`
- YYYY = année de création du plant
- NNNN = séquentiel 4 chiffres, auto-incrémenté par année
- Stocké dans `plant.accessionId` (distinct de `plant.accessionNumber` du conservatoire)
- Généré automatiquement à la création d'un plant
- Affiché en haut de la fiche plante (non éditable)

### Implémentation
```js
// Dans src/lib/store.js ou src/modules/collection.js
export function generateAccessionId(plants) {
  const year = new Date().getFullYear();
  const existing = plants.filter(p => p.accessionId?.startsWith(`CCA-${year}-`));
  const maxN = existing.reduce((max, p) => {
    const n = parseInt(p.accessionId.split('-')[2]);
    return n > max ? n : max;
  }, 0);
  return `CCA-${year}-${String(maxN + 1).padStart(4, '0')}`;
}
```

---

## F2 — Précision de date (`datePrecision`)

### Champ select adjacent aux champs de date
Options : `full` (jour exact) | `month` (mois/année) | `year` (année seule) | `unknown` (inconnue)

### Champs concernés
- Date d'acquisition
- Dates d'événements
- Date de greffe

### Affichage conditionnel
- `full` → `15/04/2026`
- `month` → `Avril 2026`
- `year` → `2026`
- `unknown` → `Date inconnue`

### Implémentation
Ajouter un helper :
```js
export function formatDateWithPrecision(dateStr, precision) { /* ... */ }
```

---

## F3 — Structuration de l'origine

### Remplacer le champ texte libre `origine` par :
```js
{
  provenanceType: 'achat' | 'don' | 'echange' | 'semis' | 'bouture' | 'greffe' | 'sauvage' | 'inconnu',
  provenanceMode: 'pepiniere' | 'particulier' | 'institution' | 'nature' | 'autre',
  productionType: 'franc' | 'greffe' | 'bouture' | 'marcotte' | 'in_vitro' | 'inconnu',
  provenanceDetail: ''  // texte libre pour précisions
}
```

### Migration
L'ancien champ `origine` (texte libre) est copié dans `provenanceDetail`. Les nouveaux champs reçoivent `'inconnu'` par défaut.

### UI
3 selects + 1 textarea dans la fiche plante, section "Origine".

---

## F9 — Emplacement structuré

### Remplacer le texte libre `emplacement` par :
```js
{
  zone: '',       // ex: 'Serre A', 'Jardin Sud', 'Terrasse'
  section: '',    // ex: 'Rangée 3', 'Bac 2'
  position: '',   // ex: 'Place 15'
  lat: null,
  lng: null
}
```

### Migration
L'ancien `emplacement` (texte libre) → `zone`. Les autres champs vides.

### UI
3 inputs texte + bouton GPS "📍 Ma position" pour `lat/lng`.

---

## F10 — Mode lecture seule

### Flag `agrumes_readonly` dans localStorage
- Toggle dans Réglages → Profil
- Si `true` : tous les boutons d'ajout/modification/suppression sont masqués ou désactivés
- Les exports et la consultation restent actifs
- Indicateur visuel : badge "🔒 Lecture seule" dans le header

### Implémentation
```js
export function isReadOnly() { return localStorage.getItem('agrumes_readonly') === 'true'; }
```
Vérifier `isReadOnly()` avant chaque action de mutation.

---

## F5 — Moteur de filtres composables

### UI
Bouton "🔍 Filtres avancés" dans la collection. Ouvre un panneau avec :
- Bouton "+ Ajouter un filtre"
- Chaque filtre = 3 selects : [Champ] [Opérateur] [Valeur]
- Champs disponibles : espèce, variété, emplacement.zone, provenanceType, status, iucnStatus, accessionId
- Opérateurs : `equals`, `contains`, `startsWith`, `greaterThan`, `lessThan`, `isEmpty`, `isNotEmpty`
- Bouton "Sauvegarder ce filtre" → nom + persistance dans `agrumes_saved_filters`
- Bouton "Charger un filtre sauvegardé" → select des filtres enregistrés

### Logique
```js
export function applyFilters(plants, filters) {
  return plants.filter(p => filters.every(f => matchFilter(p, f)));
}
```

---

## F4 — Déterminations botaniques versionnées

### Remplacer le champ unique `variete` par :
```js
{
  determinations: [{
    taxon: 'Citrus sinensis',
    cultivar: 'Washington Navel',
    determinedBy: 'Dr. Martin',
    date: '2025-03-15',
    confidence: 'confirmed',  // confirmed | probable | uncertain
    notes: ''
  }],
  currentDetermination: 0  // index dans le tableau
}
```

### Migration
L'ancien `variete` → première entrée de `determinations[]` avec `confidence: 'confirmed'`.

### UI
- Affichage de la détermination courante dans l'en-tête de la fiche
- Section "Historique des déterminations" dépliable
- Bouton "Nouvelle détermination" → formulaire

---

## F6 — Export Excel (XLSX)

### Via SheetJS (CDN : `https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js`)

```js
export function exportCollectionXLSX(plants, filters) {
  // Charger SheetJS dynamiquement si pas déjà chargé
  // Créer un workbook avec 1 feuille "Collection"
  // Colonnes : AccessionId, Espèce, Variété, Emplacement, Statut, DateAcquisition, ...
  // Appliquer les filtres actifs
  // Télécharger via Blob
}
```

---

## F7 — Catalogue pépinière JSON/CSV

```js
export function exportNurseryCatalog(format) {
  // format: 'json' | 'csv'
  // Exporter le stock pépinière (catalog[]) avec :
  // espèce, variété, porte-greffe, taille pot, quantité dispo, prix
}
```

---

## F8 — Workflows inter-modules

Transitions contextuelles via boutons d'action :
- Fiche greffe → "📦 Ajouter au catalogue pépinière" → pré-remplit une entrée catalogue
- Fiche récolte → "📅 Planifier au calendrier" → crée un événement calendrier
- Stock intrant bas → "🛒 Ajouter à la liste d'achats" (nouveau store `agrumes_shopping`)

Chaque workflow = une fonction helper qui navigue vers la page cible avec des paramètres pré-remplis via un objet `window.__CCA_workflow_data`.

---

## Ordre d'exécution

```
F11 → F1 → F2 → F3 → F9 → F10 → F5 → F4 → F6 → F7 → F8
```

Gate `node --check` + `npm run build` entre chaque feature.

## Livrable
Tous les fichiers modifiés. Build doit passer. Rapport des migrations appliquées.
