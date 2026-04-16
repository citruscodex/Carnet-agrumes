# ARCHITECTURE.md — CitrusCodex (CCA)

> Version : 2.1 · Dernière mise à jour : 2026-04-16
> Auteur : Architecture senior CitrusCodex

---

## 1. Vue d'ensemble

CitrusCodex est une PWA de gestion de collections d'agrumes ciblant 4 profils professionnels (Collectionneur, Pépiniériste, Arboriculteur, Conservatoire). L'application fonctionne en mode offline-first avec synchronisation serveur optionnelle.

### Stack technique

| Couche     | Technologie                           | Statut      |
|------------|---------------------------------------|-------------|
| Frontend   | Vanilla JS (monolithe `index.html`)   | Production  |
| Backend    | Fastify + PostgreSQL                  | Production  |
| Proxy      | Caddy (TLS automatique)              | Production  |
| Hébergement| Scaleway DEV1-S (62.210.237.49)       | Production  |
| CI/CD      | GitHub Actions → SSH deploy           | Production  |
| CDN        | GitHub Pages (`citruscodex.github.io`)| Staging     |

### Déploiement

```
main (push index.html) → GitHub Actions → SCP → /var/www/cca/ → citruscodex.fr
develop → GitHub Pages (staging)
```

---

## 2. Architecture Frontend

### 2.1. Structure actuelle (monolithe en cours de modularisation)

```
index.html (~25 700 lignes)
├── <style>          L.21–2093       CSS (~2 070 lignes)
├── <script QRCode>  L.20            Dépendance externe CDN
├── HTML statique    L.1260–1283     Navbar, conteneurs
├── i18n             L.1767–6200     5 langues (FR/EN/IT/ES/PT)
├── Données démo     L.6200–6500     Variétés pré-chargées, frost data
├── Modules JS       L.6500–24312    ~800 fonctions
│   ├── Store/CRUD   L.1284–1500     localStorage, collections
│   ├── Météo/geo    L.6500–6900
│   ├── Push notif   L.6500–6600
│   ├── Profils      L.8652–8730     PRO_PROFILES, setup, auth
│   ├── Routing      L.8828          showPage(), render()
│   ├── Dashboard    L.8900–9200     4 dashboards par profil
│   ├── Collection   L.9200–9600     Liste, filtres, sélection
│   ├── Plan/verger  L.9880–11400    Parcelles, SVG interactif
│   ├── Fiche sujet  L.11400–13550   Détail, galerie, historiques
│   ├── Événements   L.13550–14200   openAddEvent, submitEV
│   ├── Calendrier   L.14200–15400   Vue calendrier, événements
│   ├── Communauté   L.15400–16100   Wiki inline, observatoire
│   ├── Pro/Nursery  L.16100–18500   Pépinière, stocks, lots
│   ├── PDF/Export   L.18500–21500   PDF, étiquettes, partage
│   ├── Diagnostic   L.21500–23000   Plant.id, scoring
│   ├── Aide/Guide   L.21700–23600   Guide contextuel
│   └── Auth serveur L.24183–24312   JWT, sync, login
└── sw.js, manifest.json (fichiers séparés)

Modules ES extraits (public/src/modules/) :
├── drip.js          Irrigation goutte-à-goutte
├── phenology.js     Phénologie BBCH
└── wiki.js          Wiki offline-first
```

### 2.2. Patterns architecturaux

**Routing :** SPA mono-page, navigation via `showPage(name)` qui met à jour la variable globale `page` et appelle `render()`. Pages : `dashboard`, `collection`, `fert`, `eco`, `pro`, `community`, `settings`.

**État global :** Variables globales mutables (`plants`, `fertilizers`, `amendments`, etc.), persistées via localStorage avec clés préfixées `agrumes_*`.

**i18n :** Fonction `T(key)` accédant à `LANGS[currentLang]` via chemin pointé (`misc.collAddBtn` → `LANGS.fr.misc.collAddBtn`). 5 langues complètes.

**Profils :** `PRO_PROFILES = ['pepinieriste', 'arboriculteur', 'conservatoire']`. Le profil `collectionneur` est le défaut. `_updateNavbarForProfile()` contrôle la visibilité des onglets.

**Sécurité XSS :** Fonction `esc()` obligatoire pour tout contenu dynamique injecté via innerHTML.

**Modales :** `showModal(html)` / `closeModal()` — overlay avec contenu HTML arbitraire.

**Modules ES extraits :** S'exposent sur `window.__CCA_<nom>` pour interop avec le monolithe. CSS préfixé `cca-<nom>-*`.

### 2.3. Conventions de nommage

| Élément         | Convention                  | Exemple                    |
|-----------------|-----------------------------|----------------------------|
| Fonctions CRUD  | `load*` / `save*` / `get*ById` | `loadFerts()`, `saveFerts()` |
| Renderers       | `render*` / `_render*`      | `renderDash()`, `_renderObservatoire()` |
| Handlers UI     | `open*` / `close*` / `submit*` | `openAddEvent()`, `submitEV()` |
| Clés localStorage | `agrumes_*`              | `agrumes_v5`, `agrumes_cfg` |
| Clés i18n       | `section.key` via `T()`    | `T('misc.collAddSubjectBtn')` |
| CSS classes     | kebab-case, préfixe par module | `wiki-page-row`, `gel-alert-banner` |
| CSS variables   | `--name` dans `:root`      | `--g1`, `--cream`, `--amber` |

### 2.4. Dépendances externes (CDN)

| Lib           | Usage            | Chargement        |
|---------------|------------------|--------------------|
| QRCode.js     | QR codes         | Toujours           |
| Leaflet       | Cartes           | Lazy (verger/obs)  |
| Google Fonts  | Typographie      | Toujours           |
| Plant.id API  | Diagnostic photo | À la demande       |
| IGN Cadastre  | Parcelles        | À la demande       |

---

## 3. Architecture Backend

### 3.1. API Surface (Fastify)

```
/api/auth/login          POST    Email/password → JWT + refresh token
/api/auth/refresh        POST    Refresh token → nouveau JWT
/api/sync                GET     Pull toutes les clés utilisateur
/api/sync/:key           PUT     Push une clé utilisateur
/api/wiki                POST    Créer article
/api/wiki/:slug          GET     Lire article (?lang=xx)
/api/wiki/:slug          PUT     Modifier article
/api/wiki/:slug          DELETE  Supprimer article
/api/wiki/:slug/infobox  PUT     Modifier infobox
/api/wiki/:slug/revert/:rev POST Revert à une révision
/api/wiki/categories     GET     Liste des catégories
/api/observatoire/map    GET     Points géo agrégés
/api/observatoire/journal GET    Journal des observations
/api/observatoire/stats  GET     Statistiques trimestrielles
/api/observatoire        POST    Soumettre observation
/api/push/vapidkey       GET     Clé VAPID pour push notifications
/api/push/subscribe      POST    Enregistrer abonnement push
/api/push/test           POST    Tester notification push
/api/admin/users/:id/role PUT    Modifier rôle utilisateur (admin)
```

### 3.2. Authentification

- JWT avec expiration 15 min, refresh token longue durée
- Intercepteur `fetch` côté client : auto-retry sur 401 avec refresh transparent
- Rôles dans le payload JWT : `member`, `editor`, `moderator`, `admin`
- Token stocké en `sessionStorage` (pas localStorage, isolation onglets)

### 3.3. Synchronisation

Pattern : **localStorage-first, sync push/pull serveur**

1. Toute donnée est d'abord écrite en localStorage (source de vérité offline)
2. `_syncPush(key, value)` envoie au serveur en background
3. `_syncPull()` au login restaure les clés serveur → localStorage
4. Pas de résolution de conflits (last-write-wins)

---

## 4. Schéma de données

### 4.1. Clés localStorage

| Clé                     | Contenu                           |
|-------------------------|-----------------------------------|
| `agrumes_cfg`           | Configuration utilisateur, pwdHash |
| `agrumes_v5`            | Collection par défaut (array de plants) |
| `agrumes_v5_{collId}`   | Collections secondaires           |
| `agrumes_collections`   | Index des collections             |
| `agrumes_fertilizers`   | Profils d'engrais                 |
| `agrumes_amendments`    | Amendements                       |
| `agrumes_epandage`      | Entrées d'épandage                |
| `agrumes_saisonniers`   | Données saisonniers               |
| `agrumes_eco`           | Budget/économie                   |
| `agrumes_stocks`        | Stocks pépinière                  |
| `agrumes_lots`          | Lots de production                |
| `agrumes_nursery`       | Données pépinière                 |
| `agrumes_clients`       | Clients (pépiniériste)            |
| `agrumes_devis`         | Devis (pépiniériste)              |
| `agrumes_eau`           | Suivi consommation eau            |
| `agrumes_exchanges`     | Échanges/bourses                  |
| `agrumes_wishlist`      | Liste de souhaits                 |
| `agrumes_certifications`| Certifications                    |
| `agrumes_suppliers`     | Fournisseurs                      |
| `agrumes_sortis`        | Plantes sorties au soleil         |
| `agrumes_light`         | Suivi éclairage artificiel        |

### 4.2. Structure Plant (objet)

```javascript
{
  id: string,           // UUID généré par gid()
  name: string,         // Nom commun
  species: string,      // Nom scientifique
  variety: string,      // Cultivar
  origin: string,       // Origine
  dateAcquired: string, // Date ISO
  location: string,     // 'intérieur' | 'extérieur' | ...
  container: string,    // 'pot' | 'pleine terre'
  potSize: string,      // Diamètre en cm
  substrate: string,
  photo: string,        // URL GitHub raw
  events: Event[],      // Journal de culture
  notes: string,
  // ... ~30 champs additionnels
}
```

### 4.3. Structure Event (objet)

```javascript
{
  id: string,
  date: string,         // ISO date
  type: string,         // 'observation'|'arrosage'|'fertilisation'|'rempotage'|
                         // 'taille'|'traitement'|'floraison'|'fructification'|
                         // 'récolte'|'hivernage'|'sortie'|'protection'|
                         // 'modification'|'greffage'|'dégâts_gel'
  description: string,
  bulk: boolean,        // Action collective
  // Champs conditionnels par type :
  fertilizerId?: string, weightG?: number,         // fertilisation
  tailleType?: string, hauteurAvant?: number,       // taille
  ancienPot?: number, nouveauPot?: number,          // rempotage
  brix?: number, acidite?: number, qtyRecolte?: number, // récolte
  methode?: string, greffon?: string, porteGreffe?: string, // greffage
  phytoProduit?: string, phytoDAR?: number,         // traitement
}
```

---

## 5. Zones protégées (NE PAS MODIFIER)

| Zone                   | Raison                                          |
|------------------------|--------------------------------------------------|
| Pipeline phytosanitaire| Réglementaire, validé par des experts            |
| Chiffrement AES-GCM sync | Sécurité cryptographique critique             |
| `sumAppliedNPK()`      | Calcul agronomique validé                        |
| ServiceWorker (`sw.js`)| Cache strategy validée                           |
| Moteur PDF / export étiquettes | Logique de rendu validée               |

---

## 6. Feuille de route

### Phase 0 — Bugfixes (complétée)
- [x] Fix `misc.collAddBtn` → `misc.collAddSubjectBtn`
- [x] Fix TDZ `submitEV()` (déclarations graft déplacées)
- [x] Fix unicité parcelle/pleine terre
- [x] Filtres observatoire par type d'événement
- [x] Wiki : 404 gracieux avec option de création d'article
- [x] Audit UX — score 7.1/10, 5 recommandations implémentées
- [x] Nouveau logo transparent, multi-résolutions

### Phase 1 — Backend Auth & Bêta (en cours)
- [x] Whitelist emails bêta (inscription contrôlée)
- [x] Reset password par mail
- [x] Admin panel gestion profils/rôles
- [x] Système de feedback intégré
- [ ] Validation email avant première connexion
- [ ] Vérification sync push/pull optimale

### Phase 2 — Extraction modulaire (en cours)
- [x] Drip irrigation → `public/src/modules/drip.js`
- [x] Phénologie BBCH → `public/src/modules/phenology.js`
- [x] Wiki → `public/src/modules/wiki.js`
- [ ] i18n → fichiers JSON séparés
- [ ] CSS → modules par composant
- [ ] Remplacement inline onclick → addEventListener
- [ ] Tests Playwright (géométrie + fonctionnel)

### Phase 3 — Nouvelles fonctionnalités
- [ ] Profils de substrats
- [ ] Vue taxonomique phylogénétique
- [ ] Bourse aux greffons
- [ ] Gestion stocks avancée
- [ ] Catalogue public pépiniériste
- [ ] Suivi acclimatation communautaire
- [ ] Diagnostics améliorés (multi-sources)
- [ ] Archivage historiques annuels

---

## 7. Principes de développement

1. **Plan-before-code** : Toute modification est planifiée et approuvée avant implémentation.
2. **Patches ciblés** : Modifications chirurgicales, pas de réécriture globale.
3. **i18n exhaustif** : Toute nouvelle chaîne doit exister dans les 5 langues.
4. **XSS** : `esc()` sur tout contenu dynamique dans innerHTML.
5. **Zero dépendances** : Préférer vanilla JS ; `addEventListener` exclusivement.
6. **CSS variables** : Toute valeur dynamique ou thémable passe par custom properties.
7. **Offline-first** : Toute fonctionnalité doit avoir un fallback gracieux sans réseau.
8. **Profil-aware** : Vérifier `PRO_PROFILES` / `NURSERY_PROFILES` pour la visibilité des fonctionnalités.
