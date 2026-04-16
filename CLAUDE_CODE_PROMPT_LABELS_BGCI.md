# CLAUDE CODE — Étiquettes QR Muséales & Export BGCI

## Contexte
Lire `CLAUDE.md` avant toute action. Ce prompt améliore le module conservatoire existant (`src/modules/conservatoire.js` ou la section conservatoire dans `collection.js`) avec de vraies étiquettes QR et un export BGCI robuste.

**Prérequis :** QRCode.js est déjà chargé via CDN dans l'app (vérifier sa présence dans `index.html` ou le charger dynamiquement).

## Zones protégées — NE PAS TOUCHER
PDF engine, AES-GCM sync, `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes techniques
- `addEventListener` exclusivement
- `esc()` sur tout innerHTML dynamique
- CSS préfixé `cca-label-*`
- i18n 5 langues
- Zéro dépendance externe supplémentaire (QRCode.js déjà en CDN)

---

## Fonctionnalité 1 — Étiquettes muséales PDF avec vrais QR codes

### Remplacement du QR placeholder SVG

L'implémentation actuelle utilise un pseudo-QR SVG généré par hash. Le remplacer par de vrais QR codes via QRCode.js.

### Format des étiquettes

Chaque étiquette (format carte de visite, 85×55mm) contient :

```
┌────────────────────────────────────────────┐
│ [QR CODE]  N° 2024-0042                    │
│            ─────────────────               │
│            Citrus sinensis (L.) Osbeck     │
│            var. 'Washington Navel'          │
│            Fam. Rutaceae                   │
│            ──────                          │
│            P-G: Poncirus trifoliata        │
│            Orig: Sicile (IT) — 2023        │
│            Inst: Orto Botanico Palermo     │
│            ──────                          │
│            IUCN: LC  │  Statut: vivant     │
│            CitrusCodex · citruscodex.fr    │
└────────────────────────────────────────────┘
```

### Contenu du QR code

Le QR encode une URL vers la fiche : `https://citruscodex.fr/plant/{plantId}` (ou un JSON compact si pas de backend : `{"acc":"2024-0042","sp":"Citrus sinensis","var":"Washington Navel"}`).

### Mise en page impression

- Page A4, 2 colonnes × 5 rangées = 10 étiquettes par page
- Marges d'impression : 10mm
- Bordure fine pointillée pour découpe
- Classes CSS `@media print` pour masquer les boutons
- Bouton "🖨 Imprimer / Enregistrer en PDF" en bas

### Sélection des sujets

3 modes :
- Toutes les accessions (avec `accessionNumber`)
- Tous les sujets (même sans accession)
- Sélection manuelle (checkboxes)

### Implémentation

```js
export async function generateMuseumLabels(scope, selectedIds)
// scope: 'accessions' | 'all' | 'selected'
// Génère le HTML, ouvre dans un nouvel onglet via _pdfOpen()
```

Le QR code est généré par `QRCode.toDataURL()` ou `QRCode.toCanvas()` puis inséré en `<img src="data:image/png;base64,...">`.

---

## Fonctionnalité 2 — Export BGCI renforcé

### Format CSV BGCI PlantSearch

```csv
AccessionNumber,Taxon,Family,Genus,Species,InfraspecificEpithet,ProvenanceCountry,ProvenanceRegion,Collector,CollectionDate,DonorInstitution,OriginType,IUCNStatus,ConservationStatus,AcquisitionDate,Latitude,Longitude,Notes
2024-0042,Citrus sinensis (L.) Osbeck,Rutaceae,Citrus,sinensis,var. Washington Navel,IT,Sicile,Dr. Russo,2023-05-12,Orto Botanico Palermo,cultivated,LC,vivant,2023-06-01,45.764,4.836,Chimère historique
```

### Règles
- UTF-8 BOM (`\uFEFF`) en tête pour compatibilité Excel
- Seuls les sujets avec `accessionNumber` sont exportés
- Les champs vides → cellule vide (pas de "N/A")
- Les virgules dans les champs → échappement guillemets doubles
- Nom du fichier : `CCA_BGCI_Export_{YYYY-MM-DD}.csv`

### Implémentation

```js
export function exportBGCI()
// Génère le CSV, déclenche le téléchargement via Blob + URL.createObjectURL
```

---

## i18n

```
label.title        → "Étiquettes muséales" / "Museum labels" / "Etichette museali" / "Etiquetas museales" / "Etiquetas museais"
label.generate     → "Générer les étiquettes" / "Generate labels" / "Genera etichette" / "Generar etiquetas" / "Gerar etiquetas"
label.scope.acc    → "Accessions uniquement" / "Accessions only" / "Solo accessioni" / "Solo accesiones" / "Apenas acessões"
label.scope.all    → "Tous les sujets" / "All subjects" / "Tutti i soggetti" / "Todos los sujetos" / "Todos os sujeitos"
label.scope.sel    → "Sélection manuelle" / "Manual selection" / "Selezione manuale" / "Selección manual" / "Seleção manual"
label.rootstock    → "Porte-greffe" / "Rootstock" / "Portinnesto" / "Portainjerto" / "Porta-enxerto"
label.origin       → "Origine" / "Origin" / "Origine" / "Origen" / "Origem"
label.institution  → "Institution" / "Institution" / "Istituzione" / "Institución" / "Instituição"
bgci.export        → "Export BGCI PlantSearch" / "BGCI PlantSearch Export" / "Esportazione BGCI PlantSearch" / "Exportación BGCI PlantSearch" / "Exportação BGCI PlantSearch"
bgci.download      → "Télécharger CSV" / "Download CSV" / "Scarica CSV" / "Descargar CSV" / "Baixar CSV"
bgci.noAccessions  → "Aucune accession à exporter" / "No accessions to export" / "Nessuna accessione da esportare" / "Sin accesiones para exportar" / "Sem acessões para exportar"
```

## Validation

```bash
node --check src/modules/conservatoire.js  # ou collection.js selon la structure
npm run build
```

Tests :
1. Profil conservatoire → Export BGCI → CSV téléchargé, ouvrable dans Excel sans caractères cassés
2. Étiquettes → sélection "toutes accessions" → page HTML avec vrais QR codes scannables
3. QR scanné → contenu correct (URL ou JSON)
4. Impression → 10 étiquettes par page A4, bordures de découpe visibles
5. Sujet sans accession → non inclus dans export BGCI, inclus si scope "tous"
