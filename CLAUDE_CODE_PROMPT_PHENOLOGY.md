# CLAUDE CODE — Module Phénologie BBCH Agrumes

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt implémente le module phénologie BBCH dans l'architecture Vite ES modules (`src/modules/phenology.js`).

**Référence scientifique stricte :** Agustí M., Zaragoza S., Bleiholder H., Buhr L., Hack H., Klose R., Stauss R. (1997). Adaptation de l'échelle BBCH à la description des stades phénologiques des agrumes du genre *Citrus*. *Fruits*, vol. 52(5), p. 287-295, Elsevier Paris.

**Règle fondamentale :** Les 8 stades principaux (0, 1, 3, 5, 6, 7, 8, 9) et les 33 codes secondaires sont ceux du Tableau I du PDF. Les stades principaux 2 et 4 sont explicitement absents chez les agrumes. Aucun stade inventé (pas de "grossissement", "véraison", "post-récolte" comme stades principaux séparés). Les descriptions reprennent fidèlement le PDF.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques obligatoires
- `addEventListener` exclusivement — zéro `onclick` inline
- `esc()` sur tout innerHTML dynamique (import depuis `src/lib/esc.js`)
- CSS custom properties pour valeurs dynamiques, classes préfixées `cca-pheno-*`
- Zéro dépendance externe
- `window.__CCA_phenology` pour exposition au routeur existant
- `node --check` sur chaque fichier JS après modification
- i18n : les 5 langues (FR/EN/IT/ES/PT) pour chaque nouvelle clé

---

## PHASE 1 — Données & logique métier

### Fichier : `src/modules/phenology.js`

Créer le module avec les exports suivants :

```js
export const BBCH_STAGES = [ /* 8 stades principaux — voir ci-dessous */ ];
export function getPhenologyForSpecies(species, gjcAccumulated) { /* ... */ }
export function getSecondaryStage(principalCode, progressInPrincipal) { /* ... */ }
export function getStageActions(principalCode) { /* ... */ }
export function getStagePests(principalCode) { /* ... */ }
export function estimateGJCFromDate(latitude, date, baseTemp) { /* ... */ }
```

### Architecture de données — deux niveaux

**Niveau 1 : 8 stades principaux** — utilisés par le dashboard, le Gantt, les notifications.
**Niveau 2 : 33 codes secondaires** — utilisés par la vue détail de la fiche plante.

```js
export const BBCH_STAGES = [
  // ─── STADE PRINCIPAL 0 : Développement des bourgeons ───
  {
    principal: 0,
    stage: 'bourgeons',
    icon: '💤',
    gjcThreshold: 0,
    i18nKey: 'pheno.stage.0',
    descKey: 'pheno.desc.0',
    // Données agronomiques du PDF
    notes: {
      regulators: 'pheno.note.reg.0',  // Sensible aux gibbérellines et cytoquinines pendant dormance
      remarks: 'pheno.note.rem.0'      // 3-4 poussées/an en climat à hivers marqués ; continu en climat chaud
    },
    actions: {
      fertilization: 'pheno.action.fert.0',
      pruning: 'pheno.action.prune.0',
      irrigation: 'pheno.action.irrig.0'
    },
    pests: ['pheno.pest.cochenilles', 'pheno.pest.acariens_hiv'],
    speciesOffsets: {
      'Citrus limon': -50,
      'Citrus sinensis': 0,
      'Citrus reticulata': 30,
      'Citrus paradisi': 10,
      'Citrus aurantifolia': -30,
      'Fortunella': 50
    },
    // Codes secondaires fidèles au Tableau I du PDF
    secondary: [
      { code: '00', i18nKey: 'pheno.sub.00', progressPercent: 0 },
      { code: '01', i18nKey: 'pheno.sub.01', progressPercent: 25 },
      { code: '03', i18nKey: 'pheno.sub.03', progressPercent: 50 },
      { code: '07', i18nKey: 'pheno.sub.07', progressPercent: 75 },
      { code: '09', i18nKey: 'pheno.sub.09', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 1 : Développement des feuilles ───
  {
    principal: 1,
    stage: 'feuilles',
    icon: '🌱',
    gjcThreshold: 50,
    i18nKey: 'pheno.stage.1',
    descKey: 'pheno.desc.1',
    notes: {
      regulators: 'pheno.note.reg.1',  // Acide gibbérellique favorise développement foliaire
      remarks: 'pheno.note.rem.1'      // Stades 11-15 très sensibles aux aphidiens
    },
    actions: {
      fertilization: 'pheno.action.fert.1',
      pruning: 'pheno.action.prune.1',
      irrigation: 'pheno.action.irrig.1'
    },
    pests: ['pheno.pest.pucerons', 'pheno.pest.mineuse'],
    speciesOffsets: {
      'Citrus limon': -40, 'Citrus sinensis': 0, 'Citrus reticulata': 25,
      'Citrus paradisi': 10, 'Citrus aurantifolia': -25, 'Fortunella': 40
    },
    secondary: [
      { code: '10', i18nKey: 'pheno.sub.10', progressPercent: 0 },
      { code: '11', i18nKey: 'pheno.sub.11', progressPercent: 25 },
      { code: '15', i18nKey: 'pheno.sub.15', progressPercent: 60 },
      { code: '19', i18nKey: 'pheno.sub.19', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 3 : Développement des pousses ───
  {
    principal: 3,
    stage: 'pousses',
    icon: '🌿',
    gjcThreshold: 200,
    i18nKey: 'pheno.stage.3',
    descKey: 'pheno.desc.3',
    notes: {
      regulators: null,
      remarks: 'pheno.note.rem.3'
    },
    actions: {
      fertilization: 'pheno.action.fert.3',
      pruning: 'pheno.action.prune.3',
      irrigation: 'pheno.action.irrig.3'
    },
    pests: ['pheno.pest.mineuse', 'pheno.pest.psylle'],
    speciesOffsets: {
      'Citrus limon': -20, 'Citrus sinensis': 0, 'Citrus reticulata': 15,
      'Citrus paradisi': 5, 'Citrus aurantifolia': -15, 'Fortunella': 30
    },
    secondary: [
      { code: '31', i18nKey: 'pheno.sub.31', progressPercent: 0 },
      { code: '32', i18nKey: 'pheno.sub.32', progressPercent: 35 },
      { code: '39', i18nKey: 'pheno.sub.39', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 5 : Développement de l'inflorescence ───
  {
    principal: 5,
    stage: 'inflorescence',
    icon: '🌸',
    gjcThreshold: 450,
    i18nKey: 'pheno.stage.5',
    descKey: 'pheno.desc.5',
    notes: {
      regulators: null,
      remarks: 'pheno.note.rem.5'
    },
    actions: {
      fertilization: 'pheno.action.fert.5',
      pruning: 'pheno.action.prune.5',
      irrigation: 'pheno.action.irrig.5'
    },
    pests: ['pheno.pest.thrips', 'pheno.pest.acariens'],
    speciesOffsets: {
      'Citrus limon': -10, 'Citrus sinensis': 0, 'Citrus reticulata': 10,
      'Citrus paradisi': 0, 'Citrus aurantifolia': -10, 'Fortunella': 20
    },
    secondary: [
      { code: '51', i18nKey: 'pheno.sub.51', progressPercent: 0 },
      { code: '53', i18nKey: 'pheno.sub.53', progressPercent: 15 },
      { code: '55', i18nKey: 'pheno.sub.55', progressPercent: 35 },
      { code: '56', i18nKey: 'pheno.sub.56', progressPercent: 55 },
      { code: '57', i18nKey: 'pheno.sub.57', progressPercent: 75 },
      { code: '59', i18nKey: 'pheno.sub.59', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 6 : Floraison ───
  {
    principal: 6,
    stage: 'floraison',
    icon: '🌼',
    gjcThreshold: 650,
    i18nKey: 'pheno.stage.6',
    descKey: 'pheno.desc.6',
    notes: {
      regulators: 'pheno.note.reg.6',
      remarks: 'pheno.note.rem.6'
    },
    actions: {
      fertilization: 'pheno.action.fert.6',
      pruning: 'pheno.action.prune.6',
      irrigation: 'pheno.action.irrig.6'
    },
    pests: ['pheno.pest.thrips_flo', 'pheno.pest.botrytis'],
    speciesOffsets: {
      'Citrus limon': 0, 'Citrus sinensis': 0, 'Citrus reticulata': 10,
      'Citrus paradisi': 0, 'Citrus aurantifolia': -5, 'Fortunella': 15
    },
    secondary: [
      { code: '60', i18nKey: 'pheno.sub.60', progressPercent: 0 },
      { code: '61', i18nKey: 'pheno.sub.61', progressPercent: 20 },
      { code: '65', i18nKey: 'pheno.sub.65', progressPercent: 55 },
      { code: '67', i18nKey: 'pheno.sub.67', progressPercent: 80 },
      { code: '69', i18nKey: 'pheno.sub.69', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 7 : Développement du fruit ───
  {
    principal: 7,
    stage: 'fruit_dev',
    icon: '🟢',
    gjcThreshold: 750,
    i18nKey: 'pheno.stage.7',
    descKey: 'pheno.desc.7',
    notes: {
      regulators: 'pheno.note.reg.7',
      remarks: 'pheno.note.rem.7'
    },
    actions: {
      fertilization: 'pheno.action.fert.7',
      pruning: 'pheno.action.prune.7',
      irrigation: 'pheno.action.irrig.7'
    },
    pests: ['pheno.pest.mouche_fruits', 'pheno.pest.cochenilles', 'pheno.pest.alternariose'],
    speciesOffsets: {
      'Citrus limon': 0, 'Citrus sinensis': 0, 'Citrus reticulata': 5,
      'Citrus paradisi': 10, 'Citrus aurantifolia': 0, 'Fortunella': 5
    },
    secondary: [
      { code: '71', i18nKey: 'pheno.sub.71', progressPercent: 0 },
      { code: '72', i18nKey: 'pheno.sub.72', progressPercent: 15 },
      { code: '73', i18nKey: 'pheno.sub.73', progressPercent: 30, alert: true },
      { code: '74', i18nKey: 'pheno.sub.74', progressPercent: 55 },
      { code: '79', i18nKey: 'pheno.sub.79', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 8 : Maturation du fruit ───
  {
    principal: 8,
    stage: 'maturation',
    icon: '🍊',
    gjcThreshold: 1000,
    i18nKey: 'pheno.stage.8',
    descKey: 'pheno.desc.8',
    notes: {
      regulators: 'pheno.note.reg.8',
      remarks: 'pheno.note.rem.8'
    },
    actions: {
      fertilization: 'pheno.action.fert.8',
      pruning: 'pheno.action.prune.8',
      irrigation: 'pheno.action.irrig.8'
    },
    pests: ['pheno.pest.moisissures', 'pheno.pest.mouche_fruits', 'pheno.pest.pourriture'],
    speciesOffsets: {
      'Citrus limon': 0, 'Citrus sinensis': 0, 'Citrus reticulata': 0,
      'Citrus paradisi': 20, 'Citrus aurantifolia': 0, 'Fortunella': -10
    },
    secondary: [
      { code: '81', i18nKey: 'pheno.sub.81', progressPercent: 0 },
      { code: '83', i18nKey: 'pheno.sub.83', progressPercent: 35 },
      { code: '85', i18nKey: 'pheno.sub.85', progressPercent: 65 },
      { code: '89', i18nKey: 'pheno.sub.89', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 9 : Sénescence et dormance ───
  {
    principal: 9,
    stage: 'senescence',
    icon: '🍂',
    gjcThreshold: 1200,
    i18nKey: 'pheno.stage.9',
    descKey: 'pheno.desc.9',
    notes: {
      regulators: null,
      remarks: 'pheno.note.rem.9'
    },
    actions: {
      fertilization: 'pheno.action.fert.9',
      pruning: 'pheno.action.prune.9',
      irrigation: 'pheno.action.irrig.9'
    },
    pests: ['pheno.pest.cochenilles', 'pheno.pest.fumagine'],
    speciesOffsets: {
      'Citrus limon': 0, 'Citrus sinensis': 0, 'Citrus reticulata': 0,
      'Citrus paradisi': 0, 'Citrus aurantifolia': 0, 'Fortunella': 0
    },
    secondary: [
      { code: '91', i18nKey: 'pheno.sub.91', progressPercent: 0 },
      { code: '93', i18nKey: 'pheno.sub.93', progressPercent: 50 },
      { code: '97', i18nKey: 'pheno.sub.97', progressPercent: 100 }
    ]
  }
];
```

### Fonction `getPhenologyForSpecies(species, gjcAccumulated)`

```
Paramètres :
  - species : string (ex. 'Citrus sinensis')
  - gjcAccumulated : number (GJC accumulés depuis le 1er janvier)

Retourne : {
  principal: Object (entrée BBCH_STAGES du stade principal courant),
  secondaryCode: string (code secondaire le plus probable),
  secondaryAlert: boolean (true si code secondaire courant a flag alert),
  nextPrincipal: Object | null,
  progressInPrincipal: number (0-100),
  gjcToNextPrincipal: number,
  adjustedThreshold: number
}

Logique :
  1. Pour chaque stade principal, seuil ajusté = gjcThreshold + (speciesOffsets[species] || 0)
  2. Stade courant = seuil ajusté le plus élevé ≤ gjcAccumulated
  3. progressInPrincipal = interpolation linéaire entre seuil courant et seuil suivant
  4. secondaryCode = getSecondaryStage(principal, progressInPrincipal).code
  5. Si species non trouvée → offset 0 (C. sinensis comme référence)
```

### Fonction `getSecondaryStage(principalCode, progressInPrincipal)`

```
Retourne l'entrée secondary dont progressPercent est le plus élevé ≤ progressInPrincipal.
Retour : { code, i18nKey, progressPercent, alert }
```

### Fonction `estimateGJCFromDate(latitude, date, baseTemp)`

```
Estimation calendaire offline. baseTemp défaut = 13°C.
Modèle sinusoïdal par bande de latitude :
  - < 25° : Tmoy=24, amplitude=4
  - 25-35° : Tmoy=18, amplitude=8
  - 35-45° : Tmoy=15, amplitude=12
  - > 45° : Tmoy=12, amplitude=14
Décalage = 105 (N) ou 287 (S). Somme GJC du 1er janvier à date.
```

### Validation Phase 1

```bash
node --check src/modules/phenology.js
```

Assertions :
- `BBCH_STAGES.length === 8`
- Principaux = [0, 1, 3, 5, 6, 7, 8, 9]
- Total codes secondaires = 33
- `getPhenologyForSpecies('Citrus sinensis', 700).principal.principal === 6`
- `getPhenologyForSpecies('Citrus sinensis', 700).secondaryCode === '65'`
- `getPhenologyForSpecies('Citrus sinensis', 800).principal.principal === 7`
- `getPhenologyForSpecies('Citrus limon', 700).principal.principal === 7` (offset cumulé)
- `estimateGJCFromDate(43.3, new Date('2026-07-15'), 13) > 400`
- Seul code avec `alert: true` = '73'

**Gate : ne pas passer à Phase 2 avant validation complète.**

---

## PHASE 2 — Interface utilisateur

### Principes UI deux niveaux

- **Dashboard + Gantt + Notifications** → 8 stades principaux (lisible, compact)
- **Vue détail fiche plante** → codes secondaires du stade courant (précision BBCH)

### 2A — Widget dashboard : `renderPhenologyWidget(plant)`

```html
<div class="cca-pheno-widget" data-plant-id="{id}">
  <div class="cca-pheno-header">
    <span class="cca-pheno-icon">{icon}</span>
    <span class="cca-pheno-stage">{T(principal.i18nKey)}</span>
    <span class="cca-pheno-code">BBCH {secondaryCode}</span>
  </div>
  <div class="cca-pheno-bar">
    <div class="cca-pheno-bar-fill" style="width:{progressGlobal}%"></div>
    <!-- 8 markers, un par stade principal -->
  </div>
  <div class="cca-pheno-sub">{T(secondary.i18nKey)}</div>
  <div class="cca-pheno-action">{action prioritaire}</div>
  <div class="cca-pheno-alert" style="display:{alert?'':'none'}">{alerte chute physio}</div>
</div>
```

### 2B — Vue détail : `renderPhenologyDetail(plant)`

```
1. En-tête : stade principal (icône, nom, BBCH)
2. Sous-stades : liste codes secondaires du stade courant, courant surligné
3. Actions recommandées (fert/taille/irrig)
4. Régulateurs de croissance (si notes.regulators non null)
5. Risques phytosanitaires + alerte spéciale si secondary.alert
6. Remarques agronomiques (si notes.remarks non null)
7. Prochain stade + GJC restants + date estimée
8. Navigation ◄ ► entre les 8 stades principaux
```

### 2C — Gantt : `renderPhenologyCalendar(plant)`

8 barres horizontales sur 12 mois. HTML/CSS pur. Trait "aujourd'hui". Responsive.

### CSS — préfixe `cca-pheno-*`

```css
.cca-pheno-bar { height:12px; border-radius:6px; background:var(--cca-surface-secondary,#e8e0d4); position:relative; overflow:hidden; }
.cca-pheno-bar-fill { height:100%; border-radius:6px; background:linear-gradient(90deg,var(--cca-pheno-green,#4a7c59),var(--cca-pheno-yellow,#d4c455),var(--cca-pheno-orange,#d4a055)); transition:width .6s ease; }
.cca-pheno-marker { position:absolute; top:-4px; width:4px; height:20px; background:var(--cca-text-secondary,#6b5e4f); border-radius:2px; cursor:pointer; }
.cca-pheno-sub-active { background:var(--cca-accent-light,#fdf0e6); border-left:3px solid var(--cca-accent,#c75b2a); padding:8px 12px; border-radius:0 4px 4px 0; }
.cca-pheno-alert { background:var(--cca-warning-bg,#fff3cd); border:1px solid var(--cca-warning-border,#ffc107); border-radius:4px; padding:8px; margin-top:8px; }
```

### Validation Phase 2

- 8 markers (pas 11)
- Code BBCH secondaire affiché (ex. "BBCH 65")
- Alerte visible au stade 73
- Sous-stades listés et courant surligné
- Blocs régulateurs/remarques conditionnels
- Gantt : 8 barres
- FR + EN traduits

**Gate : ne pas passer à Phase 3 avant validation.**

---

## PHASE 3 — Intégration

### 3A — Dashboard
```js
import { renderPhenologyWidget } from './phenology.js';
// Après bloc météo, si plant.species renseigné
```

### 3B — Collection (fiche plante)
```js
import { renderPhenologyDetail, renderPhenologyCalendar } from './phenology.js';
// Onglet "Phénologie" (clé: 'pheno.tab'), si plant.species renseigné
```

### 3C — Notifications
```
checkPhenologyTransition(plants) :
  - Changement stade principal → push T('pheno.notif.stageChange')
  - Code secondaire avec alert:true (73) → push T('pheno.notif.alertTitle')
  - Persistance : localStorage clé `agrumes_pheno_last_{plantId}`
  - Hook : après refresh météo GJC
```

### 3D — Routeur
```js
import * as phenology from './modules/phenology.js';
window.__CCA_phenology = phenology;
```

### Validation Phase 3

```bash
node --check src/modules/phenology.js
node --check src/modules/dashboard.js
node --check src/modules/collection.js
node --check src/modules/notifications.js
node --check src/app.js
```

Tests :
1. Dashboard → widget 8 markers + code BBCH secondaire
2. Fiche plante → onglet Phénologie + sous-stades
3. Gantt → 8 barres + "aujourd'hui"
4. Langue FR↔EN → tout traduit
5. Stade 73 → alerte chute physiologique

---

## i18n — Clés complètes (5 langues)

### Stades principaux (8)

```
pheno.tab                    → "Phénologie" / "Phenology" / "Fenologia" / "Fenología" / "Fenologia"
pheno.widget.title           → "Stade phénologique" / "Phenological stage" / "Stadio fenologico" / "Estadio fenológico" / "Estádio fenológico"
pheno.widget.next            → "Prochain stade" / "Next stage" / "Prossimo stadio" / "Siguiente estadio" / "Próximo estádio"
pheno.widget.gjcRemaining    → "{n} GJC restants" / "{n} GDD remaining" / "{n} GJC rimanenti" / "{n} GJC restantes" / "{n} GJC restantes"
pheno.widget.estimatedDate   → "Estimé vers le {date}" / "Estimated around {date}" / "Stimato intorno al {date}" / "Estimado alrededor del {date}" / "Estimado por volta de {date}"
pheno.widget.noSpecies       → "Espèce non renseignée" / "Species not specified" / "Specie non indicata" / "Especie no indicada" / "Espécie não indicada"

pheno.stage.0  → "Développement des bourgeons" / "Bud development" / "Sviluppo delle gemme" / "Desarrollo de las yemas" / "Desenvolvimento dos gomos"
pheno.stage.1  → "Développement des feuilles" / "Leaf development" / "Sviluppo delle foglie" / "Desarrollo de las hojas" / "Desenvolvimento das folhas"
pheno.stage.3  → "Développement des pousses" / "Shoot development" / "Sviluppo dei germogli" / "Desarrollo de los brotes" / "Desenvolvimento dos rebentos"
pheno.stage.5  → "Développement de l'inflorescence" / "Inflorescence development" / "Sviluppo dell'infiorescenza" / "Desarrollo de la inflorescencia" / "Desenvolvimento da inflorescência"
pheno.stage.6  → "Floraison" / "Flowering" / "Fioritura" / "Floración" / "Floração"
pheno.stage.7  → "Développement du fruit" / "Fruit development" / "Sviluppo del frutto" / "Desarrollo del fruto" / "Desenvolvimento do fruto"
pheno.stage.8  → "Maturation du fruit" / "Fruit ripening" / "Maturazione del frutto" / "Maduración del fruto" / "Maturação do fruto"
pheno.stage.9  → "Sénescence et dormance" / "Senescence and dormancy" / "Senescenza e dormienza" / "Senescencia y dormancia" / "Senescência e dormência"

pheno.desc.0   → "Dormance à éclatement des bourgeons" / "Dormancy to bud burst" / "Dormienza a rottura delle gemme" / "Dormancia a brotación" / "Dormência a rebentação"
pheno.desc.1   → "Émergence des feuilles à taille définitive" / "Leaf emergence to final size" / "Emergenza fogliare a dimensione finale" / "Emergencia foliar a tamaño final" / "Emergência foliar a tamanho final"
pheno.desc.3   → "Élongation de l'axe des pousses" / "Shoot axis elongation" / "Allungamento dell'asse dei germogli" / "Elongación del eje de los brotes" / "Elongação do eixo dos rebentos"
pheno.desc.5   → "Différenciation florale au ballon creux" / "Flower differentiation to hollow ball" / "Differenziazione fiorale al palloncino cavo" / "Diferenciación floral al globo hueco" / "Diferenciação floral ao balão oco"
pheno.desc.6   → "Anthèse, de 10% à 100% des fleurs ouvertes" / "Anthesis, 10% to 100% flowers open" / "Antesi, dal 10% al 100% dei fiori aperti" / "Antesis, del 10% al 100% de flores abiertas" / "Antese, de 10% a 100% das flores abertas"
pheno.desc.7   → "Nouaison à 90% de la taille finale (courbe sigmoïdale)" / "Fruit set to 90% final size (sigmoidal curve)" / "Allegagione al 90% della dimensione finale (curva sigmoidale)" / "Cuajado al 90% del tamaño final (curva sigmoidal)" / "Vingamento a 90% do tamanho final (curva sigmoidal)"
pheno.desc.8   → "Coloration à maturité de consommation" / "Coloring to consumption maturity" / "Colorazione a maturità di consumo" / "Coloración a madurez de consumo" / "Coloração a maturidade de consumo"
pheno.desc.9   → "Fin de croissance, chute foliaire, repos hivernal" / "Growth end, leaf fall, winter rest" / "Fine crescita, caduta fogliare, riposo invernale" / "Fin de crecimiento, caída foliar, reposo invernal" / "Fim de crescimento, queda foliar, repouso invernal"
```

### Codes secondaires (33) — fidèles au Tableau I

```
pheno.sub.00  → "Dormance : bourgeons indifférenciés, fermés, recouverts d'écailles vertes" / "Dormancy: undifferentiated buds, closed, covered with green scales" / "Dormienza: gemme indifferenziate, chiuse, coperte di squame verdi" / "Dormancia: yemas indiferenciadas, cerradas, cubiertas de escamas verdes" / "Dormência: gomos indiferenciados, fechados, cobertos de escamas verdes"
pheno.sub.01  → "Début du gonflement des bourgeons" / "Beginning of bud swelling" / "Inizio del rigonfiamento delle gemme" / "Inicio de la hinchazón de las yemas" / "Início do inchamento dos gomos"
pheno.sub.03  → "Fin du gonflement : écailles légèrement séparées" / "End of swelling: scales slightly separated" / "Fine del rigonfiamento: squame leggermente separate" / "Fin de la hinchazón: escamas ligeramente separadas" / "Fim do inchamento: escamas ligeiramente separadas"
pheno.sub.07  → "Début de l'éclatement des bourgeons" / "Beginning of bud burst" / "Inizio della rottura delle gemme" / "Inicio de la brotación" / "Início da rebentação"
pheno.sub.09  → "Primordiums foliaires visibles" / "Leaf primordia visible" / "Primordi fogliari visibili" / "Primordios foliares visibles" / "Primórdios foliares visíveis"
pheno.sub.10  → "Premières feuilles se séparent, écailles s'ouvrent, feuilles émergent" / "First leaves separate, scales open, leaves emerge" / "Prime foglie si separano, squame si aprono, foglie emergono" / "Primeras hojas se separan, escamas se abren, hojas emergen" / "Primeiras folhas separam-se, escamas abrem, folhas emergem"
pheno.sub.11  → "Premières feuilles visibles" / "First leaves visible" / "Prime foglie visibili" / "Primeras hojas visibles" / "Primeiras folhas visíveis"
pheno.sub.15  → "Autres feuilles visibles, taille finale non atteinte" / "More leaves visible, final size not reached" / "Altre foglie visibili, dimensione finale non raggiunta" / "Más hojas visibles, tamaño final no alcanzado" / "Mais folhas visíveis, tamanho final não atingido"
pheno.sub.19  → "Premières feuilles à taille définitive" / "First leaves at final size" / "Prime foglie a dimensione definitiva" / "Primeras hojas a tamaño definitivo" / "Primeiras folhas em tamanho definitivo"
pheno.sub.31  → "Début de croissance : axe de la pousse visible" / "Growth start: shoot axis visible" / "Inizio crescita: asse del germoglio visibile" / "Inicio de crecimiento: eje del brote visible" / "Início de crescimento: eixo do rebento visível"
pheno.sub.32  → "Pousses à ~20% de leur taille finale" / "Shoots at ~20% of final size" / "Germogli al ~20% della dimensione finale" / "Brotes al ~20% de su tamaño final" / "Rebentos a ~20% do tamanho final"
pheno.sub.39  → "Pousses à ~90% de leur taille finale" / "Shoots at ~90% of final size" / "Germogli al ~90% della dimensione finale" / "Brotes al ~90% de su tamaño final" / "Rebentos a ~90% do tamanho final"
pheno.sub.51  → "Bourgeons d'inflorescences gonflés, fermés, écailles vert clair" / "Inflorescence buds swollen, closed, light green scales" / "Gemme delle infiorescenze gonfie, chiuse, squame verde chiaro" / "Yemas de inflorescencias hinchadas, cerradas, escamas verde claro" / "Gomos de inflorescências inchados, fechados, escamas verde-claro"
pheno.sub.53  → "Bourgeons éclatent, premiers boutons floraux visibles" / "Buds burst, first flower buds visible" / "Gemme scoppiano, primi boccioli fiorali visibili" / "Yemas brotan, primeros capullos visibles" / "Gomos rebentam, primeiros botões florais visíveis"
pheno.sub.55  → "Fleurs fermées (bouton vert), isolées ou en racèmes" / "Flowers closed (green bud), solitary or in racemes" / "Fiori chiusi (bocciolo verde), isolati o in racemi" / "Flores cerradas (capullo verde), aisladas o en racimos" / "Flores fechadas (botão verde), isoladas ou em racemos"
pheno.sub.56  → "Pétales s'allongent, sépales recouvrent la corolle à moitié (bouton blanc)" / "Petals elongating, sepals cover corolla halfway (white bud)" / "Petali si allungano, sepali coprono la corolla a metà (bocciolo bianco)" / "Pétalos se alargan, sépalos cubren la corola a la mitad (capullo blanco)" / "Pétalas alongam-se, sépalas cobrem a corola pela metade (botão branco)"
pheno.sub.57  → "Sépales étalés, pétales blancs ou rosés de plus en plus visibles" / "Sepals spreading, white or pink petals increasingly visible" / "Sepali distesi, petali bianchi o rosati sempre più visibili" / "Sépalos extendidos, pétalos blancos o rosados cada vez más visibles" / "Sépalas estendidas, pétalas brancas ou rosadas cada vez mais visíveis"
pheno.sub.59  → "Fleurs forment un ballon creux avec les pétales" / "Flowers form a hollow ball with petals" / "Fiori formano un palloncino cavo con i petali" / "Flores forman un globo hueco con los pétalos" / "Flores formam um balão oco com as pétalas"
pheno.sub.60  → "Premières fleurs ouvertes" / "First flowers open" / "Primi fiori aperti" / "Primeras flores abiertas" / "Primeiras flores abertas"
pheno.sub.61  → "Début de floraison : ~10% des fleurs ouvertes" / "Beginning of flowering: ~10% flowers open" / "Inizio fioritura: ~10% dei fiori aperti" / "Inicio de floración: ~10% de flores abiertas" / "Início de floração: ~10% das flores abertas"
pheno.sub.65  → "Pleine floraison : ~50% des fleurs ouvertes, premiers pétales tombent" / "Full bloom: ~50% flowers open, first petals falling" / "Piena fioritura: ~50% dei fiori aperti, primi petali cadono" / "Plena floración: ~50% de flores abiertas, primeros pétalos caen" / "Plena floração: ~50% das flores abertas, primeiras pétalas caem"
pheno.sub.67  → "Floraison s'achève : la plupart des pétales tombés" / "Flowering ending: most petals fallen" / "Fioritura si conclude: la maggior parte dei petali caduti" / "Floración terminando: la mayoría de los pétalos caídos" / "Floração terminando: a maioria das pétalas caídas"
pheno.sub.69  → "Fin de floraison : tous les pétales tombés" / "End of flowering: all petals fallen" / "Fine fioritura: tutti i petali caduti" / "Fin de floración: todos los pétalos caídos" / "Fim de floração: todas as pétalas caídas"
pheno.sub.71  → "Nouaison : grossissement de l'ovaire, début d'abscission" / "Fruit set: ovary swelling, beginning of abscission" / "Allegagione: ingrossamento dell'ovario, inizio abscissione" / "Cuajado: engrosamiento del ovario, inicio de abscisión" / "Vingamento: engrossamento do ovário, início de abscisão"
pheno.sub.72  → "Petit fruit vert couronné par les sépales" / "Small green fruit crowned by sepals" / "Piccolo frutto verde coronato dai sepali" / "Pequeño fruto verde coronado por los sépalos" / "Pequeno fruto verde coroado pelas sépalas"
pheno.sub.73  → "⚠ Chute physiologique des fruits" / "⚠ Physiological fruit drop" / "⚠ Cascola fisiologica dei frutti" / "⚠ Caída fisiológica de frutos" / "⚠ Queda fisiológica dos frutos"
pheno.sub.74  → "Fruit vert foncé, 40% taille finale. Fin chute physiologique" / "Dark green fruit, 40% final size. End of physiological drop" / "Frutto verde scuro, 40% dimensione finale. Fine cascola" / "Fruto verde oscuro, 40% tamaño final. Fin de caída" / "Fruto verde-escuro, 40% tamanho final. Fim da queda"
pheno.sub.79  → "Fruit à ~90% de sa taille finale" / "Fruit at ~90% final size" / "Frutto al ~90% della dimensione finale" / "Fruto al ~90% de su tamaño final" / "Fruto a ~90% do tamanho final"
pheno.sub.81  → "Début de coloration du fruit" / "Beginning of fruit coloring" / "Inizio della colorazione del frutto" / "Inicio de coloración del fruto" / "Início de coloração do fruto"
pheno.sub.83  → "Fruit prêt à récolter, couleur variétale non atteinte" / "Fruit ready to harvest, varietal color not reached" / "Frutto pronto per la raccolta, colore varietale non raggiunto" / "Fruto listo para cosechar, color varietal no alcanzado" / "Fruto pronto para colher, cor varietal não atingida"
pheno.sub.85  → "Maturation avancée : coloration variétale s'intensifie" / "Advanced ripening: varietal coloring intensifying" / "Maturazione avanzata: colorazione varietale si intensifica" / "Maduración avanzada: coloración varietal se intensifica" / "Maturação avançada: coloração varietal intensifica-se"
pheno.sub.89  → "Maturité de consommation, consistance et goût caractéristiques" / "Consumption maturity, characteristic texture and taste" / "Maturità di consumo, consistenza e gusto caratteristici" / "Madurez de consumo, consistencia y sabor característicos" / "Maturidade de consumo, consistência e sabor característicos"
pheno.sub.91  → "Fin de croissance des tiges, feuillage entièrement vert" / "End of shoot growth, foliage entirely green" / "Fine crescita dei rami, fogliame interamente verde" / "Fin de crecimiento de tallos, follaje completamente verde" / "Fim de crescimento dos caules, folhagem inteiramente verde"
pheno.sub.93  → "Début de sénescence, chute des feuilles âgées" / "Beginning of senescence, old leaf drop" / "Inizio senescenza, caduta foglie vecchie" / "Inicio de senescencia, caída de hojas viejas" / "Início de senescência, queda de folhas velhas"
pheno.sub.97  → "Début de la période de repos" / "Beginning of dormancy period" / "Inizio del periodo di riposo" / "Inicio del periodo de reposo" / "Início do período de repouso"
```

### Actions (8 × 3)

```
pheno.action.fert.0  → "Pas de fertilisation (dormance)" / "No fertilization (dormancy)" / "Nessuna fertilizzazione (dormienza)" / "Sin fertilización (dormancia)" / "Sem fertilização (dormência)"
pheno.action.fert.1  → "Azote — démarrage végétatif" / "Nitrogen — vegetative start" / "Azoto — avvio vegetativo" / "Nitrógeno — inicio vegetativo" / "Azoto — arranque vegetativo"
pheno.action.fert.3  → "NPK équilibré + applications foliaires" / "Balanced NPK + foliar applications" / "NPK equilibrato + applicazioni fogliari" / "NPK equilibrado + aplicaciones foliares" / "NPK equilibrado + aplicações foliares"
pheno.action.fert.5  → "Phosphore favorisé" / "Phosphorus emphasis" / "Fosforo favorito" / "Fósforo favorecido" / "Fósforo favorecido"
pheno.action.fert.6  → "Arrêt fertilisation" / "Stop fertilization" / "Stop fertilizzazione" / "Parar fertilización" / "Parar fertilização"
pheno.action.fert.7  → "Reprise K et Ca renforcés" / "Resume with increased K and Ca" / "Ripresa K e Ca rafforzati" / "Reanudación K y Ca reforzados" / "Retoma K e Ca reforçados"
pheno.action.fert.8  → "Arrêt azote, réduction progressive" / "Stop nitrogen, progressive reduction" / "Stop azoto, riduzione progressiva" / "Parar nitrógeno, reducción progresiva" / "Parar azoto, redução progressiva"
pheno.action.fert.9  → "Bilan annuel, amendements organiques" / "Annual review, organic amendments" / "Bilancio annuale, ammendanti organici" / "Balance anual, enmiendas orgánicas" / "Balanço anual, corretivos orgânicos"
pheno.action.prune.0 → "Pas de taille" / "No pruning" / "Nessuna potatura" / "Sin poda" / "Sem poda"
pheno.action.prune.1 → "Taille de formation" / "Training pruning" / "Potatura di formazione" / "Poda de formación" / "Poda de formação"
pheno.action.prune.3 → "Taille verte légère, pinçage" / "Light green pruning, pinching" / "Potatura verde leggera, cimatura" / "Poda verde ligera, pinzado" / "Poda verde ligeira, desponta"
pheno.action.prune.5 → "Arrêt taille" / "Stop pruning" / "Stop potatura" / "Parar poda" / "Parar poda"
pheno.action.prune.6 → "Interdit" / "Forbidden" / "Vietata" / "Prohibida" / "Proibida"
pheno.action.prune.7 → "Éclaircissage si nécessaire" / "Thinning if needed" / "Diradamento se necessario" / "Aclareo si necesario" / "Monda se necessário"
pheno.action.prune.8 → "Interdit" / "Forbidden" / "Vietata" / "Prohibida" / "Proibida"
pheno.action.prune.9 → "Taille d'entretien" / "Maintenance pruning" / "Potatura di mantenimento" / "Poda de mantenimiento" / "Poda de manutenção"
pheno.action.irrig.0 → "Réduite" / "Reduced" / "Ridotta" / "Reducido" / "Reduzida"
pheno.action.irrig.1 → "Reprise progressive" / "Progressive resumption" / "Ripresa progressiva" / "Reanudación progresiva" / "Retoma progressiva"
pheno.action.irrig.3 → "Soutenue" / "Sustained" / "Sostenuta" / "Sostenido" / "Sustentada"
pheno.action.irrig.5 → "Maintien régulier" / "Regular maintenance" / "Mantenimento regolare" / "Mantenimiento regular" / "Manutenção regular"
pheno.action.irrig.6 → "Critique — ne pas manquer" / "Critical — do not miss" / "Critica — non mancare" / "Crítico — no fallar" / "Crítica — não falhar"
pheno.action.irrig.7 → "Intensive" / "Intensive" / "Intensiva" / "Intensivo" / "Intensiva"
pheno.action.irrig.8 → "Modérée puis réduite" / "Moderate then reduced" / "Moderata poi ridotta" / "Moderado luego reducido" / "Moderada depois reduzida"
pheno.action.irrig.9 → "Réduite" / "Reduced" / "Ridotta" / "Reducido" / "Reduzida"
```

### Régulateurs (données du PDF)

```
pheno.note.reg.0  → "Sensible aux gibbérellines et cytoquinines pendant la dormance" / "Sensitive to gibberellins and cytokinins during dormancy" / "Sensibile a gibberelline e citochinine durante la dormienza" / "Sensible a giberelinas y citoquininas durante dormancia" / "Sensível a giberelinas e citocininas durante dormência"
pheno.note.reg.1  → "Développement foliaire favorisé par l'acide gibbérellique" / "Leaf development promoted by gibberellic acid" / "Sviluppo fogliare favorito dall'acido gibberellico" / "Desarrollo foliar favorecido por ácido giberélico" / "Desenvolvimento foliar favorecido pelo ácido giberélico"
pheno.note.reg.6  → "Gibbérellines recommandées pour améliorer la nouaison (variétés sensibles)" / "Gibberellins recommended to improve fruit set (sensitive varieties)" / "Gibberelline raccomandate per migliorare l'allegagione (varietà sensibili)" / "Giberelinas recomendadas para mejorar el cuajado (variedades sensibles)" / "Giberelinas recomendadas para melhorar o vingamento (variedades sensíveis)"
pheno.note.reg.7  → "Auxines pour améliorer le développement du fruit (2e période)" / "Auxins to improve fruit development (2nd period)" / "Auxine per migliorare lo sviluppo del frutto (2° periodo)" / "Auxinas para mejorar el desarrollo del fruto (2° período)" / "Auxinas para melhorar o desenvolvimento do fruto (2.º período)"
pheno.note.reg.8  → "Éthylène : coloration. Gibbérellines + auxines : retardent sénescence" / "Ethylene: coloring. Gibberellins + auxins: delay senescence" / "Etilene: colorazione. Gibberelline + auxine: ritardano senescenza" / "Etileno: coloración. Giberelinas + auxinas: retrasan senescencia" / "Etileno: coloração. Giberelinas + auxinas: atrasam senescência"
```

### Remarques agronomiques (données du PDF — FR seul, Claude Code traduit les 4 autres)

```
pheno.note.rem.0  → "3-4 poussées/an en climat à hivers marqués. Continu en climat chaud. Seule la 1re poussée printanière induit la floraison (sauf cédrat et citron vert : floraison possible sur 2e génération en été)"
pheno.note.rem.1  → "Stades 11-15 très sensibles aux aphidiens. Chez les agrumes, « visible » remplace « étalé » car les feuilles s'étalent précocement"
pheno.note.rem.3  → "3-4 pousses en subtropical, plus en tropical. Feuilles à taille définitive → applications foliaires recommandées printemps/été. Pousses secondaires puis séries successives"
pheno.note.rem.5  → "Durée dépend des conditions thermiques. Pour certaines variétés, stades 5 et 6 coexistent : fleurs à différents stades sur un même arbre"
pheno.note.rem.6  → "Anthèse ~7 jours. Non simultanée : dépend du type d'inflorescence et de sa position sur l'arbre"
pheno.note.rem.7  → "Courbe sigmoïdale à 3 périodes (Bain, 1958). 1re : division cellulaire. 2e : expansion cellulaire. Chute physiologique au stade 73. Durée : 4-7 mois"
pheno.note.rem.8  → "3e période sigmoïdale. Couleur et goût non simultanés. Récolte possible dès stade 83. Sénescence retardable par gibbérellines + auxines"
pheno.note.rem.9  → "Feuilles persistantes, durée de vie 17-24 mois selon variété et climat"
```

**Claude Code doit traduire les remarques en EN/IT/ES/PT.**

### Ravageurs, notifications, labels

```
pheno.pest.cochenilles       → "Cochenilles" / "Scale insects" / "Cocciniglie" / "Cochinillas" / "Cochonilhas"
pheno.pest.acariens_hiv      → "Acariens hivernants" / "Overwintering mites" / "Acari svernanti" / "Ácaros invernantes" / "Ácaros hibernantes"
pheno.pest.pucerons          → "Pucerons" / "Aphids" / "Afidi" / "Pulgones" / "Afídeos"
pheno.pest.mineuse           → "Mineuse des agrumes" / "Citrus leafminer" / "Minatrice degli agrumi" / "Minador de cítricos" / "Minadora dos citrinos"
pheno.pest.psylle            → "Psylle des agrumes" / "Citrus psyllid" / "Psilla degli agrumi" / "Psila de cítricos" / "Psila dos citrinos"
pheno.pest.thrips            → "Thrips" / "Thrips" / "Tripidi" / "Trips" / "Tripes"
pheno.pest.acariens          → "Acariens" / "Mites" / "Acari" / "Ácaros" / "Ácaros"
pheno.pest.thrips_flo        → "Thrips de floraison" / "Flower thrips" / "Tripidi dei fiori" / "Trips de floración" / "Tripes de floração"
pheno.pest.botrytis          → "Botrytis (si humide)" / "Botrytis (if humid)" / "Botrite (se umido)" / "Botrytis (si húmedo)" / "Botrytis (se húmido)"
pheno.pest.mouche_fruits     → "Mouche des fruits" / "Fruit fly" / "Mosca della frutta" / "Mosca de la fruta" / "Mosca-da-fruta"
pheno.pest.alternariose      → "Alternariose" / "Alternaria" / "Alternariosi" / "Alternariosis" / "Alternariose"
pheno.pest.moisissures       → "Moisissures" / "Mold" / "Muffe" / "Mohos" / "Bolores"
pheno.pest.pourriture        → "Pourriture" / "Rot" / "Marciume" / "Podredumbre" / "Podridão"
pheno.pest.fumagine          → "Fumagine" / "Sooty mold" / "Fumaggine" / "Fumagina" / "Fumagina"

pheno.notif.stageChange      → "Changement de stade" / "Stage change" / "Cambio di stadio" / "Cambio de estadio" / "Mudança de estádio"
pheno.notif.stageBody        → "{plant} entre en {stage}" / "{plant} entering {stage}" / "{plant} entra in {stage}" / "{plant} entra en {stage}" / "{plant} entra em {stage}"
pheno.notif.alertTitle       → "Alerte phénologique" / "Phenological alert" / "Allerta fenologica" / "Alerta fenológica" / "Alerta fenológico"
pheno.notif.alertBody73      → "{plant} : chute physiologique des fruits imminente" / "{plant}: physiological fruit drop imminent" / "{plant}: cascola fisiologica imminente" / "{plant}: caída fisiológica inminente" / "{plant}: queda fisiológica iminente"

pheno.section.actions        → "Actions recommandées" / "Recommended actions" / "Azioni raccomandate" / "Acciones recomendadas" / "Ações recomendadas"
pheno.section.regulators     → "Régulateurs de croissance" / "Growth regulators" / "Regolatori di crescita" / "Reguladores de crecimiento" / "Reguladores de crescimento"
pheno.section.pests          → "Risques phytosanitaires" / "Phytosanitary risks" / "Rischi fitosanitari" / "Riesgos fitosanitarios" / "Riscos fitossanitários"
pheno.section.remarks        → "Remarques agronomiques" / "Agronomic remarks" / "Note agronomiche" / "Observaciones agronómicas" / "Observações agronómicas"
pheno.section.next           → "Prochain stade" / "Next stage" / "Prossimo stadio" / "Siguiente estadio" / "Próximo estádio"
pheno.section.substages      → "Sous-stades BBCH" / "BBCH sub-stages" / "Sotto-stadi BBCH" / "Sub-estadios BBCH" / "Sub-estádios BBCH"
pheno.label.fertilization    → "Fertilisation" / "Fertilization" / "Fertilizzazione" / "Fertilización" / "Fertilização"
pheno.label.pruning          → "Taille" / "Pruning" / "Potatura" / "Poda" / "Poda"
pheno.label.irrigation       → "Irrigation" / "Irrigation" / "Irrigazione" / "Riego" / "Irrigação"
pheno.label.bbchCode         → "Code BBCH" / "BBCH code" / "Codice BBCH" / "Código BBCH" / "Código BBCH"
```

---

## Séquence d'exécution

1. `node --check` sur fichiers i18n modifiés
2. Phase 1 → `node --check` → assertions (8 stades, 33 codes, offsets)
3. Phase 2 → `node --check` → vérification visuelle (8 markers, sous-stades, alertes)
4. Phase 3 → `node --check` tous fichiers → test flux complet
5. ZIP uniquement si tout passe

## Livrable

ZIP :
- `src/modules/phenology.js`
- `src/i18n/fr.js`, `en.js`, `it.js`, `es.js`, `pt.js` (clés ajoutées)
- Diff patches : `dashboard.js`, `collection.js`, `notifications.js`, `app.js`
