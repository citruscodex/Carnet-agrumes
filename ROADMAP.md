# FEUILLE DE ROUTE CITRUSCODEX — État au 17 avril 2026

## Architecture actuelle

- **Monolithe** : `public/index.html` ~25 700 lignes
- **5 modules ES** : `public/src/modules/` — drip.js, phenology.js, wiki.js, substrats.js + migrations.js dans `src/lib/`
- **10 fichiers CSS** : `public/src/styles/` — base, dashboard, collection, calendar, pro, phenology, wiki, drip, bug, print
- **5 fichiers i18n** : `public/src/i18n/` — fr.json, en.json, it.json, es.json, pt.json
- **Backend Fastify** : `server/` — routes admin, bugs, training, bourse, orders + PostgreSQL
- **Serveur** : Scaleway DEV1-S (62.210.237.49), Caddy + Node.js, PostgreSQL
- **CI/CD** : GitHub Actions → build Vite → tar+scp → /var/www/cca/
- **Repo unique** : `carnet-agrumes/` (source de vérité)

---

## ✅ TERMINÉ

### Infrastructure
| Item | Détail |
|---|---|
| Repo unifié | `carnet-agrumes/` = repo git source unique, CI/CD fonctionnel |
| Déploiement | GitHub Actions → Vite build → tar+scp → citruscodex.fr |
| Serveur nettoyé | MediaWiki/MariaDB supprimés, 2.5 GB récupérés |
| Auth serveur | JWT, PostgreSQL users, login fonctionnel |
| Sync multi-appareils | Pull/push via /api/sync, chiffrement AES-GCM préservé |
| Backup PostgreSQL | pg_dump quotidien 3h00, rotation 30 fichiers, `/var/log/cca-backup.log` |
| GitHub Actions | actions/checkout@v5 + actions/setup-node@v5 (mis à jour avant échéance juin 2026) |
| Logo | Emoji 🍊 (SVG à faire quand graphiste disponible) |

### Features structurelles (F1-F11)
| Feature | Détail |
|---|---|
| F1 | Accession ID CCA-YYYY-NNNN |
| F2 | Précision de date (jour/mois/année/inconnu) |
| F3 | Provenance structurée (type, mode, production, détail) |
| F4 | Déterminations botaniques versionnées |
| F5 | Filtres avancés composables (7 champs × 5 opérateurs) |
| F6 | Export Excel XLSX via SheetJS |
| F7 | Export catalogue pépinière JSON/CSV |
| F8 | Workflows inter-modules + liste d'achats |
| F9 | Emplacement structuré (zone, section, position, GPS) |
| F10 | Mode lecture seule |
| F11 | APP_VERSION 3.0.0 + migrations idempotentes |

### Modules métier
| Module | Détail |
|---|---|
| Phénologie BBCH | 8 stades, 33 codes, barre interactive, Gantt, corrélation événements |
| Wiki | Offline-first + backend, catégories, historique, notes de bas de page |
| Observatoire | Carte Leaflet + stats saison/année + markers démo |
| Étiquettes QR | QRCode.js, format muséal 85×55mm, grille A4 |
| Export BGCI | CSV PlantSearch conforme |
| Irrigation goutte-à-goutte | Circuits partagés multi-plantes, calcul durée, alerte sur-arrosage |
| Substrats | 5 recettes pré-chargées, composants %, correction NPK |
| Boutures | Suivi lié au sujet source, statuts, taux de reprise |
| Lumière horticole | DLI = PPFD × heures × 0.0036, alerte insuffisant |

### Modules communautaires / backend
| Module | Détail |
|---|---|
| Bug tracker | FAB draggable, formulaire, vue membre, vue admin, queue offline |
| Admin panel | Stats globales, gestion utilisateurs (profil/rôle/désactiver), invitation beta, gestion bugs |
| Stages pépiniériste | CRUD stages, page publique inscription, email confirmation/annulation TEM, export CSV inscrits, message BCC inscrits |
| Bourse aux greffons | Offres/recherches anonymes (Membre #id), contact email via TEM, expiration 90j |
| Commandes groupées | Création, proximité GPS, rejoindre avec items, seuil franco, messagerie participants |

### Admin & sécurité
| Item | Détail |
|---|---|
| Switch profil | Réservé à tristan.peyrotty@gmail.com uniquement |
| Profil verrouillé | Badge non-éditable pour les membres, source de vérité serveur |
| Notifications BBCH | Changement de stade uniquement (pas quotidien) |
| Guide aide | ~60 helpBtn, HELP_CONTENT FR+EN, aide.html 17 sections + FAQ |
| Rate limiting login | In-memory Map, 5 tentatives/15min/IP, x-forwarded-for Caddy |

### Scaleway TEM (emails)
| Item | Détail |
|---|---|
| Configuration TEM | Fonctionnel pour stages, bourse, auth |
| SPF | `include:_spf.tem.scaleway.com` ✅ |
| DKIM | Vérifié Scaleway (status Verified, réputation 100) ✅ |
| DMARC | `p=quarantine` ✅ |
| Emails bienvenue | POST /api/admin/invite → sendMail() template HTML |
| Emails reset password | POST /api/auth/forgot + reset → TEM |
| Emails inscription stage | Confirmation + annulation inscrit + notification organisateur |

### Phase 2 extraction — COMPLÈTE
| Étape | Détail |
|---|---|
| i18n → JSON | 5 fichiers, -4 340 lignes du monolithe |
| CSS → fichiers | 10 fichiers, -1 405 lignes du monolithe |
| onclick → data-action | 115 handlers migrés. ~547 inline restants — basse priorité post-beta |

### Version locale testable
| Item | Détail |
|---|---|
| IS_LOCAL bypass | `const IS_LOCAL` hostname-strict. Config localStorage auto + launchApp() direct |
| Mock fetch | Tous les endpoints `/api/*` mockés en localhost |
| Bannière | "MODE LOCAL — données localStorage uniquement — backend mocké" |

### Tests Playwright — 21/21 ✅
| Suite | Tests |
|---|---|
| layout.spec.js | 5 tests : structure app, bannière IS_LOCAL, nav, titre, #app flex |
| i18n.spec.js | 5 tests : 5 langues, clés fr, pas de double-wrap, cohérence fr/en, type objet |
| navigation.spec.js | 5 tests : showPage() 5 pages, bouton actif, zéro erreur critique |
| collection.spec.js | 3 tests : page collection, #main rempli, aller-retour dashboard |
| phenology.spec.js | 3 tests : module chargé, page sans erreur, stades BBCH |

### BETA_PUBLIC — TOUS TERMINÉS ✅ (2026-04-17)

#### Chantiers bloquants
| Chantier | Description |
|---|---|
| 1 — Pages légales | cgu.html, confidentialite.html, mentions-legales.html, changelog.html → 200 sur prod |
| 2 — Inscription invitation | POST /api/auth/register + code XXXX-XXXX + email vérification |
| 3 — Mot de passe oublié | POST /api/auth/forgot + reset + email TEM |
| 4 — Suppression compte RGPD | DELETE /api/auth/account (cascade 14 tables) |
| 5 — Changement mot de passe | PUT /api/auth/change-password |
| 8 — Rate limiting login | 5/15min/IP, x-forwarded-for Caddy |
| 9 — SPF/DKIM/DMARC | SPF ✅ DKIM ✅ réputation 100 DMARC ✅ p=quarantine |

#### Chantiers importants
| Chantier | Description |
|---|---|
| 6 — Onboarding | Écran bienvenue compte 0 plantes (ajout, wiki, bourse, observatoire, Passer) |
| 7 — Page 404 | 404.html custom CitrusCodex. Caddy handle_errors configuré. |
| 10 — Landing page | Login enrichi : grille 6 features marketing |
| 15 — Export RGPD | GET /api/auth/export-data → JSON + bouton dans Réglages → Sécurité |
| 13 — Health check | GET /api/health → `{"status":"ok","version":"3.1.0","db":"connected","uptime":...}` |

#### Chantiers souhaitables
| Chantier | Description |
|---|---|
| 11 — Feedback | UI étoiles ★★★★★ + textarea dans Réglages. POST /api/user-ratings. |
| 12 — Changelog | /changelog.html (v3.0 + v3.1). Lien dans Réglages. |
| 14 — Analytics | Plausible.io dans `<head>` (RGPD-safe, sans cookies) |

### Corrections 16A–16H — TOUS TERMINÉS ✅
| Chantier | Description |
|---|---|
| 16A — Couleurs | 25 occurrences btn-g → btn-o sur fonds clairs |
| 16B — Stages inscrits | Modal inscrits + CSV export + bouton 📧 Message BCC inscrits confirmés |
| 16C — Titre stage | training.html `<title>` + og:title dynamiques avec organisateur + date |
| 16D — Emails stages | Notifications organisateur à l'inscription + annulation. Confirmation inscrit. |
| 16E — Stats admin | 8 cards cliquables avec filtres auto |
| 16F — Désactivation | PUT /api/admin/users/:id/active testé OK |
| 16G — Bourse anonymat | Affiche "Membre #id" (ou "Vous"). Bouton Contacter masqué sur ses propres annonces. |
| 16H — Wiki navigation | Breadcrumb titre article. `_wikiNavStack` pour ← Retour depuis recherche. |

---

## 🚀 POST-BETA (à partir de fin avril 2026)

### Priorité absolue — corrections retours testeurs
> Ordre des priorités selon les remontées. Inconnu avant réception des feedbacks.

### Feature validée pour après beta
| Feature | Profil cible | Description |
|---|---|---|
| Module réservation jeunes plants greffés | Pépiniériste | Stock par variété, réservations clients, alertes disponibilité, workflow validation |

### Optionnel
| Item | Détail | Priorité |
|---|---|---|
| onclick migration complète | ~547 handlers inline restants (calendar, pro, settings, community, admin) | Basse |
| Dark mode complet | Couverture CSS incomplète sur les nouveaux modules | Basse |
| Photos Object Storage | Migrer de GitHub vers Scaleway Object Storage (nécessite bucket) | Basse |

---

## ⏳ BACKLOG (non priorisé)

| Item | Détail |
|---|---|
| Logo SVG professionnel | Remplacer l'emoji 🍊 par un vrai logo vectoriel (nécessite graphiste) |
| Observatoire enrichi | Données d'acclimatation réelles — dépend du volume de données utilisateurs |
| Notifications push serveur | BBCH changement de stade via web-push (infrastructure VAPID en place) |
| Performance monolithe | ~25 700 lignes — extraction JS progressive vers modules ES |

---

## 📊 MÉTRIQUES

| Métrique | Valeur |
|---|---|
| Monolithe index.html | ~25 700 lignes |
| Modules ES extraits | 5 fichiers |
| Fichiers CSS extraits | 10 fichiers |
| Fichiers i18n | 5 fichiers JSON |
| Tests Playwright | 21/21 passés |
| Routes backend | ~45 endpoints |
| Tables PostgreSQL | users, invitation_codes, sync_stores, bug_reports, training_sessions, training_registrations, graft_exchange, graft_messages, group_orders, group_order_participants, group_order_messages, wiki_*, observations, audit_log, user_ratings, push_subscriptions (~20 tables) |
| Utilisateurs en base | 5 (comptes tests) |
| Build size | ~1 689 KB HTML + 79 KB JS |
| Langues supportées | FR, EN, IT, ES, PT |
| Profils | Collectionneur, Pépiniériste, Arboriculteur, Conservatoire |

---

## 🔑 IDENTIFIANTS

| Compte | Email | Rôle | Profil |
|---|---|---|---|
| Admin | tristan.peyrotty@gmail.com | admin | collectionneur (switchable) |
| Prod | citruscodex.fr | — | — |
| Serveur | root@62.210.237.49 | — | — |
| BDD | cca@ccadb | — | — |
