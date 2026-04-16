/**
 * migrations.js — F11 : APP_VERSION + migrations localStorage
 * Chaque migration est idempotente : vérifie "déjà fait" avant d'agir.
 */

export const APP_VERSION = '3.0.0';

const VERSION_KEY = 'agrumes_app_version';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * F1 — Génère un accessionId CCA-YYYY-NNNN unique pour une nouvelle plante.
 * @param {Array} plants - tableau courant des plantes
 * @returns {string}
 */
export function generateAccessionId(plants) {
  const year = new Date().getFullYear();
  const prefix = `CCA-${year}-`;
  const existing = (plants || []).filter(p => p.accessionId?.startsWith(prefix));
  const maxN = existing.reduce((max, p) => {
    const n = parseInt(p.accessionId.split('-')[2], 10);
    return n > max ? n : max;
  }, 0);
  return `${prefix}${String(maxN + 1).padStart(4, '0')}`;
}

/**
 * F2 — Formate une date selon sa précision.
 * @param {string} dateStr - date ISO YYYY-MM-DD
 * @param {'full'|'month'|'year'|'unknown'} precision
 * @param {string} [lang='fr']
 * @returns {string}
 */
export function formatDateWithPrecision(dateStr, precision, lang = 'fr') {
  if (!dateStr || precision === 'unknown') return { fr:'Date inconnue', en:'Unknown date', es:'Fecha desconocida', it:'Data sconosciuta', pt:'Data desconhecida' }[lang] || 'Date inconnue';
  const d = new Date(dateStr + 'T12:00:00');
  if (isNaN(d)) return dateStr;
  if (precision === 'year')  return String(d.getFullYear());
  if (precision === 'month') return d.toLocaleDateString(lang + '-' + lang.toUpperCase(), { month: 'long', year: 'numeric' });
  // 'full' (défaut)
  return d.toLocaleDateString(lang + '-' + lang.toUpperCase(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Migrations ────────────────────────────────────────────────────────────────

/**
 * Migration V3.0.0 :
 * - Ajoute accessionId (CCA-YYYY-NNNN) aux plantes qui n'en ont pas
 * - Ajoute datePrecision:'full' aux plantes qui n'en ont pas
 * - Ajoute provenance:{} aux plantes qui n'en ont pas
 * @param {Array} plants - tableau des plantes (muté en place)
 * @returns {boolean} true si des données ont changé
 */
function migrateV300(plants) {
  let changed = false;

  // Grouper les plantes sans accessionId par année pour attribuer des IDs séquentiels
  const withoutId = plants.filter(p => !p.accessionId);
  if (withoutId.length > 0) {
    // Trouver les maxN existants par année (plantes qui ont déjà un ID)
    const maxByYear = {};
    plants.filter(p => p.accessionId).forEach(p => {
      const parts = p.accessionId.split('-');
      if (parts.length === 3 && parts[0] === 'CCA') {
        const yr = parts[1];
        const n  = parseInt(parts[2], 10);
        if (!maxByYear[yr] || n > maxByYear[yr]) maxByYear[yr] = n;
      }
    });

    // Attribuer des IDs séquentiels par année d'acquisition/plantation
    withoutId.forEach(p => {
      const yr = (p.acquisitionDate || p.plantingDate || '').slice(0, 4) || String(new Date().getFullYear());
      if (!maxByYear[yr]) maxByYear[yr] = 0;
      maxByYear[yr]++;
      p.accessionId = `CCA-${yr}-${String(maxByYear[yr]).padStart(4, '0')}`;
    });
    changed = true;
  }

  plants.forEach(p => {
    if (!p.datePrecision) { p.datePrecision = 'full'; changed = true; }
    if (!p.provenance)    { p.provenance    = {};     changed = true; }
    // F3 — Structuration de l'origine
    if (!p.provenanceType) {
      p.provenanceType  = 'inconnu';
      p.provenanceMode  = 'inconnu';
      p.productionType  = 'inconnu';
      p.provenanceDetail = p.origin || '';
      changed = true;
    }
  });

  return changed;
}

const MIGRATIONS = [
  { version: '3.0.0', migrate: migrateV300 },
];

/**
 * Exécute les migrations nécessaires.
 * Doit être appelé après loadData() et avant tout loadXxx() secondaire.
 *
 * @param {Array}    plants   - tableau global des plantes (muté en place)
 * @param {Function} saveData - fonction de persistance des plantes
 */
export function runMigrations(plants, saveData) {
  const storedVersion = localStorage.getItem(VERSION_KEY) || '0.0.0';

  if (storedVersion === APP_VERSION) return; // déjà à jour

  // Comparer versions semver simplifié
  function semverLt(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) < (pb[i] || 0)) return true;
      if ((pa[i] || 0) > (pb[i] || 0)) return false;
    }
    return false;
  }

  let dataChanged = false;
  for (const { version, migrate } of MIGRATIONS) {
    if (semverLt(storedVersion, version)) {
      const changed = migrate(plants);
      if (changed) dataChanged = true;
    }
  }

  if (dataChanged) saveData();
  localStorage.setItem(VERSION_KEY, APP_VERSION);
}
