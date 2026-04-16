# CLAUDE CODE — P0 Stabilisation Vite : Scan onclick inline

## Contexte
Lire `CLAUDE.md` avant toute action. L'app CCA a été migrée vers Vite + ES modules (49 fichiers JS dans `src/modules/`). Le build réussit et l'app se charge. **Problème bloquant :** de nombreuses fonctions appelées depuis des attributs `onclick`/`onchange`/`oninput` inline dans le HTML généré par les modules ne sont pas exposées sur `window`, causant des erreurs `xxx is not defined` à l'exécution.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Objectif
Zéro erreur `is not defined` en navigation normale dans l'app. Toutes les fonctions référencées dans des handlers inline doivent être accessibles sur `window`.

## Méthode

### Étape 1 — Scan automatisé

Écrire et exécuter un script Node.js qui :

1. Parse tous les fichiers `src/modules/*.js`
2. Extrait toutes les chaînes dans les attributs `onclick=`, `onchange=`, `oninput=`, `onsubmit=`, `onkeydown=`, `onkeyup=`, `onfocus=`, `onblur=`
3. Pour chaque chaîne, extrait les noms de fonctions appelées (regex `\b([a-zA-Z_]\w*)\s*\(`)
4. Filtre les globals natifs du navigateur (document, window, console, Math, JSON, parseInt, etc.)
5. Vérifie si chaque fonction est :
   a. Définie localement dans le module (`function xxx` ou `const xxx = (`)
   b. Déjà exposée via `Object.assign(window, {...})` dans le module ou dans `app.js`
   c. Importée depuis un autre module
6. Produit un rapport par module : fonctions manquantes sur `window`

### Étape 2 — Correction

Pour chaque module ayant des fonctions manquantes :

**Option A (préférée)** — Ajouter un bloc `Object.assign(window, { fn1, fn2, fn3 })` en fin de module pour toutes les fonctions appelées depuis des handlers inline.

**Option B (si la fonction vient d'un autre module)** — L'importer puis l'exposer : 
```js
import { xxx } from './otherModule.js';
Object.assign(window, { xxx });
```

**Ne PAS modifier les handlers inline eux-mêmes** — la migration onclick→addEventListener est prévue en Phase 2, pas maintenant. On stabilise d'abord.

### Étape 3 — Validation

```bash
node --check src/modules/*.js
npm run build
```

Puis lancer `npm run dev` et naviguer dans :
1. Dashboard (tous profils)
2. Collection → ouvrir une fiche plante
3. Ajouter un sujet
4. Calendrier
5. Réglages
6. Pro (pépiniériste + arboriculteur)
7. Conservatoire

→ Zéro erreur `is not defined` dans la console.

### Étape 4 — P1 mutations d'imports

Après P0, scanner les modules pour les mutations de valeurs importées :

```js
// INTERDIT en ES modules :
import { plants } from './store.js';
plants = newValue; // ❌ TypeError: Assignment to constant variable

// CORRECT :
import { setPlants } from './store.js';
setPlants(newValue); // ✅
```

Vérifier avec `npm run build` — Vite signale les mutations d'imports comme erreurs.

## Contraintes
- `addEventListener` n'est PAS requis pour ce prompt — on expose sur `window` les fonctions existantes
- Ne pas refactorer les modules — corrections chirurgicales uniquement
- `node --check` après chaque modification de fichier
- Ne pas toucher aux zones protégées

## Livrable
Rapport de scan + tous les fichiers modifiés. Build doit passer.
