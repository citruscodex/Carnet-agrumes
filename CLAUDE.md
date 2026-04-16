# Carnet de Collection Agrumes — CLAUDE.md

## Projet
PWA française de gestion de collection d'agrumes.
Org GitHub : citruscodex/Carnet-agrumes. Déployé sur citruscodex.fr.
Stack : HTML/CSS/JS vanilla + Vite. Backend Express + PostgreSQL.

## Architecture

### Workspace de développement (`carnet-agrumes/`)
```
public/
  index.html          # Monolithe principal (~25 700 lignes, en cours de modularisation)
  src/
    modules/           # Modules ES extraits
      drip.js          # Irrigation goutte-à-goutte (474 lignes)
      phenology.js     # Phénologie BBCH (1 004 lignes)
      wiki.js          # Wiki offline-first (690 lignes)
    lib/
      esc.js           # Helper escape HTML
      migrations.js    # Migrations localStorage
  manifest.json
  sw.js
server/
  routes/
    admin.js           # Routes admin Express
    bugs.js            # Routes bug tracker Express
  migrations/
    001_bug_reports.sql
    002_profile_type.sql
```

### Workflow de déploiement
```
git push origin main
  → GitHub Actions (ubuntu-latest)
  → npm ci + npm run build
  → .github/fix-manifest.js  (fixe href manifest hashé → /manifest.json)
  → tar + scp + tar -x sur /var/www/cca/
  → citruscodex.fr (Scaleway DEV1-S, Caddy)
```

## Commandes essentielles
```
npm run dev          # serveur Vite dev (port 5173)
npm run build        # build → build/index.html
node --check public/src/modules/*.js   # valider syntaxe AVANT tout commit
```

## Règles absolues
1. Valider syntaxe avec `node --check` après chaque modification de module ES
2. i18n obligatoire : fr, en, es, it, pt
3. Zéro dépendance npm en production
4. Nouveaux modules ES dans `public/src/modules/` — pas d'inline dans le monolithe
5. `esc()` obligatoire sur tout contenu dynamique injecté via innerHTML
6. `addEventListener` exclusivement dans les nouveaux modules (pas d'attributs onclick inline)

## Zones protégées (NE PAS MODIFIER)
- Pipeline phytosanitaire (logique réglementaire validée)
- Chiffrement AES-GCM sync
- `sumAppliedNPK()` — calcul agronomique validé
- ServiceWorker (`public/sw.js`) — cache strategy validée
- Moteur PDF / export étiquettes

## Types d'événements (13)
Plantation, Rempotage, Taille, Traitement, Floraison,
Fructification, Récolte, Fertilisation, Irrigation,
Hivernage, Greffage, Observation, Autre

## Modularisation progressive
Le monolithe est extrait module par module dans `public/src/modules/`.
Modules déjà extraits : drip, phenology, wiki.
Chaque nouveau module doit :
- Exporter ses fonctions publiques (ES module)
- S'exposer sur `window.__CCA_<nom>` pour interop avec le monolithe
- Avoir ses CSS préfixés `cca-<nom>-*`

## MCP disponibles
- github : lecture/écriture issues, PRs sur citruscodex/Carnet-agrumes
- playwright : tests visuels et screenshots de la PWA
  URL prod : https://citruscodex.fr
