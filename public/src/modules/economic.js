import { esc } from '../lib/esc.js';

const T          = k => window.T?.(k) ?? k;
const getLd      = () => window.getLd?.() ?? {};
const getLang    = () => window.getLang?.() ?? 'fr';
const fmtDate    = v => window.fmtDate?.(v) ?? '';
const getCfg     = () => window.getCfg?.() ?? {};
const getProfile = () => window.getProfile?.() ?? {};
const gid        = () => window.gid?.() ?? Math.random().toString(36).slice(2);
const todayStr   = () => window.todayStr?.() ?? new Date().toISOString().slice(0,10);
const toast      = (msg, err) => window.toast?.(msg, err);
const showModal  = html => window.showModal?.(html);
const closeModal = () => window.closeModal?.();
const helpBtn    = k => window.helpBtn?.(k) ?? '';
const _pdfStyles = () => window._pdfStyles?.() ?? '';
const _pdfHeader = (t, n) => window._pdfHeader?.(t, n) ?? '';
const _pdfFooter = () => window._pdfFooter?.() ?? '';
const _pdfOpen   = html => window._pdfOpen?.(html);

// ─── State ────────────────────────────────────────────────────────────────────

const ECO_KEY = 'agrumes_eco';

export const ECO_CATS = {
  cost:    ['intrant','eau','main_oeuvre','autre'],
  revenue: ['vente','subvention','autre']
};

export const ECO_COLORS = {
  intrant:'#c62828', eau:'#2d7dd2', main_oeuvre:'#7b4eb5',
  vente:'#2e7d32', subvention:'#e8941a', autre:'#9e9e9e'
};

let ecoData = { entries: [] };
let ecoTab = 'overview';
let ecoSeason = _currentEcoSeason();
let _ecoLblAddCost = '+ Dépense';
let _ecoLblAddRev  = '+ Recette';
let _ecoLblPdf     = '📊 Bilan de collection PDF';

// ─── Data helpers ─────────────────────────────────────────────────────────────

function _currentEcoSeason() {
  return String(new Date().getFullYear());
}

export function loadEco() {
  try {
    const r = localStorage.getItem(ECO_KEY);
    if (r) { ecoData = JSON.parse(r); ecoData.entries = ecoData.entries || []; return; }
  } catch {}
  ecoData = { entries: [] };
}

export function saveEco() {
  try { localStorage.setItem(ECO_KEY, JSON.stringify(ecoData)); } catch {}
}

export function addEcoEntry(entry) {
  ecoData.entries.unshift({ ...entry, id: entry.id || gid() });
  saveEco();
}

export function deleteEcoEntry(id) {
  ecoData.entries = ecoData.entries.filter(e => e.id !== id);
  saveEco();
  closeModal();
  if (window.page === 'eco' || window.proView === 'eco') window.render?.();
}

export function getEcoEntries({ season, plantId } = {}) {
  let entries = ecoData.entries;
  if (season)  entries = entries.filter(e => (e.season || e.date?.slice(0,4)) === String(season));
  if (plantId) entries = entries.filter(e => e.plantId === plantId || !e.plantId);
  return entries;
}

export function currentEcoSeason() {
  return _currentEcoSeason();
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function _ecoCatLabel(cat) {
  const map = {
    intrant: T('misc.ecoCatIntrant'), eau: T('misc.ecoCatEau'),
    main_oeuvre: T('misc.ecoCatMain'), vente: T('misc.ecoCatVente'),
    subvention: T('misc.ecoCatSubv'), autre: T('misc.ecoCatAutre')
  };
  return map[cat] || cat;
}

function _ecoSeasons() {
  const years = new Set(ecoData.entries.map(e => e.season || e.date?.slice(0,4)).filter(Boolean));
  years.add(_currentEcoSeason());
  return [...years].sort().reverse();
}

function _ecoAgg(entries) {
  const costs    = entries.filter(e => e.type === 'cost');
  const revenues = entries.filter(e => e.type === 'revenue');
  const totalC   = costs.reduce((s, e) => s + (e.amount||0), 0);
  const totalR   = revenues.reduce((s, e) => s + (e.amount||0), 0);
  return { totalC, totalR, margin: totalR - totalC, costs, revenues };
}

function _ecoFmt(n) {
  if (n === null || n === undefined) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2) + ' €';
}

function _ecoFmtAbs(n) { return n.toFixed(2) + ' €'; }

// ─── Modal open/save ──────────────────────────────────────────────────────────

export function openEcoEntry(entryId, defaultType) {
  const plants   = window.plants || [];
  const ET       = window.ET || {};
  const existing = entryId ? ecoData.entries.find(e => e.id === entryId) : null;
  const type     = existing?.type || defaultType || 'cost';
  const cats     = ECO_CATS[type] || ECO_CATS.cost;

  const plantOpts = `<option value="">${T('misc.ecoAllPlants')}</option>` +
    plants.map(p => `<option value="${p.id}"${existing?.plantId===p.id?' selected':''}>${esc(p.name)}</option>`).join('');

  const catOpts = cats.map(c =>
    `<option value="${c}"${existing?.category===c?' selected':''}>${_ecoCatLabel(c)}</option>`
  ).join('');

  const evOpts = (existing?.plantId ? plants.find(p=>p.id===existing.plantId)?.events||[] : [])
    .filter(e=>!e.audit).slice(0,30)
    .map(e=>`<option value="${e.id}"${existing?.eventId===e.id?' selected':''}>${fmtDate(e.date)} ${ET[e.type]?.i||''} ${e.description.slice(0,30)}</option>`).join('');

  showModal(`
<h3 style="margin-bottom:12px">${existing ? '✏️' : '+'} ${type==='cost'?T('misc.ecoCosts'):T('misc.ecoRevenues')}</h3>
<div class="frow2" style="margin-bottom:8px">
  <div class="ff"><label>Date</label>
    <input id="eco-date" type="date" value="${existing?.date||todayStr()}"
      style="padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.87rem;width:100%"/>
  </div>
  <div class="ff"><label>${T('misc.ecoCatLabel')}</label>
    <select id="eco-cat" style="padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.87rem;width:100%">
      ${catOpts}
    </select>
  </div>
</div>
<div class="frow2" style="margin-bottom:8px">
  <div class="ff"><label>${T('misc.ecoAmount')}</label>
    <input id="eco-amount" type="number" min="0" step="0.01" value="${existing?.amount||''}" placeholder="ex : 12.50"
      style="padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.87rem;width:100%"/>
  </div>
  <div class="ff"><label>${T('misc.ecoQty')} <span style="font-size:.75rem;color:var(--muted)">(${T('misc.ecoUnit')})</span></label>
    <input id="eco-qty" type="text" value="${existing?.qty?existing.qty+(existing.unit?' '+existing.unit:''):''}" placeholder="ex : 2 kg, 50 L…"
      style="padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.87rem;width:100%"/>
  </div>
</div>
<div class="ff" style="margin-bottom:8px"><label>${T('misc.ecoPlantLabel')}</label>
  <select id="eco-plant" onchange="refreshEcoEvtOpts(this.value)"
    style="padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.87rem;width:100%">
    ${plantOpts}
  </select>
</div>
<div class="ff" style="margin-bottom:8px"><label>${T('misc.ecoNote')}</label>
  <input id="eco-note" value="${esc(existing?.note||'')}" placeholder="ex : Engrais mars, passage traitement…"
    style="padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.87rem;width:100%"/>
</div>
<div class="fact" style="margin-top:4px">
  <button class="btn" style="background:var(--cream3);color:var(--text)" onclick="closeModal()">${T('misc.ecoCancelEntry')}</button>
  ${existing?`<button class="btn" style="background:rgba(198,40,40,.1);color:#c62828;border-color:rgba(198,40,40,.3)" onclick="deleteEcoEntry('${existing.id}')">${T('ui.delete')}</button>`:''}
  <button class="btn btn-p" onclick="saveEcoEntry('${entryId||''}','${type}')">${T('misc.ecoSaveEntry')}</button>
</div>`);
}

export function refreshEcoEvtOpts(plantId) {}

export function saveEcoEntry(entryId, type) {
  const date    = document.getElementById('eco-date')?.value || todayStr();
  const cat     = document.getElementById('eco-cat')?.value || 'autre';
  const amount  = parseFloat(document.getElementById('eco-amount')?.value) || 0;
  const qtyRaw  = document.getElementById('eco-qty')?.value?.trim() || '';
  const note    = document.getElementById('eco-note')?.value?.trim() || '';
  const plantId = document.getElementById('eco-plant')?.value || null;
  if (!amount) { toast('Montant requis', true); return; }
  const qtyMatch = qtyRaw.match(/^([0-9.,]+)\s*(.*)$/);
  const qty  = qtyMatch ? parseFloat(qtyMatch[1].replace(',','.')) : null;
  const unit = qtyMatch ? (qtyMatch[2]||'').trim() : null;
  const entry = { id: entryId || gid(), date, type, category: cat, amount, qty, unit, note, plantId: plantId||null, season: date.slice(0,4) };
  if (entryId) {
    ecoData.entries = ecoData.entries.map(e => e.id === entryId ? entry : e);
    saveEco();
  } else {
    addEcoEntry(entry);
  }
  closeModal();
  toast(T('misc.ecoDataSaved'));
  if (window.page === 'eco' || window.proView === 'eco') window.render?.();
}

// ─── Render functions ─────────────────────────────────────────────────────────

export function renderEcoPage() {
  const plants = window.plants || [];
  const PRO_PROFILES = window.PRO_PROFILES || [];
  const seasons = _ecoSeasons();
  const seasonSelect = `<select id="eco-season-sel" onchange="ecoSeason=this.value;render()"
    style="font-size:.78rem;padding:5px 10px;border:1px solid var(--cream3);border-radius:7px;background:var(--white)">
    ${seasons.map(s => `<option value="${s}"${s===ecoSeason?' selected':''}>${T('misc.ecoYearLabel')} ${s}</option>`).join('')}
  </select>`;

  const prof = getProfile();
  const isCollec   = !PRO_PROFILES.includes(prof.profileType||'collectionneur');
  const showNursTab = PRO_PROFILES.includes(prof.profileType||'collectionneur');

  const lblCosts    = isCollec ? 'Dépenses'  : T('misc.ecoCosts');
  const lblRevenues = isCollec ? 'Recettes'  : T('misc.ecoRevenues');
  const lblMargin   = isCollec ? 'Solde'     : T('misc.ecoMargin');
  const lblPerUnit  = isCollec ? 'Par sujet' : T('misc.ecoPerTree');
  const lblAddCost  = isCollec ? '+ Dépense' : `+ ${T('misc.ecoCosts')}`;
  const lblAddRev   = isCollec ? '+ Recette' : `+ ${T('misc.ecoRevenues')}`;
  const lblPdfBtn   = isCollec ? '📊 Bilan de collection PDF' : T('misc.ecoPDFBtn');
  _ecoLblAddCost = lblAddCost; _ecoLblAddRev = lblAddRev; _ecoLblPdf = lblPdfBtn;
  const lblEmpty = isCollec
    ? 'Aucune dépense ni recette enregistrée. Commencez par saisir un investissement.'
    : T('misc.ecoNoData');

  const subPills = `<div class="pro-sub-pills">
    <div class="pro-sub-pill${ecoTab==='overview'?' active':''}" onclick="ecoTab='overview';render()">${T('misc.ecoTabOverview')}</div>
    <div class="pro-sub-pill${ecoTab==='plants'?' active':''}" onclick="ecoTab='plants';render()">${T('misc.ecoTabPlants')}</div>
    <div class="pro-sub-pill${ecoTab==='months'?' active':''}" onclick="ecoTab='months';render()">${T('misc.ecoTabMonths')}</div>
    <div class="pro-sub-pill${ecoTab==='trends'?' active':''}" onclick="ecoTab='trends';render()">📈 Tendances</div>
    ${showNursTab?`<div class="pro-sub-pill${ecoTab==='nursery'?' active':''}" onclick="ecoTab='nursery';render()">${T('misc.nurseryTab')}</div>`:''}
  </div>`;

  const header = `<div class="pro-module-hd">
    <div class="pro-module-hd-left">
      <div class="pro-module-hd-title">${T('misc.ecoTitle')}</div>
      <div class="pro-module-hd-sub">Saison active : ${ecoSeason}</div>
    </div>
    ${seasonSelect}
  </div>${subPills}`;

  const entries = getEcoEntries({ season: ecoSeason });
  const { totalC, totalR, margin } = _ecoAgg(entries);
  const marginC = margin > 0 ? '#2e7d32' : margin < 0 ? '#c62828' : '#9e9e9e';
  const nPlants = plants.length || 1;

  const kpis = `<div class="eco-kpi-row">
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:#c62828">${_ecoFmtAbs(totalC)}</div><div class="eco-kpi-lbl">${lblCosts}</div></div>
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:#2e7d32">${_ecoFmtAbs(totalR)}</div><div class="eco-kpi-lbl">${lblRevenues}</div></div>
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:${marginC}">${_ecoFmt(margin)}</div><div class="eco-kpi-lbl">${lblMargin}</div></div>
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:${marginC};font-size:.95rem">${_ecoFmt(margin/nPlants)}</div><div class="eco-kpi-lbl">${lblPerUnit}</div></div>
  </div>`;

  if (!entries.length) {
    return header + kpis + `<div style="padding:24px 14px;text-align:center;color:var(--muted);font-style:italic">${lblEmpty}</div>
<div style="padding:0 14px 8px;display:flex;gap:8px">
  <button class="btn btn-p" style="flex:1" onclick="openEcoEntry(null,'cost')">${lblAddCost}</button>
  <button class="btn btn-o" style="flex:1" onclick="openEcoEntry(null,'revenue')">${lblAddRev}</button>
</div>`;
  }

  if (ecoTab === 'overview') return header + kpis + _renderEcoOverview(entries);
  if (ecoTab === 'plants')   return header + kpis + _renderEcoPlants(entries);
  if (ecoTab === 'months')   return header + kpis + _renderEcoMonths(entries);
  if (ecoTab === 'trends')   return header + _renderEcoTrends();
  if (ecoTab === 'nursery')  return header + _renderEcoNursery();
  return header + kpis;
}

function _renderEcoNursery() {
  // Delegate to nursery functions still in index.html via window
  if (window._nurseryGraftSync) window._nurseryGraftSync();
  const nd = window.getNursery?.() || { semis:[], grafts:[], catalog:[], orders:[], history:[] };
  const semisActifs = nd.semis.length;
  const avgGerm = nd.semis.filter(s=>s.germinationPct!=null).length
    ? (nd.semis.filter(s=>s.germinationPct!=null).reduce((a,s)=>a+s.germinationPct,0) / nd.semis.filter(s=>s.germinationPct!=null).length).toFixed(0)
    : '—';
  const totalPlants = nd.catalog.reduce((s,c)=>s+(c.qtyAvail||0),0);
  const seasonStart = _currentEcoSeason() + '-01-01';
  const caSaison = nd.orders
    .filter(o=>o.status==='done' && (o.date||'')>=seasonStart)
    .reduce((s,o)=>s+(o.items||[]).reduce((t,it)=>{
      const cat=nd.catalog.find(c=>c.id===it.catalogId);
      return t+(it.qty||0)*(it.unitPrice||cat?.price||0);
    },0), 0);
  const kpis = `<div class="eco-kpi-row" style="margin-bottom:0">
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:var(--text-accent)">${semisActifs}</div><div class="eco-kpi-lbl">🌱 Semis actifs</div></div>
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:var(--amber)">${avgGerm}${avgGerm!=='—'?'%':''}</div><div class="eco-kpi-lbl">🌿 Germination moy.</div></div>
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:var(--text-accent)">${totalPlants}</div><div class="eco-kpi-lbl">🪴 Plants dispo</div></div>
    <div class="eco-kpi"><div class="eco-kpi-val" style="color:#2e7d32;font-size:.95rem">${caSaison.toFixed(2)} €</div><div class="eco-kpi-lbl">💶 CA saison</div></div>
  </div>`;
  const nursView = window.nursView || 'semis';
  const hist = [...(nd.history||[])].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const histRows = hist.length ? hist.map(h=>`
<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--cream3)">
  <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;white-space:nowrap;min-width:64px;margin-top:2px">${fmtDate(h.date)}</div>
  <div style="flex:1;min-width:0">
    <div style="font-size:.82rem;font-weight:600;color:var(--text)">${esc(h.clientName||'—')}</div>
    <div style="font-size:.7rem;color:var(--muted)">${h.items.map(it=>`${esc(it.species)}${it.variety?' var. '+esc(it.variety):''} ×${it.qty} @ ${(it.unitPrice||0).toFixed(2)} €`).join(' · ')}</div>
  </div>
  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
    <div style="font-size:.84rem;font-weight:700;color:#2e7d32;white-space:nowrap">${h.total.toFixed(2)} €</div>
    ${h.orderId?`<button class="btn btn-sm" style="font-size:.75rem;padding:3px 7px;background:rgba(45,90,61,.1);color:var(--text-accent)" onclick="nursView='orders';render();setTimeout(()=>openOrderModal('${h.orderId}'),80)" title="Modifier">✏️</button>`:''}
    <button class="btn btn-sm btn-d" style="font-size:.75rem;padding:3px 7px" onclick="deleteHistoryEntry('${h.id}')" title="Supprimer">🗑</button>
  </div>
</div>`).join('') : `<div style="padding:16px 0;font-size:.8rem;color:var(--muted);font-style:italic;text-align:center">Aucune livraison validée</div>`;

  const nTabs = `<div class="eco-tabs" style="margin-top:12px">
    <div class="eco-tab${nursView==='semis'?' active':''}" onclick="nursView='semis';render()">🌱 Semis (${nd.semis.length})</div>
    <div class="eco-tab${nursView==='greffes'?' active':''}" onclick="nursView='greffes';render()">✂️ Greffes (${(nd.grafts||[]).length})</div>
    <div class="eco-tab${nursView==='catalog'?' active':''}" onclick="nursView='catalog';render()">📋 Catalogue (${nd.catalog.length})</div>
    <div class="eco-tab${nursView==='orders'?' active':''}" onclick="nursView='orders';render()">📦 Commandes (${nd.orders.length})</div>
  </div>`;
  let nBody = '';
  if (nursView==='semis')   nBody = window._renderSemisView?.(nd) || '';
  if (nursView==='greffes') nBody = window._renderGraftsView?.(nd) || '';
  if (nursView==='catalog') nBody = window._renderCatalogView?.(nd) || '';
  if (nursView==='orders')  nBody = window._renderOrdersView?.(nd) || '';

  return `${kpis}
${nTabs}${nBody}
<div style="padding:12px 14px 4px;margin-top:8px;border-top:1px solid var(--cream3)">
  <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:var(--g3);font-family:'JetBrains Mono',monospace;margin-bottom:8px">📋 Historique des livraisons</div>
  ${histRows}
</div>
<div style="height:20px"></div>`;
}

function _renderEcoOverview(entries) {
  const plants = window.plants || [];
  const sorted = [...entries].sort((a,b) => new Date(b.date)-new Date(a.date));
  const rows = sorted.map(e => {
    const isRev = e.type === 'revenue';
    const c = ECO_COLORS[e.category||e.cat] || '#9e9e9e';
    const plant = e.plantId ? plants.find(p=>p.id===e.plantId) : null;
    return `<div class="eco-entry-row" onclick="openEcoEntry('${e.id}','${e.type}')">
      <div class="eco-entry-dot" style="background:${c}"></div>
      <div class="eco-entry-info">
        <div class="eco-entry-main">${esc(e.note||e.label||_ecoCatLabel(e.category||e.cat))}</div>
        <div class="eco-entry-sub">${fmtDate(e.date)}${plant?' · '+esc(plant.name):''}${e.qty?' · '+e.qty+(e.unit?' '+e.unit:''):''}</div>
      </div>
      <div class="eco-entry-amt" style="color:${isRev?'#2e7d32':'#c62828'}">${isRev?'+':'-'}${_ecoFmtAbs(e.amount)}</div>
    </div>`;
  }).join('');

  return `<div style="padding:0 14px 4px;display:flex;gap:8px;margin-top:8px">
  <button class="btn btn-p" style="flex:1;font-size:.78rem" onclick="openEcoEntry(null,'cost')">${_ecoLblAddCost}</button>
  <button class="btn btn-o" style="flex:1;font-size:.78rem" onclick="openEcoEntry(null,'revenue')">${_ecoLblAddRev}</button>
  <button class="btn btn-sm" style="background:var(--cream2);color:var(--muted);font-size:.75rem;flex-shrink:0" onclick="exportEcoCSV('${ecoSeason}')" title="Exporter CSV">⬇ CSV</button>
</div>
<div style="margin-top:8px">${rows}</div>
<div style="padding:10px 14px;display:flex;gap:8px">
  <button class="prof-action-btn pab-neutral" style="flex:1;margin:0" onclick="exportEcoPDF()">${_ecoLblPdf}</button>
</div>`;
}

function _renderEcoPlants(entries) {
  const plants = window.plants || [];
  const maxBar = Math.max(...plants.map(p => {
    const pe = entries.filter(e => e.plantId===p.id);
    const {totalC,totalR} = _ecoAgg(pe);
    return Math.max(totalC, totalR);
  }), 1);

  const rows = plants.map(p => {
    const pe = entries.filter(e => e.plantId===p.id);
    const {totalC,totalR,margin} = _ecoAgg(pe);
    if (!pe.length) return '';
    const pctC = Math.round((totalC/maxBar)*100);
    const pctR = Math.round((totalR/maxBar)*100);
    const mc   = margin>0?'#2e7d32':margin<0?'#c62828':'#9e9e9e';
    return `<div class="eco-bar-row">
      <div class="eco-bar-name">${esc(p.name)}</div>
      <div class="eco-bar-track">
        <div class="eco-bar-cost" style="width:${pctC}%"></div>
        <div class="eco-bar-rev"  style="width:${pctR}%;top:6px"></div>
      </div>
      <div class="eco-bar-vals" style="color:${mc}">${_ecoFmt(margin)}</div>
    </div>`;
  }).filter(Boolean).join('');

  const unassigned = entries.filter(e=>!e.plantId);
  const {totalC:uc,totalR:ur,margin:um} = _ecoAgg(unassigned);
  const unassRow = unassigned.length ? `<div class="eco-bar-row" style="border-top:1px solid var(--cream3);padding-top:8px">
    <div class="eco-bar-name" style="color:var(--muted);font-style:italic">${T('misc.ecoAllPlants')}</div>
    <div class="eco-bar-track">
      <div class="eco-bar-cost" style="width:${Math.round((uc/Math.max(uc,ur,1))*100)}%"></div>
      <div class="eco-bar-rev"  style="width:${Math.round((ur/Math.max(uc,ur,1))*100)}%;top:6px"></div>
    </div>
    <div class="eco-bar-vals" style="color:${um>0?'#2e7d32':um<0?'#c62828':'#9e9e9e'}">${_ecoFmt(um)}</div>
  </div>` : '';

  return `<div style="padding:10px 14px 0;font-size:.75rem;color:var(--muted);display:flex;gap:16px">
  <span><span style="display:inline-block;width:10px;height:6px;background:rgba(198,40,40,.7);border-radius:2px;margin-right:4px"></span>${T('misc.ecoCosts')}</span>
  <span><span style="display:inline-block;width:10px;height:6px;background:rgba(46,125,50,.7);border-radius:2px;margin-right:4px"></span>${T('misc.ecoRevenues')}</span>
</div>
<div style="margin-top:6px">${rows||'<div style="padding:14px;color:var(--muted);font-style:italic">Aucune entrée liée à un sujet.</div>'}${unassRow}</div>`;
}

function _renderEcoMonths(entries) {
  const months = {};
  entries.forEach(e => {
    const mk = e.date?.slice(0,7);
    if (!mk) return;
    if (!months[mk]) months[mk] = {cost:0,revenue:0};
    if (e.type==='cost')    months[mk].cost    += e.amount||0;
    if (e.type==='revenue') months[mk].revenue += e.amount||0;
  });
  const keys = Object.keys(months).sort().reverse();
  if (!keys.length) return `<div style="padding:20px;color:var(--muted);font-style:italic">${T('misc.ecoNoData')}</div>`;

  const maxVal = Math.max(...keys.map(k => Math.max(months[k].cost, months[k].revenue)), 1);
  const loc    = getLd().locale || 'fr-FR';

  const rows = keys.map(k => {
    const {cost,revenue} = months[k];
    const pctC = Math.round((cost/maxVal)*100);
    const pctR = Math.round((revenue/maxVal)*100);
    const label = new Date(k+'-01').toLocaleDateString(loc, {month:'short',year:'2-digit'});
    return `<div class="eco-month-row">
      <div class="eco-month-lbl">${label}</div>
      <div class="eco-month-bars">
        <div class="eco-month-cost-bar" style="width:${pctC}%"></div>
        <div class="eco-month-rev-bar"  style="width:${pctR}%"></div>
      </div>
      <div class="eco-month-val">${cost>0?'-'+cost.toFixed(0)+'€':''} ${revenue>0?'+'+revenue.toFixed(0)+'€':''}</div>
    </div>`;
  }).join('');

  return `<div class="eco-month-bar-wrap" style="margin-top:12px">${rows}</div>`;
}

function _renderEcoTrends() {
  const plants  = window.plants || [];
  const seasons = _ecoSeasons();
  if (seasons.length < 1) {
    return `<div style="padding:20px 14px;text-align:center;color:var(--muted);font-style:italic">Aucune donnée économique disponible.</div>`;
  }

  const byYear = seasons.map(s => {
    const entries = getEcoEntries({ season: s });
    const { totalC, totalR, margin } = _ecoAgg(entries);
    const catC = {}, catR = {};
    entries.filter(e=>e.type==='cost').forEach(e=>{ const k=e.category||'autre'; catC[k]=(catC[k]||0)+(e.amount||0); });
    entries.filter(e=>e.type==='revenue').forEach(e=>{ const k=e.category||'autre'; catR[k]=(catR[k]||0)+(e.amount||0); });
    return { s, totalC, totalR, margin, catC, catR };
  }).reverse();

  const maxVal = Math.max(...byYear.map(y => Math.max(y.totalC, y.totalR)), 1);

  const barsHtml = byYear.map(y => {
    const pctC = Math.round((y.totalC/maxVal)*100);
    const pctR = Math.round((y.totalR/maxVal)*100);
    const mc   = y.margin>=0?'#2e7d32':'#c62828';
    return `<div style="margin-bottom:10px">
<div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:4px">
  <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--text-strong)">${y.s}</span>
  <span style="font-family:'JetBrains Mono',monospace;font-size:.75rem;color:${mc}">${_ecoFmt(y.margin)}</span>
</div>
<div style="position:relative;height:10px;background:var(--cream2);border-radius:5px;overflow:hidden;margin-bottom:2px">
  <div style="position:absolute;top:0;left:0;height:100%;width:${pctC}%;background:rgba(198,40,40,.6);border-radius:5px 0 0 5px"></div>
</div>
<div style="position:relative;height:10px;background:var(--cream2);border-radius:5px;overflow:hidden">
  <div style="position:absolute;top:0;left:0;height:100%;width:${pctR}%;background:rgba(46,125,50,.6);border-radius:5px 0 0 5px"></div>
</div>
<div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px">
  <span>− ${y.totalC.toFixed(0)} €</span>
  <span>+ ${y.totalR.toFixed(0)} €</span>
</div>
</div>`;
  }).join('');

  const summaryRows = byYear.map(y => {
    const mc = y.margin>=0?'#2e7d32':'#c62828';
    const nP = plants.length || 1;
    return `<tr>
<td style="font-weight:700;font-family:'JetBrains Mono',monospace">${y.s}</td>
<td style="color:#c62828;text-align:right">${y.totalC.toFixed(2)} €</td>
<td style="color:#2e7d32;text-align:right">${y.totalR.toFixed(2)} €</td>
<td style="color:${mc};font-weight:700;text-align:right">${_ecoFmt(y.margin)}</td>
<td style="color:${mc};text-align:right;font-size:.76rem">${_ecoFmt(y.margin/nP)}/sujet</td>
</tr>`;
  }).join('');

  const allEntries = seasons.flatMap(s => getEcoEntries({ season: s }));
  const allCatC = {};
  allEntries.filter(e=>e.type==='cost').forEach(e=>{
    const k = _ecoCatLabel(e.category||'autre');
    allCatC[k] = (allCatC[k]||0) + (e.amount||0);
  });
  const topCosts = Object.entries(allCatC).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const totalAllC = Object.values(allCatC).reduce((s,v)=>s+v,0)||1;
  const costBreakdown = topCosts.map(([cat,amt]) => {
    const pct = Math.round((amt/totalAllC)*100);
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
<div style="font-size:.76rem;color:var(--text);flex:1">${esc(cat)}</div>
<div style="width:80px;height:6px;background:var(--cream2);border-radius:3px;overflow:hidden">
  <div style="height:100%;width:${pct}%;background:rgba(198,40,40,.6);border-radius:3px"></div>
</div>
<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);min-width:36px;text-align:right">${pct}%</div>
</div>`;
  }).join('');

  const ef = {intrant:2.0,eau:0.05,main_oeuvre:0.3,phyto:2.5,autre:0.5};
  const totalCarbone = allEntries.filter(e=>e.type==='cost').reduce((s,e)=>{
    return s+(e.amount||0)*(ef[e.category||'autre']||ef.autre);
  },0);
  const byYear2 = seasons.map(s=>{
    const e2=getEcoEntries({season:s}).filter(e=>e.type==='cost');
    const c=e2.reduce((s2,e)=>s2+(e.amount||0)*(ef[e.category||'autre']||ef.autre),0);
    return{s,c};
  }).reverse();
  const carbonSection = totalCarbone>=1 ? (() => {
    const maxC=Math.max(...byYear2.map(y=>y.c),1);
    const carbonBars=byYear2.map(y=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);width:32px">${y.s}</div>
<div style="flex:1;height:8px;background:var(--cream2);border-radius:4px;overflow:hidden">
  <div style="height:100%;width:${Math.round((y.c/maxC)*100)}%;background:${y.c>500?'#c62828':y.c>200?'#e65100':'#2e7d32'};border-radius:4px"></div>
</div>
<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);min-width:54px;text-align:right">${y.c.toFixed(0)} kgCO₂</div>
</div>`).join('');
    return `<div style="margin:16px 0 6px;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">🌱 Empreinte carbone estimée (intrants)</div>
<div style="background:rgba(46,125,50,.04);border:1px solid rgba(46,125,50,.12);border-radius:9px;padding:10px 12px">
  <div style="font-size:.75rem;color:var(--muted);line-height:1.4;margin-bottom:8px">Estimation indicative basée sur les facteurs d'émission ADEME par catégorie de charge. Non certifiable — à titre de pilotage interne.</div>
  ${carbonBars}
  <div style="margin-top:8px;font-size:.75rem;color:${totalCarbone>1000?'#c62828':totalCarbone>400?'#e65100':'#2e7d32'};font-weight:600">${totalCarbone.toFixed(0)} kgCO₂eq total · ${(totalCarbone/(plants.length||1)).toFixed(0)} kgCO₂eq/sujet</div>
</div>`;
  })() : '';

  return `<div style="padding:12px 14px 0">
<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin-bottom:10px">Évolution saisons (charges / recettes)${helpBtn('eco_tendances')}</div>
${barsHtml}
<div style="margin:12px 0 8px;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Synthèse annuelle</div>
<div style="overflow-x:auto">
<table style="width:100%;border-collapse:collapse;font-size:.76rem">
<thead><tr style="border-bottom:2px solid var(--cream3)">
<th style="text-align:left;padding:5px 0;color:var(--muted);font-size:.75rem">Saison</th>
<th style="text-align:right;padding:5px 0;color:#c62828;font-size:.75rem">Charges</th>
<th style="text-align:right;padding:5px 0;color:#2e7d32;font-size:.75rem">Recettes</th>
<th style="text-align:right;padding:5px 0;color:var(--muted);font-size:.75rem">Marge</th>
<th style="text-align:right;padding:5px 0;color:var(--muted);font-size:.75rem">/sujet</th>
</tr></thead>
<tbody>${summaryRows}</tbody>
</table>
</div>
${topCosts.length?`<div style="margin:14px 0 6px;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Répartition charges (toutes années)</div>${costBreakdown}`:''}
${carbonSection}
<div style="display:flex;gap:8px;margin-top:14px">
  <button class="btn btn-sm" style="background:rgba(45,90,61,.1);color:var(--text-accent);font-size:.75rem" onclick="exportEcoPDF()">📄 PDF ${ecoSeason}</button>
  <button class="btn btn-sm" style="background:var(--cream2);color:var(--muted);font-size:.75rem" onclick="exportEcoCSV('all')">⬇ CSV toutes années</button>
</div>
</div>`;
}

// ─── Export PDF / CSV ─────────────────────────────────────────────────────────

export function exportEcoPDF() {
  const plants  = window.plants || [];
  const entries = getEcoEntries({ season: ecoSeason });
  const { totalC, totalR, margin } = _ecoAgg(entries);
  const loc  = getLd().locale || 'fr-FR';
  const prof = getProfile();
  const today = new Date().toLocaleDateString(loc, { day:'numeric',month:'long',year:'numeric' });
  const mc    = margin>=0?'#2e7d32':'#c62828';

  const perPlant = {};
  entries.forEach(e => {
    const k = e.plantId || '__all__';
    if (!perPlant[k]) perPlant[k] = [];
    perPlant[k].push(e);
  });

  const plantRows = Object.entries(perPlant).map(([pid,pes]) => {
    const p = pid==='__all__' ? null : plants.find(x=>x.id===pid);
    const {totalC:pc,totalR:pr,margin:pm} = _ecoAgg(pes);
    const name = p ? esc(p.name) : T('misc.ecoAllPlants');
    return `<tr>
      <td style="font-weight:600">${name}</td>
      <td style="color:#c62828;text-align:right">${_ecoFmtAbs(pc)}</td>
      <td style="color:#2e7d32;text-align:right">${_ecoFmtAbs(pr)}</td>
      <td style="color:${pm>=0?'#2e7d32':'#c62828'};text-align:right;font-weight:700">${_ecoFmt(pm)}</td>
    </tr>`;
  }).join('');

  const detailRows = [...entries].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e => {
    const plant = e.plantId ? plants.find(p=>p.id===e.plantId) : null;
    const isRev = e.type==='revenue';
    return `<tr>
      <td style="white-space:nowrap">${new Date(e.date).toLocaleDateString(loc,{day:'numeric',month:'short'})}</td>
      <td>${esc(e.note||_ecoCatLabel(e.category))}</td>
      <td>${esc(_ecoCatLabel(e.category))}</td>
      <td>${plant?esc(plant.name):'—'}</td>
      <td style="color:${isRev?'#2e7d32':'#c62828'};text-align:right;font-weight:600">${isRev?'+':'-'}${_ecoFmtAbs(e.amount)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="${getLang()}"><head><meta charset="utf-8">
<title>${T('misc.ecoReportTitle')} ${ecoSeason}</title>${_pdfStyles()}
<style>
.eco-pdf-table{width:100%;border-collapse:collapse;font-size:.78rem;margin-top:8px}
.eco-pdf-table th{background:rgba(45,90,61,.08);color:#2d5a3d;font-family:monospace;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;padding:6px 8px;text-align:left;border-bottom:2px solid rgba(45,90,61,.2)}
.eco-pdf-table td{padding:5px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body><div class="pdf-page">
${_pdfHeader(T('misc.ecoReportTitle')+' — '+ecoSeason, prof.name||'')}
<div class="pdf-section">
  <div class="pdf-section-title">${T('misc.ecoTabOverview')}</div>
  <div class="pdf-stat-row">
    <div class="pdf-stat-box"><div class="pdf-stat-val" style="color:#c62828">${_ecoFmtAbs(totalC)}</div><div class="pdf-stat-lbl">${T('misc.ecoCosts')}</div></div>
    <div class="pdf-stat-box"><div class="pdf-stat-val" style="color:#2e7d32">${_ecoFmtAbs(totalR)}</div><div class="pdf-stat-lbl">${T('misc.ecoRevenues')}</div></div>
    <div class="pdf-stat-box"><div class="pdf-stat-val" style="color:${mc}">${_ecoFmt(margin)}</div><div class="pdf-stat-lbl">${T('misc.ecoMargin')}</div></div>
    <div class="pdf-stat-box"><div class="pdf-stat-val" style="color:${mc};font-size:1rem">${_ecoFmt(margin/(plants.length||1))}</div><div class="pdf-stat-lbl">${T('misc.ecoPerTree')}</div></div>
  </div>
</div>
<div class="pdf-section">
  <div class="pdf-section-title">${T('misc.ecoTabPlants')}</div>
  <table class="eco-pdf-table">
    <thead><tr><th>Sujet</th><th style="text-align:right">${T('misc.ecoCosts')}</th><th style="text-align:right">${T('misc.ecoRevenues')}</th><th style="text-align:right">${T('misc.ecoMargin')}</th></tr></thead>
    <tbody>${plantRows}</tbody>
  </table>
</div>
<div class="pdf-section">
  <div class="pdf-section-title">${T('misc.lastEvents')} · ${entries.length} entrées</div>
  <table class="eco-pdf-table"><thead><tr><th>Date</th><th>Note</th><th>${T('misc.ecoCatLabel')}</th><th>${T('misc.ecoPlantLabel')}</th><th style="text-align:right">Montant</th></tr></thead>
  <tbody>${detailRows}</tbody></table>
</div>
${_pdfFooter()}
</div></body></html>`;

  _pdfOpen(html);
}

export function exportEcoCSV(season) {
  const plants  = window.plants || [];
  const entries = season==='all' ? ecoData.entries : getEcoEntries({ season });
  const sorted  = [...entries].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const headers = ['Date','Type','Catégorie','Sujet','Note','Montant (€)','Saison'];
  const rows = sorted.map(e => {
    const plant = e.plantId ? plants.find(p=>p.id===e.plantId) : null;
    return [
      e.date||'',
      e.type==='cost'?'Charge':'Recette',
      _ecoCatLabel(e.category||''),
      plant?plant.name:'',
      (e.note||e.label||'').replace(/[";]/g,' '),
      (e.amount||0).toFixed(2),
      e.season||e.date?.slice(0,4)||''
    ].map(v=>`"${v}"`).join(',');
  });
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿'+csv], { type:'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `gestion_economique_${season}_${todayStr()}.csv`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
  toast('Export CSV téléchargé ✓');
}

// ─── Global exposure ──────────────────────────────────────────────────────────

window.loadEco          = loadEco;
window.saveEco          = saveEco;
window.addEcoEntry      = addEcoEntry;
window.deleteEcoEntry   = deleteEcoEntry;
window.getEcoEntries    = getEcoEntries;
window.currentEcoSeason = currentEcoSeason;
window.openEcoEntry     = openEcoEntry;
window.refreshEcoEvtOpts= refreshEcoEvtOpts;
window.saveEcoEntry     = saveEcoEntry;
window.renderEcoPage    = renderEcoPage;
window.exportEcoPDF     = exportEcoPDF;
window.exportEcoCSV     = exportEcoCSV;
window.ECO_CATS         = ECO_CATS;
window.ECO_COLORS       = ECO_COLORS;
// ecoTab and ecoSeason need to be settable from onclick handlers
Object.defineProperty(window, 'ecoTab', {
  get: () => ecoTab,
  set: v => { ecoTab = v; },
  configurable: true
});
Object.defineProperty(window, 'ecoSeason', {
  get: () => ecoSeason,
  set: v => { ecoSeason = v; },
  configurable: true
});
