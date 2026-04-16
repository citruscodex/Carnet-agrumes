# CLAUDE CODE — Modules Restants : Substrats + Bourse Greffons + Boutures + Lumière

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt implémente les 4 modules fonctionnels manquants de la feuille de route.

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement — zéro `onclick` inline
- `esc()` sur tout innerHTML dynamique
- CSS préfixé par module (`cca-sub-*`, `cca-bourse-*`, `cca-bout-*`, `cca-light-*`)
- i18n 5 langues (FR/EN/IT/ES/PT)
- `node --check` après chaque modification

---

## MODULE A — Substrats et mélanges

### Contexte
Chaque agrume en pot a un substrat spécifique qui influence le drainage, le pH, et les apports NPK. Le module permet de créer des recettes de substrat réutilisables et de les associer aux plantes.

### Store : `agrumes_substrats`

```js
[{
  id: 'sub_001',
  name: 'Terreau agrumes standard',
  ph: { min: 5.5, max: 6.5 },
  ec: 1.2,                            // conductivité mS/cm
  drainage: 'bon',                     // excellent | bon | moyen | faible
  components: [
    { name: 'Terreau universel', pct: 40 },
    { name: 'Pouzzolane', pct: 30 },
    { name: 'Compost mûr', pct: 20 },
    { name: 'Sable grossier', pct: 10 }
  ],
  npkCorrection: { N: 0, P: 0, K: 0 },  // correction sur les apports NPK calculés
  notes: 'Adapté aux jeunes plants en pot',
  createdAt: '2026-04-15T10:00:00Z'
}]
```

### Substrats pré-chargés (au premier lancement)

5 recettes de base :
1. **Terreau agrumes standard** — terreau 40%, pouzzolane 30%, compost 20%, sable 10% — pH 5.5-6.5
2. **Mix drainant pro** — écorce de pin 40%, perlite 30%, fibre de coco 30% — pH 5.5-6.0
3. **Substrat conservatoire** — terre franche 30%, terreau 30%, pouzzolane 25%, sable 15% — pH 6.0-6.5
4. **Mix semis** — tourbe blonde 50%, perlite 30%, vermiculite 20% — pH 5.0-5.5
5. **Pleine terre amendée** — terre existante + compost 30% + sable 20% — pH selon sol

### UI

#### Page substrats (onglet dans Fertilisation ou section dédiée)

```
┌────────────────────────────────────────────────┐
│ 🪴 Mes substrats                    [+ Nouveau] │
├────────────────────────────────────────────────┤
│ 🟢 Terreau agrumes standard                    │
│    pH 5.5-6.5 │ EC 1.2 │ Drainage : bon       │
│    4 composants │ Utilisé par 12 sujets        │
├────────────────────────────────────────────────┤
│ 🟡 Mix drainant pro                            │
│    pH 5.5-6.0 │ EC 0.8 │ Drainage : excellent  │
│    3 composants │ Utilisé par 5 sujets          │
└────────────────────────────────────────────────┘
```

#### Modal création/édition

- Nom du substrat
- pH min/max (2 inputs numériques)
- EC (input numérique)
- Drainage (select : excellent/bon/moyen/faible)
- Composants : liste dynamique (nom + pourcentage), bouton "+ Composant", total doit = 100%
- Correction NPK : 3 inputs numériques (N, P, K en %)
- Notes (textarea)

#### Intégration fiche plante

- Select "Substrat" dans la section Emplacement/Culture de la fiche plante
- Champ `plant.substratId` → lié au substrat
- Affichage du pH cible et de la composition sous le select
- Événement "rempotage" → select substrat pré-rempli

#### Intégration NPK

Dans le calcul `annualNPK()` ou `sumAppliedNPK` (zone protégée — ne pas toucher directement), exposer le `npkCorrection` du substrat comme information affichée dans la fiche plante, sans modifier le calcul existant. Afficher :
```
📊 Correction NPK substrat : N+0% P+0% K+5%
```

---

## MODULE B — Bourse aux greffons

### Contexte
Permettre aux membres de proposer et rechercher des greffons à échanger. C'est une fonctionnalité **communautaire** qui nécessite le backend.

### Modèle de données — Backend PostgreSQL

```sql
CREATE TABLE graft_exchange (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('offre', 'recherche')),
  species VARCHAR(200) NOT NULL,
  variety VARCHAR(200),
  rootstock VARCHAR(200),
  quantity INT DEFAULT 1,
  region VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'reservee', 'conclue', 'expiree')),
  contact_method VARCHAR(20) DEFAULT 'message',  -- message | email
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graft_exchange_status ON graft_exchange(status);
CREATE INDEX idx_graft_exchange_species ON graft_exchange(species);
```

### API Fastify

```
GET    /api/bourse              → annonces actives (paginées, filtrables)
GET    /api/bourse/mine         → mes annonces (auth)
POST   /api/bourse              → créer une annonce (auth)
PATCH  /api/bourse/:id          → modifier statut/contenu (auth: propriétaire)
DELETE /api/bourse/:id          → supprimer (auth: propriétaire ou admin)
POST   /api/bourse/:id/contact  → envoyer un message au propriétaire (auth)
```

### Frontend

#### Navigation
Accessible depuis un item "🔄 Bourse" dans le menu communauté (à côté de Wiki et Observatoire).

#### Vue liste

```
┌────────────────────────────────────────────────┐
│ 🔄 Bourse aux greffons        [+ Mon annonce]  │
│ [Offres] [Recherches] [Tout]   🔍 Recherche... │
├────────────────────────────────────────────────┤
│ 🟢 OFFRE  Citrus medica 'Etrog'               │
│    Greffons disponibles : 5 │ Région : PACA    │
│    Par : membre123 │ Expire dans 45j           │
│    [Contacter]                                  │
├────────────────────────────────────────────────┤
│ 🔵 RECHERCHE  Fortunella margarita             │
│    Porte-greffe : Poncirus │ Région : Île-de-Fr│
│    Par : membre456 │ Expire dans 20j            │
│    [Contacter]                                  │
└────────────────────────────────────────────────┘
```

#### Modal création

- Type : Offre / Recherche (radio)
- Espèce (obligatoire, input avec autocomplétion depuis SPECIES_KB)
- Variété (optionnel)
- Porte-greffe (optionnel)
- Quantité (input nombre)
- Région (input texte ou select régions françaises)
- Description (textarea)
- Méthode de contact : Message interne / Email

#### Contact

"Contacter" ouvre une modal simple avec un textarea pour envoyer un message. Le message est envoyé au backend qui le transmet par email (Scaleway TEM) au propriétaire de l'annonce sans exposer son email.

#### Fallback offline

"🔄 Bourse indisponible hors-ligne" + bouton Réessayer.

---

## MODULE C — Suivi boutures (vérification/complétion)

### Contexte
Le suivi boutures a été implémenté dans une session précédente. Vérifier qu'il est **complet et fonctionnel**.

### Vérification

1. Le store `boutures` existe dans `nurseryData` (ou store séparé)
2. La modal `openBoutureModal()` fonctionne (création + édition)
3. Le champ `sourceId` lie la bouture au sujet source
4. La section "Boutures prélevées" s'affiche dans la fiche du sujet source
5. Le statut évolue : en_cours → enracinée → sevrée → échec
6. Les KPIs boutures s'affichent dans le dashboard collectionneur
7. La vue liste boutures est accessible dans l'espace pépinière

Si l'un de ces points ne fonctionne pas → corriger.

### Compléments si manquants

- Champ `substratId` sur la bouture (select substrat du Module A)
- Calcul taux de reprise : `nbEnracinées / nbPrélevées × 100`
- Alertes : bouture > 60 jours sans changement de statut → notification

---

## MODULE D — Suivi lumière horticole (vérification/complétion)

### Contexte
Le suivi lumière a été implémenté dans une session précédente. Vérifier qu'il est **complet et fonctionnel**.

### Vérification

1. Le store `agrumes_light` existe et est chargé dans `launchApp()`
2. La section "💡 Éclairage horticole — DLI" s'affiche dans la fiche plante
3. La modal `openLightModal()` fonctionne (ajout/édition lampe)
4. Le calcul DLI = PPFD × heures × 0.0036 est correct
5. L'alerte DLI insuffisant (< 12 mol/m²/j) s'affiche en rouge
6. Les types de lampe sont proposés : LED full-spectrum, HPS, CMH, T5
7. La section est visible pour tous les profils (pas seulement pro)

Si l'un de ces points ne fonctionne pas → corriger.

### Compléments si manquants

- Timer visuel ON/OFF avec horaires (purement informatif, pas de contrôle IoT)
- Recommandation DLI par espèce depuis SPECIES_KB :
  ```js
  // Ajouter dans SPECIES_KB pour chaque espèce :
  dli: { min: 12, ideal: 25, max: 45 }
  // Citrus sinensis → 20-30, Fortunella → 15-25, Citrus limon → 25-35
  ```
- Historique DLI journalier (graphe 30 derniers jours si données disponibles)

---

## i18n

```
sub.title        → "Substrats" / "Substrates" / "Substrati" / "Sustratos" / "Substratos"
sub.new          → "Nouveau substrat" / "New substrate" / "Nuovo substrato" / "Nuevo sustrato" / "Novo substrato"
sub.name         → "Nom du substrat" / "Substrate name" / "Nome substrato" / "Nombre sustrato" / "Nome substrato"
sub.ph           → "pH cible" / "Target pH" / "pH target" / "pH objetivo" / "pH alvo"
sub.ec           → "Conductivité (mS/cm)" / "Conductivity (mS/cm)" / "Conducibilità (mS/cm)" / "Conductividad (mS/cm)" / "Condutividade (mS/cm)"
sub.drainage     → "Drainage" / "Drainage" / "Drenaggio" / "Drenaje" / "Drenagem"
sub.components   → "Composants" / "Components" / "Componenti" / "Componentes" / "Componentes"
sub.addComponent → "+ Composant" / "+ Component" / "+ Componente" / "+ Componente" / "+ Componente"
sub.totalPct     → "Total : {n}%" / "Total: {n}%" / "Totale: {n}%" / "Total: {n}%" / "Total: {n}%"
sub.npkCorr      → "Correction NPK" / "NPK correction" / "Correzione NPK" / "Corrección NPK" / "Correção NPK"
sub.usedBy       → "Utilisé par {n} sujets" / "Used by {n} subjects" / "Usato da {n} soggetti" / "Usado por {n} sujetos" / "Usado por {n} sujeitos"

bourse.title     → "Bourse aux greffons" / "Graft exchange" / "Borsa marze" / "Bolsa de injertos" / "Bolsa de enxertos"
bourse.newAd     → "Mon annonce" / "My listing" / "Il mio annuncio" / "Mi anuncio" / "O meu anúncio"
bourse.offer     → "Offre" / "Offer" / "Offerta" / "Oferta" / "Oferta"
bourse.search    → "Recherche" / "Wanted" / "Ricerca" / "Búsqueda" / "Procura"
bourse.species   → "Espèce" / "Species" / "Specie" / "Especie" / "Espécie"
bourse.variety   → "Variété" / "Variety" / "Varietà" / "Variedad" / "Variedade"
bourse.rootstock → "Porte-greffe" / "Rootstock" / "Portinnesto" / "Portainjerto" / "Porta-enxerto"
bourse.qty       → "Quantité" / "Quantity" / "Quantità" / "Cantidad" / "Quantidade"
bourse.region    → "Région" / "Region" / "Regione" / "Región" / "Região"
bourse.contact   → "Contacter" / "Contact" / "Contatta" / "Contactar" / "Contactar"
bourse.expires   → "Expire dans {n}j" / "Expires in {n}d" / "Scade tra {n}g" / "Expira en {n}d" / "Expira em {n}d"
bourse.offline   → "Bourse indisponible hors-ligne" / "Exchange unavailable offline" / "Borsa non disponibile offline" / "Bolsa no disponible sin conexión" / "Bolsa indisponível offline"
bourse.msgSent   → "Message envoyé ✓" / "Message sent ✓" / "Messaggio inviato ✓" / "Mensaje enviado ✓" / "Mensagem enviada ✓"

bout.title       → "Suivi boutures" / "Cutting tracking" / "Tracciamento talee" / "Seguimiento esquejes" / "Seguimento estacas"
bout.source      → "Sujet source" / "Source subject" / "Soggetto fonte" / "Sujeto fuente" / "Sujeito fonte"
bout.rootingRate  → "Taux de reprise" / "Rooting rate" / "Tasso radicazione" / "Tasa de enraizamiento" / "Taxa de enraizamento"
bout.status.en_cours  → "En cours" / "In progress" / "In corso" / "En curso" / "Em curso"
bout.status.enracinee → "Enracinée" / "Rooted" / "Radicata" / "Enraizada" / "Enraizada"
bout.status.sevree    → "Sevrée" / "Weaned" / "Svezzata" / "Destetada" / "Desmamada"
bout.status.echec     → "Échec" / "Failed" / "Fallita" / "Fallido" / "Falhada"

light.title      → "Éclairage horticole" / "Horticultural lighting" / "Illuminazione orticola" / "Iluminación hortícola" / "Iluminação hortícola"
light.dli        → "DLI (mol/m²/j)" / "DLI (mol/m²/d)" / "DLI (mol/m²/g)" / "DLI (mol/m²/d)" / "DLI (mol/m²/d)"
light.ppfd       → "PPFD (µmol/m²/s)" / "PPFD (µmol/m²/s)" / "PPFD (µmol/m²/s)" / "PPFD (µmol/m²/s)" / "PPFD (µmol/m²/s)"
light.photoperiod → "Photopériode (h/j)" / "Photoperiod (h/d)" / "Fotoperiodo (h/g)" / "Fotoperíodo (h/d)" / "Fotoperíodo (h/d)"
light.dliLow     → "DLI insuffisant" / "DLI insufficient" / "DLI insufficiente" / "DLI insuficiente" / "DLI insuficiente"
light.timer      → "Programmation ON/OFF" / "ON/OFF schedule" / "Programmazione ON/OFF" / "Programación ON/OFF" / "Programação ON/OFF"
```

---

## Ordre d'exécution

```
Module A (Substrats)  → Module C (vérif boutures) → Module D (vérif lumière) → Module B (Bourse greffons)
```

A et C/D sont offline-first (localStorage). B nécessite le backend. Faire A+C+D d'abord.

Gate `node --check` + `npm run build` entre chaque module.

## Validation

Module A :
- Créer un substrat → visible dans la liste
- Associer à un plant → affiché dans la fiche
- Rempotage → select substrat pré-rempli
- Composants totalisent 100%

Module B :
- Créer une offre → visible dans la liste publique
- Contacter → message envoyé (ou toast offline)
- Annonce expire après 90j → statut "expirée"

Module C :
- Bouture liée au sujet source → visible dans la fiche du source
- Statut évolutif → KPI dashboard

Module D :
- Lampe configurée → DLI calculé et affiché
- Alerte si DLI < seuil espèce
