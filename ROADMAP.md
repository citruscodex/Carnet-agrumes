# FEUILLE DE ROUTE CITRUSCODEX — État au 16 avril 2026

## Architecture actuelle

- **Monolithe** : `public/index.html` ~21 181 lignes (réduit de 26 926 grâce à l'extraction i18n + CSS)
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

### Phase 2 extraction (partiel)
| Étape | Détail |
|---|---|
| i18n → JSON | ✅ 5 fichiers, -4 340 lignes du monolithe |
| CSS → fichiers | ✅ 10 fichiers, -1 405 lignes du monolithe |

---

## ⏳ EN COURS / À FAIRE

### Phase 2 extraction (suite)
| Étape | Priorité | Détail | Estimation |
|---|---|---|---|
| onclick → addEventListener | Basse | ~750 handlers → délégation d'événements, cible <100 restants | 1-2h |
| Tests Playwright | Basse | Layout, navigation, CRUD, phéno, i18n | 1h |

### Version locale testable
| Item | Priorité | Détail |
|---|---|---|
| Bypass auth localhost | Moyenne | Détecter localhost → injecter user test, mock des endpoints backend |

### Améliorations UX identifiées mais non priorisées
| Item | Détail |
|---|---|
| Logo SVG professionnel | Remplacer l'emoji 🍊 par un vrai logo vectoriel (nécessite graphiste) |
| Observatoire enrichi | Données d'acclimatation réelles (floraison par région, zones gel, GJC régionaux) — dépend du volume de données utilisateurs |
| Notifications push serveur | BBCH changement de stade via web-push (infrastructure VAPID en place) |
| Performance monolithe | Le fichier fait encore 21k lignes — extraction JS progressive vers modules ES |
| Dark mode | Toggle existe mais couverture CSS incomplète sur les nouveaux modules |

### Scaleway TEM (emails)
| Item | Statut |
|---|---|
| Configuration TEM | ✅ Fonctionnel pour stages et bourse |
| Emails bienvenue | ⏳ À implémenter |
| Emails reset password | ⏳ À implémenter |
| Emails notifications | ⏳ Dépend des notifications push |

### Maintenance
| Item | Détail |
|---|---|
| GitHub Actions | Upgrader actions/checkout@v5 + actions/setup-node@v5 avant juin 2026 |
| Backup PostgreSQL | pg_dump quotidien vers Scaleway Object Storage (bucket cca-storage à créer) |
| Photos Object Storage | Migrer le stockage photos de GitHub vers Scaleway Object Storage |
| Volume disque | 8 Go total, 69% utilisé — prévoir upgrade si croissance utilisateurs |

---

## 📊 MÉTRIQUES

| Métrique | Valeur |
|---|---|
| Monolithe index.html | 21 181 lignes (était 26 926) |
| Modules ES extraits | 5 fichiers |
| Fichiers CSS extraits | 10 fichiers |
| Fichiers i18n | 5 fichiers JSON |
| Routes backend | ~25 endpoints |
| Tables PostgreSQL | users, sync_stores, bug_reports, training_sessions, training_registrations, graft_exchange, graft_messages, group_orders, group_order_participants, group_order_messages, wiki_*, observations |
| Utilisateurs en base | 5 |
| Build size | 1 644 KB HTML + 79 KB JS |
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
