'use strict';
import { esc } from '../lib/esc.js';

const T = k => window.T?.(k) ?? k;

let _plants, _collView, _srch, _fCt, _fSt, _selMode, _activeCollectionId, _advFilters;

export function mount(container, ctx) {
  _plants             = ctx.plants             ?? [];
  _collView           = ctx.collView           ?? 'list';
  _srch               = ctx.srch               ?? '';
  _fCt                = ctx.fCt                ?? 'all';
  _fSt                = ctx.fSt                ?? 'all';
  _selMode            = ctx.selMode            ?? false;
  _activeCollectionId = ctx.activeCollectionId ?? null;
  _advFilters         = ctx.advFilters         ?? [];
  container.innerHTML = _renderColl();
}

window.__CCA_collection = { mount };
window._openWishModal   = _openWishModal;
window._saveWish        = _saveWish;
window._deleteWish      = _deleteWish;
window._wishAcquired    = _wishAcquired;

function _renderColl() {
  const fl      = window.filtered();
  const nPot    = _plants.filter(p => window.isPot(p)).length;
  const nTerre  = _plants.filter(p => !window.isPot(p)).length;
  const nUrgent = _plants.filter(p => { const u = window.getWateringUrgency(p); return u.rawDays !== null && u.effDays > u.t3; }).length;
  const nExt    = _plants.filter(p => window.isPot(p) && p.location === 'extérieur').length;
  const nVerger = _plants.filter(p => !window.isPot(p) || (window.isPot(p) && p.location === 'extérieur')).length;

  const collIdx    = window.loadCollIndex();
  const defName    = collIdx.find(c => c.id === '') ? collIdx.find(c => c.id === '').name : 'Collection principale';
  const activeName = _activeCollectionId ? (collIdx.find(c => c.id === _activeCollectionId)?.name || 'Collection') : defName;
  const collSwitcher = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
  <div style="display:flex;align-items:center;gap:6px;background:var(--white);border:1.5px solid var(--cream3);border-radius:20px;padding:5px 13px 5px 10px;cursor:pointer;box-shadow:0 1px 3px rgba(22,45,31,.06)" data-action="open-coll-switcher">
    <span style="font-size:.82rem">🍋</span>
    <span style="font-size:.78rem;font-weight:600;color:var(--text-strong);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(activeName)}</span>
    <span style="font-size:.75rem;color:var(--muted)">▾</span>
  </div>
  <button class="btn btn-sm" style="border-radius:20px;font-size:.7rem;padding:4px 10px;background:rgba(45,90,61,.08);color:var(--text-strong);border:1.5px solid rgba(45,90,61,.15)" data-action="open-new-coll-modal">＋ Nouvelle</button>
  <button class="btn btn-pri btn-sm" style="border-radius:20px;margin-left:auto;padding:6px 14px;font-size:.82rem;font-weight:700" onclick="openAddPlant()" aria-label="${T('misc.collAddBtn') || 'Ajouter un sujet'}">＋ ${T('misc.collAddBtn') || 'Ajouter'}</button>
</div>`;

  const statChips = `<div style="display:flex;gap:7px;margin-bottom:10px;overflow-x:auto;padding-bottom:2px;align-items:center">
  <div style="display:flex;align-items:center;gap:4px;background:var(--white);border:1px solid var(--cream3);border-radius:20px;padding:5px 11px;font-size:.7rem;white-space:nowrap;box-shadow:0 1px 3px rgba(22,45,31,.05)"><span style="font-weight:700;color:var(--text-strong)">${_plants.length}</span><span style="color:var(--muted)">${T('misc.statSubjects')}</span></div>
  <div style="display:flex;align-items:center;gap:4px;background:rgba(45,90,61,.08);border:1px solid rgba(45,90,61,.15);border-radius:20px;padding:5px 11px;font-size:.7rem;white-space:nowrap"><span>🪴</span><span style="font-weight:700;color:var(--text-accent)">${nPot}</span><span style="color:var(--muted)">${T('misc.potMode').replace('🪴 ', '')}</span></div>
  <div style="display:flex;align-items:center;gap:4px;background:rgba(139,69,19,.07);border:1px solid rgba(139,69,19,.15);border-radius:20px;padding:5px 11px;font-size:.7rem;white-space:nowrap"><span>🌳</span><span style="font-weight:700;color:var(--terra)">${nTerre}</span><span style="color:var(--muted)">${T('misc.groundMode').replace('🌳 ', '')}</span></div>
  ${nExt > 0 ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(56,142,60,.08);border:1px solid rgba(56,142,60,.2);border-radius:20px;padding:5px 11px;font-size:.7rem;white-space:nowrap"><span>☀</span><span style="font-weight:700;color:#388e3c">${nExt}</span><span style="color:var(--muted)">${T('misc.outside')}</span></div>` : ''}
  ${nUrgent > 0 ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(198,40,40,.08);border:1px solid rgba(198,40,40,.2);border-radius:20px;padding:5px 11px;font-size:.7rem;white-space:nowrap"><span>💧</span><span style="font-weight:700;color:#c62828">${nUrgent}</span><span style="color:var(--muted)">${T('misc.statUrgent')}</span></div>` : ''}
</div>`;

  const isCollOrCons = ['collectionneur', 'conservatoire'].includes((window.getProfile().profileType) || 'collectionneur');
  const wishCount    = window.getWishlist().filter(w => w.status !== 'acquired').length;
  const viewTabs = `<div class="coll-view-tabs" style="position:relative">
  <div class="coll-view-tab${_collView === 'list'     ? ' active' : ''}" data-action="coll-view" data-view="list">📋 Liste</div>
  <div class="coll-view-tab${_collView === 'verger'   ? ' active' : ''}" data-action="coll-view" data-view="verger">📍 Emplacements${nVerger > 0 ? ` (${nVerger})` : ''}</div>
  ${isCollOrCons ? `<div class="coll-view-tab${_collView === 'wishlist' ? ' active' : ''}" data-action="coll-view" data-view="wishlist">🌱 Wishlist${wishCount > 0 ? ` (${wishCount})` : ''}</div>` : ''}
</div>`;

  if (_collView === 'wishlist') return `<div class="page">${collSwitcher}${statChips}${viewTabs}${_renderWishlist()}</div>`;

  if (_collView === 'verger') {
    return `<div class="page" style="padding:10px 14px 0">${collSwitcher}${statChips}${viewTabs}${window.renderVergerPage()}</div>`;
  }

  return `<div class="page">
${collSwitcher}
${statChips}
${viewTabs}
<div id="cca-filters-root"></div>
<div style="display:flex;gap:7px;margin-bottom:10px;align-items:center">
  <input class="fsrch" placeholder="🔍 Rechercher nom, espèce, variété…" value="${esc(_srch)}" oninput="srch=this.value;rGrid()" style="flex:1;margin-bottom:0"/>
  <button data-action="open-adv-filters" style="white-space:nowrap;font-size:.78rem;padding:6px 10px;border-radius:8px;cursor:pointer;border:1.5px solid ${_advFilters.length ? 'rgba(45,90,61,.3)' : 'var(--cream3)'};background:${_advFilters.length ? 'rgba(45,90,61,.1)' : 'var(--cream2)'};color:${_advFilters.length ? 'var(--text-accent)' : 'var(--muted)'}">🔍${_advFilters.length ? ` ${_advFilters.length}` : ''}</button>
  ${window.helpBtn?.('collection') ?? ''}
</div>
<div class="frow" style="margin-bottom:10px">
  <select class="fsel" onchange="fCt=this.value;rGrid()">
    <option value="all"${_fCt === 'all'   ? ' selected' : ''}>${T('misc.allModes')}</option>
    <option value="pot"${_fCt === 'pot'   ? ' selected' : ''}>${T('misc.potOnly')}</option>
    <option value="terre"${_fCt === 'terre' ? ' selected' : ''}>${T('misc.groundOnly')}</option>
  </select>
  <select class="fsel" onchange="fSt=this.value;rGrid()">
    ${[['all', 'Tous états'], ...Object.entries(window.STATUS ?? {}).map(([k, v]) => [k, v.label])].map(([k, l]) => `<option value="${k}"${_fSt === k ? ' selected' : ''}>${l}</option>`).join('')}
  </select>
</div>
${_selMode ? `<div style="font-size:.75rem;color:var(--amber3);margin-bottom:9px;font-family:'JetBrains Mono',monospace;background:rgba(232,148,26,.08);padding:6px 10px;border-radius:7px">${T('misc.selectMode')}</div>` : ''}
<div class="pgrid" id="pgrid">${fl.length ? fl.map(window.rCard).join('') : `<div class="emp">${T('misc.collNoMatch')}</div>`}</div>
</div>`;
}

function _renderWishlist() {
  const items       = window.getWishlist().sort((a, b) => { const po = { high: 0, med: 1, low: 2 }; return (po[a.priority] || 1) - (po[b.priority] || 1); });
  const prioIcon    = { high: '🔴', med: '🟡', low: '🟢' };
  const statusLabel = { wanted: 'Souhaité', searching: 'En recherche', found: 'Trouvé', acquired: 'Acquis' };
  const statusColor = { wanted: 'var(--muted)', searching: 'var(--amber)', found: 'var(--g2)', acquired: 'var(--blue)' };
  return `<div>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
  <h3 class="secttl" style="margin:0">🌱 Wishlist — Acquisitions souhaitées ${window.helpBtn?.('wishlist') ?? ''}</h3>
  <button class="btn btn-p btn-sm" onclick="_openWishModal(null)">+ Souhait</button>
</div>
${items.length ? items.map(w => `
<div style="background:var(--white);border-radius:10px;padding:10px 12px;margin-bottom:6px;border:1px solid var(--cream3)">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        <span style="font-size:1rem">${prioIcon[w.priority] || '🟡'}</span>
        <div style="font-size:.84rem;font-weight:600">${esc(w.species)}</div>
      </div>
      ${w.source ? `<div style="font-size:.75rem;color:var(--muted)">🏪 ${esc(w.source)}</div>` : ''}
      ${w.budget ? `<div style="font-size:.75rem;color:var(--muted)">💶 Budget max : ${esc(String(w.budget))} €</div>` : ''}
      ${w.notes ? `<div style="font-size:.7rem;color:var(--muted);font-style:italic;margin-top:2px">${esc(w.notes)}</div>` : ''}
      <div style="margin-top:4px"><span style="font-size:.75rem;color:${statusColor[w.status] || 'var(--muted)'};font-weight:600">${statusLabel[w.status] || w.status}</span></div>
    </div>
    <div style="display:flex;gap:4px;flex-shrink:0">
      ${w.status !== 'acquired' ? `<button class="btn btn-sm" style="font-size:.75rem;padding:2px 6px;background:rgba(45,90,61,.1);color:var(--text-accent)" onclick="_wishAcquired('${w.id}')" title="Marquer acquis">✓</button>` : ''}
      <button class="btn btn-sm" style="font-size:.75rem;padding:2px 6px" onclick="_openWishModal('${w.id}')">✏</button>
      <button class="btn btn-sm" style="font-size:.75rem;padding:2px 6px;background:rgba(192,57,43,.1);color:var(--red)" onclick="_deleteWish('${w.id}')">✕</button>
    </div>
  </div>
</div>`).join('') : `<div style="color:var(--muted);font-style:italic;padding:20px;text-align:center">Aucun souhait enregistré.<br><span style="font-size:.75rem">Ajoutez les espèces ou cultivars que vous recherchez.</span></div>`}
</div>`;
}

function _openWishModal(id) {
  const w     = id ? window.getWishlist().find(i => i.id === id) : null;
  const modal = document.createElement('div');
  modal.id              = 'wish-modal';
  modal.style.cssText   = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `<div style="background:var(--white);border-radius:18px 18px 0 0;width:100%;max-width:480px;padding:18px 16px 28px;max-height:85vh;overflow-y:auto">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
  <div style="font-size:.9rem;font-weight:700;color:var(--text-strong)">${id ? 'Modifier' : 'Nouveau'} souhait</div>
  <button onclick="document.getElementById('wish-modal').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--muted)">✕</button>
</div>
<div class="ff"><label>Espèce / Cultivar *</label><input id="wi-sp" type="text" value="${esc(w?.species || '')}" placeholder="ex : Citrus medica 'Etrog'"/></div>
<div class="ff"><label>Priorité</label><select id="wi-prio"><option value="high" ${(w?.priority || '') === 'high' ? 'selected' : ''}>🔴 Haute</option><option value="med" ${(w?.priority || 'med') === 'med' ? 'selected' : ''}>🟡 Moyenne</option><option value="low" ${(w?.priority || '') === 'low' ? 'selected' : ''}>🟢 Basse</option></select></div>
<div class="ff"><label>Source / Fournisseur</label><input id="wi-src" type="text" value="${esc(w?.source || '')}" placeholder="pépinière, échange, collecte…"/></div>
<div class="ff"><label>Budget max (€)</label><input id="wi-bgt" type="number" value="${w?.budget || ''}" placeholder="0"/></div>
<div class="ff"><label>Statut</label><select id="wi-st"><option value="wanted" ${(w?.status || 'wanted') === 'wanted' ? 'selected' : ''}>Souhaité</option><option value="searching" ${(w?.status || '') === 'searching' ? 'selected' : ''}>En recherche</option><option value="found" ${(w?.status || '') === 'found' ? 'selected' : ''}>Trouvé</option><option value="acquired" ${(w?.status || '') === 'acquired' ? 'selected' : ''}>Acquis</option></select></div>
<div class="ff"><label>Notes</label><textarea id="wi-notes" rows="2" style="width:100%">${esc(w?.notes || '')}</textarea></div>
<button class="btn btn-p" style="width:100%;margin-top:6px" onclick="_saveWish('${id || ''}')">Enregistrer</button>
</div>`;
  document.body.appendChild(modal);
}

function _saveWish(id) {
  const species = document.getElementById('wi-sp')?.value?.trim();
  if (!species) { window.toast('Espèce requise'); return; }
  const data = {
    species,
    priority: document.getElementById('wi-prio')?.value || 'med',
    source:   document.getElementById('wi-src')?.value?.trim() || '',
    budget:   parseFloat(document.getElementById('wi-bgt')?.value) || null,
    status:   document.getElementById('wi-st')?.value || 'wanted',
    notes:    document.getElementById('wi-notes')?.value?.trim() || '',
  };
  if (id) { window.updateWishlistItem(id, data); } else { window.addWishlistItem(data); }
  document.getElementById('wish-modal')?.remove();
  window.toast('Souhait enregistré ✓');
  window.render();
}

function _deleteWish(id) {
  if (!confirm('Supprimer ce souhait ?')) return;
  window.deleteWishlistItem(id);
  window.toast('Supprimé');
  window.render();
}

function _wishAcquired(id) {
  window.updateWishlistItem(id, { status: 'acquired' });
  window.toast('Marqué comme acquis ✓');
  window.render();
}
