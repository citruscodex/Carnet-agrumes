# CHANGELOG — Phase 0 Bugfixes

Date : 2026-04-14

## Corrections appliquées sur `index.html`

### B1 — Bouton "Ajouter" affiche `＋ misc.collAddBtn` (P0)
**Ligne :** 9230
**Cause :** La clé i18n `misc.collAddBtn` n'existe dans aucune langue. Seules `collAddFertBtn` et `collAddSubjectBtn` sont définies.
**Fix :** Remplacé `T('misc.collAddBtn')` par `T('misc.collAddSubjectBtn')` (2 occurrences sur la ligne : aria-label et contenu texte).

### B2 — Bouton "Consigner" ne ferme pas la modale d'événement (P0)
**Lignes :** 14029–14075 (fonction `submitEV()`)
**Cause :** 11 variables `const` (`graftMethode`, `graftStade`, `graftGreffon`, `graftPG`, `graftLotId`, `graftLotQty`, `graftSrc`, `graftReprisePct`, `graftRepriseDate`, `graftElev`, `graftDispo`) étaient déclarées **après** leur première utilisation. En JavaScript, accéder à une `const` avant sa déclaration provoque un `ReferenceError` (Temporal Dead Zone). L'erreur bloquait l'exécution avant `closeModal()` et `toast()`.
**Fix :** Déplacé les 11 déclarations `const graft*` juste après la ligne `if(brixVal&&aciditeVal)` et avant les assignations `ev.methode = graftMethode`, etc. Supprimé les anciennes déclarations dupliquées.
**Impact :** Ce bug affectait l'enregistrement de TOUS les types d'événements (pas seulement greffage), car les `if(graftMethode)` étaient exécutés inconditionnellement.

### B3 — Observatoire : ajout filtres par type d'événement (P1)
**Lignes :** 15429, 15997–16031 (fonction `_renderObservatoire()`)
**Description :** Ajout d'une variable d'état `obsFilterType` et d'une barre de filtres (boutons par type : floraison, récolte, gel, maladie, ravageur, autre). Les filtres s'appliquent aux marqueurs de la carte Leaflet ET au journal des observations.
**Ajouts :**
- Variable globale `let obsFilterType = 'all'`
- Barre de boutons filtres avec style actif/inactif coloré
- Variables `filteredMap` et `filteredJournal` appliquant le filtre
- Remplacement de `mapData` par `filteredMap` dans le rendu carte
- Remplacement de `journalRows` par `journalRowsFiltered` dans le rendu journal

### B5 — Wiki : erreurs réseau gracieuses sur articles inexistants (P1)
**Lignes :** 15595–15609 (catch de `_renderWikiArticle()`)
**Cause :** Quand un lien interne wiki pointait vers un slug inexistant, le `_wikiLoad('/api/wiki/'+slug)` renvoyait une erreur HTTP 404, affichée comme "Communauté hors ligne" — trompeur.
**Fix :** Le catch distingue maintenant les 404 (article non trouvé) des erreurs réseau réelles. Pour un 404, affichage d'un message clair avec le nom de l'article et deux boutons : retour accueil wiki + créer cet article (si connecté au serveur).

### B6 — Parcelles : contrainte unicité pleine terre (P2)
**Lignes :** 10048–10054 (fonction `empOpenAssignModal()`)
**Cause :** Un agrume en pleine terre pouvait être assigné à plusieurs parcelles simultanément. Le filtre `eligible` ne vérifiait pas l'assignation existante sur d'autres parcelles.
**Fix :** Ajout d'un `Set` `otherParcellePlantIds` collectant les IDs de plantes assignées aux autres parcelles. Les plantes pleine terre déjà assignées à une autre parcelle sont exclues de la liste d'assignation (sauf si déjà assignées à la parcelle courante, pour permettre la dé-assignation).

## Fichiers livrés

| Fichier | Description |
|---------|-------------|
| `index.html` | Monolithe patché avec les 5 corrections |
| `ARCHITECTURE.md` | Documentation architecture complète |
| `CHANGELOG_PHASE0.md` | Ce fichier |
| `backend/schema.sql` | Schéma PostgreSQL Phase 1 |
| `CLAUDE_CODE_PROMPT_PHASE1.md` | Prompt pour implémentation backend |
