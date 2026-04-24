# SESSION STATE — Carnet Agrumes

> Mis à jour : 2026-04-23 (fin session — 10 correctifs bloquants+importants hotfix bêta)

---

## Dernière session

**Date :** 23/04/2026
**Dernier commit :** `5443772` — fix(pwa): nom affiché CitrusCodex au lieu d'agrumes

---

## Phases complétées

### Phase 0A ✅ — commit `af5c904`
Sync serveur normalisé

| Livrable | Statut |
|---|---|
| Migration SQL 006 — 19 tables `user_*` en DB (`ccadb`) | ✅ |
| Routes CJS : `user-data.js`, `user-sync.js`, `user-account.js` | ✅ |
| Shim `fastify.pg` dans `/opt/cca/server.js` + restart `cca.service` | ✅ |
| `server-sync.js` — queue, snapshot diff, flush, pull, topbar (position:fixed) | ✅ |
| `migration-modal.js` — push/conflict/merge au premier login | ✅ |
| i18n `sync.*` sur FR/EN/IT/ES/PT | ✅ |
| 5 comptes test `testsync1-5@citruscodex.fr` / `TestSync1234!` en DB | ✅ |
| Tests Playwright : **6/6 passent** | ✅ |

### Phase 0B ✅ — commit `938aba6`
Bugs bloquants + Wiki v2

| Livrable | Statut |
|---|---|
| Observatoire : 3 obs. seedées avec coords valides (Paris/Nice/Lyon) | ✅ |
| Bug tracker : `POST /api/bugs` 201, `GET /api/bugs/mine` 200, admin OK | ✅ |
| `wiki-v1-migration.js` — archive `wikiPages_v1` → backup J+30 | ✅ |
| i18n `wikiV1.*` + `wiki.footnote/footnotePlaceholder/backToText` 5 langues | ✅ |
| Section backup wiki v1 dans Réglages (conditionnelle) | ✅ |
| `parseMarkdown()` — extraction `[^key]: content`, `<ol class="cca-footnotes">` | ✅ |
| Toolbar `📝 Note` (`md-footnote`) + `_insertFootnote()` | ✅ |
| CSS `.cca-fn-ref`, `.cca-footnotes`, `.cca-fn-backref` | ✅ |
| Tests Playwright : **5/5 passent** | ✅ |

### Phase 0C ✅ — commit `6e3323e`
Guide débutant fertilisation intégré

| Livrable | Statut |
|---|---|
| `public/guide/guide-debutant-citruscodex.md` — 11 chap. + 3 annexes (sources INRAE/UF-IFAS/IAC/IVIA) | ✅ |
| `guide-debutant-citruscodex.pdf` déposé manuellement sur Scaleway `/var/www/cca/guide/` | ✅ |
| `public/src/modules/guide.js` — rendu MD, TOC sidebar, recherche, bookmarks, footnotes ↩ | ✅ |
| Point d'entrée 1 : onglet "📚 Guide" dans Fertilisation | ✅ |
| Point d'entrée 2 : bouton 📖 sur chaque gauge NPK (→ chapitre-2) | ✅ |
| Point d'entrée 3 : bouton "Comprendre" sur résultats carences diagnostic (→ chapitre-10) | ✅ |
| Point d'entrée 4 : bouton "Guide nutrition complet" dans Réglages (data-action) | ✅ |
| i18n `guide.*` sur 5 langues + bannière bilingue non-FR | ✅ |
| Ancres construites depuis vrais `##` du guide (pas inventées) | ✅ |
| `cca-navigate` event listener pour deep-link cross-module | ✅ |
| Tests Playwright : **5/6 passent** (T3 skip valide : alerte carence absente en test) | ✅ |
| `node --check` OK, `npm run build` OK | ✅ |

### Corrections ponctuelles ✅
- Bug couleur liens login (`Mot de passe oublié` / `Pas encore de compte`) — texte visible résolu

---

## Architecture serveur actuelle (2026-04-18)

```
/opt/cca/
  server.js           # Phase 0A : shim fastify.pg + register user-data/sync/account
  routes/
    admin.js          # CRUD users, invitation, stats
    bugs.js           # Bug tracker (user + admin)
    training.js       # Stages
    bourse.js         # Bourse aux greffons
    orders.js         # Commandes groupées
    user-data.js      # CRUD plants/events/parcelles/stocks/eco/boutures/settings  [Phase 0A]
    user-sync.js      # snapshot/bulk-import/export RGPD                          [Phase 0A]
    user-account.js   # DELETE RGPD avec confirmation                              [Phase 0A]

/var/www/cca/
  index.html, sw.js, manifest.json, assets/
  guide/
    guide-debutant-citruscodex.md                                                  [Phase 0C]
    guide-debutant-citruscodex.pdf  (déposé manuellement, hors CI/CD)             [Phase 0C]
  src/modules/
    server-sync.js       [Phase 0A]
    migration-modal.js   [Phase 0A]
    wiki-v1-migration.js [Phase 0B]
    wiki.js (modifié)    [Phase 0B]
    guide.js             [Phase 0C]
```

DB PostgreSQL (`ccadb`) — 19 tables `user_*` ajoutées en Phase 0A :
`user_plants`, `user_events`, `user_fertilizations`, `user_harvests`, `user_graftings`,
`user_parcelles`, `user_stocks`, `user_stock_movements`, `user_economic_entries`,
`user_lots`, `user_lot_plants`, `user_boutures`, `user_devis`, `user_devis_lignes`,
`user_settings`, `user_sortis`, `user_lumiere`, `user_phyto_register`, `user_ratings`

---

## Comptes tests

| Compte | Email | Rôle | Mot de passe |
|---|---|---|---|
| Admin | admin@citruscodex.fr | admin | (privé) |
| Admin dev | tristan.peyrotty@gmail.com | admin | (privé) |
| Test sync 1–5 | testsync1-5@citruscodex.fr | member | TestSync1234! |
| Collectionneur | coll@citruscodex.fr | member | CitrusTest2026! |
| Pépiniériste | pepi@citruscodex.fr | member | CitrusTest2026! |
| Arboriculteur | arbo@citruscodex.fr | member | CitrusTest2026! |
| Conservatoire | cons@citruscodex.fr | member | CitrusTest2026! |

---

## Corrections ponctuelles ✅ (2026-04-18)
- Emails unifiés : `contact@citruscodex.fr` + `tristan.peyrotty@gmail.com` → `citruscodex@gmail.com` (confidentialite.html, mentions-legales.html, bienvenue.html)
- Faille sécurité corrigée : condition email hardcodée → `_srvUserRole()==='admin'` dans index.html L12362

---

## Hotfix bêta ✅ (2026-04-23) — 10 correctifs livrés

### Bloquants corrigés

| # | Commit | Correctif |
|---|---|---|
| 1 | `be14690` | Inscription : création `server/routes/auth.js` + migration `007_auth_tokens.sql` — routes register/verify/login/forgot/reset opérationnelles |
| 2 | `8fa8ce5` | Événements : bug TDZ `const graftMethode` etc. déclarés après usage → ReferenceError silencieux corrigé |
| 3 | `f1980f0` | Reset mot de passe : extraction `?reset_token` URL + gestion `?verified=0` (lien expiré) |
| 4 | `cd8f05f` | Guide fertilisation : `guide/` absent du tar deploy.yml → ajout `cp -r build/guide guide` et `guide` dans archive |
| 5 | `bcfa6ff` | Double mot de passe : `_startLocalFlow()` n'appelle plus `showLogin()` AES-GCM après auth serveur réussie |

### Importants corrigés

| # | Commit | Correctif |
|---|---|---|
| 6 | `e1534b1` | Alerte gel centralisée dans Réglages → Notifications, suppression bloc gel dashboard |
| 7 | `8271ad7` | ETP/météo : skeleton au lieu de message "pas de données", troncature ville corrigée |
| 8 | `65b5df6` | Profils : indicateur visuel mode admin (accès tous modules), comportement métier inchangé |
| 9 | `52b8645` | Guide bêta-testeur (`bienvenue.html`) : bouton login ajouté, accès guide MD derrière auth |
| 10 | `5443772` | PWA : nom `CitrusCodex` (manifest.json, title, apple-mobile-web-app-title) |

---

## Phase 1 ✅ — commits `f0f2929`→`2af7f24`
Admin panel + comptes test multi-profils + notif BBCH

| Livrable | Statut |
|---|---|
| Migration 008 — `admin_audit_log`, `bug_report_groups`, colonnes `users` | ✅ appliquée sur ccadb |
| Migration 009 — `user_bbch_tracking` | ✅ appliquée sur ccadb |
| `server/routes/admin-panel.js` — routes activate/deactivate/hard-delete/audit/bugs/stats | ✅ |
| `public/src/modules/admin-panel.js` — module ES 4 onglets, i18n 5 langues | ✅ |
| `server/seeds/004_test_accounts.js` — 4 comptes test (collectionneur/pepinieriste/arboriculteur/conservatoire) | ✅ seedés sur ccadb |
| `server/crons/bbch-notifications.js` — cron 7h30, notification uniquement au changement de stade | ✅ |
| Wiki : catégorie `guide-fertilisation` (📚) visible dans l'interface — 17 articles | ✅ |
| Base de données renommée ccadb partout dans la doc (était cca_prod) | ✅ |
| Tests Playwright : **6/6 passent** | ✅ |

---

## Prochaine session — À FAIRE DANS CET ORDRE

1. **Phase 2** : à définir

---

## Fichiers protégés — NE JAMAIS TOUCHER

- PDF engine
- AES-GCM sync (`sumAppliedNPK`, chiffrement)
- Firebase legacy
- `barcode-scanner.js`
- ServiceWorker (`public/sw.js`)
- Pipeline phytosanitaire (logique réglementaire validée)

---

## Historique des phases

| Phase | Commit | Description |
|---|---|---|
| Beta publique | `b45a6fc` | Chantiers 1–15 + 16A-16H — beta ready |
| Phase 0A | `af5c904` + `938aba6` (fix) | Sync serveur, 19 tables, routes user data |
| Phase 0B | `938aba6` | Observatoire, bugs, wiki v2 footnotes, migration v1 |
| Phase 0C | `6e3323e` | Guide fertilisation intégré, 4 points d'entrée, i18n 5 langues |
| Hotfix bêta | `be14690`→`5443772` | 5 bloquants + 5 importants corrigés avant bêta publique |
