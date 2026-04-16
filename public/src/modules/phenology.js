/**
 * Module Phénologie BBCH Agrumes
 * Référence : Agustí M. et al. (1997). Adaptation de l'échelle BBCH à la description
 * des stades phénologiques des agrumes du genre Citrus. Fruits, vol. 52(5), p. 287-295.
 *
 * 8 stades principaux (0, 1, 3, 5, 6, 7, 8, 9) — stades 2 et 4 absents chez les agrumes.
 * Les seuils GJC (Growing Degree Days / Degrés-Jours de Croissance) sont relatifs
 * à C. sinensis comme référence ; les offsets espèces s'accumulent stade par stade.
 */
import { esc } from '../lib/esc.js';

export const BBCH_STAGES = [
  // ─── STADE PRINCIPAL 0 : Développement des bourgeons ───
  {
    principal: 0,
    stage: 'bourgeons',
    icon: '💤',
    gjcThreshold: 0,
    i18nKey: 'pheno.stage.0',
    descKey: 'pheno.desc.0',
    notes: {
      regulators: 'pheno.note.reg.0',
      remarks: 'pheno.note.rem.0'
    },
    actions: {
      fertilization: 'pheno.action.fert.0',
      pruning: 'pheno.action.prune.0',
      irrigation: 'pheno.action.irrig.0'
    },
    pests: ['pheno.pest.cochenilles', 'pheno.pest.acariens_hiv'],
    speciesOffsets: {
      'Citrus limon': -50,
      'Citrus sinensis': 0,
      'Citrus reticulata': 30,
      'Citrus paradisi': 10,
      'Citrus aurantifolia': -30,
      'Fortunella': 50
    },
    secondary: [
      { code: '00', i18nKey: 'pheno.sub.00', progressPercent: 0 },
      { code: '01', i18nKey: 'pheno.sub.01', progressPercent: 25 },
      { code: '03', i18nKey: 'pheno.sub.03', progressPercent: 50 },
      { code: '07', i18nKey: 'pheno.sub.07', progressPercent: 75 },
      { code: '09', i18nKey: 'pheno.sub.09', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 1 : Développement des feuilles ───
  {
    principal: 1,
    stage: 'feuilles',
    icon: '🌱',
    gjcThreshold: 50,
    i18nKey: 'pheno.stage.1',
    descKey: 'pheno.desc.1',
    notes: {
      regulators: 'pheno.note.reg.1',
      remarks: 'pheno.note.rem.1'
    },
    actions: {
      fertilization: 'pheno.action.fert.1',
      pruning: 'pheno.action.prune.1',
      irrigation: 'pheno.action.irrig.1'
    },
    pests: ['pheno.pest.pucerons', 'pheno.pest.mineuse'],
    speciesOffsets: {
      'Citrus limon': -40,
      'Citrus sinensis': 0,
      'Citrus reticulata': 25,
      'Citrus paradisi': 10,
      'Citrus aurantifolia': -25,
      'Fortunella': 40
    },
    secondary: [
      { code: '10', i18nKey: 'pheno.sub.10', progressPercent: 0 },
      { code: '11', i18nKey: 'pheno.sub.11', progressPercent: 25 },
      { code: '15', i18nKey: 'pheno.sub.15', progressPercent: 60 },
      { code: '19', i18nKey: 'pheno.sub.19', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 3 : Développement des pousses ───
  {
    principal: 3,
    stage: 'pousses',
    icon: '🌿',
    gjcThreshold: 200,
    i18nKey: 'pheno.stage.3',
    descKey: 'pheno.desc.3',
    notes: {
      regulators: null,
      remarks: 'pheno.note.rem.3'
    },
    actions: {
      fertilization: 'pheno.action.fert.3',
      pruning: 'pheno.action.prune.3',
      irrigation: 'pheno.action.irrig.3'
    },
    pests: ['pheno.pest.mineuse', 'pheno.pest.psylle'],
    speciesOffsets: {
      'Citrus limon': -20,
      'Citrus sinensis': 0,
      'Citrus reticulata': 15,
      'Citrus paradisi': 5,
      'Citrus aurantifolia': -15,
      'Fortunella': 30
    },
    secondary: [
      { code: '31', i18nKey: 'pheno.sub.31', progressPercent: 0 },
      { code: '32', i18nKey: 'pheno.sub.32', progressPercent: 35 },
      { code: '39', i18nKey: 'pheno.sub.39', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 5 : Développement de l'inflorescence ───
  {
    principal: 5,
    stage: 'inflorescence',
    icon: '🌸',
    gjcThreshold: 450,
    i18nKey: 'pheno.stage.5',
    descKey: 'pheno.desc.5',
    notes: {
      regulators: null,
      remarks: 'pheno.note.rem.5'
    },
    actions: {
      fertilization: 'pheno.action.fert.5',
      pruning: 'pheno.action.prune.5',
      irrigation: 'pheno.action.irrig.5'
    },
    pests: ['pheno.pest.thrips', 'pheno.pest.acariens'],
    speciesOffsets: {
      'Citrus limon': -10,
      'Citrus sinensis': 0,
      'Citrus reticulata': 10,
      'Citrus paradisi': 0,
      'Citrus aurantifolia': -10,
      'Fortunella': 20
    },
    secondary: [
      { code: '51', i18nKey: 'pheno.sub.51', progressPercent: 0 },
      { code: '53', i18nKey: 'pheno.sub.53', progressPercent: 15 },
      { code: '55', i18nKey: 'pheno.sub.55', progressPercent: 35 },
      { code: '56', i18nKey: 'pheno.sub.56', progressPercent: 55 },
      { code: '57', i18nKey: 'pheno.sub.57', progressPercent: 75 },
      { code: '59', i18nKey: 'pheno.sub.59', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 6 : Floraison ───
  {
    principal: 6,
    stage: 'floraison',
    icon: '🌼',
    gjcThreshold: 650,
    i18nKey: 'pheno.stage.6',
    descKey: 'pheno.desc.6',
    notes: {
      regulators: 'pheno.note.reg.6',
      remarks: 'pheno.note.rem.6'
    },
    actions: {
      fertilization: 'pheno.action.fert.6',
      pruning: 'pheno.action.prune.6',
      irrigation: 'pheno.action.irrig.6'
    },
    pests: ['pheno.pest.thrips_flo', 'pheno.pest.botrytis'],
    speciesOffsets: {
      'Citrus limon': 0,
      'Citrus sinensis': 0,
      'Citrus reticulata': 10,
      'Citrus paradisi': 0,
      'Citrus aurantifolia': -5,
      'Fortunella': 15
    },
    secondary: [
      { code: '60', i18nKey: 'pheno.sub.60', progressPercent: 0 },
      { code: '61', i18nKey: 'pheno.sub.61', progressPercent: 20 },
      // progressPercent: 50 → BBCH 65 "~50% fleurs ouvertes" à mi-floraison
      { code: '65', i18nKey: 'pheno.sub.65', progressPercent: 50 },
      { code: '67', i18nKey: 'pheno.sub.67', progressPercent: 80 },
      { code: '69', i18nKey: 'pheno.sub.69', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 7 : Développement du fruit ───
  {
    principal: 7,
    stage: 'fruit_dev',
    icon: '🟢',
    gjcThreshold: 750,
    i18nKey: 'pheno.stage.7',
    descKey: 'pheno.desc.7',
    notes: {
      regulators: 'pheno.note.reg.7',
      remarks: 'pheno.note.rem.7'
    },
    actions: {
      fertilization: 'pheno.action.fert.7',
      pruning: 'pheno.action.prune.7',
      irrigation: 'pheno.action.irrig.7'
    },
    pests: ['pheno.pest.mouche_fruits', 'pheno.pest.cochenilles', 'pheno.pest.alternariose'],
    speciesOffsets: {
      'Citrus limon': 0,
      'Citrus sinensis': 0,
      'Citrus reticulata': 5,
      'Citrus paradisi': 10,
      'Citrus aurantifolia': 0,
      'Fortunella': 5
    },
    secondary: [
      { code: '71', i18nKey: 'pheno.sub.71', progressPercent: 0 },
      { code: '72', i18nKey: 'pheno.sub.72', progressPercent: 15 },
      { code: '73', i18nKey: 'pheno.sub.73', progressPercent: 30, alert: true },
      { code: '74', i18nKey: 'pheno.sub.74', progressPercent: 55 },
      { code: '79', i18nKey: 'pheno.sub.79', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 8 : Maturation du fruit ───
  {
    principal: 8,
    stage: 'maturation',
    icon: '🍊',
    gjcThreshold: 1000,
    i18nKey: 'pheno.stage.8',
    descKey: 'pheno.desc.8',
    notes: {
      regulators: 'pheno.note.reg.8',
      remarks: 'pheno.note.rem.8'
    },
    actions: {
      fertilization: 'pheno.action.fert.8',
      pruning: 'pheno.action.prune.8',
      irrigation: 'pheno.action.irrig.8'
    },
    pests: ['pheno.pest.moisissures', 'pheno.pest.mouche_fruits', 'pheno.pest.pourriture'],
    speciesOffsets: {
      'Citrus limon': 0,
      'Citrus sinensis': 0,
      'Citrus reticulata': 0,
      'Citrus paradisi': 20,
      'Citrus aurantifolia': 0,
      'Fortunella': -10
    },
    secondary: [
      { code: '81', i18nKey: 'pheno.sub.81', progressPercent: 0 },
      { code: '83', i18nKey: 'pheno.sub.83', progressPercent: 35 },
      { code: '85', i18nKey: 'pheno.sub.85', progressPercent: 65 },
      { code: '89', i18nKey: 'pheno.sub.89', progressPercent: 100 }
    ]
  },

  // ─── STADE PRINCIPAL 9 : Sénescence et dormance ───
  {
    principal: 9,
    stage: 'senescence',
    icon: '🍂',
    gjcThreshold: 1200,
    i18nKey: 'pheno.stage.9',
    descKey: 'pheno.desc.9',
    notes: {
      regulators: null,
      remarks: 'pheno.note.rem.9'
    },
    actions: {
      fertilization: 'pheno.action.fert.9',
      pruning: 'pheno.action.prune.9',
      irrigation: 'pheno.action.irrig.9'
    },
    pests: ['pheno.pest.cochenilles', 'pheno.pest.fumagine'],
    speciesOffsets: {
      'Citrus limon': 0,
      'Citrus sinensis': 0,
      'Citrus reticulata': 0,
      'Citrus paradisi': 0,
      'Citrus aurantifolia': 0,
      'Fortunella': 0
    },
    secondary: [
      { code: '91', i18nKey: 'pheno.sub.91', progressPercent: 0 },
      { code: '93', i18nKey: 'pheno.sub.93', progressPercent: 50 },
      { code: '97', i18nKey: 'pheno.sub.97', progressPercent: 100 }
    ]
  }
];

/**
 * Détermine le stade phénologique actuel d'un agrume en fonction des GJC accumulés.
 *
 * Les offsets espèces sont CUMULATIFS : l'avance/retard phénologique d'une espèce
 * par rapport à C. sinensis s'accumule de stade en stade (d'où "offset cumulé").
 * Exemple : C. limon, qui démarre plus tôt (-50 GJC en dormance, -40 en feuilles…),
 * atteint la floraison et la nouaison avec 120 GJC de moins que C. sinensis.
 *
 * @param {string} species   - Nom latin (ex. 'Citrus sinensis')
 * @param {number} gjcAccumulated - GJC accumulés depuis le 1er janvier
 * @returns {{
 *   principal: Object,
 *   secondaryCode: string,
 *   secondaryAlert: boolean,
 *   nextPrincipal: Object|null,
 *   progressInPrincipal: number,
 *   gjcToNextPrincipal: number,
 *   adjustedThreshold: number
 * }}
 */
export function getPhenologyForSpecies(species, gjcAccumulated) {
  // 1. Calcul des seuils ajustés avec offsets cumulatifs par espèce
  let cumulativeOffset = 0;
  const adjustedStages = BBCH_STAGES.map(s => {
    cumulativeOffset += (s.speciesOffsets[species] ?? 0);
    return { idx: BBCH_STAGES.indexOf(s), adjustedThreshold: s.gjcThreshold + cumulativeOffset };
  });

  // 2. Stade courant : seuil ajusté le plus élevé ≤ gjcAccumulated
  let currentIdx = 0;
  for (let i = 0; i < adjustedStages.length; i++) {
    if (adjustedStages[i].adjustedThreshold <= gjcAccumulated) {
      currentIdx = i;
    }
  }

  const currentAdj = adjustedStages[currentIdx];
  const nextAdj = adjustedStages[currentIdx + 1] ?? null;
  const principal = BBCH_STAGES[currentIdx];
  const nextPrincipal = nextAdj ? BBCH_STAGES[currentIdx + 1] : null;

  // 3. Progression dans le stade courant (0-100)
  let progressInPrincipal = 100;
  let gjcToNextPrincipal = 0;
  if (nextAdj) {
    const rangeGJC = nextAdj.adjustedThreshold - currentAdj.adjustedThreshold;
    const doneGJC = gjcAccumulated - currentAdj.adjustedThreshold;
    progressInPrincipal = rangeGJC > 0
      ? Math.min(100, Math.max(0, (doneGJC / rangeGJC) * 100))
      : 100;
    gjcToNextPrincipal = Math.max(0, nextAdj.adjustedThreshold - gjcAccumulated);
  }

  // 4. Code secondaire le plus probable
  const secondaryStage = getSecondaryStage(principal.principal, progressInPrincipal);

  return {
    principal,
    secondaryCode: secondaryStage.code,
    secondaryAlert: secondaryStage.alert === true,
    nextPrincipal,
    progressInPrincipal,
    gjcToNextPrincipal,
    adjustedThreshold: currentAdj.adjustedThreshold
  };
}

/**
 * Retourne le sous-stade BBCH correspondant à une progression dans un stade principal.
 *
 * @param {number} principalCode     - Code du stade principal (0, 1, 3, 5, 6, 7, 8 ou 9)
 * @param {number} progressInPrincipal - Progression 0-100 dans le stade principal
 * @returns {{ code: string, i18nKey: string, progressPercent: number, alert?: boolean }}
 */
export function getSecondaryStage(principalCode, progressInPrincipal) {
  const stage = BBCH_STAGES.find(s => s.principal === principalCode);
  if (!stage) return { code: '00', i18nKey: 'pheno.sub.00', progressPercent: 0 };

  const secondary = stage.secondary;
  let best = secondary[0];
  for (const sub of secondary) {
    if (sub.progressPercent <= progressInPrincipal) {
      best = sub;
    }
  }
  return best;
}

/**
 * Retourne les clés i18n des actions recommandées pour un stade principal.
 *
 * @param {number} principalCode
 * @returns {{ fertilization: string, pruning: string, irrigation: string }|null}
 */
export function getStageActions(principalCode) {
  const stage = BBCH_STAGES.find(s => s.principal === principalCode);
  return stage ? stage.actions : null;
}

/**
 * Retourne les clés i18n des ravageurs associés à un stade principal.
 *
 * @param {number} principalCode
 * @returns {string[]}
 */
export function getStagePests(principalCode) {
  const stage = BBCH_STAGES.find(s => s.principal === principalCode);
  return stage ? stage.pests : [];
}

/**
 * Estime les GJC accumulés depuis le 1er janvier jusqu'à une date donnée,
 * en utilisant un modèle sinusoïdal calibré par bande de latitude.
 *
 * Modèle : Tjour = Tmoy + amplitude × sin(2π × (jourAnnée − décalage) / 365)
 *   - décalage = 105 (hémisphère N) | 287 (hémisphère S)
 * GJC quotidien = max(0, Tjour − baseTemp)
 *
 * @param {number} latitude   - Latitude en degrés décimaux (négatif = Sud)
 * @param {Date}   date       - Date cible
 * @param {number} [baseTemp=13] - Température de base GJC (°C)
 * @returns {number} GJC accumulés (arrondi à 1 décimale)
 */
export function estimateGJCFromDate(latitude, date, baseTemp = 13) {
  // Paramètres sinusoïdaux par bande de latitude
  const absLat = Math.abs(latitude);
  let Tmoy, amplitude;
  if (absLat < 25) {
    Tmoy = 24; amplitude = 4;
  } else if (absLat < 35) {
    Tmoy = 18; amplitude = 8;
  } else if (absLat < 45) {
    Tmoy = 15; amplitude = 12;
  } else {
    Tmoy = 12; amplitude = 14;
  }

  // Décalage de phase : hémisphère N = 105, S = 287
  const offset = latitude >= 0 ? 105 : 287;

  // Jour julien de la date cible (1 = 1er janvier)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / 86400000) + 1;

  // Accumulation GJC du jour 1 au jour cible
  const TWO_PI_OVER_365 = (2 * Math.PI) / 365;
  let gjc = 0;
  for (let d = 1; d <= dayOfYear; d++) {
    const Tday = Tmoy + amplitude * Math.sin(TWO_PI_OVER_365 * (d - offset));
    gjc += Math.max(0, Tday - baseTemp);
  }

  return Math.round(gjc * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/** Icônes et couleurs par type d'événement (ne dépend pas de ET qui est buildé côté app). */
const _EV_ICON = {
  arrosage:'💧', fertilisation:'🌱', taille:'✂️', traitement:'🧪',
  floraison:'🌸', fructification:'🍊', récolte:'🧺', observation:'👁',
  rempotage:'🪴', greffage:'🌿', hivernage:'❄️', sortie:'☀️',
  protection:'🛡', dégâts_gel:'🍂', plantation:'🌳'
};
const _EV_COLOR = {
  arrosage:'#2d7dd2', fertilisation:'#8b5e3c', taille:'#5c6bc0',
  traitement:'#c62828', floraison:'#d81b60', fructification:'#e65100',
  récolte:'#c77900', observation:'#4a7c59', rempotage:'#5d4037',
  greffage:'#388e3c', hivernage:'#455a64', sortie:'#388e3c',
  protection:'#78909c', dégâts_gel:'#1565c0', plantation:'#4a7c59'
};

/**
 * Calcule le code BBCH de chaque événement de la plante à la volée.
 * @param {Object} plant
 * @returns {Array} events enrichis avec _bbchCode, _principalCode, _principalIcon
 */
function _calcEventBBCH(plant) {
  const species = plant.species || 'Citrus sinensis';
  const lat     = plant.lat || 44;
  return (plant.events || [])
    .filter(ev => !ev.audit && ev.date)
    .map(ev => {
      try {
        const gjcAtEv = estimateGJCFromDate(lat, new Date(ev.date), 13);
        const pheno   = getPhenologyForSpecies(species, gjcAtEv);
        return { ...ev, _bbchCode: pheno.secondaryCode,
          _principalCode: pheno.principal.principal,
          _principalIcon: pheno.principal.icon,
          _principalI18nKey: pheno.principal.i18nKey };
      } catch { return { ...ev, _bbchCode: null, _principalCode: null }; }
    });
}

/** Résout la fonction T depuis window ou utilise un fallback identité. */
const _resolveT = userT =>
  userT ||
  (typeof window !== 'undefined' && typeof window.T === 'function' ? window.T : k => k);

/**
 * Paramètres sinusoïdaux selon la bande de latitude (identiques à estimateGJCFromDate).
 * @param {number} latitude
 * @returns {{ Tmoy: number, amplitude: number, offset: number }}
 */
function _latParams(latitude) {
  const absLat = Math.abs(latitude);
  let Tmoy, amplitude;
  if (absLat < 25)       { Tmoy = 24; amplitude = 4; }
  else if (absLat < 35)  { Tmoy = 18; amplitude = 8; }
  else if (absLat < 45)  { Tmoy = 15; amplitude = 12; }
  else                   { Tmoy = 12; amplitude = 14; }
  return { Tmoy, amplitude, offset: latitude >= 0 ? 105 : 287 };
}

/**
 * Retourne le jour julien (1–365) où le GJC cumulé dépasse gjcTarget.
 * Retourne 366 si le seuil n'est pas atteint dans l'année.
 */
function _dayOfYearForGJC(gjcTarget, latitude, baseTemp = 13) {
  const { Tmoy, amplitude, offset } = _latParams(latitude);
  const TWO_PI_365 = (2 * Math.PI) / 365;
  let cum = 0;
  for (let d = 1; d <= 365; d++) {
    cum += Math.max(0, Tmoy + amplitude * Math.sin(TWO_PI_365 * (d - offset)) - baseTemp);
    if (cum >= gjcTarget) return d;
  }
  return 366;
}

/** Convertit un jour julien en indice de mois 0–11. */
const _dayToMonth = d => Math.min(11, Math.floor((Math.min(d, 365) - 1) / 30.44));

/**
 * Calcule les seuils ajustés (cumulatifs) pour une espèce.
 * Retourne un tableau parallèle à BBCH_STAGES.
 */
function _adjustedThresholds(species) {
  let cum = 0;
  return BBCH_STAGES.map(s => {
    cum += (s.speciesOffsets[species] ?? 0);
    return s.gjcThreshold + cum;
  });
}

/**
 * Calcule la position (%) sur la barre globale pour un GJC donné.
 * La barre s'étend du seuil du stade 0 (ajusté) au seuil du stade 9 (ajusté) + 200 GJC.
 */
function _globalProgress(gjcAccumulated, thresholds) {
  const maxGJC = thresholds[thresholds.length - 1] + 200;
  return Math.min(100, Math.max(0, (gjcAccumulated / maxGJC) * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2A — Widget dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit le widget phénologie pour le dashboard.
 *
 * @param {Object} plant           - Objet plante (doit avoir plant.species)
 * @param {number} gjcAccumulated  - GJC accumulés (depuis getCfg().gjcCumul)
 * @param {Function} [T]           - Fonction de traduction (défaut : window.T)
 * @returns {HTMLElement}
 */
export function renderPhenologyWidget(plant, gjcAccumulated, T) {
  T = _resolveT(T);
  const species = plant.species || 'Citrus sinensis';

  if (!plant.species) {
    const wrap = document.createElement('div');
    wrap.className = 'cca-pheno-widget';
    wrap.innerHTML = `<p class="cca-pheno-no-species">${esc(T('pheno.widget.noSpecies'))}</p>`;
    return wrap;
  }

  const pheno       = getPhenologyForSpecies(species, gjcAccumulated);
  const { principal, secondaryCode, secondaryAlert, nextPrincipal,
          progressInPrincipal, gjcToNextPrincipal } = pheno;

  const thresholds  = _adjustedThresholds(species);
  const progressGlobal = _globalProgress(gjcAccumulated, thresholds);

  const secondary   = getSecondaryStage(principal.principal, progressInPrincipal);
  const actionKey   = principal.actions.irrigation;  // action prioritaire : irrigation
  const alertText   = T('pheno.notif.alertBody73').replace('{plant}', plant.name || '');

  // ── Marqueurs (8, un par stade principal) ──────────────────────────────
  const maxGJC = thresholds[thresholds.length - 1] + 200;
  const markers = thresholds
    .map((t, i) => {
      const pct = Math.min(99, (t / maxGJC) * 100);
      const stageData = BBCH_STAGES[i];
      return `<div class="cca-pheno-marker"
                   style="left:${pct.toFixed(1)}%"
                   title="${esc(T(stageData.i18nKey))} — ${esc(stageData.icon)}"
                   data-principal="${stageData.principal}"></div>`;
    })
    .join('');

  // ── Prochain stade ─────────────────────────────────────────────────────
  const nextHtml = nextPrincipal
    ? `<div class="cca-pheno-next">
         ${esc(T('pheno.widget.next'))} : ${esc(nextPrincipal.icon)}
         <strong>${esc(T(nextPrincipal.i18nKey))}</strong>
         — ${Math.round(gjcToNextPrincipal)} GJC
       </div>`
    : '';

  // ── Actions (3) ───────────────────────────────────────────────────────
  const { fertilization, pruning, irrigation } = principal.actions;
  const actionsWidgetHtml = `
    <div class="cca-pheno-actions-grid" style="margin-top:6px">
      <div><strong>🌱</strong><br>${esc(T(fertilization))}</div>
      <div><strong>✂️</strong><br>${esc(T(pruning))}</div>
      <div><strong>💧</strong><br>${esc(T(irrigation))}</div>
    </div>`;

  // ── Régulateurs (conditionnel) ─────────────────────────────────────────
  const regulatorsWidgetHtml = principal.notes.regulators
    ? `<div class="cca-pheno-action" style="margin-top:4px">🧪 ${esc(T(principal.notes.regulators))}</div>`
    : '';

  // ── Événements liés au stade courant ──────────────────────────────────
  const enrichedEvs = _calcEventBBCH(plant);
  const stageEvs = enrichedEvs
    .filter(ev => ev._principalCode === principal.principal)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);
  const evSectionHtml = stageEvs.length ? `
    <div class="cca-pheno-ev-section">
      <div class="cca-pheno-secttl" style="margin-top:8px;font-size:.72rem">
        📅 ${esc(T('pheno.events.title'))}
      </div>
      ${stageEvs.map(ev => {
        const icon = _EV_ICON[ev.type] || '📌';
        const color = _EV_COLOR[ev.type] || '#4a7c59';
        const dateStr = ev.date ? new Date(ev.date).toLocaleDateString(undefined, { day:'numeric', month:'short' }) : '';
        return `<div class="cca-pheno-ev-item">
          <span style="color:${esc(color)}">${icon}</span>
          <span style="flex:1;font-size:.78rem;color:var(--text)">${esc(ev.description || ev.type)}</span>
          <span style="font-size:.72rem;color:var(--muted);white-space:nowrap">${esc(dateStr)}</span>
          ${ev._bbchCode ? `<span class="cca-pheno-sub-code" style="font-size:.65rem">${esc(ev._bbchCode)}</span>` : ''}
        </div>`;
      }).join('')}
    </div>` : '';

  const el = document.createElement('div');
  el.className = 'cca-pheno-widget';
  el.dataset.plantId = plant.id || '';

  el.innerHTML = `
    <div class="cca-pheno-header">
      <span class="cca-pheno-icon">${esc(principal.icon)}</span>
      <span class="cca-pheno-stage">${esc(T(principal.i18nKey))}</span>
      <span class="cca-pheno-code">BBCH ${esc(secondaryCode)}</span>
    </div>
    <div class="cca-pheno-bar" role="progressbar"
         aria-valuenow="${Math.round(progressGlobal)}" aria-valuemin="0" aria-valuemax="100">
      <div class="cca-pheno-bar-fill" style="width:${progressGlobal.toFixed(1)}%"></div>
      ${markers}
    </div>
    <div class="cca-pheno-slide-panel" style="display:none"></div>
    <div class="cca-pheno-sub">${esc(T(secondary.i18nKey))}</div>
    ${actionsWidgetHtml}
    ${regulatorsWidgetHtml}
    <div class="cca-pheno-alert" style="display:${secondaryAlert ? 'block' : 'none'}">
      ⚠ ${esc(alertText)}
    </div>
    ${evSectionHtml}
    ${nextHtml}`;

  // ── Listeners : clic sur marqueur → slide-down sous-stades ────────────
  const slidePanel = el.querySelector('.cca-pheno-slide-panel');
  let openPrincipal = null;

  el.querySelectorAll('.cca-pheno-marker').forEach(marker => {
    marker.addEventListener('click', () => {
      const clickedCode = parseInt(marker.dataset.principal, 10);
      if (openPrincipal === clickedCode) {
        slidePanel.style.display = 'none';
        slidePanel.innerHTML = '';
        openPrincipal = null;
        el.querySelectorAll('.cca-pheno-marker').forEach(m => m.classList.remove('cca-pheno-marker-active'));
        return;
      }
      const stage = BBCH_STAGES.find(s => s.principal === clickedCode);
      if (!stage) return;
      const listHtml = stage.secondary.map(sub => {
        const isActive = sub.code === secondaryCode && clickedCode === principal.principal;
        return `<li class="${isActive ? 'cca-pheno-sub-active' : 'cca-pheno-sub-item'}">
          <span class="cca-pheno-sub-code">${esc(sub.code)}</span>
          <span>${esc(T(sub.i18nKey))}${sub.alert ? ' ⚠' : ''}</span>
          ${isActive ? '<span style="margin-left:auto;font-size:.7rem;opacity:.6">●</span>' : ''}
        </li>`;
      }).join('');
      slidePanel.innerHTML = `<ul class="cca-pheno-sub-list" style="padding:6px 0">${listHtml}</ul>`;
      slidePanel.style.display = 'block';
      el.querySelectorAll('.cca-pheno-marker').forEach(m => m.classList.remove('cca-pheno-marker-active'));
      marker.classList.add('cca-pheno-marker-active');
      openPrincipal = clickedCode;
    });
  });

  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2B — Vue détail fiche plante
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit la vue détail phénologie (onglet fiche plante).
 *
 * @param {Object}   plant          - Objet plante
 * @param {number}   gjcAccumulated - GJC accumulés
 * @param {Function} [T]            - Fonction de traduction
 * @returns {HTMLElement}
 */
export function renderPhenologyDetail(plant, gjcAccumulated, T) {
  T = _resolveT(T);
  const species = plant.species || 'Citrus sinensis';
  const pheno   = getPhenologyForSpecies(species, gjcAccumulated);
  const { principal, secondaryCode, secondaryAlert, nextPrincipal,
          progressInPrincipal, gjcToNextPrincipal, adjustedThreshold } = pheno;

  const secondary = getSecondaryStage(principal.principal, progressInPrincipal);

  // ── 1. En-tête ─────────────────────────────────────────────────────────
  const headerHtml = `
    <div class="cca-pheno-det-header">
      <span class="cca-pheno-det-icon">${esc(principal.icon)}</span>
      <div>
        <div class="cca-pheno-det-title">${esc(T(principal.i18nKey))}</div>
        <div class="cca-pheno-det-desc">${esc(T(principal.descKey))}</div>
        <div class="cca-pheno-code">BBCH ${esc(secondaryCode)}</div>
      </div>
    </div>`;

  // ── 2. Sous-stades ─────────────────────────────────────────────────────
  const subsHtml = `
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${esc(T('pheno.section.substages'))}</h4>
      <ul class="cca-pheno-sub-list">
        ${principal.secondary.map(sub => {
          const isActive = sub.code === secondaryCode;
          return `<li class="${isActive ? 'cca-pheno-sub-active' : 'cca-pheno-sub-item'}">
            <span class="cca-pheno-sub-code">${esc(sub.code)}</span>
            <span>${esc(T(sub.i18nKey))}${sub.alert ? ' ⚠' : ''}</span>
          </li>`;
        }).join('')}
      </ul>
    </section>`;

  // ── 3. Actions recommandées ────────────────────────────────────────────
  const { fertilization, pruning, irrigation } = principal.actions;
  const actionsHtml = `
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${esc(T('pheno.section.actions'))}</h4>
      <div class="cca-pheno-actions-grid">
        <div><strong>${esc(T('pheno.label.fertilization'))}</strong><br>${esc(T(fertilization))}</div>
        <div><strong>${esc(T('pheno.label.pruning'))}</strong><br>${esc(T(pruning))}</div>
        <div><strong>${esc(T('pheno.label.irrigation'))}</strong><br>${esc(T(irrigation))}</div>
      </div>
    </section>`;

  // ── 4. Régulateurs (conditionnel) ─────────────────────────────────────
  const regulatorsHtml = principal.notes.regulators ? `
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${esc(T('pheno.section.regulators'))}</h4>
      <p class="cca-pheno-note">${esc(T(principal.notes.regulators))}</p>
    </section>` : '';

  // ── 5. Risques phytosanitaires ─────────────────────────────────────────
  const pestsHtml = `
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${esc(T('pheno.section.pests'))}</h4>
      <ul class="cca-pheno-pest-list">
        ${principal.pests.map(pk => `<li>${esc(T(pk))}</li>`).join('')}
      </ul>
      ${secondaryAlert ? `<div class="cca-pheno-alert">⚠ ${esc(T('pheno.notif.alertBody73').replace('{plant}', plant.name || ''))}</div>` : ''}
    </section>`;

  // ── 6. Remarques agronomiques (conditionnel) ───────────────────────────
  const remarksHtml = principal.notes.remarks ? `
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${esc(T('pheno.section.remarks'))}</h4>
      <p class="cca-pheno-note">${esc(T(principal.notes.remarks))}</p>
    </section>` : '';

  // ── 7. Prochain stade ──────────────────────────────────────────────────
  const nextHtml = nextPrincipal ? (() => {
    const lat = (plant.lat || 44);
    const dayNext = _dayOfYearForGJC(adjustedThreshold + gjcToNextPrincipal, lat);
    const dateEst = dayNext < 366
      ? new Date(new Date().getFullYear(), 0, dayNext).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
      : '—';
    return `
      <section class="cca-pheno-section">
        <h4 class="cca-pheno-secttl">${esc(T('pheno.section.next'))}</h4>
        <div class="cca-pheno-next-block">
          <span class="cca-pheno-det-icon">${esc(nextPrincipal.icon)}</span>
          <div>
            <div><strong>${esc(T(nextPrincipal.i18nKey))}</strong></div>
            <div>${esc(T('pheno.widget.gjcRemaining').replace('{n}', Math.round(gjcToNextPrincipal)))}</div>
            <div>${esc(T('pheno.widget.estimatedDate').replace('{date}', dateEst))}</div>
          </div>
        </div>
      </section>`;
  })() : '';

  // ── 8. Événements groupés par stade BBCH ──────────────────────────────
  const allEnrichedEvs = _calcEventBBCH(plant);
  // Grouper par principal code
  const evsByStage = new Map();
  for (const s of BBCH_STAGES) evsByStage.set(s.principal, []);
  for (const ev of allEnrichedEvs) {
    if (ev._principalCode !== null && evsByStage.has(ev._principalCode)) {
      evsByStage.get(ev._principalCode).push(ev);
    }
  }
  // Construire HTML : n'afficher que les stades ayant des événements (+ stade courant)
  const stagesWithEvs = BBCH_STAGES.filter(s =>
    evsByStage.get(s.principal).length > 0 || s.principal === principal.principal
  );
  const eventsHtml = stagesWithEvs.length ? `
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${esc(T('pheno.events.title'))}</h4>
      ${stagesWithEvs.map(s => {
        const evs = evsByStage.get(s.principal).sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,8);
        const isCurrentStage = s.principal === principal.principal;
        return `
          <div class="cca-pheno-ev-group${isCurrentStage ? ' cca-pheno-ev-group-current' : ''}">
            <div class="cca-pheno-ev-group-title">
              ${esc(s.icon)} ${esc(T(s.i18nKey))} <span class="cca-pheno-sub-code">BBCH ${esc(String(s.principal))}</span>
            </div>
            ${evs.length ? evs.map(ev => {
              const icon  = _EV_ICON[ev.type]  || '📌';
              const color = _EV_COLOR[ev.type] || '#4a7c59';
              const dateStr = ev.date ? new Date(ev.date).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' }) : '';
              return `<div class="cca-pheno-ev-item">
                <span style="color:${esc(color)}">${icon}</span>
                <span style="flex:1;font-size:.78rem">${esc(ev.description || ev.type)}</span>
                <span style="font-size:.72rem;color:var(--muted);white-space:nowrap">${esc(dateStr)}</span>
                ${ev._bbchCode ? `<span class="cca-pheno-sub-code" style="font-size:.65rem">${esc(ev._bbchCode)}</span>` : ''}
              </div>`;
            }).join('') : `<div class="cca-pheno-ev-none">${esc(T('pheno.events.none'))}</div>`}
          </div>`;
      }).join('')}
    </section>` : '';

  // ── 9. Navigation ◄ ► ─────────────────────────────────────────────────
  const currentIdx = BBCH_STAGES.findIndex(s => s.principal === principal.principal);
  const navHtml = `
    <div class="cca-pheno-nav">
      <button class="cca-pheno-nav-btn" data-dir="-1"
              ${currentIdx === 0 ? 'disabled' : ''}>◄</button>
      <span class="cca-pheno-nav-label">
        ${currentIdx + 1} / ${BBCH_STAGES.length}
      </span>
      <button class="cca-pheno-nav-btn" data-dir="1"
              ${currentIdx === BBCH_STAGES.length - 1 ? 'disabled' : ''}>►</button>
    </div>`;

  // ── Assemblage ─────────────────────────────────────────────────────────
  const el = document.createElement('div');
  el.className = 'cca-pheno-detail';
  el.dataset.plantId = plant.id || '';
  el.dataset.principalIdx = String(currentIdx);

  el.innerHTML = headerHtml + subsHtml + actionsHtml + regulatorsHtml
    + pestsHtml + remarksHtml + nextHtml + eventsHtml + navHtml;

  // Navigation ◄ ► : affiche le stade demandé (simulation pour vue statique)
  el.querySelectorAll('.cca-pheno-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir   = parseInt(btn.dataset.dir, 10);
      const curIdx = parseInt(el.dataset.principalIdx, 10);
      const newIdx = Math.max(0, Math.min(BBCH_STAGES.length - 1, curIdx + dir));
      if (newIdx === curIdx) return;

      // Reconstruit le détail sur le stade navigué (GJC fictif = milieu du stade)
      const targetStage    = BBCH_STAGES[newIdx];
      const thresholds     = _adjustedThresholds(species);
      const midGJC         = newIdx < BBCH_STAGES.length - 1
        ? (thresholds[newIdx] + thresholds[newIdx + 1]) / 2
        : thresholds[newIdx] + 100;

      const newEl = renderPhenologyDetail(plant, midGJC, T);
      el.replaceWith(newEl);

      newEl.dispatchEvent(new CustomEvent('pheno:navChange', {
        bubbles: true, detail: { principalCode: targetStage.principal }
      }));
    });
  });

  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2C — Calendrier Gantt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit le Gantt phénologie sur 12 mois.
 * 8 barres horizontales (une par stade principal), trait "aujourd'hui".
 *
 * @param {Object}   plant     - Objet plante (plant.species, plant.lat optionnel)
 * @param {number}   [latitude=44] - Latitude pour le modèle GJC
 * @param {Function} [T]       - Fonction de traduction
 * @returns {HTMLElement}
 */
export function renderPhenologyCalendar(plant, latitude, T) {
  T = _resolveT(T);
  latitude = latitude ?? plant.lat ?? 44;
  const species   = plant.species || 'Citrus sinensis';
  const thresholds = _adjustedThresholds(species);
  const BASE_TEMP  = 13;

  // Calcul des plages de mois pour chaque stade
  const stageMonthRanges = thresholds.map((thr, i) => {
    const startDay = _dayOfYearForGJC(thr, latitude, BASE_TEMP);
    const endDay   = i < thresholds.length - 1
      ? _dayOfYearForGJC(thresholds[i + 1], latitude, BASE_TEMP)
      : 365;
    const startMonth = _dayToMonth(startDay);
    const endMonth   = _dayToMonth(Math.min(endDay, 365));
    return { startMonth, endMonth };
  });

  // Mois courant (0-11) pour le trait "aujourd'hui"
  const todayMonth = new Date().getMonth();
  const todayPct   = (todayMonth + (new Date().getDate() / 31)) / 12 * 100;

  // Labels des mois (abrégés, 1 lettre ou 3 lettres selon la locale)
  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleDateString(undefined, { month: 'short' })
  );

  // Pré-calcul des événements par stade pour le Gantt
  const enrichedGanttEvs = _calcEventBBCH(plant);
  const evsByPrincipalGantt = new Map();
  for (const s of BBCH_STAGES) evsByPrincipalGantt.set(s.principal, []);
  for (const ev of enrichedGanttEvs) {
    if (ev._principalCode !== null && evsByPrincipalGantt.has(ev._principalCode)) {
      evsByPrincipalGantt.get(ev._principalCode).push(ev);
    }
  }

  const rowsHtml = BBCH_STAGES.map((stage, i) => {
    const { startMonth, endMonth } = stageMonthRanges[i];
    const leftPct  = (startMonth / 12) * 100;
    const widthPct = Math.max(4, ((endMonth - startMonth + 1) / 12) * 100);

    // Losanges événements
    const stageEvsDiamonds = (evsByPrincipalGantt.get(stage.principal) || [])
      .filter(ev => ev.date)
      .map(ev => {
        const d = new Date(ev.date);
        const evPct = ((d.getMonth() + (d.getDate() - 1) / 31) / 12) * 100;
        const icon  = _EV_ICON[ev.type]  || '◆';
        const color = _EV_COLOR[ev.type] || '#4a7c59';
        const dateStr = d.toLocaleDateString(undefined, { day:'numeric', month:'short' });
        const tipText = `${ev.type} — ${dateStr}${ev._bbchCode ? ` — BBCH ${ev._bbchCode}` : ''}`;
        return `<div class="cca-pheno-gantt-ev"
                     style="left:${evPct.toFixed(1)}%;color:${esc(color)}"
                     title="${esc(tipText)}">◆</div>`;
      })
      .join('');

    return `
      <div class="cca-pheno-gantt-row">
        <div class="cca-pheno-gantt-label">
          ${esc(stage.icon)}&nbsp;${esc(T(stage.i18nKey))}
        </div>
        <div class="cca-pheno-gantt-track">
          <div class="cca-pheno-gantt-bar"
               style="left:${leftPct.toFixed(1)}%;width:${widthPct.toFixed(1)}%"
               title="BBCH ${esc(String(stage.principal))} — ${esc(T(stage.i18nKey))}">
          </div>
          ${stageEvsDiamonds}
        </div>
      </div>`;
  }).join('');

  const monthHeaderHtml = monthLabels
    .map(m => `<div class="cca-pheno-gantt-month">${esc(m)}</div>`)
    .join('');

  const el = document.createElement('div');
  el.className = 'cca-pheno-calendar';
  el.dataset.plantId = plant.id || '';
  el.innerHTML = `
    <div class="cca-pheno-gantt-header">
      <div class="cca-pheno-gantt-label-empty"></div>
      <div class="cca-pheno-gantt-months">${monthHeaderHtml}</div>
    </div>
    <div class="cca-pheno-gantt-body">
      ${rowsHtml}
      <div class="cca-pheno-gantt-today"
           title="${esc(new Date().toLocaleDateString())}">
      </div>
    </div>`;

  // Positionne le trait "aujourd'hui" via custom property :
  // left = labelWidth + (100% - labelWidth) * todayPct / 100
  // → CSS : calc(var(--cca-gantt-label-w) + (100% - var(--cca-gantt-label-w)) * N / 100)
  el.querySelector('.cca-pheno-gantt-body')
    .style.setProperty('--cca-gantt-today-pct', todayPct.toFixed(2));

  return el;
}
