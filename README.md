# 🍊 Carnet de Collection Agrumes

**Application web progressive (PWA) · Fichier unique autonome · Aucune installation**

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Tutoriel — première utilisation](#2-tutoriel--première-utilisation)
3. [Architecture technique](#3-architecture-technique)
4. [Modules détaillés](#4-modules-détaillés)
   - 4.1 [Authentification & sécurité](#41-authentification--sécurité)
   - 4.2 [Tableau de bord](#42-tableau-de-bord)
   - 4.3 [Module météo](#43-module-météo)
   - 4.4 [Jauges d'arrosage](#44-jauges-darrosage)
   - 4.5 [Jauges de fertilisation NPK](#45-jauges-de-fertilisation-npk)
   - 4.6 [Alerte gel](#46-alerte-gel)
   - 4.7 [Phase lunaire](#47-phase-lunaire)
   - 4.8 [Collection — vue liste](#48-collection--vue-liste)
   - 4.9 [Emplacements — plan interactif](#49-emplacements--plan-interactif)
   - 4.10 [Fiche sujet](#410-fiche-sujet)
   - 4.11 [Événements & journal de culture](#411-événements--journal-de-culture)
   - 4.12 [Historiques spécialisés](#412-historiques-spécialisés)
   - 4.13 [Scanner passeport phytosanitaire](#413-scanner-passeport-phytosanitaire)
   - 4.14 [Recherche botanique GBIF](#414-recherche-botanique-gbif)
   - 4.15 [Onglet Calendrier](#415-onglet-calendrier)
   - 4.16 [Profils d'engrais & amendements](#416-profils-dengrais--amendements)
   - 4.17 [Profil utilisateur](#417-profil-utilisateur)
   - 4.18 [Historique global](#418-historique-global)
   - 4.19 [Export / Import JSON](#419-export--import-json)
   - 4.20 [Infographies](#420-infographies)
   - 4.21 [Notifications push locales](#421-notifications-push-locales)
   - 4.22 [Export PDF](#422-export-pdf)
   - 4.23 [Registre phytosanitaire](#423-registre-phytosanitaire)
   - 4.24 [Stocks d'intrants](#424-stocks-dintrants)
   - 4.25 [Module économique](#425-module-économique)
   - 4.26 [Lots de récolte](#426-lots-de-récolte)
   - 4.27 [ETP — Évapotranspiration](#427-etp--évapotranspiration)
   - 4.28 [Équipe & tâches](#428-équipe--tâches)
   - 4.29 [Pépinière](#429-pépinière)
   - 4.30 [Capteurs IoT](#430-capteurs-iot)
5. [Référence des données](#5-référence-des-données)
6. [FAQ & dépannage](#6-faq--dépannage)
7. [Historique des versions](#7-historique-des-versions)
8. [Crédits & sources scientifiques](#8-crédits--sources-scientifiques)

---

## 1. Présentation

**Carnet de Collection Agrumes** est une application web progressive conçue pour les collectionneurs, arboriculteurs et botanistes spécialisés dans les *Citrus* et agrumes apparentés. Elle fonctionne entièrement dans un navigateur, sans serveur ni compte en ligne requis.

### Caractéristiques principales

- **Fichier unique** `index.html` (~774 Ko) — copiez-le sur votre appareil, ouvrez-le dans Chrome, Safari ou Firefox, et c'est prêt.
- **Données 100 % locales** — tout est stocké dans le `localStorage` du navigateur. Rien n'est envoyé vers un serveur tiers, sauf les photos optionnelles vers un dépôt GitHub configuré par l'utilisateur.
- **Compatible smartphone** — interface mobile-first, touch-optimisée.
- **8 sujets pré-chargés** avec nomenclature scientifique complète (*Citrus × bizarria*, *Citrus hystrix*, *Fortunella* spp., *Poncirus trifoliata*, etc.)
- **~355 fonctions JavaScript** couvrant la météo, la botanique, la cartographie, la nutrition végétale et la phénologie lunaire.
- **Aucune dépendance externe obligatoire** hormis Leaflet (CDN, chargé uniquement dans la vue Emplacements) et les polices Google Fonts.

---


## 2. Tutoriel — première utilisation

### Étape 1 — Ouvrir l'application

1. Téléchargez `index.html` sur votre appareil.
2. Ouvrez le fichier dans **Chrome** (recommandé), Firefox ou Safari. Sur smartphone, ajoutez-le à votre écran d'accueil pour l'expérience PWA complète.
3. L'assistant de configuration se lance automatiquement à la première ouverture.

### Étape 2 — Assistant de configuration (4 étapes)

L'assistant ne se lance qu'une seule fois. Il configure votre profil et sécurise l'accès.

**Étape 1 — Profil**
Renseignez votre prénom, votre localisation et une courte description (facultatif). Ces informations apparaissent dans l'en-tête de l'application et dans les exports.

**Étape 2 — Mot de passe**
Choisissez un mot de passe d'au moins 6 caractères. Il est haché en SHA-256 et stocké localement — Anthropic et aucun tiers n'y ont accès. Ce mot de passe verrouille l'application à chaque fermeture de l'onglet.

> ⚠️ **Notez bien votre mot de passe.** En cas d'oubli, utilisez le lien « Mot de passe oublié » depuis l'écran de connexion. Si vous avez renseigné un e-mail de récupération (étape 1), il vous sera demandé pour confirmer votre identité. Vos données de collection sont intégralement conservées dans tous les cas.

**Étape 3 — GitHub (facultatif)**
Configurez un dépôt GitHub pour héberger vos photos. Touchez **→ Passer cette étape** pour ignorer — l'application est pleinement fonctionnelle sans GitHub. Les photos peuvent être ajoutées à tout moment depuis les fiches sujets.

Pour configurer :
- Créez un dépôt public ou privé sur [github.com](https://github.com) (ex. `monpseudo/carnet-agrumes`)
- Générez un token d'accès personnel (*Settings → Developer settings → Personal access tokens → Fine-grained*) avec les permissions `Contents: Read & Write` sur ce dépôt
- Renseignez le token, votre nom d'utilisateur et le nom du dépôt

**Étape 4 — Confirmation**
Vérifiez le récapitulatif et cliquez sur **Ouvrir mon carnet 🍊**.

---

### Étape 3 — Découvrir le tableau de bord

Le tableau de bord est l'écran d'accueil. Il affiche :

- **Bannière saisonnière** — conseils culturaux adaptés à la saison (hivernage, réveil printanier, pleine saison, préparation hivernage)
- **Module météo** — conditions actuelles, lever/coucher du soleil, phase lunaire, vent, hygrométrie, prévisions 7 jours
- **Alerte gel** — configurable, s'active si la T° minimale prévue dépasse votre seuil
- **Jauges d'arrosage** — état en temps réel pour chaque sujet
- **Jauges de fertilisation NPK** — apports vs cibles annuelles (s'affichent après saisie des données)
- **Points d'attention** — sujets à statut dégradé ou arrosage dépassé
- **Derniers événements** — fil des 6 derniers actes de culture

---

### Étape 4 — Explorer la collection

1. Touchez l'onglet **🍋 Collection** dans la barre de navigation en bas.
2. Les cartes préchargées s'affichent. Chaque carte résume l'espèce, le nom, la variété, l'emplacement, le statut sanitaire, le délai d'arrosage et le dernier relevé de température.
3. Touchez une carte pour ouvrir la **fiche sujet** complète.

---

### Étape 5 — Modifier une fiche sujet

Dans une fiche, vous pouvez :

1. Modifier le nom, l'espèce (avec recherche GBIF en temps réel), la variété, le porte-greffe, la taille de pot, la hauteur, le diamètre de couronne, l'exposition, l'emplacement, le statut, les notes.
2. Scanner le passeport phytosanitaire UE (code-barres) pour pré-remplir les champs botaniques.
3. Ajouter des photos (si GitHub est configuré).
4. Touchez **💾 Enregistrer la fiche** — la fiche se ferme et vous revenez à la liste de la collection. L'audit trail enregistre automatiquement les modifications détectées.

---

### Étape 6 — Enregistrer un événement cultural

1. Depuis la fiche d'un sujet, touchez **+ Consigner un événement**.
2. Choisissez le type d'événement parmi les 12 types disponibles.
3. Renseignez la date, la description, et les champs spécifiques au type.
4. Validez — l'événement s'ajoute au journal de culture et les indicateurs du tableau de bord se mettent à jour.

---

### Étape 7 — Ajouter un nouveau sujet

1. Touchez l'onglet **🍋 Collection** puis le bouton **＋** en haut à droite.
2. Renseignez le nom, l'espèce (tapez les premières lettres pour activer la suggestion GBIF ou choisir dans la base locale de cultivars), la variété, le porte-greffe, le mode de culture (pot ou pleine terre).
3. Selon le mode, des champs contextuels s'affichent (Ø du pot, diamètre de couronne, exposition, sol…).
4. Touchez **Ajouter à la collection**.

---

### Étape 8 — Configurer la météo

La météo se configure automatiquement si vous autorisez la géolocalisation. Sinon :

1. Sur le tableau de bord, touchez la zone météo.
2. Entrez le nom d'une ville dans le champ de recherche.
3. La météo se charge depuis Open-Meteo (gratuit, sans clé API).

---

### Étape 9 — Créer le plan des emplacements

1. Touchez **🍋 Collection** puis l'onglet **📍 Emplacements**.
2. Choisissez le mode : **🗺 Par localisation sur la carte** (parcelle cadastrale IGN) ou **✏ Par dessin sur le plan** (plan libre sans carte).
3. **Mode carte** : appuyez sur **🏚 Cadastre**, centrez le réticule ⊕ sur votre parcelle, appuyez à nouveau pour identifier la parcelle IGN, confirmez avec **✓ Appliquer**.
4. **Mode dessin** : appuyez sur **✏ Tracer** dans la barre d'outils, touchez le plan pour ajouter des points, touchez ⊕ ou double-tapez pour fermer le périmètre.
5. Passez en mode **✏ Modifier**, faites glisser vos sujets depuis la palette vers le plan.
6. Touchez **💾 Enreg.** pour sauvegarder et revenir en vue lecture.
7. Touchez **📥 Télécharger** pour exporter un document HTML imprimable avec plan numéroté, légende et historique des interventions.

---

### Étape 10 — Sauvegarder vos données

Vos données sont **sauvegardées automatiquement** à chaque action (ajout d'événement, modification de fiche, etc.). Pour une sauvegarde externe :

1. Touchez l'onglet **🌿 Profil**.
2. Dans l'onglet **🌿 Profil**, touchez **⬇ Exporter JSON**.
3. Un fichier `agrumes-collection-YYYY-MM-DD.json` est téléchargé — conservez-le précieusement.

---

## 3. Architecture technique

| Composant | Détail |
|---|---|
| Type | Application web monopage (SPA) · PWA |
| Fichier | `index.html` (~1,1 Mo, ~17 539 lignes) |
| Langage | HTML5 + CSS3 + JavaScript ES2022 (vanilla) |
| Stockage | `localStorage` — 11 clés (voir tableau ci-dessous) |
| Authentification | Hachage SHA-256 (WebCrypto API), token GitHub chiffré XOR avec dérivé du hash |
| Internationalisation | Objet `LANGS` (5 langues), `getLd()`, `T(path)`, `initI18n()` |
| Météo | [Open-Meteo](https://open-meteo.com) — gratuit, sans clé, résolution 1 km |
| Cartographie | [Leaflet 1.9.4](https://leafletjs.com) (CDN) + IGN Géoplateforme (satellite, cadastre) + OpenStreetMap |
| Cadastre | API Carto IGN — `apicarto.ign.fr/api/cadastre/parcelle` |
| Botaniques | [GBIF API](https://api.gbif.org) — `species/suggest` |
| Phase lunaire | Algorithme astronomique local (période synodique 29,530 59 j, lune de référence 2000-01-06) |
| Photos | GitHub REST API v3 (optionnel, token utilisateur) |
| Polices | Google Fonts — Playfair Display, EB Garamond, JetBrains Mono |

### Clés `localStorage`

| Clé | Contenu |
|---|---|
| `agrumes_v5` | Tableau JSON de tous les sujets (plantes, événements, photos, coords GPS, histTemps) |
| `agrumes_cfg` | Configuration utilisateur (hash mdp, token GitHub obfusqué, e-mail de récupération, profil) |
| `agrumes_fertilizers` | Profils d'engrais personnalisés |
| `agrumes_amendments` | Profils d'amendements personnalisés |
| `agrumes_verger` | Plan du verger (boundary, networks, networkLabels) |
| `agrumes_eco` | Entrées économiques (charges, produits par saison) |
| `agrumes_stocks` | Stocks d'intrants avec mouvements |
| `agrumes_lots` | Lots de récolte et passeports phytosanitaires |
| `agrumes_iot_v1` | Lectures capteurs IoT (par sonde) |
| `agrumes_nursery` | Pépinière — semis, catalogue, commandes |
| `agrumes_team` | Équipe — opérateurs et tâches planifiées |

### Sécurité du token GitHub

Le token GitHub n'est **jamais stocké en clair**. Il est chiffré avec un opérateur XOR dont la clé est dérivée des 16 premiers octets du hash SHA-256 du mot de passe utilisateur. Si le mot de passe change, le token est re-chiffré à la volée.

---

## 4. Modules détaillés

### 4.1 Authentification & sécurité

**Fonctions concernées :** `submitLogin`, `startSetup`, `nsStep`, `finalSetup`, `savePwd`, `saveGH`, `openChgPwd`, `openEditGH`, `resetAll`, `sha256`, `obf`, `dob`, `getToken`, `getCfg`, `setCfg`

**Fonctionnement :**

À chaque ouverture de l'application, le code vérifie si un hash de mot de passe est présent dans `agrumes_cfg`. Si oui, l'écran de connexion s'affiche. Sinon, l'assistant de configuration est lancé.

La vérification du mot de passe compare le hash SHA-256 saisi avec celui stocké. En cas de succès, les données sont chargées via `loadData()` et l'interface principale est initialisée.

**GitHub facultatif :** L'étape 2 de l'assistant est entièrement optionnelle. Touchez *→ Passer cette étape* pour ignorer. L'application fonctionne sans GitHub — les photos ne sont simplement pas disponibles. À configurer ultérieurement : Profil → 🔒 Sécurité → *Modifier token / dépôt GitHub*.

**E-mail de récupération :** Saisissez une adresse e-mail à l'étape 1 de l'assistant (ou dans Profil → 🌿 Profil). En cas de mot de passe oublié, cet e-mail est demandé pour confirmer votre identité avant réinitialisation. Aucun message n'est jamais envoyé — l'e-mail est utilisé uniquement comme question de sécurité locale.

**Changer le mot de passe :** Profil → 🔒 Sécurité → *Changer le mot de passe*. L'ancien mot de passe est requis. Le token GitHub est re-chiffré automatiquement s'il est configuré. Sans token, le changement fonctionne normalement.

**Verrouiller :** Logo 🍊 ne verrouille pas (retour tableau de bord). Le bouton 🔒 Verrouiller dans le Profil ferme la session.

---

### 4.2 Tableau de bord

**Fonction :** `renderDash`, `getSz`

**Fonctionnement :**

La bannière saisonnière (`getSz`) retourne les conseils culturaux adaptés au mois courant, séparément pour les pots et la pleine terre. Le tableau de bord agrège en temps réel les statistiques de la collection (nombre de sujets, états sanitaires, urgences) et appelle les modules météo, jauges, alertes.

---

### 4.3 Module météo

**Fonctions :** `initWeather`, `fetchWeather`, `searchCity`, `updateWxWidget`, `renderWxInner`, `wmoInfo`, `dayName`

**Fonctionnement :**

Au chargement de l'application, `initWeather` vérifie le cache sessionStorage (TTL 1 heure). Si le cache est périmé ou absent, la géolocalisation du navigateur est demandée. En cas de refus, un champ de saisie de ville est affiché.

La requête Open-Meteo récupère en une seule requête :
- `current_weather` — température et conditions actuelles
- `hourly` — température, probabilité de pluie, code météo, vent (vitesse/direction/rafales), hygrométrie — sur 7 jours
- `daily` — min/max, lever/coucher du soleil, vent max/dominant, précipitations — sur 7 jours

**Données affichées :**
- Date du jour, conditions actuelles, min/max
- Lever 🌅 et coucher 🌇 du soleil, durée du jour calculée
- Phase lunaire (algorithme local)
- Vent : vitesse km/h (moyenne heure courante + 2h), direction, Beaufort, rafales, direction dominante journalière
- Hygrométrie : taux actuel, niveau de confort, barre de progression, histogramme 6 prochaines heures
- Bandes horaires (13h glissantes) et prévisions hebdomadaires

**Note technique sur le vent :** Les données `hourly.windspeed_10m` sont utilisées (interpolées à la localisation exacte) plutôt que `current_weather.windspeed` (grille synoptique plus grossière).

**Mise à jour manuelle :** Touchez ↺ dans le bandeau météo.

**Changer de ville :** Touchez 📍 dans le bandeau.

---

### 4.4 Jauges d'arrosage

**Fonctions :** `renderWateringGauges`, `getWateringUrgency`

**Seuils de base :**
- Pot intérieur : 7 j (OK) / 14 j (bientôt) / 21 j (urgent)
- Pot extérieur : 5 j / 10 j / 18 j
- Pleine terre : 14 j / 21 j / 35 j

**Multiplicateurs appliqués :**

| Facteur | Plage | Multiplicateur |
|---|---|---|
| Pot < 18 cm | — | × 0,50 |
| Pot 18–24 cm | — | × 0,65 |
| Pot 25–34 cm | — | × 0,80 |
| Pot 35–47 cm (réf.) | — | × 1,00 |
| Pot 48–61 cm | — | × 1,25 |
| Pot ≥ 62 cm | — | × 1,50 |
| Plein soleil | — | × 0,72 |
| Mi-ombre | — | × 1,00 |
| Ombre | — | × 1,35 |
| Gel (< 5 °C) | extérieur | × 3,0 |
| Frais (5–11 °C) | extérieur | × 2,0 |
| Chaud (20–27 °C) | extérieur | × 0,75 |
| Canicule (≥ 28 °C) | extérieur | × 0,55 |

**Déduction pluie :** −3 j si proba ≥ 70 %, −1,5 j si ≥ 40 %, −0,5 j si ≥ 15 %.

Les plantes en intérieur/orangerie n'ont pas de correction météo.

---

### 4.5 Jauges de fertilisation NPK

**Fonctions :** `renderFertGauges`, `annualNPK`, `sumAppliedNPK`, `seasonFactor`, `weatherFactor`

**Condition d'affichage :** Au moins un événement fertilisation avec **poids en grammes ET profil NPK** sélectionné dans les 12 derniers mois.

**Cibles annuelles (source INRAE) :**

| Mode | N | P | K | Ca | Mg |
|---|---|---|---|---|---|
| Pot < 25 cm | 10 g | 3 g | 10 g | 4 g | 1,5 g |
| Pot 25–39 cm | 18 g | 6 g | 18 g | 8 g | 3 g |
| Pot 40–54 cm | 28 g | 9 g | 28 g | 12 g | 4 g |
| Pot ≥ 55 cm | 40 g | 13 g | 40 g | 18 g | 6 g |
| Pleine terre | 80 g | 25 g | 80 g | 30 g | 10 g |

**Corrections météo :** T° > 25 °C → cible N × 1,15 ; précipitations > 10 mm → cible K × 1,10 (lessivage).

**Calcul :** `g_élément = poids_apporté × composition% / 100`

---

### 4.6 Alerte gel

**Fonctions :** `getGelAlert`, `setGelAlert`, `toggleGelAlert`, `setGelThreshold`

**Utilisation :** Tableau de bord → carte *Alerte gel* → toggle on/off + curseur de seuil (−5 °C à +5 °C, pas 0,5 °C).

**Deux niveaux :**
- Bandeau **bleu nuit** : T° minimale prévue demain ≤ seuil
- Bandeau **rouge** : T° minimale prévue aujourd'hui ≤ seuil

Le seuil et l'activation sont persistés dans `getCfg()`.

---

### 4.7 Phase lunaire

**Fonction :** `lunarPhase`

**Algorithme :** Période synodique de 29,530 59 jours, lune de référence du 6 janvier 2000 à 18h14 UTC. L'âge de la lune est calculé par modulo de l'intervalle écoulé sur la période synodique.

**Données retournées :** icône, label de phase, conseil cultural, jour dans le cycle, pourcentage d'illumination (formule cosinus), indicateur croissant/décroissant, prochaine phase clé avec nombre de jours.

**Rendu :** Disque SVG avec portion illuminée calculée dynamiquement + barre de cycle 29 cases + conseil cultural spécifique.

**Précision :** ± 1 heure sur les phases principales. Suffisant pour les conseils culturaux.

---

### 4.8 Collection — vue liste

**Fonctions :** `renderColl`, `filtered`, `rGrid`, `rCard`

Chaque carte (`rCard`) affiche : barre d'accent colorée (pot/terre), photo si disponible, badge mode de culture, espèce en italique, nom, variété, tags contextuels (Ø pot, sol, emplacement, photos, porte-greffe, ensoleillement), et une barre de métriques à 3 colonnes (statut sanitaire, délai d'arrosage coloré, dernière température ou dernier événement).

**Filtres :** mode de culture (pot/terre/tous) + statut sanitaire. Barre de recherche full-text (nom + espèce + variété).

**Chips statistiques :** total sujets, en pot, en pleine terre, dehors (si > 0), urgent à arroser (si > 0).

**Mode sélection :** Bouton ☑ en haut à droite pour sélectionner plusieurs sujets et appliquer une action collective (fertilisation, hivernage/sortie, arrosage, traitement…).

---

### 4.9 Emplacements — plan interactif

**Fonctions clés :** `renderVergerPage`, `initVergerMap`, `initPlanCanvas`, `_initPlanCanvasNow`, `renderPlanSVGBase`, `renderPlanTrees`, `renderPlanPalette`, `planTreeDragStart/Move/End`, `_planPointerDown/Move/Up`, `_planWheel`, `_planZoomAt/By/Reset`, `_applyViewport`, `_svgEventToNorm`, `planSVGClick`, `_planPlantAt`, `_planMoveTreeTo`, `_planRemoveTree`, `planUndo`, `_migratePlanPositions`, `savePlanPositions`, `exportPlanAsPNG`, `projectBoundaryToCanvas`, `pointInPolygon`, `_pickParcelAtCenter`, `_pickParcelAt`, `_resolveInsee`, `_resolveAddress`, `_searchParcelByNum`, `_renderPickParcelCard`, `_pickParcelNav`, `_applyParcelCadastral`, `_createVergerFromParcelle`, `_refreshBoundary`, `_renderParcelleButtons`, `jumpToParcelle`, `setVergerMode`, `vergerGPS`, `_vergerResetPosition`, `_enterPlanViewMode`, `_enterPlanEditMode`, `_refreshPlanBottomBar`, `_enterPlanDrawMode`, `_exitPlanDrawMode`, `_togglePlanDrawMode`, `_planDrawClick`, `_renderPlanDrawOverlay`, `_applyDrawnBoundary`, `_clearPlanBoundary`, `_geojsonContainsPoint`, `_findContainingParcel`, `_geomCentroid`, `_calcSurface`

**Modes d'affichage :**

| Mode | Accès | Comportement |
|---|---|---|
| Vue | Par défaut / après 💾 | Lecture seule, arbres non interactifs, boutons Modifier + Télécharger |
| Édition | Bouton ✏ Modifier | Palette + tous les outils, sauvegarde auto sur changement d'onglet |
| Tracé | Bouton ✏ Tracer (en édition) | Dessin point par point du périmètre SVG |

**Positionnement de la carte — GPS-first :**

La carte s'initialise toujours depuis le GPS (`maximumAge:0`). La boundary stockée est dessinée ensuite, uniquement si elle est à moins de 200 km de la position GPS. Cela garantit que `vergerMap.getCenter()` retourne toujours les bonnes coordonnées pour les requêtes cadastrales.

**Identification cadastrale — 3 étapes :**

```
1. geo.api.gouv.fr/communes → code INSEE (autorité officielle Etalab, indépendant IGN)
2. nominatim.openstreetmap.org/reverse → nom de rue (timeout 3s, parallèle)
3. apicarto.ign.fr/parcelle?code_insee=XXXXX → parcelles filtrées au bon département
```

Point-in-polygon (`_geojsonContainsPoint`) identifie la parcelle sous le réticule. Tri : parcelle contenant le centre en premier, reste par distance. Auto-détection du numéro → pré-rempli dans le champ de recherche avec badge `⊕ sous le réticule`.

**Tracé manuel du périmètre (`_enterPlanDrawMode`) :**

- Si freehand existant : points rechargés en pixels SVG pour modification
- Si cadastral existant : projeté en pixels via `_planProjection.project()`, marqué freehand
- Tap sur un sommet (rayon 14px) → suppression de ce sommet
- Fermeture : tap premier point ⊕, double-tap, ou 2e pression sur ✏ (si ≥ 3 pts)
- Stockage : `boundary = [[normY, normX], ...]` avec `ap.freehand = true`
- Projection freehand : pass-through `x = lng*W, y = lat*H` (pas de géo-math)
- Étiquette "✏ plan libre" à la place de l'échelle graphique

**Bouton ⬜ Effacer (`_clearPlanBoundary`) :**

Efface la boundary ET les `planPositions[ap.id]` après confirmation utilisateur. Pushes l'ancienne boundary dans `_vergerUndoStack`.

**Export 📥 Télécharger (`exportPlanAsPNG`) :**

Génère un fichier HTML autonome en 3 sections :
- Plan SVG → canvas ×2 avec badges numérotés injectés
- Tableau légende par numéro (espèce, variété, porte-greffe, Ø couronne)
- Historique températures (30 entrées) + interventions 12 mois (fertilisation, traitement, taille)

**Sauvegarde automatique :** `jumpToParcelle` appelle `saveVergerData()+saveData()` avant de changer d'onglet. `_planPlantAt` et `planTreeDragEnd` appellent les deux fonctions à chaque modification.

**Sélecteur de mode (au-dessus de la carte) :**

| Onglet | Comportement |
|---|---|
| 🗺 Par localisation | Carte Leaflet visible (GPS + cadastre) |
| ✏ Par dessin | Carte masquée, éditeur SVG plein écran, tracé auto-activé |

Synchronisé avec le type de parcelle active. `_setVergerAddMode(mode)` pilote `planMapHidden` + destruction/reconstruction de la carte Leaflet.

**Plantes incluses :** pleine terre (`cultureType='terre'`) + pots en extérieur (`location='extérieur'`). `terrePlants` dans `renderVergerPage` et `_refreshPlanBottomBar` utilise ce filtre étendu.

**Archive du plan à la rentrée hivernage (`_archivePlanForPlant`) :**

Appelée automatiquement lors d'un événement `hivernage` pour un pot en extérieur positionné sur un plan :
1. Trouve la parcelle et la position normalisée dans `vergerData.planPositions`
2. Projette la boundary en coordonnées SVG locales (même algorithme que `renderPlanSVGBase`)
3. Génère un SVG compact (200×144 px) : périmètre vert + disque ambre proportionnel au `crownDiameter`
4. Encode en `btoa(unescape(encodeURIComponent(svg)))` → data URI stockée dans `ev.planArchive`
5. `renderHivernageHistory` affiche la vignette sous les dates de chaque saison archivée

L'archive est indépendante du plan courant (persistée dans l'événement lui-même).

**Clé localStorage :** `agrumes_verger`


### 4.10 Fiche sujet

**Fonctions :** `renderDetail`, `saveDetail`, `makeEB`, `openDetail`

La fiche est divisée en sections :

**Identité botanique :** Nom vernaculaire, espèce (*Citrus* nomenclature + cultivars), variété, porte-greffe, date et source d'acquisition, n° de passeport phytosanitaire.

**Culture :** Mode (pot/terre), Ø pot ou dimensions terrain, hauteur, Ø couronne, emplacement, exposition, ensoleillement, type de sol, substrat.

**Statut :** Statut sanitaire (5 niveaux), notes libres.

**Photos :** Galerie avec upload vers GitHub. Chaque photo est liée à une URL publique GitHub et s'affiche avec date de prise.

**Journal :** Chronologie complète des événements, avec toggle pour afficher/masquer les modifications automatiques (audit trail).

**Historique tailles** (si taille consignée) : Tableau type/parties/hauteur avant-après.

**Historique rempotages** (pot uniquement) : Tableau Ø avant→après / substrat / observations racinaires.

**Historique hivernages** (pot uniquement) : Appariement rentrée↔sortie, durée, statut *En cours ❄* / *Terminé*, badge collectif.

**Températures vécues** : Graphique 30 jours, records absolu froid/chaud, liste complète accordéon.

**Totaux saisonniers** : Cumuls NPK par saison avec les apports réels en grammes.

**Enregistrement :** Le bouton 💾 *Enregistrer la fiche* ferme la fiche et revient à la liste de la collection. L'audit trail compare 19 champs et génère automatiquement des entrées de modification.

---

### 4.11 Événements & journal de culture

**Fonctions :** `openAddEvent`, `submitEV`, `delEv`, `onEvTypeChange`, `toggleAudit`

**12 types d'événements :**

| Type | Champs spécifiques | Effets automatiques |
|---|---|---|
| 🔵 Observation | — | — |
| 💧 Arrosage | — | Met à jour `lastWatering` |
| 🌱 Fertilisation | Profil NPK + amendement + poids (g) | Met à jour `lastFertilization` |
| 🪴 Rempotage | Ø avant/après, substrat, observations racinaires | Met à jour `lastRempotage`, `potSize` |
| ✂️ Taille | Type (6 catégories), parties, hauteur avant/après | Met à jour `lastTaille` |
| 🧪 Traitement phyto | — | — |
| 🌸 Floraison | — | — |
| 🍊 Fructification | — | — |
| 🍇 Récolte | — | — |
| ❄️ Rentrée hivernage | — | `location → intérieur`, met à jour `lastHivernage` |
| ☀️ Sortie hivernage | — | `location → extérieur`, met à jour `lastSortie` |
| 🌿 Protection hivernale | — | — |

Les événements de type *modification* sont générés automatiquement par l'audit trail et ne peuvent pas être créés manuellement.

---

### 4.12 Historiques spécialisés

**Fonctions :** `renderTailleHistory`, `renderRempotageHistory`, `renderHivernageHistory`, `renderTempHistory`, `renderSeasonalTotals`

**Historique des températures vécues** (`renderTempHistory`) : Visible pour tous les sujets en extérieur (pleine terre ou pot avec emplacement `extérieur`, `jardin`, `terrasse`, `pied de mur`, `plein champ`). Les relevés sont enregistrés automatiquement à chaque chargement météo via `recordTempHistory()`. Maximum 365 entrées par sujet. Un sujet rentré en hivernage ne reçoit plus de relevés mais conserve l'historique existant.

---

### 4.13 Scanner passeport phytosanitaire

**Fonctions :** `openScanner`, `apOpenScannerForNew`, `parsePhytosanitary`, `applyScannedData`

Deux points d'entrée :
- **Depuis une fiche existante** : bouton 📷 Scanner → applique les données au sujet en cours d'édition
- **Lors de l'ajout d'un nouveau sujet** : bouton Scanner dans le formulaire

**Modes :**
- Vidéo en temps réel (BarcodeDetector API — Chrome, Edge)
- Import d'une image depuis la galerie (fallback universel)

**Parsing passeport UE :** Zones A (espèce), B (variété), C (porte-greffe/pays d'origine), D (n° agrément producteur), E (n° lot/passeport). Les données détectées sont appliquées directement aux champs de la fiche.

---

### 4.14 Recherche botanique GBIF

**Fonctions :** `gbifSearch`, `apSuggestVarieties`

En tapant dans le champ Espèce, l'API GBIF `species/suggest` est interrogée après 350 ms de silence (debounce). Les résultats s'affichent en liste déroulante sous le champ. La sélection remplit automatiquement le champ espèce avec le nom accepté.

Les suggestions de variétés sont issues d'une base locale de 13 espèces × cultivars courants (ex. : *Citrus × sinensis* → 'Navel Washington', 'Valencia', 'Sanguinello', 'Tarocco'…). Elle complète la recherche GBIF pour les cultivars non indexés.

---

### 4.15 Onglet Calendrier

**Fonctions :** `renderFertPage`, `renderFertCal`, `renderFertList`

**4 sous-onglets :** 📅 Calendrier · 🌱 Fertilisation · ⚗ Engrais · 🪨 Amendements

**Vue Calendrier :** Grille mensuelle avec points colorés par type d'événement (et par profil NPK pour les fertilisations). Cliquer sur un jour affiche un **panneau de détail sous la grille**, groupé par sujet, avec tous les événements du jour et les modifications de fiche en accordéon dépliable. Scroll automatique vers le panneau après sélection.

**Filtres :** Pills par type (masquer/afficher individuellement). Tout afficher / Tout masquer.

**Modifications de fiche dans le calendrier :** Les modifications automatiques (audit trail) sont incluses dans le calendrier avec le type `modification`, filtrables indépendamment.

**Légende dynamique :** Affiche uniquement les types présents dans le mois courant.

---

### 4.16 Profils d'engrais & amendements

**Fonctions :** `renderFertProfiles`, `renderFertCard`, `openAddFert`, `submitFert`, `deleteFert`, `renderAmendProfiles`, `openAddAmend`, `submitAmend`, `deleteAmend`, `getFertById`, `getAmendById`, `fertSelectOptions`, `fertNPKBadges`

**6 profils d'engrais pré-configurés :** Engrais universel, spécial agrumes, NPK équilibré, engrais d'hiver, engrais de printemps, engrais potassique.

Chaque profil définit les pourcentages N, P, K, Ca, Mg et une couleur d'identification sur le calendrier.

**8 amendements pré-configurés :** Chaux, soufre élémentaire, compost, perlite, pouzzolane, sable grossier, terreau forestier, fumier compostés.

Les profils sont modifiables et supprimables. Vous pouvez en créer autant que nécessaire.

**Utilisation :** Lors d'un événement fertilisation, sélectionnez le profil NPK et renseignez le poids en grammes. Ces données alimentent les jauges NPK du tableau de bord.

---

### 4.17 Profil utilisateur

**Fonctions :** `renderProfile`, `renderProfSecurity`, `renderProfNotifs`, `renderProfIoT`, `renderTeamDashboard`, `renderProfNursery`, `renderProfPhyto`, `renderProfLots`, `saveProfile`

**Champ `profileType`** (`collectionneur` | `pepinieriste` | `arboriculteur` | `conservatoire`) — persisté dans `CFG_KEY.profile`. Sélecteur visuel 2×2 en haut de l'onglet Profil. Change immédiatement (sans enregistrer) le rôle affiché dans le hero et les onglets visibles (Pépinière masqué sauf `pepinieriste`). Sections de formulaire conditionnelles :
- 🌱 **Pépiniériste** : Raison sociale, SIRET, agrément RNPV, zone de vente, certifications
- 🌳 **Arboriculteur** : Raison sociale, SIRET, surface (ha), N° PACAGE, certifications, canaux de vente
- 🏛 **Conservatoire** : Nom officiel, organisme de tutelle, partenaires, accès public, référent scientifique

**9 onglets :**

🌿 **Profil** — Sélecteur de type (Collectionneur / Pépiniériste / Arboriculteur / Conservatoire) avec sections conditionnelles dédiées. Infos personnelles, culture (pot/pleine terre), export/import JSON, toggle ETP expert, bouton verrouiller.

🔒 **Sécurité** — Statut mot de passe, GitHub (token, dépôt, photos archivées), boutons modifier.

🔔 **Notifications** — Push locales sans serveur, scheduler 4h, 4 types configurables (arrosage, gel, fertilisation, greffage).

📡 **Capteurs IoT** — Configuration des sondes sol par sujet (endpoint, token Bearer, polling, seuils alerte).

👥 **Équipe** — Opérateurs + tâches planifiées. Voir §4.28.

🌱 **Pépinière** — Semis, catalogue de vente, commandes clients. Voir §4.29.

🧪 **Registre phyto** — Traitements réglementaires (AMM, dose, DAR, surface, opérateur), alertes DAR, export PDF conforme DGAL/PAC.

📦 **Lots** — Traçabilité commerciale des lots de récolte, passeports phytosanitaires à l'émission avec QR SVG.

📋 **Historique** — Chronologie complète de toute la collection (voir §4.18).---

### 4.18 Historique global

**Fonctions :** `renderProfHistory`, `buildHistList`, `renderHistFilter`

Accessible via Profil → 📋 Historique.

Affiche **tous** les événements et modifications de toute la collection, en ordre anti-chronologique avec séparateurs mensuels. Chaque entrée montre : date, badge type coloré, icône 🪴/🌳, nom du sujet, espèce, description complète, données enrichies (NPK, amendement, type de taille, Ø rempotage, etc.).

**Deux filtres instantanés :** 📝 Modifications de fiche (audit trail) et ✅ Événements culturaux.

Cliquer sur une entrée ouvre directement la fiche du sujet concerné.

---

### 4.19 Export / Import JSON

**Fonctions :** `exportData`, `importData`

**Export :** Génère un fichier `agrumes-collection-YYYY-MM-DD.json` contenant tous les sujets avec leurs événements, photos, coordonnées GPS et historiques de température. Ce fichier peut être importé sur un autre appareil ou servir de sauvegarde.

**Import :** Remplace intégralement la collection courante après confirmation. Idéal pour transférer la collection entre appareils ou restaurer après réinitialisation.

> ⚠️ L'import **écrase** la collection existante. Exportez vos données avant d'importer.

---

### 4.20 Infographies

**Fonctions :** `generateInfographic`, `openInfographic`

Accessibles depuis le tableau de bord (bouton 📊 en haut à droite).

Génèrent une image PNG de la collection pour partage (Facebook, Instagram…). 4 périodes disponibles (7 jours, 30 jours, 3 mois, 1 an) × 2 formats (carré, paysage). Le rendu utilise le Canvas 2D et inclut statistiques, espèces représentées, derniers événements.

---

---

### 4.21 Notifications push locales

**Fonctions :** `initPushNotifications`, `requestNotifPermission`, `disableNotifications`, `_startNotifScheduler`, `checkAndNotify`, `buildNotifPayload`, `toggleNotifType`, `sendTestNotification`, `renderProfNotifs`

Scheduler `setInterval` 4h. 4 types indépendants : arrosage urgent (`effDays > t3`), gel (prévision ≤ seuil configuré), fertilisation en retard, greffage (reprise à évaluer / disponibilité imminente). PIN navigateur requis. Toggle iOS-style par type. Compatible Chrome/Edge desktop+Android, Safari iOS 16.4+ en mode PWA.

---

### 4.22 Export PDF

**Fonctions :** `exportPlantPDF`, `exportJournalPDF`, `exportMonthlyReportPDF`, `openPdfMenu`, `_pdfOpen`, `_pdfStyles`, `_pdfHeader`, `_pdfFooter`

PDF via `window.open()` + HTML stylé + `window.print()` — aucune dépendance CDN. FAB ⋯ dans chaque fiche sujet (fiche détaillée / journal / rapport mensuel). Bouton rapport dans l'historique global.

---

### 4.23 Registre phytosanitaire

**Fonctions :** `renderProfPhyto`, `_getPhytoEvents`, `generatePhytoRegisterPDF`, `onEvTypeChange` (étendu)

Panneau `phyto-reg-wrap` dans le formulaire d'événement Traitement phyto : AMM, dose, volume, surface, DAR, organisme cible, justification, opérateur (pré-rempli depuis profil). Alertes DAR calculées en croisant la date du traitement avec les récoltes enregistrées. Export PDF 10 colonnes, lignes non conformes en rouge, mention légale.

---

### 4.24 Stocks d'intrants

**Fonctions :** `loadStocks`, `saveStocks`, `addStockItem`, `updateStockItem`, `deleteStockItem`, `addStockMovement`, `getStockAlerts`, `renderStocksTab`

Store `agrumes_stocks`. Chaque stock est lié à un profil d'engrais ou d'amendement. Les événements Fertilisation avec poids en grammes génèrent automatiquement un mouvement de déstockage si un stock lié existe. Alertes tableau de bord si stock ≤ seuil configuré.

---

### 4.25 Module économique

**Fonctions :** `loadEco`, `saveEco`, `addEcoEntry`, `deleteEcoEntry`, `getEcoEntries`, `_ecoAgg`, `renderEcoPage`, `_renderEcoOverview`, `_renderEcoPlants`, `_renderEcoMonths`, `openEcoEntry`, `saveEcoEntry`, `exportEcoPDF`, `_ecoAutoHarvestRevenue`

Onglet 💶 dans la barre de navigation. Store `agrumes_eco` indépendant. KPIs : total charges, total produits, marge nette, marge par arbre. Intégration récolte : prix de vente + acheteur sur l'événement Récolte → entrée revenu auto dans ECO. Export PDF 3 sections.

---

### 4.26 Lots de récolte

**Fonctions :** `loadLots`, `saveLots`, `renderProfLots`, `openLotModal`, `saveLotModal`, `deleteLot`, `generateLotPasseport`

Store `agrumes_lots`. Lots numérotés (auto `LOT-AAAA-XXX`), association de sujets, poids/prix, certifications (bio/IGP/HVE/HVE3/Label Rouge). Génération de passeport phytosanitaire à l'émission : QR SVG maison, champs RNPV, HTML exportable `<a download>`.

---

### 4.27 ETP — Évapotranspiration

**Fonctions :** `_calcRa`, `calcETP_HS`, `calcKcCitrus`, `getETPForPlant`, `getETPToday`, `isETPEnabled`, `toggleETPMode`, `renderETPPanel`

Formule Hargreaves-Samani (FAO-56). Ra calculé localement (latitude + jour de l'année). Kc mensuel différencié pot/pleine terre (FAO-56 Table 12 + INRAE 2023). Facteur surface depuis taille de pot. Toggle dans Profil. Panneau ETP sur tableau de bord, sous-label ETc (mm/j) dans les jauges d'arrosage.

---

### 4.28 Équipe & tâches

**Fonctions :** `loadTeam`, `saveTeam`, `addOperator`, `deleteOperator`, `addTask`, `completeTask`, `skipTask`, `updateTask`, `deleteTask`, `getOverdueTasks`, `getPendingTasksForPlant`, `getTasksForWeek`, `renderTeamDashboard`, `_renderTeamTasks`, `_renderTeamWeek`, `_renderTeamOps`, `openOperatorModal`, `saveOperatorModal`, `openTaskModal`, `saveTaskModal`, `openCompleteTaskModal`, `generateWeeklySummaryPDF`, `generatePublicCard`

Store `agrumes_team`. Opérateurs : nom, rôle (owner/operator/viewer), couleur, PIN SHA-256. Tâches : description, catégorie, sujet concerné, assignation, échéance, statut (pending/done/skipped). Vue semaine : grille 7 colonnes avec dots colorés. Alertes tableau de bord si tâches en retard. PDF récap hebdo. `generatePublicCard(plantId)` → HTML autonome `<a download>` sans dépendance.

---

### 4.29 Pépinière

**Fonctions :** `loadNursery`, `saveNursery`, `getNursery`, `_nurseryGraftSync`, `renderProfNursery`, `_renderSemisView`, `_renderCatalogView`, `_renderOrdersView`, `openSemisModal`, `saveSemisModal`, `deleteSemis`, `openCatalogModal`, `saveCatalogModal`, `deleteCatalogItem`, `openOrderModal`, `saveOrderModal`, `deleteOrder`, `generateNurseryLabelPDF`

Store `agrumes_nursery` — 3 collections : `semis`, `catalog`, `orders`. Sync automatique greffage → catalogue : les cohortes avec `disponibilite` atteinte dans les 14 jours et `repriseQty > 0` sont proposées pour alimenter le catalogue. Livraison d'une commande décrémente le stock catalogue. Étiquettes PDF : grille 160px, QR SVG maison, espèce/variété/porte-greffe/taille/prix.

---

### 4.30 Capteurs IoT

**Fonctions :** `startIoTPolling`, `_iotFetch`, `_iotIsFresh`, `_iotMoistureColor`, `renderProfIoT`

Store `agrumes_iot_v1`. Un capteur par sujet : endpoint HTTP retournant `{ moisture, temp?, battery? }`, token Bearer optionnel, intervalle configurable. Polling parallèle au démarrage et à chaque refresh. Lecture fraîche (< 2h) remplace le calcul heuristique d'arrosage : couleur + pct d'urgence calculés depuis l'humidité réelle. Badge `📡 XX%` sur les cartes de collection. Stat card "📡 Capteurs actifs" sur le tableau de bord si `nIotActive > 0`.


## 5. Référence des données

### Structure d'un sujet (`plant`)

```json
{
  "id": "p01",
  "name": "Bizzarria",
  "cultureType": "pot",
  "species": "Citrus × bizarria",
  "variety": "Bizzarria",
  "rootstock": "Citrus aurantium",
  "origin": "acheté",
  "acquisitionDate": "2023-03-15",
  "acquisitionSource": "Pépinière Tintori",
  "potSize": "35",
  "height": "120",
  "crownDiameter": "80",
  "location": "intérieur",
  "exposition": "",
  "sol": "",
  "sunExposure": "mi-ombre",
  "status": "bon",
  "lastWatering": "2025-01-10",
  "lastFertilization": "2024-11-02",
  "lastTaille": "2024-04-15",
  "lastRempotage": "2023-05-20",
  "lastHivernage": "2024-10-15",
  "lastSortie": "2024-04-20",
  "notes": "Chimère historique...",
  "photos": [{"url": "https://...", "date": "2024-05-01"}],
  "events": [...],
  "tempHistory": [{"date": "2024-06-15", "min": 14.2, "max": 28.7, "city": "Lyon"}],
  "lat": 45.7640,
  "lng": 4.8357
}
```

### Structure d'un événement

```json
{
  "id": "ev_abc123",
  "date": "2025-01-10",
  "type": "fertilisation",
  "description": "Engrais spécial agrumes, dose standard",
  "fertilizerId": "fert_001",
  "weightG": 20,
  "audit": false,
  "bulk": false
}
```

---

## 6. FAQ & dépannage

**Q : La météo ne se charge pas.**
R : Vérifiez que vous avez autorisé la géolocalisation, ou entrez manuellement une ville. Si le problème persiste, touchez ↺ Actualiser. Le cache sessionStorage expire après 1 heure.

**Q : Le module Verger ne s'affiche pas correctement.**
R : Le fond de plan IGN Géoplateforme nécessite une connexion internet. En hors-ligne, seul le fond OpenStreetMap est disponible via le bouton Fond 🛰/🗺.

**Q : Les jauges de fertilisation ne s'affichent pas.**
R : Vérifiez que vous avez renseigné le **poids en grammes** ET sélectionné un **profil NPK** sur vos événements fertilisation. Les événements sans ces deux données ne sont pas comptabilisés.

**Q : L'export des photos ne fonctionne pas.**
R : Vérifiez que votre token GitHub est valide et dispose des permissions `Contents: Read & Write` sur le bon dépôt. Profil → 🔒 Sécurité → Modifier token / dépôt GitHub.

**Q : J'ai oublié mon mot de passe.**
R : Sur l'écran de connexion, touchez *Mot de passe oublié*. Cela réinitialise la configuration de sécurité (mot de passe + token GitHub) mais **conserve vos données de collection**.

**Q : Puis-je utiliser l'application hors ligne ?**
R : Oui, à l'exception du module météo (API externe), du fond de plan Verger (tuiles IGN/OSM) et de la recherche GBIF. Toutes les fonctions de saisie, consultation et export fonctionnent hors ligne.

**Q : Combien de sujets puis-je gérer ?**
R : Le `localStorage` est limité à environ 5 Mo. Avec photos stockées sur GitHub (URL uniquement en local), vous pouvez gérer plusieurs centaines de sujets sans problème. Sans GitHub, les photos volumineuses en base64 peuvent rapidement saturer la limite.

**Q : Puis-je importer des données depuis un autre logiciel ?**
R : Uniquement via le format JSON natif de l'application. Vous pouvez construire manuellement un fichier JSON respectant la structure décrite en section 5.

---


## 7. Historique des versions

### v8.0 — *10 phases d'extension — notifications, PDF, phyto, stocks, économie, lots, ETP, IoT, pépinière, équipe* (mars 2026)

**Phase 1 — Notifications push locales** : scheduler 4h, 4 types configurables, onglet Profil 🔔, compatible PWA.

**Phase 2 — Export PDF** : FAB ⋯ dans chaque fiche (fiche détaillée / journal / rapport mensuel), `_pdfOpen` + `_pdfStyles` + `_pdfHeader` + `_pdfFooter` réutilisables.

**Phase 3 — Registre phytosanitaire** : 8 champs réglementaires sur l'événement Traitement, alertes DAR automatiques, export PDF 10 colonnes conforme DGAL/PAC. Onglet Profil 🧪.

**Phase 4 — Stocks d'intrants** : store `agrumes_stocks`, mouvements auto depuis Fertilisation, alertes tableau de bord.

**Phase 5 — Module économique** : onglet navigation 💶, charges/produits par saison, intégration récolte (prix → entrée ECO auto), PDF 3 sections, store `agrumes_eco`.

**Phase 6 — Lots de récolte** : numérotation auto, certifications, passeport phytosanitaire à l'émission (QR SVG), store `agrumes_lots`. Onglet Profil 📦.

**Phase 7 — ETP Hargreaves-Samani** : Ra local, Kc mensuel citrus (FAO-56 + INRAE), panneau tableau de bord, sous-labels ETc dans les jauges, toggle mode expert dans Profil.

**Phase 8 — Capteurs IoT** : polling HTTP/JSON parallèle, override heuristique arrosage si lecture fraîche (< 2h), badge `📡` sur cartes, stat card tableau de bord. Store `agrumes_iot_v1`. Onglet Profil 📡.

**Phase 9 — Pépinière** : chaîne complète semis → catalogue → commandes, sync greffage auto, étiquettes PDF avec QR SVG, déstockage à la livraison. Store `agrumes_nursery`. Onglet Profil 🌱.

**Phase 10 — Équipe** : opérateurs avec rôles + PIN SHA-256, tâches assignées avec échéances, vue semaine, alertes tâches en retard sur tableau de bord, PDF récap hebdo, fiche publique HTML autonome. Store `agrumes_team`. Onglet Profil 👥.

**i18n** : +150 clés ajoutées × 5 langues (FR/EN/IT/ES/PT) pour tous les nouveaux modules.

**localStorage** : 6 nouvelles clés indépendantes (`agrumes_eco`, `agrumes_stocks`, `agrumes_lots`, `agrumes_iot_v1`, `agrumes_nursery`, `agrumes_team`) — n'alourdit pas l'export JSON principal.


### v6.8 — *Verger 2D — interface redessinée* (mars 2026)
Refonte complète de l'UX/UI du verger :
- **Rail de modes** vertical à gauche (Navigation · Placer · Parcelle · Réseau) — un seul toucher suffit, toujours accessible
- **Barre d'actions** horizontale en bas (GPS · Annuler · 💾 Sauv. · Export) — actions directes les plus fréquentes
- **Contrôles overlay** en haut : chip statut (top gauche), couleurs par pills (top centre), 🛰 fond + ⋯ menu (top droite)
- **Menu ⋯** regroupe les actions secondaires (Parcelles, Cadastre, Légende, Export, Effacer) en modal propre
- **Légende** toggle via le menu — s'affiche en bas à droite, filtrée selon le mode couleur actif
- **Boutons parcelle** intégrés dans la carte (sous le bandeau d'instruction) avec mini-SVG de la forme réelle
- **Curseur crosshair** automatique en modes trace/placement
- **Plus d'espace cartographique** : la bande d'info au-dessus est supprimée — statut compris dans le chip en overlay
- **CSS modernisé** : backdrop-filter, shadow réaliste, transitions tactiles, tap-highlight supprimé

### v6.7 — *Corrections dashboard & collection* (mars 2026)
- **Bug critique corrigé** : `daysSince()` → `dys()` dans `renderNeedsGauges()` — le module Besoins & vigilance ne s'affichait plus
- Filtre collection : `${'misc.allModes'}` → `${T('misc.allModes')}` (affichait le nom brut de la clé)
- Login : `${pwdInput("lg-pwd",...)}` dans HTML statique → remplacé par HTML natif (bouton 👁 visible)
- **13 textes encore codés en dur** traduits : `Aujourd'hui`, `Conditions`, `Prochaine`, `cycle lunaire 29,5j`, `Prochaines heures`, `à surveiller`, `Aucun événement enregistré`, `Notification visuelle si…`, bannière saisonnière 🪴/🌳, messages de chargement météo
- `humidComfort()` : labels `Très sec/Sec/Idéal/Humide/Saturé` → clés i18n `ld.humVeryDry||…`
- **10 nouvelles clés** ajoutées aux 5 langues : `today`, `today2`, `wxConditions`, `toWatch`, `humVeryDry`, `humDry`, `humIdeal`, `humHumid`, `humVeryHumid`, `humSat`
- Illustration SVG agrumes dans la liste : remplacée par une fine bande sobre avec le nom scientifique abrégé (plus sobre, plus lisible)

### v6.6 — *Base de données GCVC/UCR — variétés & porte-greffes* (mars 2026)
- **`CITRUS_VARIETIES`** refondue sur les données de la **Givaudan Citrus Variety Collection (GCVC), UC Riverside** (citrusvariety.ucr.edu) — ~1 100 cultivars/espèces, l'une des collections les plus complètes au monde. 41 espèces couvertes, ~280 références de cultivars organisées par taxon.
- **`SP` (liste d'espèces)** étendue de 24 à 61 entrées : *Citrus unshiu*, *C. × aurantiifolia*, *C. × latifolia*, *C. depressa* (shikuwasa), *C. ichangensis*, *Microcitrus australis*, *M. australasica var. sanguinea*, *Aegle marmelos*, *Clausena lansium*, etc.
- **`RS` (porte-greffes)** mis à jour de 7 à 29 entrées : Flying Dragon, Rubidoux, Rich 16-6, C-32, C-35, Benton, Rusk, Swingle citrumelo, C-190, citrandarins X639 et C-146, Cléopâtre, Sunki, Volkamer, Macrophylla, Rough lemon Schaub, Borneo Rangpur, Bigaradier standard, US-802/812/852.
- **Attribution GCVC** visible dans l'interface (lien `GCVC/UCR ↗` sur les champs espèce et variété, badge `GCVC` dans les suggestions).
- **`apSuggestVarieties`** enrichi : affiche l'espèce sélectionnée, attribution GCVC, lien vers la collection UCR.
- **`apSearchVariety`** : recherche croisée locale GCVC + GBIF, badge de source par résultat.

### v6.5 — *Scanner amélioré · Jauges de besoins · Multi-parcelles · Mots de passe* (mars 2026)
- **Scanner passeport phytosanitaire** refondu — chaque champ (espèce, origine, lot, opérateur) s'applique individuellement via des boutons dédiés, sans écraser les données existantes. Historique des 30 derniers scans persisté dans `localStorage` (clé `agrumes_scan_hist`).
- **Base de données de résistance thermique** (`CITRUS_HARDINESS`) — 23 taxons avec T° létale, premiers dégâts, plage optimale et T° max tolérable. Sources : INRAE, USDA, Vivai Tintori, Gonzalez-Sicilia (1968), Ladaniya (2008), Saunt (2000).
- **Module "Besoins & vigilance"** (`renderNeedsGauges`) en remplacement des jauges d'arrosage seules — double barre par sujet (💧 eau + 🌱 fertilisation), badge T° forecast vs seuil de résistance, tri par urgence, prise en compte du type de sol pour les sujets pleine terre.
- **Affichage des mots de passe** — bouton 👁 sur tous les champs `type="password"` (connexion, assistant, changement de mot de passe, token GitHub).
- **Verger multi-parcelles** — plusieurs parcelles indépendantes avec nom, couleur et historique. Boutons en forme de la parcelle (mini-SVG) pour naviguer directement.
- **Annuler/Valider** — bouton ↩ Annuler dans la barre FAB (20 niveaux d'annulation), bannière de validation après tracé d'un périmètre.
- **Scanner étiquette produit** (engrais/amendements) — lit EAN/QR sur l'emballage, extrait NPK et nom, pré-remplit le formulaire d'ajout.
- **Illustration citrus SVG** — chaque sujet sans photo affiche un agrume stylisé adapté à l'espèce (couleur et forme spécifiques).
- **Données démo Élysée** — coordonnées des plantes pleine terre repositionnées dans les jardins du Palais de l'Élysée (Paris, 48.869°N 2.316°E), périmètre pré-tracé automatiquement au premier chargement.

### v6.4 — *Aide contextuelle* (mars 2026)
- **13 boutons ❓** placés sur tous les modules clés : arrosage, fertilisation, météo, hygrométrie, phase lunaire, températures, verger, calendrier, événements, collection, fiche sujet, sécurité, données
- Panneau slide-up (`help-panel`) avec titre, contenu riche (tables, formules, info-boxes) et lien vers la section correspondante du guide `aide.html`
- Contenu disponible en 🇫🇷 Français et 🇬🇧 English (fallback FR pour les autres langues)
- Fermeture par tap fond, bouton ✕ ou touche Echap
- CSS dédié `.help-btn` (18px rond, discret) + `.help-panel` (fixed, z-index 400, animation slide-up)
- `HELP_CONTENT` objet structuré · `showHelp(key)` · `closeHelp()` · `helpBtn(key)`

### v6.3 — *Multilangue & données de démo enrichies* (mars 2026)
- **5 langues** : 🇫🇷 Français · 🇬🇧 English · 🇮🇹 Italiano · 🇪🇸 Español · 🇵🇹 Português
- Sélecteur dans Profil → 🌿 Profil. `setLang()` sauvegarde et recharge. `initI18n()` reconstruit toutes les constantes dynamiques.
- Traduits : types d'événements, statuts sanitaires, listes d'emplacement, conseils culturaux saisonniers, formats de dates, noms de jours
- `T(path)` — fonction de traduction par chemin pointé (`T('status.bon')`)
- `getLd()` / `buildET()` / `buildSTATUS()` — système extensible
- **Données de démo** réduites de 32 à **8 plantes** avec un mois d'historique couvrant toutes les fonctionnalités : arrosages, fertilisations NPK avec poids, taille avec dimensions, rempotage, traitement, floraison, protection/sortie hivernage, tempHistory pour les plantes pleine terre
- Mix équilibré : 5 pots (dont statut vigilance) + 3 pleine terre géolocalisées

### v6.2 — *Correctif formulaire "Mot de passe oublié" depuis l'écran de connexion* (mars 2026)
- **Bug corrigé** : le formulaire *Mot de passe oublié* utilisait `showModal()` (z-index 100) masqué derrière l'écran de connexion (z-index 200) — inaccessible sans être connecté
- `showForgot()` injecte désormais le formulaire **directement dans la carte de connexion** (`#sc-login .acard`) — fonctionnel quel que soit l'état de l'application
- `restoreForgotLogin()` — nouvelle fonction qui restaure le contenu original de la carte après annulation
- `confirmReset()` — affiche les erreurs e-mail en ligne (pas via `toast`) pour rester visible dans la carte
- `resetAll()` — corrigé pour fermer proprement `sc-login` et ne pas crasher si l'overlay est absent
- `.overlay` — z-index relevé de 100 à 300 (sécurité générale : modaux visibles au-dessus de tout élément fixe)

### v6.1 — *GitHub facultatif & récupération de mot de passe par e-mail* (mars 2026)
- **GitHub désormais entièrement facultatif** — bouton *→ Passer cette étape* dans l'assistant, `nsStep` accepte un token vide, `finalSetup` ne stocke pas `tokenObf` si aucun token n'est saisi
- **E-mail de récupération** — nouveau champ à l'étape 1 de l'assistant et dans le Profil ; stocké dans `recoveryEmail` (localStorage) ; demandé masqué lors du *Mot de passe oublié* pour confirmation locale d'identité
- `confirmReset` — nouvelle fonction qui vérifie l'e-mail avant `resetAll()` si un e-mail est configuré
- `savePwd` — corrigé pour ne pas planter si `tokenObf` est absent (utilisateurs sans GitHub)
- `showForgot` — affiche l'adresse masquée + champ de saisie, ou avertissement si aucun e-mail configuré
- Mise à jour de `aide.html` et `README.md` en cohérence

### v6.0 — *Verger 2D & plan exportable* (mars 2026)  ← ancienne version, voir v7.0 ci-dessous
- Vue **Verger 2D** dans l'onglet Collection avec basculement liste/carte
- Fond de plan satellite IGN Géoplateforme + overlay cadastral IGN
- GPS auto-center au chargement + chargement automatique de la parcelle cadastrale
- Interface mobile-first : barre FAB flottante, touch double-tap, hauteur `dvh`
- Modes de coloration : espèce, âge, statut sanitaire, porte-greffe
- Outils : placement GPS, traçage périmètre, réseaux (7 types : arrosage, électricité, eau potable, eaux usées, télécoms, gaz, limite)
- Bouton 💾 Sauvegarder avec feedback visuel
- Bouton 📄 Export — plan Canvas 2D + inventaire HTML imprimable
- Cercles à l'échelle métrique (`crownDiameter / 2`)
- Correctif : `useCadastralAsBoundary` (coordonnées via `window._pendingCadCoords` au lieu de `JSON.stringify` inline)
- Correctif : échelle Leaflet déplacée en `bottomright` (ne cache plus la FAB)

### v5.5 — *Amélioration interface collection & météo* (mars 2026)
- Refonte des cartes de collection : barre d'accent, photo pleine largeur, metrics à 3 colonnes
- Chips statistiques (total, pot, terre, dehors, urgent) dans la vue collection
- Taux d'**hygrométrie** ajouté au module météo (`hourly.relative_humidity_2m`)
- Phase lunaire enrichie : disque SVG, 9 phases, conseil cultural botanique, barre de cycle 29 cases, prochaine phase avec countdown
- **Jauges de fertilisation NPK** sur le tableau de bord (12 mois glissants, corrections météo)
- Logo 🍊 cliquable → retour tableau de bord depuis n'importe quel écran
- Croix ✕ de fermeture dans la modale d'ajout de nouveau sujet
- Correctif : `hIdx` défini avant son utilisation dans le bloc vent (fix `ReferenceError`)
- Correctif : `daily.time||[]` — guard sur toutes les données optionnelles Open-Meteo

### v5.4 — *Historique des températures vécues* (février 2026)
- Section **🌡 Températures vécues** dans chaque fiche sujet
- `recordTempHistory()` — enregistrement automatique à chaque chargement météo
- Records absolus froid/chaud, graphique barres 30 jours, accordéon liste complète (365 entrées max)
- Badge ❄ gel si T°min ≤ 2 °C

### v5.3 — *Profil en onglets & historique global* (février 2026)
- Profil restructuré en 3 onglets : 🌿 Profil / 🔒 Sécurité / 📋 Historique
- `renderProfHistory`, `buildHistList`, `renderHistFilter` — chronologie complète filtrée
- Vent : migration vers `hourly.windspeed_10m` (données localisées) avec average 3h
- Correctif de position : panel jour calendrier avec `scrollIntoView` automatique

### v5.2 — *Tableau de bord météo enrichi* (janvier 2026)
- Bandeau date du jour
- Lever 🌅 / coucher 🌇 du soleil + durée du jour
- Phase lunaire (version initiale)
- Vent Beaufort + direction + rafales
- Alerte gel avec seuil configurable

### v5.1 — *Calendrier & modifications* (janvier 2026)
- `modification` ajouté aux types de calendrier
- Panel de détail sous la grille groupé par sujet
- Modifications de fiche archivées dans le calendrier

### v5.0 — *Hivernage automatique & sections historiques* (décembre 2025)
- Bascule automatique `location` lors d'un événement hivernage/sortie
- `lastHivernage`, `lastSortie` dans AUDIT_FIELDS
- Sections historiques dédiées : tailles, rempotages, hivernages dans les fiches
- `renderHivernageHistory` — appariement rentrée↔sortie, durée calculée

### v4.5 — *Jauges d'arrosage contextuelles* (novembre 2025)
- 5 multiplicateurs : pot, soleil, température, pluie, saison
- Déduction pluie à partir de `hourly.precipitation_probability`
- Correction météo désactivée pour les plantes en intérieur

### v4.0 — *Scanner & GBIF* (octobre 2025)
- BarcodeDetector + import image pour le passeport phytosanitaire UE
- Recherche GBIF `species/suggest` avec debounce
- Base locale de cultivars (13 espèces)

### v3.5 — *Profils d'engrais & calendrier fertilisation* (septembre 2025)
- 6 profils d'engrais pré-configurés (N, P, K, Ca, Mg)
- 8 amendements pré-configurés
- Onglet Calendrier avec filtres, légende dynamique, bandes colorées
- Poids en grammes + totaux saisonniers

### v3.0 — *Collection & Verger 2D initial* (août 2025)
- Restructuration en 5 onglets (Dashboard, Collection, Ajouter, Calendrier, Profil)
- Vue liste avec filtres, sélection multiple, actions collectives
- Audit trail automatique sur 19 champs
- Upload photos GitHub

### v2.0 — *Authentification & sécurité* (juillet 2025)
- Setup wizard 4 étapes
- Hash SHA-256 + token XOR
- 8 sujets pré-chargés avec nomenclature scientifique

### v1.0 — *Version initiale* (juin 2025)
- Fichier HTML unique autonome
- Journal de culture basique
- Export/import JSON

---

## 8.  Crédits & sources scientifiques

**Données météorologiques**
- [Open-Meteo](https://open-meteo.com) — API météo gratuite, modèle ECMWF IFS, résolution 1 km

**Cartographie**
- [Leaflet](https://leafletjs.com) v1.9.4 — bibliothèque cartographique open source (BSD 2-Clause)
- [IGN Géoplateforme](https://geoplateforme.ign.fr) — orthophotos et cadastre (© IGN)
- [OpenStreetMap](https://www.openstreetmap.org) — fond cartographique collaboratif (ODbL)
- [API Carto IGN](https://apicarto.ign.fr) — données cadastrales (© IGN)

**Taxonomie**
- [GBIF](https://www.gbif.org) — Global Biodiversity Information Facility (CC BY 4.0)

**Références agronomiques**
- Lèbre, M.-C., & Mauleon, H. (1994). *La culture des agrumes*. INRA Éditions.
- Morin, C. (2001). *Agrumiculture en France*. CTIFL.
- Swingle, W.T. & Reece, P.C. (1967). *The Botany of Citrus*. USDA.

**Polices**
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — Claus Eggers Sørensen (SIL OFL)
- [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) — Georg Duffner (SIL OFL)
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — JetBrains (SIL OFL)

---

---

### v7.0 — *Refonte complète Vergers — plan SVG 2D interactif* (mars 2026)

**Architecture :**
- Vue Vergers scindée en deux composants distincts : carte Leaflet compacte (360 px) + plan 2D SVG sous la carte
- Onglet renommé `🗺 Verger 2D` → `🌳 Vergers` (renommé ensuite `📍 Emplacements` en v7.3)

**Carte IGN simplifiée :**
- Modes supprimés : `place`, `boundary`, `network` — la carte ne sert plus qu'à la sélection cadastrale
- Réticule ⊕ central (méthode fiable pour mobile) — `_pickParcelAtCenter()` utilise `vergerMap.getCenter()`
- **GPS-first init** : carte toujours positionnée depuis le GPS, jamais depuis la boundary
- Vérification de proximité boundary/GPS : alerte si distance > ~200 km (boundary probablement corrompue)
- `_vergerResetPosition()` : recadrage GPS instantané depuis le menu ⋯
- `vergerGPS()` : spinner + `maximumAge:0` (coordonnées toujours fraîches)
- Listener `scroll` → `invalidateSize()` pour maintenir la cohérence interne de Leaflet

**Plan 2D SVG (`initPlanCanvas` / `_initPlanCanvasNow`) :**
- Projection géométrique WGS84 → pixels avec correction cosinus latitude
- Groupe `<g id="plan-viewport">` pour zoom/pan sans redraw SVG complet
- `requestAnimationFrame` pour garantir un `clientWidth` non nul au premier rendu

**Zoom / Pan plan :**
- Boutons ＋ / － (×1.35) + recadrage ⊡ dans la barre d'outils
- Molette souris — zoom centré sur le curseur
- Pinch-to-zoom mobile (Pointer Events API, point médian)
- Pan sur fond — glisser-déposer (seuil 3 px pour distinguer d'un tap)
- `_svgEventToNorm()` — inverse du transform viewport pour coordonnées précises à tout zoom

**Palette et placement :**
- Palette horizontale scrollable avec chips par sujet pleine terre
- Fantôme ⊕ qui suit le curseur en mode placement
- Contrainte dans le périmètre (ray-casting `pointInPolygon`)
- Undo stack 20 niveaux pour placement, déplacement et retrait

**Onglets parcelles (hors carte) :**
- `#plan-parc-tabs` — onglets cliquables au-dessus du plan
- Changement d'onglet → `fitBounds` carte + rechargement plan

**Export :**
- `exportPlanAsPNG()` — SVG → canvas ×2 haute résolution → PNG téléchargé

**Données :**
- `vergerData.planPositions` — positions normalisées {x, y} par parcelle et par arbre
- Migration automatique `plant.lat/lng → planPositions` au premier chargement

**Fonctions supprimées :** `refreshVergerMarkers`, `removePlantFromMap`, `exportVergerPlan` (HTML), `onVergerMapClick`, `placePlantAt`, `onVergerBoundaryClick`, `finishBoundary`, `onVergerNetworkClick`, `startNetwork`, `finishNetwork`, `_refreshNetworks`, `startVergerBoundaryDraw`

**Bilan :** −989 lignes supprimées, +843 lignes nouvelles. JS validé Node.js `--check`. i18n 5 langues.

---

### v7.5 — *Greffage, PlantNet, Plant.id, diagnostic multi-zones* (mars 2026)

**13e type d'événement — Greffage :**
- Panneau `greffage-wrap` : méthode, stade phénologique, greffon × porte-greffe, cohorte (lot), reprise, élevage
- Auto-génération `lotId`, calcul live `disponibilite` et `repriseQty`
- `openGraftRepriseModal()` + `saveGraftReprise()` : mise à jour reprise sans doublon
- `renderGraffageRegistry(plant)` : registre dans la fiche sujet (taux moyen, stock)
- `getGraftAlerts()` : alertes tableau de bord (reprise à évaluer, dispo imminente)
- Badges `🌿` dans journal, journal détaillé et calendrier mensuel
- `plant.lastGreffage` · 1 entrée `HELP_CONTENT` + `§greffage` dans aide.html · 35 clés i18n × 5 langues

**Pipeline diagnostic 4 moteurs :**
- 🌿 PlantNet API : confirmation espèce avant diagnostic (500 req/j gratuit)
- 🔬 Plant.id API : diagnostic maladies & ravageurs IA spécialisée (~100/mois gratuit)
- 🤖 Claude Vision : analyse multimodale contextualisée (déjà présent)
- ○ Heuristique local : filet de sécurité offline (toujours actif)

**Sélection multi-zones dans le diagnostic :**
- `_diagZones` (Set) remplace `_diagZone` (string) — sélection multiple de zones
- Chip `🌿 Plante entière` sélectionne/désélectionne toutes les zones
- Sélecteur âge feuilles pour discriminer carences Fe (jeunes) vs Mg (vieilles)
- Scoring `diagnoseLocal()` recalibré : gates d'exclusion strictes, plafonds par catégorie

### v7.4 — *Base de connaissances, Diagnostic IA, Brix & acidité* (mars 2026)

**Base de connaissances (`SPECIES_KB`) :**
- 22 espèces couvertes avec rusticité, sol, NPK, taille, ravageurs, phénologie, porte-greffes
- `renderSpeciesKB()` + 7 sous-composants dans chaque fiche sujet
- `getKBAlerts()` → alertes ravageurs & taille dans le tableau de bord
- 48 nouvelles clés i18n × 5 langues

**Diagnostic phytosanitaire par photo :**
- `DIAG_CATALOGUE` : 19 conditions (6 insectes, 5 champignons, 5 carences, 3 virus/bactéries)
- FAB flottant 🔬 dans chaque fiche → panneau slide-up 3 étapes
- Moteur heuristique `diagnoseLocal()` : portes d'exclusion strictes (`requireZones`, `requireSymptom`), plafonds `confCap` par catégorie (virus ≤ 30 % absolu), seuil minimal 0,38, bonus âge foliaire pour carences Fe/Mg
- Moteur IA `diagnoseClaude()` : Claude Vision API `claude-opus-4-6`, clé Anthropic chiffrée XOR
- `DIAG_SOURCES` : 45 liens vers EPPO, EFSA, ANSES, CABI, UCR-CVC, USDA APHIS — affichés dans chaque résultat avec avertissement "aide à l'identification, vérification humaine requise"
- Sélecteur âge feuilles (jeunes / vieilles) en étape 2 pour affiner les carences
- `renderDiagHistory()` dans la fiche, badges 🔬 dans le journal
- 3 nouvelles entrées `HELP_CONTENT` (`brix`, `diagnostic`, `connaissances`) + `helpBtn()` placés dans l'UI
- 33 nouvelles clés i18n × 5 langues

**Suivi Brix & acidité :**
- Panneau `recolte-wrap` dans l'événement 🧺 Récolte
- °Brix, acidité titrable (g/L), ratio calculé en temps réel avec badge qualité
- 14 nouvelles clés i18n × 5 langues

### v7.3 — *Vue Emplacements, archive plan hivernage, i18n lune/météo* (mars 2026)

**Onglet « Vergers » → « Emplacements » :**
- Compteur et palette étendus aux pots en `location='extérieur'` (pas seulement pleine terre)
- `terrePlants` = `!isPot(p) || (isPot(p) && p.location==='extérieur')`

**Sélecteur de mode repositionné :**
- Barre `🗺 / ✏` déplacée **au-dessus de la carte** (avant `verger-wrap`) — pleine largeur, sans marges
- CSS `border-radius:0;border-bottom:1px solid var(--cream3)` — intégré naturellement dans la mise en page
- En mode Dessin : carte Leaflet masquée + détruite, `planMapHidden=true`, `vergerAddMode='draw'`
- Synchronisation automatique sur `jumpToParcelle` : freehand → Dessin, cadastral → Carte

**Archive du plan à la rentrée hivernage (`_archivePlanForPlant`) :**
- Déclenchée sur événement `hivernage` pour pots en `extérieur` avec position dans `planPositions`
- SVG 200×144px : boundary projetée + disque ambre proportionnel + nom de la plante
- Encodé base64 et stocké dans `ev.planArchive` (persisté, indépendant du plan courant)
- `renderHivernageHistory` affiche la vignette pour chaque saison archivée

**Internationalisation complète :**
- **Module lune** : 10 labels de phase + 10 conseils culturaux + 4 noms de phases clés → `T('misc.moon*')`
- **Échelle de Beaufort** : 13 niveaux (Calme → Ouragan) → `T('misc.bft0'–'bft12')`
- **Codes WMO météo** : 12 descriptions (Ciel dégagé → Orage) → `T('misc.wmo*')`
- **Divers météo** : `illuminé`, préfixe Beaufort, placeholder ville, bouton Réessayer
- Total : 301 appels `T('misc.*')` couverts dans les 5 langues (FR/EN/ES/IT/PT)

---

### v7.2 — *Tracé manuel, mode Vue/Édition, export enrichi* (mars 2026)

**Mode Vue / Édition :**
- `planViewMode` (bool) : Vue = lecture seule + boutons Modifier/Télécharger · Édition = palette + outils complets
- Transition Vue → Édition : `_enterPlanEditMode()` · Édition → Vue : `savePlanPositions()` → `_enterPlanViewMode()`
- Changement d'onglet (`jumpToParcelle`) → sauvegarde auto + reset `planViewMode=true`
- `_refreshPlanBottomBar()` : swap DOM sans re-render complet

**Mode ✏ Tracer (`_enterPlanDrawMode`) :**
- Chargement des points existants (freehand ou cadastral) pour modification
- Tap ajoute un sommet, tap sur sommet existant (14px) le supprime
- Fermeture : premier point ⊕, double-tap, ou 2e pression sur ✏ Valider
- Projection freehand : pass-through normalisé, flag `ap.freehand=true`

**Bouton ⬜ Effacer (`_clearPlanBoundary`) :**
- Confirmation utilisateur avec comptage des arbres positionnés
- Efface boundary + planPositions + push undo

**Export HTML enrichi (`exportPlanAsPNG`) :**
- Plan SVG ×2 avec badges numérotés injectés dynamiquement
- Légende : N° / espèce / variété / porte-greffe / Ø couronne
- Températures vécues (30 entrées) avec alertes gel
- Interventions 12 mois : fertilisation / traitement / taille
- `_calcSurface(boundary)` : Shoelace + correction cosinus Mercator

**Identification cadastrale améliorée :**
- Appels geo.api.gouv.fr + Nominatim en **parallèle** (`Promise.all`)
- Timeout 3s sur Nominatim (évite "Failed to fetch" sur mobile)
- `_pickParcelTargetId` : snapshot de la parcelle active au 1er appui 🏚 → "Appliquer" cible toujours le bon onglet
- Champ numéro pré-rempli avec l'auto-détection par point-in-polygon

**Bouton ? dans la barre de statut verger :** `showHelp('verger')` accessible sans quitter la vue.

---

### v7.1 — *Correction positionnement carte & robustesse cadastrale* (mars 2026)

**Problème résolu :** `vergerMap.getCenter()` retournait des coordonnées corrompues (ex. 48.18N/6.46E en Lorraine) même quand la carte affichait le bon endroit — les tuiles satellite étaient dans le cache navigateur, mais Leaflet était initialisé depuis une boundary corrompue stockée.

- **`initVergerMap` GPS-first** : démarrage systématique depuis la position GPS (`maximumAge:0`), boundary stockée appliquée *ensuite* si elle est cohérente avec la position GPS (distance < ~200 km)
- **Détection corruption** : si la boundary stockée est à plus de 200 km du GPS → toast `⚠ Périmètre stocké éloigné…` et la carte reste centrée sur le GPS
- **`_vergerResetPosition()`** : nouvelle fonction accessible via `⋯ → 📍 Recentrer sur ma position GPS` — recadre la carte sur le GPS en ignorant toute boundary ; permet de récupérer un état corrompu sans effacer les données
- **`vergerGPS()`** : ajout spinner sur le bouton + `maximumAge:0` (interdit les coordonnées GPS mises en cache)
- **Fallback GPS échoué** : si la géolocalisation échoue, `fitBounds` sur la boundary en dernier recours (comportement précédent conservé uniquement dans ce cas)

---

### v6.8.1 — *Correction i18n complète de renderNeedsGauges* (2026-03-17)

**Session de correction ciblée — aucune régression syntaxique.**

- **Bug principal corrigé** : `'auj.'` codé en dur → `T('misc.today')` dans `renderNeedsGauges()` — le label « aujourd'hui » dans la colonne 💧 Eau restait en français quelle que soit la langue sélectionnée
- **8 chaînes supplémentaires i18n-isées** dans la même fonction (clés existantes dans LANGS × 5 langues, non appelées) :
  - Pills statut : `T('misc.nvGelFatal')`, `T('misc.nvGelDmg')`, `T('misc.nvHeat')`, `T('misc.nvWaterUrgent')`, `T('misc.nvWarnGel')`, `T('misc.nvOk')`
  - Sous-labels colonnes : `T('misc.nvWaterSub')`, `T('misc.nvFertSub')`, `T('misc.nvTempSeuil')`
  - Badge résumé header : `T('misc.toWatch')`
  - Footer : `T('misc.nvFooter')` remplace le template mixte partiellement traduit
- **Audit post-correction** : Node.js `--check` PASS · backticks 1044 (pair ✓) · 238 fonctions · 0 doublon
- **Normalisation** : 13 lignes vides en excès supprimées (7924 → 7912 lignes)

*Document généré le 17 mars 2026 · Carnet de Collection Agrumes v7.3*
