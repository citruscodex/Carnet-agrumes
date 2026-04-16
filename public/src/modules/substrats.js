/**
 * substrats.js — Module A : Gestion des substrats et mélanges
 * Store localStorage : agrumes_substrats
 * CSS préfixé : cca-sub-*
 * Bridge : window.__CCA_substrats
 * Règles: addEventListener exclusivement, esc() sur tout innerHTML dynamique
 */

'use strict';

const SUBSTRAT_KEY = 'agrumes_substrats';

function _esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _gid() { return 'sub_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

// ── Constantes ────────────────────────────────────────────────────────────────

export const DRAINAGE_LEVELS = ['excellent', 'bon', 'moyen', 'faible'];
const DRAINAGE_LABEL = { excellent: 'Excellent', bon: 'Bon', moyen: 'Moyen', faible: 'Faible' };
const DRAINAGE_COLOR = { excellent: '#1565c0', bon: '#2e7d32', moyen: '#f57f17', faible: '#c62828' };
const DRAINAGE_ICON  = { excellent: '💧💧💧', bon: '💧💧', moyen: '💧', faible: '⚠️' };

const COMP_COLORS = [
  '#e65100','#1565c0','#2e7d32','#6a1b9a','#c62828',
  '#f57f17','#00695c','#37474f','#4e342e','#1a237e'
];

const DEFAULT_SUBSTRATS = [
  {
    id: 'sub_std', name: 'Terreau agrumes standard',
    ph: { min: 5.5, max: 6.5 }, ec: 1.2, drainage: 'bon',
    components: [
      { name: 'Terreau universel', pct: 40 },
      { name: 'Pouzzolane', pct: 30 },
      { name: 'Compost mûr', pct: 20 },
      { name: 'Sable grossier', pct: 10 }
    ],
    npkCorrection: { N: 0, P: 0, K: 0 },
    notes: 'Adapté aux jeunes plants en pot', createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sub_pro', name: 'Mix drainant pro',
    ph: { min: 5.5, max: 6.0 }, ec: 0.8, drainage: 'excellent',
    components: [
      { name: 'Écorce de pin', pct: 40 },
      { name: 'Perlite', pct: 30 },
      { name: 'Fibre de coco', pct: 30 }
    ],
    npkCorrection: { N: 0, P: 0, K: 0 },
    notes: 'Excellent drainage, idéal pour collections pro', createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sub_cons', name: 'Substrat conservatoire',
    ph: { min: 6.0, max: 6.5 }, ec: 1.5, drainage: 'bon',
    components: [
      { name: 'Terre franche', pct: 30 },
      { name: 'Terreau', pct: 30 },
      { name: 'Pouzzolane', pct: 25 },
      { name: 'Sable', pct: 15 }
    ],
    npkCorrection: { N: 0, P: 0, K: 5 },
    notes: 'Pour grands contenants et sujets âgés', createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sub_semis', name: 'Mix semis',
    ph: { min: 5.0, max: 5.5 }, ec: 0.5, drainage: 'excellent',
    components: [
      { name: 'Tourbe blonde', pct: 50 },
      { name: 'Perlite', pct: 30 },
      { name: 'Vermiculite', pct: 20 }
    ],
    npkCorrection: { N: 0, P: 0, K: 0 },
    notes: 'Germination et jeunes semis', createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'sub_pt', name: 'Pleine terre amendée',
    ph: { min: 5.5, max: 7.0 }, ec: 1.0, drainage: 'moyen',
    components: [
      { name: 'Terre existante', pct: 50 },
      { name: 'Compost', pct: 30 },
      { name: 'Sable grossier', pct: 20 }
    ],
    npkCorrection: { N: 0, P: 0, K: 0 },
    notes: 'Pour plantation en pleine terre — adapter selon analyse de sol', createdAt: '2026-01-01T00:00:00Z'
  }
];

// ── Store ─────────────────────────────────────────────────────────────────────

let _data = null;

export function loadSubstrats() {
  try {
    const raw = localStorage.getItem(SUBSTRAT_KEY);
    if (raw) {
      _data = JSON.parse(raw);
      _data.substrats = _data.substrats || [];
    } else {
      _data = { substrats: JSON.parse(JSON.stringify(DEFAULT_SUBSTRATS)) };
      _save();
    }
  } catch {
    _data = { substrats: JSON.parse(JSON.stringify(DEFAULT_SUBSTRATS)) };
  }
}

export function saveSubstrats() { _save(); }

function _save() {
  if (_data) localStorage.setItem(SUBSTRAT_KEY, JSON.stringify(_data));
}

function _init() {
  if (!_data) loadSubstrats();
}

export function getSubstrats() {
  _init();
  return _data.substrats;
}

export function getSubstratById(id) {
  if (!id) return null;
  return getSubstrats().find(s => s.id === id) || null;
}

export function addSubstrat(data) {
  _init();
  const comps = _validComps(data.components);
  const s = {
    id: _gid(),
    name: (data.name || 'Substrat').slice(0, 200),
    ph: { min: parseFloat(data.phMin) || 5.5, max: parseFloat(data.phMax) || 6.5 },
    ec: parseFloat(data.ec) || 1.0,
    drainage: DRAINAGE_LEVELS.includes(data.drainage) ? data.drainage : 'bon',
    components: comps,
    npkCorrection: {
      N: parseFloat(data.npkN) || 0,
      P: parseFloat(data.npkP) || 0,
      K: parseFloat(data.npkK) || 0
    },
    notes: (data.notes || '').slice(0, 1000),
    createdAt: new Date().toISOString()
  };
  _data.substrats.unshift(s);
  _save();
  return s;
}

export function updateSubstrat(id, data) {
  _init();
  _data.substrats = _data.substrats.map(s => {
    if (s.id !== id) return s;
    const comps = data.components !== undefined ? _validComps(data.components) : s.components;
    return {
      ...s,
      name: data.name !== undefined ? data.name.slice(0, 200) : s.name,
      ph: {
        min: data.phMin !== undefined ? (parseFloat(data.phMin) || s.ph.min) : s.ph.min,
        max: data.phMax !== undefined ? (parseFloat(data.phMax) || s.ph.max) : s.ph.max
      },
      ec: data.ec !== undefined ? (parseFloat(data.ec) ?? s.ec) : s.ec,
      drainage: data.drainage !== undefined ? (DRAINAGE_LEVELS.includes(data.drainage) ? data.drainage : s.drainage) : s.drainage,
      components: comps,
      npkCorrection: {
        N: data.npkN !== undefined ? parseFloat(data.npkN) : s.npkCorrection.N,
        P: data.npkP !== undefined ? parseFloat(data.npkP) : s.npkCorrection.P,
        K: data.npkK !== undefined ? parseFloat(data.npkK) : s.npkCorrection.K
      },
      notes: data.notes !== undefined ? data.notes.slice(0, 1000) : s.notes
    };
  });
  _save();
}

export function deleteSubstrat(id) {
  _init();
  _data.substrats = _data.substrats.filter(s => s.id !== id);
  _save();
}

export function getSubstratUsage(id, plants) {
  return (plants || []).filter(p => p.substratId === id).length;
}

// Returns <option> elements HTML for embedding in a <select>
export function buildSelectOptions(selectedId) {
  _init();
  const opts = _data.substrats.map(s =>
    `<option value="${_esc(s.id)}"${s.id === selectedId ? ' selected' : ''}>${_esc(s.name)}</option>`
  ).join('');
  return `<option value="">— Choisir un substrat —</option>${opts}`;
}

function _validComps(comps) {
  return (comps || []).filter(c => c && String(c.name || '').trim() && parseFloat(c.pct) > 0)
    .map(c => ({ name: String(c.name).trim().slice(0, 100), pct: Math.round(parseFloat(c.pct) * 10) / 10 }));
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const _CSS = `
.cca-sub-page{padding:12px;max-width:900px;margin:0 auto}
.cca-sub-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.cca-sub-header h3{margin:0;font-size:1rem}
.cca-sub-card{background:var(--white,#fff);border:1px solid var(--cream3,#e8dcc8);border-radius:10px;padding:12px 14px;margin-bottom:10px;transition:box-shadow .15s;cursor:pointer}
.cca-sub-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.08)}
.cca-sub-card-name{font-weight:600;font-size:.9rem;margin-bottom:4px}
.cca-sub-card-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:.75rem;color:var(--muted,#888);font-family:'JetBrains Mono',monospace}
.cca-sub-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:600;font-family:'JetBrains Mono',monospace;flex-shrink:0}
.cca-sub-comp-bar{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 0 4px}
.cca-sub-comp-seg{height:100%}
.cca-sub-usage{font-size:.72rem;color:var(--muted,#888);margin-top:4px;font-style:italic}
.cca-sub-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;display:flex;align-items:flex-end;justify-content:center}
.cca-sub-modal{background:var(--white,#fff);border-radius:16px 16px 0 0;padding:20px 16px 28px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
.cca-sub-modal h4{margin:0 0 14px;font-size:1rem}
.cca-sub-label{font-size:.78rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#888);margin-bottom:3px;margin-top:10px;display:block}
.cca-sub-input{padding:8px 10px;border:1px solid var(--cream3,#e8dcc8);border-radius:7px;background:var(--white,#fff);font-size:.87rem;width:100%;box-sizing:border-box}
.cca-sub-grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cca-sub-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.cca-sub-comp-row{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.cca-sub-comp-row .name-inp{flex:1;padding:7px 9px;border:1px solid var(--cream3,#e8dcc8);border-radius:6px;background:var(--white,#fff);font-size:.83rem}
.cca-sub-comp-row .pct-inp{width:64px;padding:7px 9px;border:1px solid var(--cream3,#e8dcc8);border-radius:6px;background:var(--white,#fff);font-size:.83rem;text-align:right}
.cca-sub-total{font-size:.75rem;font-family:'JetBrains Mono',monospace;text-align:right;margin-bottom:6px;padding:3px 0}
.cca-sub-total.ok{color:#2e7d32;font-weight:700}
.cca-sub-total.err{color:#c62828;font-weight:700}
.cca-sub-del-btn{width:28px;height:28px;border-radius:50%;background:var(--cream3,#e8dcc8);font-size:.85rem;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;border:none;line-height:1}
.cca-sub-del-btn:hover{background:#ffd0d0}
.cca-sub-actions{display:flex;gap:8px;margin-top:16px}
.cca-sub-btn{padding:11px 14px;border-radius:8px;font-weight:600;font-size:.87rem;cursor:pointer;border:none;transition:opacity .15s;flex:1}
.cca-sub-btn:disabled{opacity:.5;cursor:not-allowed}
.cca-sub-btn-save{background:var(--g2,#2e7d32);color:#fff}
.cca-sub-btn-cancel{background:var(--cream3,#e8dcc8);color:var(--text,#333);flex:unset}
.cca-sub-btn-del{background:var(--red,#c62828);color:#fff;flex:unset}
.cca-sub-empty{text-align:center;padding:40px 20px;color:var(--muted,#888);font-size:.87rem}
.cca-sub-err{color:#c62828;font-size:.82rem;margin-top:6px}
`;

let _cssInjected = false;
function _injectCSS() {
  if (_cssInjected) return;
  const style = document.createElement('style');
  style.textContent = _CSS;
  document.head.appendChild(style);
  _cssInjected = true;
}

// ── State ─────────────────────────────────────────────────────────────────────

let _root = null;
let _plants = [];
let _editId = null;

// ── Mount ─────────────────────────────────────────────────────────────────────

export function mount(root, _T, plants) {
  _root = root;
  _plants = plants || [];
  _injectCSS();
  _init();
  _renderList();
}

// ── List ──────────────────────────────────────────────────────────────────────

function _renderList() {
  if (!_root) return;
  const subs = getSubstrats();

  const cards = subs.length ? subs.map(s => {
    const usage = getSubstratUsage(s.id, _plants);
    const drColor = DRAINAGE_COLOR[s.drainage] || '#888';
    const drLabel = DRAINAGE_LABEL[s.drainage] || s.drainage;
    const comps = s.components || [];
    const totalPct = comps.reduce((sum, c) => sum + (c.pct || 0), 0);
    const compBar = comps.length
      ? `<div class="cca-sub-comp-bar" title="${comps.map(c => `${c.name} ${c.pct}%`).join(' | ')}">${
          comps.map((c, i) =>
            `<div class="cca-sub-comp-seg" style="width:${c.pct}%;background:${COMP_COLORS[i % COMP_COLORS.length]}"></div>`
          ).join('')}</div>`
      : '';
    const compLegend = comps.length
      ? `<div style="font-size:.7rem;color:var(--muted,#888);display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px">${
          comps.map((c, i) =>
            `<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${COMP_COLORS[i % COMP_COLORS.length]};margin-right:2px"></span>${_esc(c.name)} ${c.pct}%</span>`
          ).join('')}</div>`
      : '';
    const npk = s.npkCorrection || {};
    const anyNpk = npk.N || npk.P || npk.K;
    const npkLine = anyNpk
      ? `<div style="font-size:.72rem;color:#555;margin-top:3px">📊 Correction NPK : N${npk.N >= 0 ? '+' : ''}${npk.N}% P${npk.P >= 0 ? '+' : ''}${npk.P}% K${npk.K >= 0 ? '+' : ''}${npk.K}%</div>`
      : '';

    return `<div class="cca-sub-card" data-sub-id="${_esc(s.id)}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <div style="min-width:0;flex:1">
          <div class="cca-sub-card-name">${_esc(s.name)}</div>
          <div class="cca-sub-card-meta">
            <span>pH ${s.ph.min}–${s.ph.max}</span>
            <span>EC ${s.ec} mS/cm</span>
            <span>${comps.length} composant${comps.length > 1 ? 's' : ''}</span>
            ${usage ? `<span style="color:var(--g2,#2e7d32)">Utilisé par ${usage} sujet${usage > 1 ? 's' : ''}</span>` : ''}
          </div>
          ${compBar}${compLegend}${npkLine}
          ${s.notes ? `<div class="cca-sub-usage">${_esc(s.notes.slice(0, 90))}${s.notes.length > 90 ? '…' : ''}</div>` : ''}
        </div>
        <span class="cca-sub-badge" style="background:${drColor}20;color:${drColor}">${DRAINAGE_ICON[s.drainage] || ''} ${_esc(drLabel)}</span>
      </div>
    </div>`;
  }).join('') : '<div class="cca-sub-empty">Aucun substrat.<br><br>Cliquez sur <strong>+ Nouveau</strong> pour commencer.</div>';

  _root.innerHTML = `
<div class="cca-sub-page">
  <div class="cca-sub-header">
    <h3>🪴 Substrats & mélanges</h3>
    <button class="btn btn-a btn-sm" id="cca-sub-new-btn">+ Nouveau</button>
  </div>
  ${cards}
</div>`;

  _root.querySelector('#cca-sub-new-btn').addEventListener('click', () => _openModal(null));
  _root.querySelectorAll('.cca-sub-card').forEach(el =>
    el.addEventListener('click', () => _openModal(el.dataset.subId))
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function _openModal(id) {
  _editId = id || null;
  const s = id ? getSubstratById(id) : null;

  const overlay = document.createElement('div');
  overlay.className = 'cca-sub-overlay';
  overlay.innerHTML = `
<div class="cca-sub-modal" role="dialog" aria-modal="true">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <h4 style="margin:0">${s ? '✏️ Modifier' : '🪴 Nouveau substrat'}</h4>
    <button class="cca-sub-del-btn" id="csub-x" style="font-size:1rem">✕</button>
  </div>
  <label class="cca-sub-label">Nom *</label>
  <input id="csub-name" class="cca-sub-input" maxlength="200" value="${_esc(s?.name || '')}" placeholder="Ex : Mix drainant maison"/>
  <div class="cca-sub-grid2">
    <div><label class="cca-sub-label">pH min</label>
      <input id="csub-ph-min" class="cca-sub-input" type="number" step="0.1" min="3" max="9" value="${s?.ph?.min ?? 5.5}"/></div>
    <div><label class="cca-sub-label">pH max</label>
      <input id="csub-ph-max" class="cca-sub-input" type="number" step="0.1" min="3" max="9" value="${s?.ph?.max ?? 6.5}"/></div>
  </div>
  <div class="cca-sub-grid2">
    <div><label class="cca-sub-label">EC (mS/cm)</label>
      <input id="csub-ec" class="cca-sub-input" type="number" step="0.1" min="0" value="${s?.ec ?? 1.0}"/></div>
    <div><label class="cca-sub-label">Drainage</label>
      <select id="csub-drainage" class="cca-sub-input">
        ${DRAINAGE_LEVELS.map(d =>
          `<option value="${d}"${(s?.drainage || 'bon') === d ? ' selected' : ''}>${DRAINAGE_ICON[d]} ${DRAINAGE_LABEL[d]}</option>`
        ).join('')}
      </select></div>
  </div>
  <label class="cca-sub-label">Composants (total = 100%)</label>
  <div id="csub-comps"></div>
  <div class="cca-sub-total" id="csub-total">Total : 0%</div>
  <button class="btn btn-g btn-sm" id="csub-add-comp" style="margin-bottom:10px">+ Composant</button>
  <label class="cca-sub-label">Correction NPK (en %)</label>
  <div class="cca-sub-grid3">
    <div><label class="cca-sub-label" style="margin-top:0">N</label>
      <input id="csub-npk-n" class="cca-sub-input" type="number" step="1" value="${s?.npkCorrection?.N ?? 0}"/></div>
    <div><label class="cca-sub-label" style="margin-top:0">P</label>
      <input id="csub-npk-p" class="cca-sub-input" type="number" step="1" value="${s?.npkCorrection?.P ?? 0}"/></div>
    <div><label class="cca-sub-label" style="margin-top:0">K</label>
      <input id="csub-npk-k" class="cca-sub-input" type="number" step="1" value="${s?.npkCorrection?.K ?? 0}"/></div>
  </div>
  <label class="cca-sub-label">Notes</label>
  <textarea id="csub-notes" class="cca-sub-input" rows="2" style="resize:vertical">${_esc(s?.notes || '')}</textarea>
  <div id="csub-err" class="cca-sub-err" style="display:none"></div>
  <div class="cca-sub-actions">
    ${s ? `<button class="cca-sub-btn cca-sub-btn-del" id="csub-del-btn">🗑 Supprimer</button>` : ''}
    <button class="cca-sub-btn cca-sub-btn-cancel" id="csub-cancel-btn">Annuler</button>
    <button class="cca-sub-btn cca-sub-btn-save" id="csub-save-btn">💾 Enregistrer</button>
  </div>
</div>`;

  document.body.appendChild(overlay);

  // Close handlers
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeModal(); });
  overlay.querySelector('#csub-x').addEventListener('click', _closeModal);
  overlay.querySelector('#csub-cancel-btn').addEventListener('click', _closeModal);

  // Delete
  overlay.querySelector('#csub-del-btn')?.addEventListener('click', () => {
    const name = getSubstratById(_editId)?.name || 'ce substrat';
    if (confirm(`Supprimer "${name}" ?`)) {
      deleteSubstrat(_editId);
      _closeModal();
      _renderList();
      _toast('Substrat supprimé');
    }
  });

  // Components state
  const comps = s ? JSON.parse(JSON.stringify(s.components || [])) : [{ name: '', pct: 0 }];
  const compsEl = overlay.querySelector('#csub-comps');

  function _renderComps() {
    compsEl.innerHTML = '';
    comps.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'cca-sub-comp-row';
      const nameInp = document.createElement('input');
      nameInp.className = 'name-inp';
      nameInp.type = 'text';
      nameInp.placeholder = `Composant ${i + 1}`;
      nameInp.value = c.name;
      nameInp.style.borderLeft = `3px solid ${COMP_COLORS[i % COMP_COLORS.length]}`;
      const pctInp = document.createElement('input');
      pctInp.className = 'pct-inp';
      pctInp.type = 'number';
      pctInp.min = '0';
      pctInp.max = '100';
      pctInp.step = '1';
      pctInp.value = c.pct || '';
      pctInp.placeholder = '%';
      const delBtn = document.createElement('button');
      delBtn.className = 'cca-sub-del-btn';
      delBtn.textContent = '✕';
      nameInp.addEventListener('input', e => { comps[i].name = e.target.value; _updateTotal(); });
      pctInp.addEventListener('input', e => { comps[i].pct = parseFloat(e.target.value) || 0; _updateTotal(); });
      delBtn.addEventListener('click', () => { comps.splice(i, 1); _renderComps(); _updateTotal(); });
      row.appendChild(nameInp); row.appendChild(pctInp); row.appendChild(delBtn);
      compsEl.appendChild(row);
    });
  }

  function _updateTotal() {
    const total = Math.round(comps.reduce((sum, c) => sum + (c.pct || 0), 0) * 10) / 10;
    const el = overlay.querySelector('#csub-total');
    el.textContent = `Total : ${total}%`;
    el.className = 'cca-sub-total ' + (Math.abs(total - 100) < 0.5 ? 'ok' : total === 0 ? '' : 'err');
  }

  overlay.querySelector('#csub-add-comp').addEventListener('click', () => {
    comps.push({ name: '', pct: 0 });
    _renderComps();
    _updateTotal();
  });

  _renderComps();
  _updateTotal();

  // Save
  overlay.querySelector('#csub-save-btn').addEventListener('click', () => {
    const name = overlay.querySelector('#csub-name').value.trim();
    if (!name) { _showErr(overlay, 'Le nom est requis.'); return; }
    const validComps = comps.filter(c => String(c.name || '').trim() && c.pct > 0);
    if (validComps.length) {
      const total = validComps.reduce((sum, c) => sum + c.pct, 0);
      if (Math.abs(total - 100) > 0.5) {
        _showErr(overlay, `Total composants = ${Math.round(total)}% — doit être 100%.`);
        return;
      }
    }
    const data = {
      name,
      phMin: overlay.querySelector('#csub-ph-min').value,
      phMax: overlay.querySelector('#csub-ph-max').value,
      ec: overlay.querySelector('#csub-ec').value,
      drainage: overlay.querySelector('#csub-drainage').value,
      components: validComps,
      npkN: overlay.querySelector('#csub-npk-n').value,
      npkP: overlay.querySelector('#csub-npk-p').value,
      npkK: overlay.querySelector('#csub-npk-k').value,
      notes: overlay.querySelector('#csub-notes').value.trim()
    };
    if (_editId) {
      updateSubstrat(_editId, data);
      _toast('Substrat mis à jour ✓');
    } else {
      addSubstrat(data);
      _toast('Substrat créé ✓');
    }
    _closeModal();
    _renderList();
  });

  // Focus name
  setTimeout(() => overlay.querySelector('#csub-name')?.focus(), 80);
}

function _closeModal() {
  document.querySelector('.cca-sub-overlay')?.remove();
  _editId = null;
}

function _showErr(overlay, msg) {
  const el = overlay.querySelector('#csub-err');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function _toast(msg) {
  if (typeof window.toast === 'function') { window.toast(msg); return; }
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#162d1f;color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-size:.87rem;pointer-events:none';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
