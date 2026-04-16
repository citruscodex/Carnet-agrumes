# CLAUDE CODE — Module Wiki Scientifique Agrumes

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt implémente le wiki collaboratif dans `src/modules/wiki.js`. Le backend wiki (Fastify + PostgreSQL) est prévu sur Scaleway mais pas encore déployé. **Ce prompt implémente la version offline-first localStorage**, migrable vers le backend ultérieurement.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement — zéro `onclick` inline
- `esc()` sur tout innerHTML dynamique
- CSS préfixé `cca-wiki-*`
- `window.__CCA_wiki` pour exposition routeur
- i18n 5 langues pour chaque nouvelle clé
- Zéro dépendance externe (rendu Markdown maison simplifié, pas de lib)

---

## Architecture

### Store localStorage

```js
// Clé : agrumes_wiki_pages
[{
  id: 'citrus-sinensis',           // slug unique
  slug: 'citrus-sinensis',
  title: 'Citrus sinensis',
  category: 'especes',             // especes | culture | maladies | greffage | histoire | general
  createdBy: 'local',              // userId quand backend disponible
  createdAt: '2026-04-14T10:00:00Z',
  revisions: [{
    id: 'rev_001',
    content: '## Oranger doux\n\nL\'oranger doux (*Citrus sinensis*)...',  // Markdown
    author: 'local',
    createdAt: '2026-04-14T10:00:00Z',
    summary: 'Création de la page'
  }],
  refs: {
    'bain1958': { authors: ['Bain J.M.'], year: 1958, title: 'Morphological changes...', journal: 'Aust J Bot' }
  }
}]
```

### Rendu Markdown simplifié (pas de lib)

Implémenter un parseur Markdown minimal couvrant :
- `## Titres` (h2-h4)
- `**gras**`, `*italique*`
- `- listes` à puces
- `[liens](url)`
- `[^ref]` → notes de bas de page (références scientifiques)
- `` `code inline` ``
- Paragraphes (double saut de ligne)
- `---` (séparateur horizontal)

Tout le contenu passe par `esc()` AVANT le parsing Markdown pour éviter les XSS.

---

## Fichier : `src/modules/wiki.js`

### Exports

```js
export function renderWikiPage()          // Page principale : liste des articles par catégorie
export function renderWikiArticle(slug)   // Vue lecture d'un article
export function renderWikiEditor(slug)    // Éditeur Markdown
export function renderWikiHistory(slug)   // Historique des révisions
export function renderWikiSearch(query)   // Recherche full-text
export function parseMarkdown(md)         // Rendu MD → HTML sécurisé
```

### UI — Vue liste (`renderWikiPage`)

```
┌─────────────────────────────────────────────────┐
│ 📖 Citrus Wiki                    [🔍 Recherche] │
├─────────────────────────────────────────────────┤
│ Catégories :                                     │
│ [Espèces] [Culture] [Maladies] [Greffage] [Tout]│
├─────────────────────────────────────────────────┤
│ 🍊 Citrus sinensis          Modifié il y a 2j   │
│ 🍋 Citrus limon             Modifié il y a 5j   │
│ 🌿 Greffe en écusson        Modifié il y a 1sem │
│ ...                                              │
│                              [+ Nouvel article]  │
└─────────────────────────────────────────────────┘
```

### UI — Vue article (`renderWikiArticle`)

```
┌─────────────────────────────────────────────────┐
│ Citrus sinensis              [📝 Modifier] [🕐]  │
├─────────────────────────────────────────────────┤
│ Contenu Markdown rendu en HTML...               │
│                                                  │
│ ── Notes et références ─────────────────────────│
│ [1] Bain J.M. (1958). Morphological...          │
│ [2] Agustí M. et al. (1997). Adaptation...      │
└─────────────────────────────────────────────────┘
```

### UI — Éditeur (`renderWikiEditor`)

- Textarea pleine largeur avec le Markdown brut
- Barre d'outils minimale : **G** *I* 📎Lien 📚Ref
- Champ "Résumé de la modification" (obligatoire)
- Boutons : [Prévisualiser] [Enregistrer] [Annuler]
- La prévisualisation utilise `parseMarkdown()` dans un div adjacent

### UI — Historique (`renderWikiHistory`)

- Liste des révisions : date, auteur, résumé
- Bouton "Restaurer" sur chaque révision
- Pas de diff visuel (trop complexe sans lib) — afficher le contenu complet de la révision sélectionnée

### Pages pré-remplies

Au premier chargement (localStorage vide), injecter 5 articles de base :
1. `citrus-sinensis` — Oranger doux (description, culture, variétés principales)
2. `citrus-limon` — Citronnier
3. `citrus-reticulata` — Mandarinier
4. `greffe-ecusson` — Technique de greffe en écusson
5. `hlb-greening` — Huanglongbing (HLB), la maladie la plus destructrice

Contenu de base : 3-5 paragraphes par article, avec au moins 1 référence scientifique.

---

## Intégration

### Navigation
Ajouter un item dans la navbar ou dans le menu existant :
- Icône : 📖
- Clé i18n : `wiki.nav`
- Route : `page='wiki'` dans `showPage()`

### Routeur (`app.js`)
```js
import * as wiki from './modules/wiki.js';
window.__CCA_wiki = wiki;
```

### Lien depuis les fiches plantes
Si une page wiki existe pour l'espèce de la plante (`plant.species` → slug), afficher un lien "📖 Voir l'article wiki" dans la fiche.

---

## i18n (clés principales)

```
wiki.nav         → "Wiki" / "Wiki" / "Wiki" / "Wiki" / "Wiki"
wiki.title       → "Citrus Wiki" / "Citrus Wiki" / "Citrus Wiki" / "Citrus Wiki" / "Citrus Wiki"
wiki.search      → "Rechercher…" / "Search…" / "Cerca…" / "Buscar…" / "Pesquisar…"
wiki.newArticle  → "Nouvel article" / "New article" / "Nuovo articolo" / "Nuevo artículo" / "Novo artigo"
wiki.edit        → "Modifier" / "Edit" / "Modifica" / "Editar" / "Editar"
wiki.history     → "Historique" / "History" / "Cronologia" / "Historial" / "Histórico"
wiki.save        → "Enregistrer" / "Save" / "Salva" / "Guardar" / "Guardar"
wiki.cancel      → "Annuler" / "Cancel" / "Annulla" / "Cancelar" / "Cancelar"
wiki.preview     → "Prévisualiser" / "Preview" / "Anteprima" / "Vista previa" / "Pré-visualizar"
wiki.summary     → "Résumé de la modification" / "Edit summary" / "Riepilogo modifica" / "Resumen de edición" / "Resumo da edição"
wiki.summaryPh   → "Décrivez vos changements…" / "Describe your changes…" / "Descrivi le modifiche…" / "Describa sus cambios…" / "Descreva as alterações…"
wiki.restore     → "Restaurer cette version" / "Restore this version" / "Ripristina versione" / "Restaurar versión" / "Restaurar versão"
wiki.noArticles  → "Aucun article" / "No articles" / "Nessun articolo" / "Sin artículos" / "Sem artigos"
wiki.references  → "Notes et références" / "Notes and references" / "Note e riferimenti" / "Notas y referencias" / "Notas e referências"
wiki.cat.especes   → "Espèces" / "Species" / "Specie" / "Especies" / "Espécies"
wiki.cat.culture   → "Culture" / "Cultivation" / "Coltivazione" / "Cultivo" / "Cultivo"
wiki.cat.maladies  → "Maladies" / "Diseases" / "Malattie" / "Enfermedades" / "Doenças"
wiki.cat.greffage  → "Greffage" / "Grafting" / "Innesto" / "Injerto" / "Enxertia"
wiki.cat.histoire  → "Histoire" / "History" / "Storia" / "Historia" / "História"
wiki.cat.general   → "Général" / "General" / "Generale" / "General" / "Geral"
wiki.lastModified  → "Modifié {date}" / "Modified {date}" / "Modificato {date}" / "Modificado {date}" / "Modificado {date}"
wiki.seeArticle    → "📖 Voir l'article wiki" / "📖 See wiki article" / "📖 Vedi articolo wiki" / "📖 Ver artículo wiki" / "📖 Ver artigo wiki"
```

## Validation

```bash
node --check src/modules/wiki.js
node --check src/app.js
npm run build
```

Tests :
1. Naviguer vers Wiki → 5 articles pré-remplis affichés
2. Ouvrir un article → contenu Markdown rendu correctement
3. Modifier un article → nouvelle révision créée
4. Historique → liste des révisions, restauration fonctionnelle
5. Recherche → filtrage par titre et contenu
6. Fiche plante avec species → lien wiki visible si article existe
7. Changement de langue → tous textes traduits
