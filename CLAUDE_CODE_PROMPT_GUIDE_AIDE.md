# CLAUDE CODE — Corrections Critiques + Guide Utilisateur Exhaustif + Aide Contextuelle

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt commence par des **corrections critiques** (Phase 0) sur des fonctionnalités livrées mais non fonctionnelles, puis produit un guide utilisateur complet.

**Règle impérative Phase 0 :** Pour chaque correction, **tester en ouvrant l'app dans le navigateur** (`npm run dev`) et vérifier visuellement que le résultat est correct. Ne pas se contenter de `node --check`. Boucler sur la correction jusqu'à ce que ça fonctionne parfaitement.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues (FR/EN/IT/ES/PT) pour les titres d'aide
- `node --check` après chaque modification

---

## PHASE 0 — CORRECTIONS CRITIQUES (avant tout le reste)

Chaque point ci-dessous est un travail qui a été demandé, implémenté selon les rapports, mais qui **ne fonctionne pas en pratique**. Investiguer le code réel, trouver la cause, corriger, et **tester visuellement** jusqu'à ce que ce soit parfait.

### 0A — Météo : persistance de la localisation

**Problème :** À chaque connexion, l'app redemande la géolocalisation pour la météo. C'est pénible.

**Correction :**
1. Au premier chargement météo, si `navigator.geolocation` réussit, stocker `{ lat, lng, city, savedAt }` dans `localStorage('agrumes_weather_location')`
2. Aux chargements suivants, utiliser la localisation stockée sans redemander
3. Ajouter un bouton discret (petite icône 📍 ou ⚙) **dans le bloc météo** (pas dans les réglages principaux) qui permet de :
   - Recapturer la position GPS actuelle
   - Saisir manuellement une ville/coordonnées
4. Le bouton doit être discret : petite icône en haut à droite du bloc météo, pas un gros bouton

**Test :** Ouvrir l'app → météo s'affiche sans prompt de géolocalisation (sauf première fois). Cliquer sur 📍 → permet de changer la localisation.

### 0B — Bouton bug flottant (FAB) : draggable non fonctionnel

**Problème :** Le FAB de signalement de bug devait être draggable (déplaçable) pour ne pas masquer d'autres boutons. Le drag ne fonctionne pas.

**Investigation :**
1. Vérifier que le FAB a bien les event listeners `mousedown`/`touchstart` + `mousemove`/`touchmove` + `mouseup`/`touchend`
2. Vérifier que le seuil de drag (≥5px) est correct
3. Vérifier que la position est persistée dans `localStorage('agrumes_bug_fab_pos')`
4. Vérifier que la position est restaurée au chargement
5. Vérifier que le FAB ne sort pas de l'écran (clamping)

**Causes probables :**
- Les listeners sont attachés sur le FAB mais le FAB est recréé à chaque `render()` → listeners perdus. **Fix :** attacher les listeners dans un `_initBugFab()` appelé une seule fois, ou vérifier que le FAB n'est injecté qu'une fois dans le DOM.
- `position: fixed` + `right/bottom` au lieu de `left/top` → le drag calcule dans le mauvais référentiel. **Fix :** utiliser `left/top` exclusivement pour le positionnement.
- Le `touchmove` n'a pas `{ passive: false }` → le scroll consomme l'événement. **Fix :** `addEventListener('touchmove', handler, { passive: false })` + `e.preventDefault()`.

**Test :** Sur mobile ET desktop, maintenir le bouton 🐛 et le glisser → il se déplace. Relâcher → il reste en place. Recharger la page → il est à la même position.

### 0C — Module BBCH phénologie : non visible / non fonctionnel

**Problème :** Le module phénologie BBCH a été implémenté (Phase 1-3 du prompt PHENOLOGY) mais n'est pas visible dans l'interface.

**Investigation systématique :**

1. **Le bridge ES module est-il en place ?**
   ```
   Chercher dans public/index.html :
   <script type="module">
     import * as phenology from './src/modules/phenology.js';
     window.__CCA_phenology = phenology;
   </script>
   ```
   Si absent → l'ajouter avant `</body>`.

2. **Le placeholder dashboard est-il injecté ?**
   ```
   Chercher `<div id="cca-pheno-dash">` dans le rendu de renderDash / renderWxInner.
   ```
   Si absent → l'ajouter après le bloc météo.

3. **Le placeholder fiche plante est-il injecté ?**
   ```
   Chercher `<div id="cca-pheno-det">` dans renderDetail.
   ```
   Si absent → l'ajouter dans un onglet dédié.

4. **La fonction `_mountPheno()` est-elle appelée dans `render()` ?**
   ```
   Chercher `_mountPheno` dans la fonction render().
   ```
   Si absent → l'ajouter après `m.innerHTML = renderDash()` et après `m.innerHTML = renderDetail()`.

5. **Le fichier `src/modules/phenology.js` est-il accessible ?**
   ```
   Vérifier que public/src/modules/phenology.js existe (le build copie depuis src/).
   Ouvrir la console navigateur → erreurs d'import ?
   ```

6. **Le widget s'affiche-t-il ?**
   Si `window.__CCA_phenology` est défini mais le widget ne s'affiche pas :
   - Vérifier que `_mountPheno('dash')` trouve le placeholder `#cca-pheno-dash`
   - Vérifier que `renderPhenologyWidget(plant)` retourne du HTML valide
   - Vérifier que la plante a un `species` renseigné (condition d'affichage)

**Test :** Dashboard → widget phéno visible sous la météo pour chaque plante avec species. Fiche plante → onglet Phénologie visible avec barre BBCH, sous-stades, actions.

### 0D — Observatoire : marqueurs carte toujours invisibles

**Problème :** La correction des marqueurs a été rapportée comme faite, mais les marqueurs ne s'affichent toujours pas sur la carte Leaflet.

**Investigation :**

1. **Les données arrivent-elles ?**
   ```js
   // Dans la console, après avoir ouvert l'observatoire :
   // Chercher le fetch vers /api/observatoire/map
   // Vérifier la réponse : est-ce un tableau ? est-il vide ?
   ```

2. **Les coordonnées sont-elles valides ?**
   ```js
   // Pour chaque point de mapData :
   console.log(pt.lat_approx, pt.lng_approx, typeof pt.lat_approx);
   // Si ce sont des strings → parseFloat nécessaire
   // Si null/undefined → filtrage manquant
   ```

3. **La carte est-elle initialisée avant les données ?**
   Le `setTimeout` pour Leaflet init peut être trop court. Augmenter à 500ms.

4. **`invalidateSize()` est-il appelé ?**
   Après l'init de la carte ET après l'ajout des markers, appeler `obsMap.invalidateSize()`.

5. **Le conteneur `#obs-map` a-t-il une hauteur ?**
   ```js
   document.getElementById('obs-map')?.getBoundingClientRect()
   // height doit être > 0 (au moins 220px)
   ```

6. **Si aucune donnée serveur** (backend pas encore alimenté) → afficher un message "Aucune observation pour le moment" au lieu d'une carte vide. Et/ou injecter 3-5 observations de démonstration pour le test.

**Test :** Ouvrir l'observatoire → carte visible avec au moins les points de démo. Si backend alimenté → marqueurs colorés par type d'événement.

### 0E — Wiki : métadonnées indésirables sous le titre

**Problème :** Sous le titre de chaque article wiki, on voit "Rév. par tristan.peyrotty@gmail.com · 01/04/2026 · 0 vues". Ce n'est pas ce qui était demandé.

**Correction :**
1. **Supprimer** la ligne de métadonnées (email, date, vues) sous le titre de l'article en vue lecture
2. Le titre doit être suivi **directement** par le contenu de l'article
3. Les métadonnées de révision (auteur, date) ne doivent apparaître que dans la **vue Historique** (pas dans la vue lecture)
4. L'email de l'auteur ne doit **jamais** être affiché en clair — afficher "Vous" si c'est l'utilisateur courant, ou un pseudonyme/initiales sinon
5. Le compteur de vues "0 vues" n'a aucune utilité dans une app offline-first — le supprimer complètement

**Layout cible en vue lecture :**
```
┌─────────────────────────────────────────────┐
│ Citrus sinensis            [📝 Modifier] [🕐]│
├─────────────────────────────────────────────┤
│ L'oranger doux (Citrus sinensis) est...     │
│ ...contenu de l'article...                  │
│                                              │
│ ── Notes et références ─────────────────────│
│ [1] Bain J.M. (1958)...                     │
└─────────────────────────────────────────────┘
```

Pas de ligne de métadonnées entre le titre et le contenu.

**Test :** Ouvrir un article wiki → le contenu commence immédiatement sous le titre, sans email/date/vues.

### Validation Phase 0

**Chaque correction doit être testée visuellement.** Ne pas passer à la Phase 1 tant que les 5 points ne sont pas fonctionnels :
- [ ] 0A : Météo sans prompt géoloc + bouton discret pour changer
- [ ] 0B : FAB bug draggable sur mobile et desktop, position persistée
- [ ] 0C : Widget BBCH visible sur dashboard + onglet phéno sur fiche plante
- [ ] 0D : Marqueurs observatoire visibles sur la carte
- [ ] 0E : Pas de métadonnées sous le titre des articles wiki

```bash
node --check
npm run build
npm run dev  # → tester manuellement chaque point
```

---

## PHASE 1 — Audit complet des helpBtn existants

### Étape 1A — Inventaire

Exécuter ce scan :

```bash
# 1. Lister toutes les clés HELP_CONTENT définies
grep -oP "^\s*\K[a-z_]+(?=:\s*\{)" public/index.html | sort -u > /tmp/help_keys_defined.txt

# 2. Lister tous les helpBtn() appelés dans le code
grep -oP "helpBtn\('\K[^']*" public/index.html | sort -u > /tmp/help_keys_called.txt

# 3. Trouver les clés appelées mais non définies (orphelins)
comm -23 /tmp/help_keys_called.txt /tmp/help_keys_defined.txt

# 4. Trouver les clés définies mais jamais appelées (mortes)
comm -13 /tmp/help_keys_called.txt /tmp/help_keys_defined.txt

# 5. Lister tous les secttl / section headers SANS helpBtn
grep -n "secttl\|section-title\|nv-hdr-title" public/index.html | grep -v "helpBtn" | head -50
```

### Étape 1B — Corrections

Pour chaque résultat :
- **Clé appelée mais non définie** → créer l'entrée dans `HELP_CONTENT` (FR + EN minimum, les 3 autres langues en fallback EN)
- **Clé définie mais jamais appelée** → supprimer de `HELP_CONTENT` (code mort)
- **Section sans helpBtn** → ajouter `helpBtn('clé')` à côté du titre de section

### Règle de placement des helpBtn

Le `helpBtn('clé')` doit apparaître :
- À droite du titre de chaque section/module (`secttl`, `nv-hdr-title`)
- À droite du titre de chaque modal/formulaire complexe
- À côté de chaque indicateur technique nécessitant explication (GJC, IFT, ETP, BBCH, etc.)
- **Jamais** dans un élément avec `text-align:center` ou hauteur fixe (cause des débordements)

---

## PHASE 2 — Rédaction exhaustive du HELP_CONTENT

### Structure d'une entrée

```js
HELP_CONTENT['clé'] = {
  fr: {
    title: '🔧 Titre de la fonctionnalité',
    anchor: 'section-aide',  // ancre dans aide.html
    body: `
      <p>Description claire de ce que fait cette fonctionnalité.</p>
      <h3>Comment l'utiliser</h3>
      <p>Étapes pas à pas.</p>
      <h3>Configuration</h3>
      <p>Paramètres disponibles et leur effet.</p>
      <div class="tip">💡 Astuce ou bonne pratique.</div>
    `
  },
  en: {
    title: '🔧 Feature title',
    anchor: 'help-section',
    body: `<p>English translation...</p>`
  }
  // it, es, pt : si absents, fallback sur en
};
```

### Liste exhaustive des entrées à rédiger/compléter

Couvrir **chaque fonctionnalité** de l'app. Voici la liste complète organisée par page/module. Pour chaque entrée, rédiger un contenu FR détaillé (3-10 paragraphes) et un contenu EN condensé. Le contenu doit expliquer **quoi**, **comment**, et **pourquoi** — pas juste un titre.

#### Dashboard
| Clé | Sujet |
|-----|-------|
| `dashboard` | Le tableau de bord : widgets, adaptation par profil, données affichées |
| `meteo` | Météo locale : source Open-Meteo, prévisions 7j, alerte gel, fiabilité |
| `gjc` | Degrés-Jours de Croissance : calcul, base 10°C, interprétation, lien phénologie |
| `season_banner` | Bannière saisonnière : détection automatique, tâches recommandées |

#### Collection
| Clé | Sujet |
|-----|-------|
| `collection` | La collection : ajout de sujet, recherche, filtres, vues (liste/verger/wishlist) |
| `fiche_plante` | La fiche sujet : tous les champs, comment les remplir, onglets |
| `identification` | Identification botanique : espèce, variété, déterminations versionnées (F4), confiance |
| `provenance` | Origine et provenance : type (achat/don/semis...), mode, détail (F3) |
| `emplacement` | Emplacement structuré : zone, section, position, GPS (F9) |
| `accession_id` | Identifiant d'accession CCA-YYYY-NNNN : format, usage, export |
| `date_precision` | Précision de date : jour exact, mois, année, inconnue (F2) |
| `filtres` | Filtres avancés : champs, opérateurs, sauvegarde de filtres (F5) |
| `export_xlsx` | Export Excel : colonnes, filtres appliqués, format (F6) |
| `photos` | Galerie photos : ajout, légendes, multi-vues |
| `lecture_seule` | Mode lecture seule : activation, effet sur l'interface (F10) |

#### Événements & Calendrier
| Clé | Sujet |
|-----|-------|
| `evenements` | Les événements : types disponibles, ajout, modification, suppression |
| `calendrier` | Le calendrier : vue mensuelle, navigation, icônes par type, filtrage |
| `gel` | Dégâts de gel : constat, alerte quotidienne, sujets sortis à rentrer |

#### Phénologie BBCH
| Clé | Sujet |
|-----|-------|
| `phenologie` | Module phénologie BBCH : échelle, 8 stades principaux, 33 codes secondaires, source scientifique (Agustí et al. 1997) |
| `bbch_bar` | Barre phénologique : lecture, clic pour détail, sous-stades, stade courant |
| `bbch_actions` | Actions recommandées par stade : fertilisation, taille, irrigation |
| `bbch_regulators` | Régulateurs de croissance : gibbérellines, auxines, éthylène — quand et pourquoi |
| `bbch_gantt` | Calendrier phénologique Gantt : lecture, estimation, trait "aujourd'hui" |

#### Fertilisation & Sol
| Clé | Sujet |
|-----|-------|
| `fertilisation` | Plan de fertilisation : NPK, amendements, calcul automatique |
| `epandage` | Épandage : enregistrement, doses, surface, calendrier |
| `substrats` | Substrats : composition, mélanges personnalisés |

#### Arrosage & Irrigation
| Clé | Sujet |
|-----|-------|
| `arrosage` | Urgence d'arrosage : calcul, indicateurs, seuils |
| `eau` | Qualité de l'eau : relevés pH/EC, historique |
| `irrigation` | Bilan hydrique : ETP, ETc, RU, déficit, recommandation |
| `etp` | ETP Penman-Monteith / Hargreaves-Samani : explication scientifique, sources |
| `drip` | Goutte-à-goutte : circuits d'irrigation partagés, calcul durée, sur-arrosage |

#### Phytosanitaire
| Clé | Sujet |
|-----|-------|
| `phyto` | Registre phytosanitaire : AMM, dose, DAR, surface, opérateur |
| `ift` | IFT (Indicateur de Fréquence de Traitement) : calcul, seuils, interprétation |
| `diagnostic` | Diagnostic IA : description des symptômes, résultats, fiabilité |
| `ppf` | Produits phytopharmaceutiques : recherche, homologation |

#### Greffage & Pépinière
| Clé | Sujet |
|-----|-------|
| `greffes` | Registre de greffage : types, suivi reprise, alertes |
| `boutures` | Suivi des boutures : lien au sujet source, étapes, taux de reprise |
| `pepiniere` | Module pépinière : semis, catalogue, commandes, clients |
| `pepiniere_dashboard` | Dashboard pépinière : KPIs, CA, stocks |
| `pepiniere_planning` | Planning pépinière : tâches, échéances |
| `pepiniere_clients` | CRM clients : fiches, historique commandes |
| `pepiniere_rentabilite` | Rentabilité pépinière : marge par variété, coût de revient |
| `catalogue_export` | Export catalogue pépinière JSON/CSV (F7) |

#### Module économique
| Clé | Sujet |
|-----|-------|
| `economie` | Module économique : charges, produits, marge par sujet |
| `eco_tendances` | Tendances P&L : multi-années, graphes, bilan carbone |
| `stocks` | Stocks d'intrants : ajout, consommation, seuils d'alerte |
| `lots` | Lots commerciaux : traçabilité, passeport phytosanitaire QR |
| `workflows` | Workflows inter-modules : greffe→catalogue, récolte→calendrier, stock→achats (F8) |
| `shopping` | Liste d'achats : ajout depuis stocks bas, gestion |

#### Conservatoire
| Clé | Sujet |
|-----|-------|
| `conservatoire` | Espace conservatoire : accessions, échanges, taxonomie, export BGCI |
| `wishlist` | Wishlist : espèces souhaitées, priorité, suivi d'acquisition |
| `etiquettes` | Étiquettes muséales PDF : QR codes, format, impression |
| `bgci` | Export BGCI PlantSearch : format CSV, colonnes, compatibilité |
| `taxonomie` | Vue taxonomique : arbre Famille→Genre→Espèce, navigation |

#### IoT & Capteurs
| Clé | Sujet |
|-----|-------|
| `iot` | Capteurs IoT : configuration, polling HTTP/JSON, seuils, alertes |

#### Wiki
| Clé | Sujet |
|-----|-------|
| `wiki` | Citrus Wiki : navigation, catégories, création/édition d'articles, historique |

#### Observatoire
| Clé | Sujet |
|-----|-------|
| `observatoire` | Observatoire CitrusCodex : carte, statistiques saison/année, journal, opt-in |

#### Profil & Réglages
| Clé | Sujet |
|-----|-------|
| `profil` | Profil utilisateur : type de profil (verrouillé), informations, champs métier |
| `sync` | Synchronisation : Gist GitHub, chiffrement AES, multi-appareils |
| `notifications` | Notifications push : types, fréquence, configuration |
| `historique` | Historique global : chronologie complète de la collection |
| `dark_mode` | Mode sombre : activation, compatibilité |

#### Signalement
| Clé | Sujet |
|-----|-------|
| `bug_report` | Signaler un problème : bouton flottant, formulaire, suivi |

#### Admin (si admin)
| Clé | Sujet |
|-----|-------|
| `admin_users` | Gestion des utilisateurs : profils, rôles, invitations beta |
| `admin_bugs` | Gestion des bugs : statuts, résolution, notes |

#### Technique / Général
| Clé | Sujet |
|-----|-------|
| `dashboard_adaptatif` | Dashboard adaptatif : 4 profils, composants partagés, personnalisation |
| `hve` | Certification HVE : checklist, échéances |
| `saisonniers` | Tâches saisonnières : recommandations par période |
| `yieldmapping` | Prévision de récolte : yield mapping par parcelle |

### Contenu — Règles de rédaction

Pour **chaque** entrée FR :
1. **Paragraphe d'introduction** : ce que fait la fonctionnalité, à qui elle s'adresse
2. **Section "Comment l'utiliser"** : étapes pas à pas, claires, avec les noms des boutons/menus
3. **Section "Configuration"** (si applicable) : paramètres, valeurs par défaut, où les modifier
4. **Section "Astuces"** : tips, bonnes pratiques, pièges à éviter
5. **Encadré `<div class="tip">💡 ...</div>`** pour les conseils importants

Ton : professionnel mais accessible. Un utilisateur non-technique doit comprendre. Utiliser "vous" (vouvoiement).

Pour **chaque** entrée EN : version condensée (1-2 paragraphes) couvrant l'essentiel.

---

## PHASE 3 — Fichier aide.html complet

### Structure

Le fichier `aide.html` (ou `public/aide.html`) est la documentation complète de l'app. Il doit contenir :

1. **Table des matières** avec liens ancres vers chaque section
2. **Une section par clé HELP_CONTENT** avec l'ancre correspondante (`id="nom-section"`)
3. **Captures d'écran / schémas** : pas d'images réelles (pas de dépendances), mais des descriptions ASCII ou des tableaux explicatifs
4. **FAQ** en fin de document

### Mapping ancres

Chaque `HELP_CONTENT[clé].fr.anchor` doit correspondre à un `id` dans aide.html. Vérifier la cohérence de tous les liens.

### Sections obligatoires dans aide.html

```
1. Premiers pas
   - Création de compte / connexion
   - Choix du profil (explication des 4 profils)
   - Premier sujet ajouté

2. Tableau de bord
   - [dashboard] [meteo] [gjc] [season_banner]

3. Ma collection
   - [collection] [fiche_plante] [identification] [provenance]
   - [emplacement] [accession_id] [date_precision]
   - [filtres] [export_xlsx] [photos] [lecture_seule]

4. Événements & Calendrier
   - [evenements] [calendrier] [gel]

5. Phénologie
   - [phenologie] [bbch_bar] [bbch_actions] [bbch_regulators] [bbch_gantt]

6. Fertilisation & Sol
   - [fertilisation] [epandage] [substrats]

7. Arrosage & Irrigation
   - [arrosage] [eau] [irrigation] [etp] [drip]

8. Phytosanitaire
   - [phyto] [ift] [diagnostic] [ppf]

9. Greffage & Pépinière
   - [greffes] [boutures] [pepiniere] [pepiniere_dashboard]
   - [pepiniere_planning] [pepiniere_clients] [pepiniere_rentabilite]
   - [catalogue_export]

10. Module économique
    - [economie] [eco_tendances] [stocks] [lots] [workflows] [shopping]

11. Conservatoire
    - [conservatoire] [wishlist] [etiquettes] [bgci] [taxonomie]

12. IoT & Capteurs
    - [iot]

13. Wiki & Observatoire
    - [wiki] [observatoire]

14. Profil & Réglages
    - [profil] [sync] [notifications] [historique] [dark_mode]

15. Signalement & Support
    - [bug_report]

16. Administration (si admin)
    - [admin_users] [admin_bugs]

17. FAQ
```

---

## PHASE 4 — Validation

### Tests

```bash
node --check public/index.html  # ou extraction JS
npm run build
```

1. **Audit systématique** : pour chaque `helpBtn('x')` dans le code, vérifier que :
   - `HELP_CONTENT['x']` existe avec au moins `fr` et `en`
   - `HELP_CONTENT['x'].fr.anchor` pointe vers un `id` existant dans aide.html
   - Le contenu FR fait au moins 3 paragraphes (pas juste un titre)

2. **Audit inverse** : pour chaque section dans aide.html, vérifier qu'un `helpBtn` y renvoie

3. **Visuellement** :
   - Cliquer sur chaque `?` → la modale s'ouvre avec le bon contenu
   - Le lien "Voir le guide complet" ouvre aide.html à la bonne ancre
   - Changer la langue → les titres se mettent à jour

### Compteurs attendus

Après complétion :
- `HELP_CONTENT` : **~60 clés** minimum
- `helpBtn()` dans le code : **~60 appels** (1 par section/module)
- `aide.html` : **~17 sections** avec sous-sections

---

## Livrable

- `public/index.html` modifié (HELP_CONTENT complet + helpBtn placés)
- `public/aide.html` réécrit (guide exhaustif)
- `README.md` mis à jour (changelog)
- Rapport d'audit : liste des clés ajoutées, orphelins corrigés, helpBtn positionnés
