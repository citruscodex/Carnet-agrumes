/**
 * drip.js — Module B : Systèmes d'irrigation goutte-à-goutte par collection
 * Clé localStorage : agrumes_drip_systems
 * Contraintes : addEventListener exclusivement, esc() sur tout innerHTML,
 *               CSS préfixé cca-drip-*, window.__CCA_drip pour exposition.
 */

const DRIP_KEY = 'agrumes_drip_systems';

function _esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _gid() {
  return 'drip_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function _T(key, T, fallback) {
  if (typeof T === 'function') {
    const v = T(key);
    if (v && v !== key) return v;
  }
  return fallback;
}

// ── Store ─────────────────────────────────────────────────────────────────────

function _load() {
  try { return JSON.parse(localStorage.getItem(DRIP_KEY) || '[]'); }
  catch { return []; }
}

function _save(systems) {
  localStorage.setItem(DRIP_KEY, JSON.stringify(systems));
}

export function getAllSystems()       { return _load(); }
export function getSystem(id)        { return getAllSystems().find(s => s.id === id) || null; }

export function createSystem(data) {
  const systems = getAllSystems();
  const sys = {
    id: _gid(),
    name: data.name || 'Nouveau circuit',
    emitterFlow: parseFloat(data.emitterFlow) || 2.0,
    emittersPerPlant: parseInt(data.emittersPerPlant) || 2,
    pressure: parseFloat(data.pressure) || 1.5,
    filterType: data.filterType || 'disque',
    timerEnabled: !!data.timerEnabled,
    timerSchedule: data.timerSchedule || '',
    plantIds: data.plantIds || [],
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };
  systems.unshift(sys);
  _save(systems);
  return sys;
}

export function updateSystem(id, data) {
  const systems = getAllSystems();
  const i = systems.findIndex(s => s.id === id);
  if (i < 0) return;
  systems[i] = { ...systems[i], ...data };
  _save(systems);
}

export function deleteSystem(id) {
  _save(getAllSystems().filter(s => s.id !== id));
}

export function addPlantToSystem(systemId, plantId) {
  const systems = getAllSystems();
  const sys = systems.find(s => s.id === systemId);
  if (!sys || sys.plantIds.includes(plantId)) return;
  sys.plantIds.push(plantId);
  _save(systems);
}

export function removePlantFromSystem(systemId, plantId) {
  const systems = getAllSystems();
  const sys = systems.find(s => s.id === systemId);
  if (!sys) return;
  sys.plantIds = sys.plantIds.filter(id => id !== plantId);
  _save(systems);
}

/** Retourne le premier circuit contenant cette plante. */
export function getSystemForPlant(plantId) {
  return getAllSystems().find(s => (s.plantIds || []).includes(plantId)) || null;
}

// ── Calcul ────────────────────────────────────────────────────────────────────

/**
 * calcSystemIrrigation — calcule les besoins agrégés d'un circuit.
 * Délègue à window.calcDripRecommendation (exposé par le monolithe).
 */
export function calcSystemIrrigation(system, plants) {
  const calcFn = window.calcDripRecommendation;
  const plantObjs = (system.plantIds || [])
    .map(id => (plants || []).find(p => p.id === id))
    .filter(Boolean);

  const plantCalcs = plantObjs.map(p => {
    let volL = null, etcMm = null, durMin = null;
    if (typeof calcFn === 'function') {
      try {
        const rec = calcFn(p);
        volL  = rec.volL;
        etcMm = rec.etcMm;
        if (volL !== null) {
          const flow  = system.emitterFlow || 2.0;
          const count = system.emittersPerPlant || 2;
          durMin = Math.round(volL / (flow * count) * 60);
        }
      } catch {}
    }
    return { id: p.id, name: p.name || p.species || '—', species: p.species || '',
             volL, etcMm, durMin };
  });

  const valid = plantCalcs.filter(p => p.volL !== null);
  if (!valid.length) {
    return { plants: plantCalcs, maxVolL: null, durationMin: null,
             totalVolL: null, overIrrigated: [], underIrrigated: [] };
  }

  const maxVolL = Math.max(...valid.map(p => p.volL));
  const flow    = system.emitterFlow || 2.0;
  const count   = system.emittersPerPlant || 2;
  const durationMin = Math.round(maxVolL / (flow * count) * 60);
  const totalVolL   = Math.round(valid.reduce((s, p) => s + p.volL, 0) * 10) / 10;
  // Volume effectivement reçu par chaque plante si le circuit tourne durationMin min
  const volReceived = Math.round(flow * count * (durationMin / 60) * 10) / 10;
  const overIrrigated = valid
    .filter(p => p.volL < maxVolL)
    .map(p => ({ ...p, excessL: Math.round((volReceived - p.volL) * 10) / 10 }));

  return { plants: plantCalcs, maxVolL, durationMin, totalVolL, overIrrigated, underIrrigated: [] };
}

// ── Module state ──────────────────────────────────────────────────────────────

let _view      = 'list';   // 'list' | 'detail' | 'form' | 'add-plant'
let _systemId  = null;
let _addingTo  = null;     // systemId en cours d'ajout de plantes

export function resetView()   { _view = 'list'; _systemId = null; _addingTo = null; }
export function openDetail(id){ _view = 'detail'; _systemId = id; }

// ── Render — liste ────────────────────────────────────────────────────────────

function _renderList(systems, plants, T) {
  if (!systems.length) return `
    <div style="padding:32px 20px;text-align:center;color:var(--muted)">
      <div style="font-size:2.2rem;margin-bottom:10px">💧</div>
      <div style="font-weight:600;font-size:.92rem;margin-bottom:6px;color:var(--text-strong)">
        ${_esc(_T('drip.title', T, "Systèmes d'irrigation"))}
      </div>
      <div style="font-size:.78rem;margin-bottom:18px;line-height:1.6">
        Aucun circuit configuré.<br>Créez un circuit pour piloter l'irrigation de plusieurs plantes ensemble.
      </div>
      <button class="btn btn-p" data-action="drip-new">
        + ${_esc(_T('drip.newSystem', T, 'Nouveau circuit'))}
      </button>
    </div>`;

  const rows = systems.map(sys => {
    const calc      = calcSystemIrrigation(sys, plants);
    const nPlants   = (sys.plantIds || []).length;
    const overCount = calc.overIrrigated.length;
    const durStr    = calc.durationMin !== null ? `${calc.durationMin} min` : '—';
    const volStr    = calc.totalVolL   !== null ? `${calc.totalVolL} L`    : '—';
    return `<div class="cca-drip-card" data-action="drip-detail" data-id="${_esc(sys.id)}" role="button" tabindex="0">
      <div class="cca-drip-card-header">
        <span class="cca-drip-card-ico">🔵</span>
        <span class="cca-drip-card-name">${_esc(sys.name)}</span>
        <span class="cca-drip-card-count">${nPlants} plante${nPlants !== 1 ? 's' : ''}</span>
      </div>
      <div class="cca-drip-card-body">
        <span>${_esc(_T('drip.duration', T, 'Durée recommandée'))} : <strong>${_esc(durStr)}</strong></span>
        <span style="margin-left:10px">${_esc(_T('drip.totalVol', T, 'Volume total'))} : <strong>${_esc(volStr)}</strong></span>
      </div>
      ${overCount ? `<div class="cca-drip-over-tag">⚠ ${overCount} plante${overCount > 1 ? 's' : ''} en sur-arrosage</div>` : ''}
    </div>`;
  }).join('');

  return `<div style="padding:12px 14px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 class="secttl" style="margin:0">💧 ${_esc(_T('drip.title', T, "Systèmes d'irrigation"))}</h3>
      <button class="btn btn-p btn-sm" data-action="drip-new">
        + ${_esc(_T('drip.newSystem', T, 'Nouveau circuit'))}
      </button>
    </div>
    ${rows}
  </div>`;
}

// ── Render — détail ───────────────────────────────────────────────────────────

function _renderDetail(sys, plants, T) {
  const calc = calcSystemIrrigation(sys, plants);
  const flow  = sys.emitterFlow || 2.0;
  const count = sys.emittersPerPlant || 2;

  const rows = calc.plants.map(p => {
    const isMax = p.volL !== null && p.volL === calc.maxVolL;
    const over  = calc.overIrrigated.find(o => o.id === p.id);
    return `<div class="cca-drip-detail-row${isMax ? ' cca-drip-detail-max' : ''}">
      <span class="cca-drip-det-name">${_esc(p.name)}</span>
      <span class="cca-drip-det-val">${p.etcMm !== null ? _esc(String(p.etcMm)) + ' mm' : '—'}</span>
      <span class="cca-drip-det-val">${p.volL  !== null ? _esc(String(p.volL))  + ' L'  : '—'}</span>
      <span class="cca-drip-det-val">${p.durMin !== null ? _esc(String(p.durMin)) + ' min' : '—'}${isMax ? ' ←' : ''}</span>
      <span>${over ? `<span class="cca-drip-over-badge">⚠ +${_esc(String(over.excessL))}L</span>` : ''}</span>
      <button class="cca-drip-det-rm"
        data-action="drip-remove-plant"
        data-id="${_esc(sys.id)}"
        data-plant-id="${_esc(p.id)}"
        title="Retirer du circuit">✕</button>
    </div>`;
  }).join('');

  const overWarnings = calc.overIrrigated.map(p =>
    `<div class="cca-drip-warn-row">⚠ <strong>${_esc(p.name)}</strong> ${_esc(_T('drip.overIrrig', T, '⚠ Sur-arrosage'))} : ${_esc(_T('drip.excessL', T, '+{n}L en excès').replace('{n}', String(p.excessL)))}</div>`
  ).join('');

  return `<div style="padding:12px 14px">
    <div class="cca-drip-detail-topbar">
      <button class="btn btn-sm" data-action="drip-back">← Retour</button>
      <h3 class="secttl" style="margin:0;flex:1">💧 ${_esc(sys.name)}</h3>
      <button class="btn btn-sm" data-action="drip-edit" data-id="${_esc(sys.id)}" title="Modifier">✏️</button>
      <button class="btn btn-sm cca-drip-del-btn"
        data-action="drip-delete" data-id="${_esc(sys.id)}" title="Supprimer">🗑</button>
    </div>
    <div style="font-size:.75rem;color:var(--muted);margin-bottom:10px">
      Émetteurs : <strong>${_esc(String(flow))} L/h</strong> × <strong>${_esc(String(count))}/plante</strong>
      ${sys.filterType ? ` · Filtre : ${_esc(sys.filterType)}` : ''}
      ${sys.timerEnabled && sys.timerSchedule ? ` · ⏱ ${_esc(sys.timerSchedule)}` : ''}
    </div>
    <div class="cca-drip-detail-header">
      <span>Plante</span><span>ETc</span><span>Volume</span><span>Durée</span><span></span><span></span>
    </div>
    ${rows || `<div style="padding:16px;text-align:center;color:var(--muted);font-size:.78rem">Aucune plante dans ce circuit.</div>`}
    ${calc.durationMin !== null ? `
    <div class="cca-drip-summary">
      <span>📊 ${_esc(_T('drip.duration', T, 'Durée circuit'))} : <strong>${_esc(String(calc.durationMin))} min</strong></span>
      <span style="margin-left:12px">${_esc(_T('drip.totalVol', T, 'Volume total'))} : <strong>${_esc(String(calc.totalVolL))} L</strong></span>
    </div>` : ''}
    ${overWarnings ? `<div class="cca-drip-warn-block">
      ${overWarnings}
      <div class="cca-drip-sep-hint">💡 ${_esc(_T('drip.separateHint', T, 'Séparer les plantes aux besoins très différents'))}</div>
    </div>` : ''}
    <button class="btn btn-p btn-sm" style="margin-top:12px;width:100%"
      data-action="drip-add-plant" data-id="${_esc(sys.id)}">
      + ${_esc(_T('drip.addPlant', T, 'Ajouter une plante'))}
    </button>
  </div>`;
}

// ── Render — formulaire ───────────────────────────────────────────────────────

function _renderForm(sys, T) {
  const isNew = !sys.id;
  return `<div style="padding:12px 14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <button class="btn btn-sm" data-action="drip-cancel">← Annuler</button>
      <h3 class="secttl" style="margin:0">${isNew ? '➕ Nouveau' : '✏️ Modifier'} circuit</h3>
    </div>
    <div class="ff">
      <label>${_esc(_T('drip.name', T, 'Nom du circuit'))}</label>
      <input id="drip-f-name" type="text" maxlength="60"
        value="${_esc(sys.name || '')}" placeholder="Ex: Circuit serre A"
        class="cca-drip-input"/>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="ff">
        <label>${_esc(_T('drip.flow', T, 'Débit émetteur (L/h)'))}</label>
        <input id="drip-f-flow" type="number" min="0.5" max="20" step="0.5"
          value="${_esc(String(sys.emitterFlow || 2.0))}" class="cca-drip-input"/>
      </div>
      <div class="ff">
        <label>${_esc(_T('drip.emitters', T, 'Émetteurs/plante'))}</label>
        <input id="drip-f-emitters" type="number" min="1" max="20" step="1"
          value="${_esc(String(sys.emittersPerPlant || 2))}" class="cca-drip-input"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="ff">
        <label>Pression (bar)</label>
        <input id="drip-f-pressure" type="number" min="0.1" max="10" step="0.1"
          value="${_esc(String(sys.pressure || 1.5))}" class="cca-drip-input"/>
      </div>
      <div class="ff">
        <label>Filtre</label>
        <select id="drip-f-filter" class="cca-drip-input">
          ${['disque', 'sable', 'tamis'].map(f =>
            `<option value="${_esc(f)}" ${sys.filterType === f ? 'selected' : ''}>${_esc(f.charAt(0).toUpperCase() + f.slice(1))}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="ff">
      <label>Programmateur</label>
      <div style="display:flex;align-items:center;gap:10px">
        <label class="sw"><input type="checkbox" id="drip-f-timer"
          ${sys.timerEnabled ? 'checked' : ''}><span class="sw-track"></span></label>
        <input id="drip-f-schedule" type="text"
          value="${_esc(sys.timerSchedule || '')}"
          placeholder="Ex: 06:00, 18:00" class="cca-drip-input" style="flex:1"/>
      </div>
    </div>
    <div class="ff">
      <label>Notes</label>
      <textarea id="drip-f-notes" rows="2" class="cca-drip-input"
        style="resize:vertical">${_esc(sys.notes || '')}</textarea>
    </div>
    <input type="hidden" id="drip-f-id" value="${_esc(sys.id || '')}"/>
    <button class="btn btn-p" style="width:100%;margin-top:8px" data-action="drip-save">
      ${_esc(_T('ui.save', T, 'Enregistrer'))}
    </button>
  </div>`;
}

// ── Render — ajout de plantes ─────────────────────────────────────────────────

function _renderAddPlant(systemId, systems, plants, T) {
  const usedIds = new Set(systems.flatMap(s => s.plantIds || []));
  const available = (plants || []).filter(p => !usedIds.has(p.id));
  if (!available.length) return `
    <div style="padding:12px 14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <button class="btn btn-sm" data-action="drip-back">← Annuler</button>
        <h3 class="secttl" style="margin:0">+ ${_esc(_T('drip.addPlant', T, 'Ajouter une plante'))}</h3>
      </div>
      <div style="padding:20px;text-align:center;color:var(--muted);font-size:.78rem">
        Toutes les plantes sont déjà dans un circuit.
      </div>
    </div>`;

  const rows = available.map(p => `
    <label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--cream3);font-size:.8rem;cursor:pointer">
      <input type="checkbox" class="drip-add-chk" value="${_esc(p.id)}"
        style="width:16px;height:16px;flex-shrink:0">
      <span style="flex:1;font-weight:600">${_esc(p.name || p.species || '—')}</span>
      <span style="font-size:.7rem;color:var(--muted);font-style:italic">${_esc(p.species || '')}</span>
    </label>`).join('');

  return `<div style="padding:12px 14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <button class="btn btn-sm" data-action="drip-back">← Annuler</button>
      <h3 class="secttl" style="margin:0">+ ${_esc(_T('drip.addPlant', T, 'Ajouter une plante'))}</h3>
    </div>
    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--cream3);border-radius:8px;padding:6px 10px;background:var(--cream2)">
      ${rows}
    </div>
    <button class="btn btn-p" style="width:100%;margin-top:10px"
      data-action="drip-confirm-add" data-id="${_esc(systemId)}">
      Ajouter la sélection
    </button>
  </div>`;
}

// ── Router interne ────────────────────────────────────────────────────────────

function _renderView(rootEl, T, plants) {
  const systems = getAllSystems();
  if (_view === 'detail' && _systemId) {
    const sys = systems.find(s => s.id === _systemId);
    rootEl.innerHTML = sys ? _renderDetail(sys, plants, T) : _renderList(systems, plants, T);
  } else if (_view === 'form') {
    const sys = _systemId ? (systems.find(s => s.id === _systemId) || {}) : {};
    rootEl.innerHTML = _renderForm(sys, T);
  } else if (_view === 'add-plant' && _addingTo) {
    rootEl.innerHTML = _renderAddPlant(_addingTo, systems, plants, T);
  } else {
    _view = 'list';
    rootEl.innerHTML = _renderList(systems, plants, T);
  }
  _attachEvents(rootEl, T, plants);
}

// ── Événements ────────────────────────────────────────────────────────────────

function _attachEvents(rootEl, T, plants) {
  // Un seul listener par montage
  rootEl.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    e.stopPropagation();
    const action   = el.dataset.action;
    const id       = el.dataset.id;
    const plantId  = el.dataset.plantId;

    switch (action) {
      case 'drip-new':
        _view = 'form'; _systemId = null;
        _renderView(rootEl, T, plants); break;

      case 'drip-detail':
        _view = 'detail'; _systemId = id;
        _renderView(rootEl, T, plants); break;

      case 'drip-edit':
        _view = 'form'; _systemId = id;
        _renderView(rootEl, T, plants); break;

      case 'drip-delete':
        if (!confirm('Supprimer ce circuit d\'irrigation ?')) break;
        deleteSystem(id);
        _view = 'list'; _systemId = null;
        _renderView(rootEl, T, plants); break;

      case 'drip-back':
        if (_view === 'add-plant') { _view = 'detail'; }
        else { _view = 'list'; _systemId = null; }
        _renderView(rootEl, T, plants); break;

      case 'drip-cancel':
        _view = _systemId ? 'detail' : 'list';
        _renderView(rootEl, T, plants); break;

      case 'drip-save': {
        const name = document.getElementById('drip-f-name')?.value.trim();
        if (!name) { alert(_T('drip.name', T, 'Nom requis') + ' — requis'); break; }
        const data = {
          name,
          emitterFlow:      parseFloat(document.getElementById('drip-f-flow')?.value)     || 2.0,
          emittersPerPlant: parseInt(document.getElementById('drip-f-emitters')?.value)   || 2,
          pressure:         parseFloat(document.getElementById('drip-f-pressure')?.value) || 1.5,
          filterType:       document.getElementById('drip-f-filter')?.value               || 'disque',
          timerEnabled:     document.getElementById('drip-f-timer')?.checked              || false,
          timerSchedule:    document.getElementById('drip-f-schedule')?.value.trim()      || '',
          notes:            document.getElementById('drip-f-notes')?.value.trim()         || '',
        };
        const existingId = document.getElementById('drip-f-id')?.value;
        if (existingId) {
          updateSystem(existingId, data);
          _systemId = existingId;
        } else {
          const sys = createSystem(data);
          _systemId = sys.id;
        }
        _view = 'detail';
        _renderView(rootEl, T, plants); break;
      }

      case 'drip-remove-plant':
        if (!id || !plantId) break;
        removePlantFromSystem(id, plantId);
        _renderView(rootEl, T, plants); break;

      case 'drip-add-plant':
        _view = 'add-plant'; _addingTo = id;
        _renderView(rootEl, T, plants); break;

      case 'drip-confirm-add': {
        const checked = [...rootEl.querySelectorAll('.drip-add-chk:checked')].map(cb => cb.value);
        checked.forEach(pid => addPlantToSystem(id, pid));
        _view = 'detail'; _systemId = id; _addingTo = null;
        _renderView(rootEl, T, plants); break;
      }
    }
  });
}

// ── API publique ──────────────────────────────────────────────────────────────

/** Point d'entrée principal — monte le module dans rootEl. */
export function mount(rootEl, T, plants) {
  if (!rootEl) return;
  _renderView(rootEl, T, plants || []);
}
