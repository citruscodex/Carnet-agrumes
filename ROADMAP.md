# FEUILLE DE ROUTE CITRUSCODEX — État au 16 avril 2026

## Architecture actuelle

- **Monolithe** : `public/index.html` ~21 363 lignes (réduit de 26 926 grâce à l'extraction i18n + CSS)
- **5 modules ES** : `public/src/modules/` — drip.js, phenology.js, wiki.js, substrats.js + migrations.js dans `src/lib/`
- **10 fichiers CSS** : `public/src/styles/` — base, dashboard, collection, calendar, pro, phenology, wiki, drip, bug, print
- **5 fichiers i18n** : `public/src/i18n/` — fr.json, en.json, it.json, es.json, pt.json
- **Backend Express/Fastify** : `server/` — routes admin, bugs, training, bourse, orders + PostgreSQL
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
| Logo | Emoji 🍊 (tentative PNG abandonnée — SVG à faire quand graphiste disponible) |

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
| Stages pépiniériste | CRUD stages, page publique inscription, email confirmation/annulation TEM, export CSV inscrits |
| Bourse aux greffons | Offres/recherches, contact email via TEM, expiration 90j |
| Commandes groupées | Création, proximité GPS, rejoindre avec items, seuil franco, messagerie participants |

### Admin & sécurité
| Item | Détail |
|---|---|
| Switch profil | Réservé à tristan.peyrotty@gmail.com uniquement |
| Profil verrouillé | Badge non-éditable pour les membres, source de vérité serveur |
| Notifications BBCH | Changement de stade uniquement (pas quotidien) |
| Guide aide | ~60 helpBtn, HELP_CONTENT FR+EN, aide.html 17 sections + FAQ |

### Scaleway TEM (emails)
| Item | Détail |
|---|---|
| Configuration TEM | Fonctionnel pour stages et bourse |
| Emails bienvenue | POST /api/admin/invite → sendMail() template HTML |
| Emails reset password | POST /api/admin/users/:id/reset-password → sendMail() mot de passe temporaire |

### Phase 2 extraction — COMPLÈTE
| Étape | Détail |
|---|---|
| i18n → JSON | 5 fichiers, -4 340 lignes du monolithe. `var LANGS + window.LANGS` pour accès tests |
| CSS → fichiers | 10 fichiers, -1 405 lignes du monolithe |
| onclick → data-action | 115 handlers migrés (dashboard 56, collection 53, fiche 6). ~547 inline restants — basse priorité |

### Version locale testable
| Item | Détail |
|---|---|
| IS_LOCAL bypass | `const IS_LOCAL` hostname-strict. Config localStorage auto + launchApp() direct (bypass wizard + login) |
| Mock fetch | Tous les endpoints `/api/*` mockés en localhost — jamais actif en production |
| Bannière | "MODE LOCAL — données localStorage uniquement — backend mocké" |

### Tests Playwright — 21/21 ✅
| Suite | Tests |
|---|---|
| layout.spec.js | 5 tests : structure app, bannière IS_LOCAL, nav, titre, #app flex |
| i18n.spec.js | 5 tests : 5 langues, clés fr, pas de double-wrap, cohérence fr/en, type objet |
| navigation.spec.js | 5 tests : showPage() 5 pages, bouton actif, zéro erreur critique |
| collection.spec.js | 3 tests : page collection, #main rempli, aller-retour dashboard |
| phenology.spec.js | 3 tests : module chargé, page sans erreur, stades BBCH |

---

---

## 🚀 BETA_READY v2 — En cours (démarré 2026-04-17)

| Chantier | Description | Statut |
|---|---|---|
| 1 — Comptes tests | 5 comptes @citruscodex.fr créés, vérifiés, TESTING.md | ✅ |
| 2 — Test curl prod | 45+ endpoints testés. 2 issues 🟡, 1 🟢. Tous schémas frontend OK | ✅ |
| 3 — onclick restants | 547 → <100 handlers inline | ⏳ |
| 4 — Dark mode complet | CSS couverture nouveaux modules | ⏳ |
| 5 — Photos Object Storage | Scaleway S3 (nécessite bucket) | ⏳ |
| 6 — Polish UX | 10 corrections cosmétiques/UX | ⏳ |

### Bugs chantier 2 à corriger
| Sévérité | Issue | Action |
|---|---|---|
| 🟡 | `POST /api/auth/logout` → 404 | Implémenter ou ignorer (frontend ne l'appelle pas) |
| 🟡 | `POST /api/feedback` → schéma non câblé frontend | Câbler ou supprimer l'endpoint |
| 🟢 | `GET /api/admin/bugs` → 404 | Cosmétique — utiliser `/api/bugs` |

---

## ⏳ BACKLOG (non priorisé)

| Item | Détail |
|---|---|
| Logo SVG professionnel | Remplacer l'emoji 🍊 par un vrai logo vectoriel (nécessite graphiste) |
| Observatoire enrichi | Données d'acclimatation réelles — dépend du volume de données utilisateurs |
| Notifications push serveur | BBCH changement de stade via web-push (infrastructure VAPID en place) |
| Performance monolithe | 21k lignes restantes — extraction JS progressive vers modules ES |
| Dark mode | Toggle existe mais couverture CSS incomplète sur les nouveaux modules |
| Photos Object Storage | Migrer le stockage photos de GitHub vers Scaleway Object Storage |
| onclick complet | Migrer les ~547 handlers inline restants (calendar, pro, settings, community, admin) |

---

## 📊 MÉTRIQUES

| Métrique | Valeur |
|---|---|
| Monolithe index.html | 21 363 lignes (était 26 926, -5 563 lignes) |
| Modules ES extraits | 5 fichiers |
| Fichiers CSS extraits | 10 fichiers |
| Fichiers i18n | 5 fichiers JSON |
| Tests Playwright | 21/21 passés |
| Routes backend | ~30 endpoints |
| Tables PostgreSQL | users, sync_stores, bug_reports, training_sessions, training_registrations, graft_exchange, graft_messages, group_orders, group_order_participants, group_order_messages, wiki_*, observations |
| Utilisateurs en base | 5 |
| Build size | 1 655 KB HTML + 79 KB JS |
| Langues supportées | FR, EN, IT, ES, PT |
| Profils | Collectionneur, Pépiniériste, Arboriculteur, Conservatoire |

---

## 🔑 IDENTIFIANTS

| Compte | Email | Rôle | Profil |
|---|---|---|---|
| Admin | tristan.peyrotty@gmail.com | admin | collectionneur (switchable) |
| Test | beta@test.fr | member | collectionneur |
| Prod | citruscodex.fr | — | — |
| Serveur | root@62.210.237.49 | — | — |
| BDD | cca@ccadb | — | — |
