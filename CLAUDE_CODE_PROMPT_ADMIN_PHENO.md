# CLAUDE CODE — Logo + Admin Profils + Phénologie Enrichie + Sync Profil

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt couvre 4 chantiers. Le chantier 0 (logo) est la **priorité absolue** — à exécuter en premier.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement — zéro `onclick` inline
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues (FR/EN/IT/ES/PT)
- `node --check` après chaque modification
- Backend Fastify + PostgreSQL (Scaleway)

---

## CHANTIER 0 — PRIORITÉ ABSOLUE — Intégration du logo CitrusCodex

### Fichier source
`citruscodex-logo.jpg` (302×353px) à la racine du projet. C'est le **logo officiel** de l'application — il représente l'image de marque et doit être rendu pixel-perfect dans toutes les tailles et sur tous les supports.

### Déclinaisons à générer

À partir du fichier source, générer via `sharp` ou `jimp` (ou manuellement) les déclinaisons suivantes dans `public/assets/logo/` :

```
public/assets/logo/
├── citruscodex-logo.png          ← source PNG haute qualité (302×353)
├── citruscodex-logo-192.png      ← 192×192 (PWA manifest, icône mobile)
├── citruscodex-logo-512.png      ← 512×512 (PWA manifest, splash)
├── citruscodex-logo-180.png      ← 180×180 (apple-touch-icon)
├── citruscodex-logo-64.png       ← 64×64 (favicon, topbar)
├── citruscodex-logo-32.png       ← 32×32 (favicon classique)
├── citruscodex-logo-16.png       ← 16×16 (favicon mini)
├── favicon.ico                    ← multi-size (16+32+48)
└── citruscodex-logo-email.png    ← 120×140 (header emails transactionnels)
```

**CRITIQUE — règle de redimensionnement :**
- Le logo n'est PAS carré (302×353, ratio ~0.856). Pour les formats carrés (192×192, 512×512, etc.), centrer le logo sur fond transparent avec padding proportionnel — **ne jamais déformer ni recadrer**.
- Utiliser un redimensionnement bicubique ou Lanczos pour des contours nets à toutes les tailles.
- Le résultat doit être **strictement visuellement et proportionnellement identique** au modèle original.

### Intégration dans l'app

#### 1. Favicon + PWA manifest

```html
<!-- Dans <head> de index.html -->
<link rel="icon" type="image/png" sizes="32x32" href="/assets/logo/citruscodex-logo-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/logo/citruscodex-logo-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/logo/citruscodex-logo-180.png">
```

```json
// Dans manifest.json
{
  "icons": [
    { "src": "/assets/logo/citruscodex-logo-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/logo/citruscodex-logo-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### 2. Topbar / Header de l'application

Remplacer le texte/icône actuel du header par le logo :

```html
<img src="/assets/logo/citruscodex-logo-64.png" 
     alt="CitrusCodex" 
     class="cca-logo-topbar"
     width="28" height="32">
```

```css
.cca-logo-topbar {
  width: 28px;
  height: auto;  /* préserve le ratio */
  object-fit: contain;
  margin-right: 8px;
  vertical-align: middle;
}
```

#### 3. Écran de login / splash

Le logo 512px centré sur l'écran de connexion beta :

```css
.cca-logo-splash {
  width: 120px;
  height: auto;
  margin: 0 auto 24px;
  display: block;
}
```

#### 4. Exports PDF (fiches plantes, rapports collection, phytosanitaire, lots)

Dans toutes les fonctions `_pdfHeader()` et exports PDF, remplacer le texte "CitrusCodex" par le logo inline en base64 :

```js
// Pré-encoder le logo en base64 au chargement
const LOGO_BASE64 = await fetchLogoBase64('/assets/logo/citruscodex-logo-email.png');

// Dans _pdfHeader() :
<img src="${LOGO_BASE64}" style="height:36px;width:auto" alt="CitrusCodex">
```

**Ne pas utiliser une URL externe dans les PDF** — les PDF ouverts en HTML offline n'auraient pas accès au fichier. Utiliser systématiquement le base64 inline.

#### 5. Étiquettes muséales

Dans `_consLabelPDF()`, remplacer la mention texte "CitrusCodex · citruscodex.fr" par le logo 32px + texte :

```html
<img src="${LOGO_BASE64}" style="height:14px;width:auto;vertical-align:middle"> citruscodex.fr
```

#### 6. Emails transactionnels (si Scaleway TEM configuré)

Header d'email avec le logo 120×140 :

```html
<img src="https://citruscodex.fr/assets/logo/citruscodex-logo-email.png" 
     alt="CitrusCodex" width="60" height="70" 
     style="display:block;margin:0 auto 16px">
```

#### 7. Export PPTX / présentations (si applicable)

Le logo doit être disponible comme constante globale pour tout futur export nécessitant l'image de marque.

### Validation chantier 0

- [ ] Toutes les déclinaisons générées dans `public/assets/logo/`
- [ ] Favicon visible dans l'onglet navigateur
- [ ] Logo visible dans la topbar (28px, ratio préservé)
- [ ] Logo visible sur l'écran de login (120px)
- [ ] Logo visible dans les exports PDF (base64 inline, pas d'URL externe)
- [ ] Logo visible dans les étiquettes muséales
- [ ] manifest.json mis à jour avec les icônes 192 et 512
- [ ] `npm run build` OK

**Gate : ne pas passer aux chantiers suivants tant que le logo n'est pas intégré partout.**

---

## CHANTIER 1 — Verrouillage du profil + Sync

### Problème
Le `profileType` est stocké dans `localStorage('agrumes_profile')` — chaque appareil a sa propre valeur. Un utilisateur peut avoir "pépiniériste" sur PC et "collectionneur" sur mobile. Le profil doit être **autoritatif côté serveur**.

### Solution

#### 1A — Le profileType est piloté par le serveur

Le champ `profileType` dans la table `users` du backend est la **source de vérité**.

```sql
ALTER TABLE users ADD COLUMN profile_type VARCHAR(30) DEFAULT 'collectionneur';
-- Valeurs : collectionneur, pepinieriste, arboriculteur, conservatoire
```

Au login, la réponse `/api/auth/login` inclut `profile_type`. Le frontend le stocke localement mais **ne permet pas de le modifier** :

```js
// Au login réussi :
const profile = getProfile();
profile.profileType = loginResponse.profile_type;
saveProfile(profile);
```

#### 1B — Suppression du select profileType côté membre

Dans `renderSettings()` → onglet Profil :
- **Supprimer le `<select>` profileType** pour les membres
- Remplacer par un **badge non-éditable** affichant le profil courant :
  ```html
  <div class="cca-profile-badge">
    <span class="cca-profile-icon">{icon}</span>
    <span>{T('profile.type.' + profileType)}</span>
    <span class="cca-profile-locked">🔒</span>
  </div>
  <div class="cca-profile-hint">{T('profile.lockedHint')}</div>
  ```
- Le hint explique : "Votre type de profil est géré par l'administrateur. Contactez-le pour le modifier."

#### 1C — Sync du profil dans le Gist

Ajouter `profileType` aux données synchronisées via le Gist (sans toucher au chiffrement AES-GCM existant — juste ajouter le champ dans le payload avant chiffrement). **ATTENTION zone protégée AES-GCM :** ne modifier que le contenu du payload, pas le mécanisme de chiffrement/déchiffrement.

Concrètement : dans la fonction qui prépare les données à synchroniser, inclure `profileType` dans l'objet. Au téléchargement, écraser le `profileType` local par celui du Gist **seulement si le serveur n'est pas joignable** (le serveur reste la source de vérité principale).

---

## CHANTIER 2 — Panel Admin Gestion des Utilisateurs

### Route backend

```
GET    /api/admin/users             → liste tous les utilisateurs (admin only)
PUT    /api/admin/users/:id/profile → { profile_type: 'pepinieriste' } (admin only)
GET    /api/admin/users/:id         → détail utilisateur (admin only)
DELETE /api/admin/users/:id         → désactiver un compte (admin only, soft delete)
```

Middleware : vérifier `req.user.role === 'admin'` sur toutes les routes `/api/admin/*`.

### Frontend — Page admin

Accessible uniquement si `getProfile().role === 'admin'` (rôle reçu au login).

Navigation : ajouter un item "⚙ Admin" dans la navbar, visible uniquement pour les admins.

```
┌──────────────────────────────────────────────────┐
│ 👥 Gestion des utilisateurs                      │
├──────────────────────────────────────────────────┤
│ 🔍 Recherche...                                  │
├──────────────────────────────────────────────────┤
│ user@email.com                                   │
│ Profil : [Collectionneur ▾]    Rôle : [member ▾] │
│ Inscrit le : 2026-03-15       Dernière connexion │
│ Sujets : 45    Événements : 230                  │
│ [Désactiver le compte]                           │
├──────────────────────────────────────────────────┤
│ user2@email.com                                  │
│ Profil : [Pépiniériste ▾]     Rôle : [editor ▾]  │
│ ...                                               │
└──────────────────────────────────────────────────┘
```

Fonctionnalités admin :
- **Changer le profileType** d'un utilisateur via select → PUT /api/admin/users/:id/profile
- **Changer le rôle** (member/editor/moderator/admin) → PUT /api/admin/users/:id/role
- **Désactiver un compte** → soft delete (champ `disabled_at` non null)
- **Voir les stats** : nombre de sujets, événements, dernière connexion
- **Filtrer** par profil, rôle, statut (actif/désactivé)
- **Inviter un beta-testeur** (voir ci-dessous)

### Gestion des beta-testeurs

Le script `adduser.js` existe déjà sur le serveur (`/opt/cca/adduser.js`) mais nécessite un accès SSH. L'admin doit pouvoir ajouter des testeurs **directement depuis l'interface**.

#### Route backend

```
POST   /api/admin/invite    → { email, password, profile_type } (admin only)
```

Logique serveur :
1. Vérifier que l'email n'existe pas déjà
2. Hasher le mot de passe via bcrypt (12 rounds)
3. Insérer dans la table `users` avec `profile_type` et `role: 'member'`
4. Optionnel : envoyer un email de bienvenue via Scaleway TEM si configuré (sinon skip silencieusement)
5. Retourner `{ id, email, profile_type }`

#### Frontend — Bloc invitation dans la page admin

```
┌──────────────────────────────────────────────────┐
│ ✉ Inviter un beta-testeur                        │
├──────────────────────────────────────────────────┤
│ Email :     [________________________]           │
│ Mot de passe : [____________________]  [🎲 Générer]│
│ Profil :    [Collectionneur ▾]                   │
│                                                   │
│ [Créer le compte]                                │
│                                                   │
│ Derniers invités :                                │
│ ✅ beta1@test.fr — Collectionneur — 14/04/2026   │
│ ✅ beta2@test.fr — Pépiniériste — 12/04/2026     │
└──────────────────────────────────────────────────┘
```

Fonctionnalités :
- Bouton 🎲 "Générer" → crée un mot de passe aléatoire 12 chars (majuscules, minuscules, chiffres) et l'affiche en clair pour que l'admin puisse le communiquer au testeur
- Select profil : collectionneur / pepinieriste / arboriculteur / conservatoire
- Après création → toast "Compte créé ✓" + ajout dans la liste "Derniers invités"
- La liste des derniers invités = les 10 utilisateurs les plus récemment créés (GET /api/admin/users?sort=created_at&limit=10)

#### Sécurité invitation
- Email validé côté serveur (regex basique + unicité)
- Mot de passe minimum 8 caractères
- Rate limiting : 20 invitations/jour/admin
- L'email ne doit pas contenir de caractères dangereux (sanitization)

### Sécurité générale
- Le changement de rôle admin → admin est interdit (un admin ne peut pas se retirer son propre rôle)
- Le endpoint vérifie le JWT + le rôle admin côté serveur — le frontend ne fait que l'UI
- Rate limiting : 30 requêtes/min sur les routes admin

---

## CHANTIER 3 — Phénologie BBCH enrichie et interactive

### Problème
Le module phénologie (BBCH_STAGES, 8 stades principaux, 33 codes secondaires) a été implémenté mais n'est pas suffisamment visible dans l'UI. Les événements enregistrés sur les fiches sujets ne sont pas corrélés aux stades phénologiques.

### 3A — Widget dashboard enrichi

Le widget `renderPhenologyWidget(plant)` actuel est trop compact. L'enrichir :

```
┌──────────────────────────────────────────────────┐
│ 🌸 Floraison (BBCH 65)          C. sinensis     │
│ ▰▰▰▰▰▰▰▰▰▱▱▱ 65%                               │
│ │00│10│31│51│60●65│71│81│91│                      │
│                                                   │
│ 📋 Pleine floraison : ~50% des fleurs ouvertes   │
│ 💧 Irrigation : Critique — ne pas manquer         │
│ ✂️ Taille : Interdit                              │
│ 🧪 Gibbérellines recommandées (nouaison)          │
│                                                   │
│ 📅 Événements liés à ce stade :                   │
│   🌸 Floraison observée — 12/04/2026             │
│   💧 Arrosage — 10/04/2026                        │
│ ▶ Prochain : Développement du fruit (~120 GJC)    │
└──────────────────────────────────────────────────┘
```

### 3B — Barre phénologique interactive (clic sur stade)

La barre BBCH avec les 8 markers doit être **cliquable**. Au clic sur un marker :

1. Expand un panneau sous la barre montrant les **codes secondaires** du stade cliqué
2. Les codes secondaires s'affichent en liste verticale avec :
   - Code BBCH
   - Description (T(i18nKey))
   - Indicateur : ● si c'est le stade courant, ○ sinon
3. Le panneau se referme au clic sur un autre stade ou sur le même (toggle)

```
│00│10│31│51│ ●60 │71│81│91│   ← clic sur 60
    ┌─────────────────────────────┐
    │ 60  Premières fleurs ouvertes         ○ │
    │ 61  Début floraison (~10%)            ○ │
    │ 65  Pleine floraison (~50%)           ● │ ← courant
    │ 67  Floraison s'achève                ○ │
    │ 69  Fin de floraison                  ○ │
    └─────────────────────────────┘
```

CSS animation : slide-down 200ms.

### 3C — Corrélation événements × stades phénologiques

Chaque événement enregistré sur une fiche plante a une date. À partir de la date, on peut calculer le GJC accumulé à cette date (via `estimateGJCFromDate` ou les données météo réelles) et donc retrouver le stade BBCH correspondant.

#### Enrichissement des événements existants

Pour chaque événement de la plante :
```js
const gjcAtEvent = estimateGJCFromDate(plant.lat || profileLat, event.date, 13);
const phenoAtEvent = getPhenologyForSpecies(plant.species, gjcAtEvent);
event._bbchCode = phenoAtEvent.secondaryCode;  // calculé à la volée, pas stocké
event._bbchStage = phenoAtEvent.principal.stage;
```

**Ne PAS stocker dans l'événement** — calculer à la volée à l'affichage.

#### Affichage dans la vue détail phénologie

Dans `renderPhenologyDetail(plant)`, après les sous-stades du stade courant, ajouter une section :

```
┌──────────────────────────────────────────────────┐
│ 📅 Événements liés à ce stade                    │
├──────────────────────────────────────────────────┤
│ Stade 6 — Floraison (BBCH 60-69)                │
│                                                   │
│ 🌸 Floraison constatée     12/04/2026  BBCH 65   │
│ 💧 Arrosage                10/04/2026  BBCH 63   │
│ 🧪 Traitement préventif    08/04/2026  BBCH 61   │
│                                                   │
│ Stade 7 — Développement du fruit (BBCH 71-79)   │
│ (aucun événement pour ce stade)                  │
└──────────────────────────────────────────────────┘
```

Logique : filtrer `plant.events` par date, calculer le BBCH de chaque événement, grouper par stade principal, afficher dans la section du stade correspondant.

#### Affichage parallèle dans le Gantt

Dans `renderPhenologyCalendar(plant)`, superposer les événements de la plante sur le Gantt :

- Chaque événement = un petit losange (◆) positionné sur l'axe des mois
- Couleur selon le type d'événement (arrosage=bleu, floraison=rose, taille=vert, traitement=rouge)
- Tooltip au survol : type + date + code BBCH calculé

### 3D — Fiche plante — Section phénologie visible

S'assurer que l'onglet Phénologie est bien visible dans la fiche plante. Vérifier :
1. L'onglet existe dans le système d'onglets de `renderDetail()`
2. Il est positionné après les onglets principaux (Identité, Événements, Photos)
3. Il contient `renderPhenologyDetail(plant)` + `renderPhenologyCalendar(plant)`
4. Il est conditionné à `plant.species` renseigné

Si l'onglet n'est pas visible (le signalement dit qu'il ne l'est pas), investiguer :
- Le placeholder `<div id="cca-pheno-det">` est-il injecté dans `renderDetail()` ?
- La fonction `_mountPheno('detail')` est-elle appelée dans `render()` après le rendu de la fiche ?
- Le module `phenology.js` est-il bien importé et `window.__CCA_phenology` défini ?

---

## i18n

```
profile.type.collectionneur  → "Collectionneur" / "Collector" / "Collezionista" / "Coleccionista" / "Colecionador"
profile.type.pepinieriste    → "Pépiniériste" / "Nurseryman" / "Vivaista" / "Viverista" / "Viveirista"
profile.type.arboriculteur   → "Arboriculteur" / "Orchardist" / "Arboricolttore" / "Arboricultor" / "Arboricultor"
profile.type.conservatoire   → "Conservatoire" / "Conservatory" / "Conservatorio" / "Conservatorio" / "Conservatório"
profile.lockedHint           → "Type de profil géré par l'administrateur" / "Profile type managed by administrator" / "Tipo di profilo gestito dall'amministratore" / "Tipo de perfil gestionado por el administrador" / "Tipo de perfil gerido pelo administrador"
profile.locked               → "Verrouillé" / "Locked" / "Bloccato" / "Bloqueado" / "Bloqueado"

admin.nav                    → "Admin" / "Admin" / "Admin" / "Admin" / "Admin"
admin.users                  → "Gestion des utilisateurs" / "User management" / "Gestione utenti" / "Gestión de usuarios" / "Gestão de utilizadores"
admin.changeProfile          → "Changer le profil" / "Change profile" / "Cambia profilo" / "Cambiar perfil" / "Alterar perfil"
admin.changeRole             → "Changer le rôle" / "Change role" / "Cambia ruolo" / "Cambiar rol" / "Alterar papel"
admin.disable                → "Désactiver le compte" / "Disable account" / "Disattiva account" / "Desactivar cuenta" / "Desativar conta"
admin.lastLogin              → "Dernière connexion" / "Last login" / "Ultimo accesso" / "Último inicio de sesión" / "Último login"
admin.subjects               → "Sujets" / "Subjects" / "Soggetti" / "Sujetos" / "Sujeitos"

pheno.events.title           → "Événements liés à ce stade" / "Events related to this stage" / "Eventi legati a questo stadio" / "Eventos relacionados con este estadio" / "Eventos relacionados com este estádio"
pheno.events.none            → "Aucun événement pour ce stade" / "No events for this stage" / "Nessun evento per questo stadio" / "Sin eventos para este estadio" / "Sem eventos para este estádio"
pheno.expand                 → "Voir les sous-stades" / "See sub-stages" / "Vedi sotto-stadi" / "Ver sub-estadios" / "Ver sub-estádios"
pheno.collapse               → "Masquer" / "Hide" / "Nascondi" / "Ocultar" / "Ocultar"
```

---

## Ordre d'exécution

1. **Chantier 1** — Verrouillage profileType (backend + frontend)
2. **Chantier 2** — Panel admin gestion utilisateurs
3. **Chantier 3** — Phénologie enrichie (widget, barre interactive, corrélation événements)

Gate `node --check` + `npm run build` entre chaque chantier.

## Validation

Chantier 1 :
- Login → profileType reçu du serveur, stocké localement
- Réglages → badge profil non-éditable (pas de select)
- Sync Gist → profileType inclus dans le payload

Chantier 2 :
- Admin → liste des utilisateurs affichée
- Changer le profil d'un utilisateur → prise en compte immédiate
- Membre non-admin → page admin inaccessible (404 ou redirect)

Chantier 3 :
- Dashboard → widget phéno avec actions, régulateurs, événements liés
- Barre BBCH → clic sur un stade → sous-stades visibles en slide-down
- Vue détail phéno → événements groupés par stade BBCH
- Gantt → losanges événements superposés sur les barres de stades
- Onglet Phénologie visible dans la fiche plante si species renseigné
