# SESSION STATE — Carnet Agrumes

> Mis à jour : 2026-04-18 (fin session — emails unifiés + faille sécurité corrigée)

---

## Dernière session

**Date :** 18/04/2026
**Dernier commit :** `0d9b92f` — chore(privacy): unification adresse contact → citruscodex@gmail.com

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

## Prochaine session — À FAIRE DANS CET ORDRE

1. **Phase 1** : admin panel + comptes test multi-profils + notif BBCH changement de stade uniquement

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
