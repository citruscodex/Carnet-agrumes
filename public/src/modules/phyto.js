import { esc } from '../lib/esc.js';

const T         = k  => window.T?.(k) ?? k;
const getCfg    = () => window.getCfg?.() ?? {};
const getLd     = () => window.getLd?.() ?? {};
const getLang   = () => window.getLang?.() ?? 'fr';
const getProfile = () => window.getProfile?.() ?? {};
const fmtDate   = d  => window.fmtDate?.(d) ?? d;
const helpBtn   = id => window.helpBtn?.(id) ?? '';
const toast     = (msg, err) => window.toast?.(msg, err);
const todayStr  = () => window.todayStr?.() ?? new Date().toISOString().slice(0,10);
const _pdfStyles = () => window._pdfStyles?.() ?? '';
const _pdfFooter = () => window._pdfFooter?.() ?? '';
const _pdfOpen   = html => window._pdfOpen?.(html);

function _getPlants()     { return window.plants ?? []; }
function _getSelId()      { return window.selId ?? null; }
function _getYieldData()  { return window.yieldData ?? {}; }

function _checkDARInForm() {
  const darInput  = document.getElementById('ev-phyto-dar');
  const dateInput = document.getElementById('ev-dt');
  const warnDiv   = document.getElementById('dar-inline-warn');
  if (!darInput || !dateInput || !warnDiv) return;

  const darVal  = parseInt(darInput.value);
  const dateVal = dateInput.value;
  if (!darVal || !dateVal) { warnDiv.style.display = 'none'; return; }

  const treatDate = new Date(dateVal);
  const deadline  = new Date(dateVal);
  deadline.setDate(deadline.getDate() + darVal);

  const plants = _getPlants();
  const selId  = _getSelId();
  const plant  = selId ? plants.find(p => p.id === selId) : null;

  let conflict = null;

  if (plant) {
    const rec = plant.events.find(e =>
      e.type === 'récolte' && !e.audit &&
      new Date(e.date) > treatDate &&
      new Date(e.date) < deadline
    );
    if (rec) conflict = { source: '🍊 récolte enregistrée', date: rec.date };

    if (!conflict) {
      const yieldData = _getYieldData();
      const par = (yieldData.parcelles || []).find(p =>
        (p.plantIds || []).includes(plant.id) &&
        p.harvestStart &&
        new Date(p.harvestStart) > treatDate &&
        new Date(p.harvestStart) < deadline
      );
      if (par) conflict = { source: '📅 récolte planifiée', date: par.harvestStart };
    }
  }

  if (conflict) {
    const daysLeft = Math.round((new Date(conflict.date) - treatDate) / 86400000);
    warnDiv.innerHTML = `⚠ DAR non respecté — ${esc(conflict.source)} le ${fmtDate(conflict.date)} (J+${daysLeft}, DAR requis : ${darVal}j)`;
    warnDiv.style.display = 'block';
  } else {
    warnDiv.style.display = 'none';
  }
}

function _getPhytoEvents(filterFrom, filterTo) {
  const from = filterFrom ? new Date(filterFrom) : null;
  const to   = filterTo   ? new Date(filterTo + 'T23:59:59') : null;
  const rows = [];
  const plants    = _getPlants();
  const yieldData = _getYieldData();

  plants.forEach(p => {
    p.events.filter(e => e.type === 'traitement' && !e.audit).forEach(e => {
      const d = new Date(e.date);
      if (from && d < from) return;
      if (to   && d > to)   return;
      let darWarn = false;
      let darDetail = null;
      if (e.phytoDAR) {
        const treatDate = new Date(e.date);
        const deadline  = new Date(e.date);
        deadline.setDate(deadline.getDate() + e.phytoDAR);
        const recordedHarvest = p.events.find(r =>
          r.type === 'récolte' && !r.audit &&
          new Date(r.date) > treatDate &&
          new Date(r.date) < deadline
        );
        if (recordedHarvest) {
          darWarn = true;
          darDetail = { source: 'récolte', date: recordedHarvest.date };
        }
        if (!darWarn) {
          const planned = (yieldData.parcelles || []).find(par =>
            (par.plantIds || []).includes(p.id) &&
            par.harvestStart &&
            new Date(par.harvestStart) > treatDate &&
            new Date(par.harvestStart) < deadline
          );
          if (planned) {
            darWarn = true;
            darDetail = { source: 'planifiée', date: planned.harvestStart };
          }
        }
      }
      rows.push({ ev: e, plant: p, darWarn, darDetail });
    });
  });
  return rows.sort((a, b) => new Date(b.ev.date) - new Date(a.ev.date));
}

function renderProfPhyto() {
  const cfg = getCfg();
  const fromVal = cfg.phytoFilterFrom || '';
  const toVal   = cfg.phytoFilterTo   || '';
  const rows    = _getPhytoEvents(fromVal, toVal);
  const loc     = getLd().locale || 'fr-FR';

  const iftRefHerb = parseFloat(cfg.iftRefHerb) || 3;
  const iftRefHors = parseFloat(cfg.iftRefHors) || 10;
  const iftThreshHerb = iftRefHerb * 0.30;
  const iftThreshHors = iftRefHors * 0.50;

  const allPhytoRows = rows;
  const herbRows = allPhytoRows.filter(r => r.ev.phytoIsHerbicide);
  const horsRows = allPhytoRows.filter(r => !r.ev.phytoIsHerbicide);

  function _calcIFT(rws) {
    if (!rws.length) return null;
    const withDose = rws.filter(r => r.ev.phytoDose);
    if (!withDose.length) return { val: rws.length, simplified: true, n: rws.length };
    const total = withDose.reduce((s,r) => {
      const d = r.ev.phytoDose || 0;
      const dRef = r.ev.phytoDoseRef || d;
      return s + (dRef > 0 ? d / dRef : 1);
    }, 0);
    const surf = Math.max(...withDose.map(r => r.ev.phytoSurface || 1));
    return { val: surf > 0 ? total / surf : total, simplified: withDose.length < rws.length, n: rws.length };
  }

  const iftHerb  = _calcIFT(herbRows);
  const iftHors  = _calcIFT(horsRows);
  const iftTotal = allPhytoRows.length;

  function _iftGauge(ift, thresh, ref, label) {
    if (!ift) return '';
    const v = ift.val;
    const pct = Math.min(v / ref * 100, 100);
    const thPct = thresh / ref * 100;
    const ok = v <= thresh;
    const col = ok ? '#2e7d32' : v <= thresh * 1.5 ? '#e65100' : '#c62828';
    const status = ok ? '✅ HVE4 conforme' : '⚠ Dépasse seuil HVE4';
    const statusCol = ok ? '#2e7d32' : '#c62828';
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
        <span style="font-size:.75rem;font-weight:700;color:var(--text-strong)">${label}</span>
        <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;font-weight:700;color:${col}">${v.toFixed(2)}</span>
      </div>
      <div style="position:relative;height:8px;background:var(--cream3);border-radius:4px;overflow:visible;margin-bottom:3px">
        <div style="height:8px;width:${pct}%;background:${col};border-radius:4px;transition:width .4s"></div>
        <div style="position:absolute;top:-3px;left:${thPct}%;width:2px;height:14px;background:#c62828;border-radius:1px" title="Seuil HVE4 : ${thresh.toFixed(2)}"></div>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:.75rem;color:${statusCol}">${status}</span>
        <span style="font-size:.75rem;color:var(--muted)">Seuil HVE4 : ${thresh.toFixed(2)} · Réf : ${ref}</span>
      </div>
      ${ift.simplified ? '<div style="font-size:.75rem;color:var(--muted);margin-top:2px">⚠ IFT simplifié — renseignez la dose homologuée (réf.) pour un calcul certifiable</div>' : ''}
    </div>`;
  }

  const iftBanner = allPhytoRows.length ? `<div style="background:rgba(21,101,192,.05);border:1px solid rgba(21,101,192,.18);border-radius:9px;padding:10px 14px;margin:8px 14px 4px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:#1565c0;font-weight:700">📊 IFT — Indicateur de Fréquence de Traitement${helpBtn('ift')}</div>
    <button class="btn btn-sm" style="font-size:.75rem;padding:2px 8px" onclick="_openIftRefModal()">⚙ Références</button>
  </div>
  <div style="display:flex;gap:14px;margin-bottom:10px">
    <div><div style="font-size:1.1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:#1565c0">${iftTotal}</div><div style="font-size:.75rem;color:var(--muted);text-transform:uppercase">Passages total</div></div>
    <div><div style="font-size:1.1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--text-accent)">${herbRows.length}</div><div style="font-size:.75rem;color:var(--muted);text-transform:uppercase">Herbicides</div></div>
    <div><div style="font-size:1.1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--amber3)">${horsRows.length}</div><div style="font-size:.75rem;color:var(--muted);text-transform:uppercase">Hors herb.</div></div>
  </div>
  ${_iftGauge(iftHerb, iftThreshHerb, iftRefHerb, '🌿 IFT Herbicides')}
  ${_iftGauge(iftHors, iftThreshHors, iftRefHors, '🔬 IFT Hors herbicides')}
</div>` : '';

  const filterBar = `
<div class="pro-module-hd">
  <div class="pro-module-hd-left">
    <div class="pro-module-hd-title">Registre phytosanitaire</div>
    <div class="pro-module-hd-sub">${rows.length} traitement${rows.length!==1?'s':''} enregistré${rows.length!==1?'s':''}</div>
  </div>
  <div style="display:flex;gap:5px">
    <button class="btn btn-sm" style="font-size:.75rem;background:var(--cream2);color:var(--muted)" onclick="exportPhytoCSV()" title="Export CSV">⬇ CSV</button>
    <button class="btn btn-sm" style="font-size:.7rem;background:rgba(198,40,40,.08);color:#c62828;border:1px solid rgba(198,40,40,.2)" onclick="generatePhytoRegisterPDF()">PDF</button>
  </div>
</div>
<div style="padding:9px 14px 2px;background:var(--cream2);border-bottom:1px solid var(--cream3)">
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <label style="font-size:.7rem;color:var(--muted)">${T('misc.pdfDateFrom')}</label>
    <input type="date" id="phyto-filter-from" value="${fromVal}"
      onchange="setCfg({...getCfg(),phytoFilterFrom:this.value});render()"
      style="font-size:.76rem;border:1px solid var(--cream3);border-radius:6px;padding:4px 8px;background:var(--white)"/>
    <label style="font-size:.7rem;color:var(--muted)">${T('misc.pdfDateTo')}</label>
    <input type="date" id="phyto-filter-to" value="${toVal}"
      onchange="setCfg({...getCfg(),phytoFilterTo:this.value});render()"
      style="font-size:.76rem;border:1px solid var(--cream3);border-radius:6px;padding:4px 8px;background:var(--white)"/>
    ${fromVal||toVal ? `<button class="btn btn-sm" style="font-size:.75rem;padding:3px 8px" onclick="setCfg({...getCfg(),phytoFilterFrom:'',phytoFilterTo:''});render()">${T('misc.phytoFilterAll')}</button>` : ''}
  </div>
</div>`;

  if (!rows.length) {
    return filterBar + `<div style="padding:28px 14px;color:var(--muted);font-style:italic;text-align:center;font-size:.84rem">${T('misc.phytoNone')}<br><span style="font-size:.75rem">Ajoutez un événement Traitement depuis la fiche d'un sujet.</span></div>`;
  }

  const warns = rows.filter(r => r.darWarn);
  const warnBanner = warns.length ? (() => {
    const lines = warns.slice(0,5).map(r => {
      const src = r.darDetail?.source === 'planifiée' ? '📅 récolte planifiée' : '🍊 récolte enregistrée';
      const dt  = r.darDetail?.date ? ' le ' + fmtDate(r.darDetail.date) : '';
      return `<div style="font-size:.75rem;margin-top:2px">${esc(r.plant.name)} · DAR ${r.ev.phytoDAR}j · ${src}${dt}</div>`;
    }).join('');
    const more = warns.length > 5 ? `<div style="font-size:.75rem;margin-top:2px">+${warns.length-5} autre(s)</div>` : '';
    return `<div class="phyto-dar-warn" style="margin:8px 14px 0"><div style="font-weight:700;margin-bottom:3px">⚠ ${T('misc.phytoDARWarning')} — ${warns.length} cas</div>${lines}${more}</div>`;
  })() : '';

  const tableRows = rows.map(r => {
    const e = r.ev, p = r.plant;
    const hasReg = e.phytoProduit || e.phytoAMM;
    const prodCell = hasReg
      ? `<div style="font-size:.78rem;font-weight:600;color:var(--text)">${esc(e.phytoProduit||'—')}</div>${e.phytoAMM ? `<span class="phyto-amm-badge">${esc(e.phytoAMM)}</span>` : ''}`
      : `<span style="font-size:.75rem;color:var(--muted);font-style:italic">${esc(e.description.slice(0, 40))}</span>`;
    const doseCell = [
      e.phytoDose   ? e.phytoDose + ' L/ha' : '',
      e.phytoVolume ? e.phytoVolume + ' L/ha bouillie' : '',
      e.phytoSurface? e.phytoSurface + ' ha' : ''
    ].filter(Boolean).join(' · ') || '—';
    const darCell = e.phytoDAR
      ? `<span style="color:${r.darWarn ? '#c62828' : 'var(--text)'}${r.darWarn ? ';font-weight:700' : ''}">${e.phytoDAR}j${r.darWarn ? ' ⚠' : ''}</span>`
      : '—';
    return `<tr>
      <td style="white-space:nowrap">${new Date(e.date).toLocaleDateString(loc,{day:'numeric',month:'short',year:'2-digit'})}</td>
      <td><div style="font-size:.78rem;font-weight:600">${esc(p.name)}</div>${e.phytoTarget ? `<div style="font-size:.75rem;color:var(--muted)">${esc(e.phytoTarget)}</div>` : ''}</td>
      <td>${prodCell}</td>
      <td style="font-size:.7rem;color:var(--muted)">${doseCell}</td>
      <td>${darCell}</td>
      <td style="font-size:.7rem;color:var(--muted)">${esc(e.phytoOperateur||'—')}</td>
    </tr>`;
  }).join('');

  return filterBar + iftBanner + warnBanner + `
<div style="padding:8px 14px 0;overflow-x:auto">
<table class="phyto-table">
  <thead><tr>
    <th>${T('misc.phytoColDate')}</th>
    <th>${T('misc.phytoColPlant')}</th>
    <th>${T('misc.phytoColProduit')}</th>
    <th>${T('misc.phytoColDose')}</th>
    <th>${T('misc.phytoColDAR')}</th>
    <th>${T('misc.phytoColOp')}</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>
</div>
<div style="padding:10px 14px;display:flex;gap:8px">
  <button class="prof-action-btn pab-neutral" style="flex:1;margin:0" onclick="generatePhytoRegisterPDF()">${T('misc.phytoPDFBtn')}</button>
  <button class="btn btn-sm" style="background:rgba(198,40,40,.1);color:#c62828;font-size:.7rem;flex-shrink:0;white-space:nowrap" onclick="generatePhytoRegisterPDF_AgriMer()" title="Format réglementaire France DGER/AgriMer">📋 FR</button>
  <button class="btn btn-sm" style="background:var(--cream2);color:var(--muted);font-size:.75rem;flex-shrink:0" onclick="exportPhytoCSV()">⬇ CSV</button>
</div>
<div style="height:16px"></div>`;
}

function generatePhytoRegisterPDF() {
  const cfg  = getCfg();
  const rows = _getPhytoEvents(cfg.phytoFilterFrom, cfg.phytoFilterTo);
  const loc  = getLd().locale || 'fr-FR';
  const prof = getProfile();
  const today = new Date().toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  const periodLabel = (cfg.phytoFilterFrom || cfg.phytoFilterTo)
    ? `${T('misc.pdfDateFrom')} ${cfg.phytoFilterFrom ? new Date(cfg.phytoFilterFrom).toLocaleDateString(loc,{day:'numeric',month:'long',year:'numeric'}) : '—'} ${T('misc.pdfDateTo')} ${cfg.phytoFilterTo ? new Date(cfg.phytoFilterTo).toLocaleDateString(loc,{day:'numeric',month:'long',year:'numeric'}) : today}`
    : T('misc.phytoFilterAll');

  const tableRows = rows.map(r => {
    const e = r.ev, p = r.plant;
    return `<tr style="${r.darWarn ? 'background:rgba(198,40,40,.04)' : ''}">
      <td style="white-space:nowrap">${new Date(e.date).toLocaleDateString(loc,{day:'numeric',month:'short',year:'numeric'})}</td>
      <td><strong>${esc(p.name)}</strong>${p.species ? `<br><span style="font-style:italic;color:#888">${esc(p.species)}</span>` : ''}</td>
      <td>${esc(e.phytoProduit||'—')}${e.phytoAMM ? `<br><span style="font-size:.75rem;background:rgba(198,40,40,.08);color:#c62828;padding:1px 5px;border-radius:3px;font-family:monospace">AMM ${esc(e.phytoAMM)}</span>` : ''}</td>
      <td style="font-size:.78rem">${e.phytoDose ? e.phytoDose + ' L/ha' : '—'}</td>
      <td style="font-size:.78rem">${e.phytoVolume ? e.phytoVolume + ' L/ha' : '—'}</td>
      <td style="font-size:.78rem">${e.phytoSurface ? e.phytoSurface + ' ha' : '—'}</td>
      <td style="${r.darWarn ? 'color:#c62828;font-weight:700' : ''}">${e.phytoDAR ? e.phytoDAR + 'j' + (r.darWarn ? ' ⚠' : '') : '—'}</td>
      <td style="font-size:.78rem">${esc(e.phytoJustif||'—')}</td>
      <td style="font-size:.78rem">${esc(e.phytoTarget||'—')}</td>
      <td style="font-size:.78rem">${esc(e.phytoOperateur||'—')}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="${getLang()}"><head><meta charset="utf-8">
<title>${T('misc.phytoRegTitle')}</title>
${_pdfStyles()}
<style>
.reg-table{width:100%;border-collapse:collapse;font-size:.75rem;margin-top:12px}
.reg-table th{background:rgba(198,40,40,.1);color:#c62828;font-family:monospace;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em;padding:6px 7px;text-align:left;border-bottom:2px solid rgba(198,40,40,.2);white-space:nowrap}
.reg-table td{padding:5px 7px;border-bottom:1px solid #f0f0f0;vertical-align:top}
.reg-table tr:nth-child(even) td{background:#fafafa}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body><div class="pdf-page">
<div class="pdf-header">
  <h1>${T('misc.phytoRegTitle')}</h1>
  <div class="pdf-sub">${prof.name ? esc(prof.name) + ' · ' : ''}${periodLabel} · ${T('misc.pdfGeneratedOn')} ${today}</div>
</div>
<div class="pdf-section">
  <div class="pdf-section-title">${rows.length} traitement${rows.length > 1 ? 's' : ''} enregistré${rows.length > 1 ? 's' : ''}</div>
  ${rows.length ? `
  <table class="reg-table">
    <thead><tr>
      <th>${T('misc.phytoColDate')}</th>
      <th>${T('misc.phytoColPlant')}</th>
      <th>${T('misc.phytoColProduit')}</th>
      <th>${T('misc.phytoDose')}</th>
      <th>${T('misc.phytoVolume')}</th>
      <th>${T('misc.phytoSurface')}</th>
      <th>${T('misc.phytoColDAR')}</th>
      <th>${T('misc.phytoJustif')}</th>
      <th>${T('misc.phytoTarget')}</th>
      <th>${T('misc.phytoColOp')}</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>` : `<div style="color:#999;font-style:italic;padding:12px 0">${T('misc.phytoNone')}</div>`}
</div>
<div style="margin:20px 28px;padding:10px 14px;background:#fff8f8;border:1px solid rgba(198,40,40,.2);border-radius:6px;font-size:.75rem;color:#888;line-height:1.55;font-style:italic">
  ${T('misc.phytoLegalNote')}
</div>
${_pdfFooter()}
</div></body></html>`;

  _pdfOpen(html);
}

function generatePhytoRegisterPDF_AgriMer() {
  const cfg  = getCfg();
  const rows = _getPhytoEvents(cfg.phytoFilterFrom, cfg.phytoFilterTo);
  const loc  = getLd().locale || 'fr-FR';
  const prof = getProfile();
  const today = new Date().toLocaleDateString(loc, { day:'numeric', month:'long', year:'numeric' });
  const periodLabel = (cfg.phytoFilterFrom||cfg.phytoFilterTo)
    ? `Du ${cfg.phytoFilterFrom?new Date(cfg.phytoFilterFrom).toLocaleDateString(loc,{day:'numeric',month:'long',year:'numeric'}):'—'} au ${cfg.phytoFilterTo?new Date(cfg.phytoFilterTo).toLocaleDateString(loc,{day:'numeric',month:'long',year:'numeric'}):today}`
    : 'Toutes les dates';

  const tableRows = rows.map((r,idx) => {
    const e=r.ev, p=r.plant;
    const dateStr=new Date(e.date).toLocaleDateString(loc,{day:'2-digit',month:'2-digit',year:'numeric'});
    const darWarn=r.darWarn;
    return `<tr style="${darWarn?'background:rgba(198,40,40,.05)':idx%2===0?'':'background:#fafafa'}">
      <td class="c">${idx+1}</td>
      <td style="white-space:nowrap">${dateStr}</td>
      <td><em>${esc(p.species||'—')}</em></td>
      <td style="font-size:.75rem">${esc(p.location||p.name||'—')}</td>
      <td style="font-size:.7rem;background:rgba(198,40,40,.04)">${esc(e.phytoAMM||'—')}</td>
      <td><strong>${esc(e.phytoProduit||'—')}</strong></td>
      <td style="font-size:.75rem;color:#555">${esc(e.phytoMA||'—')}</td>
      <td class="c">${e.phytoDose?e.phytoDose+' L/ha':'—'}</td>
      <td class="c">${e.phytoVolume?e.phytoVolume+' L/ha':'—'}</td>
      <td class="c">${e.phytoSurface?e.phytoSurface+' ha':'—'}</td>
      <td style="font-size:.7rem">${esc(e.phytoTarget||'—')}</td>
      <td class="c" style="${darWarn?'color:#c62828;font-weight:700':''}">${e.phytoDAR?e.phytoDAR+'j'+(darWarn?' ⚠':''):'—'}</td>
      <td style="font-size:.75rem">${esc(e.phytoJustif||'—')}</td>
      <td style="font-size:.75rem">${esc(e.phytoOperateur||prof.name||'—')}</td>
    </tr>`;
  }).join('');

  const html=`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Registre phytosanitaire — Format réglementaire</title>
${_pdfStyles()}
<style>
body{font-size:11px}
.reg-table{width:100%;border-collapse:collapse;font-size:.75rem;margin-top:10px;table-layout:auto}
.reg-table th{background:#b71c1c;color:white;font-family:monospace;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;padding:5px 5px;text-align:left;border:1px solid #7f0000;white-space:nowrap}
.reg-table td{padding:4px 5px;border:1px solid #e8e8e8;vertical-align:top;line-height:1.3}
.reg-table tr:nth-child(even) td{background:#fafafa}
.c{text-align:center}
.legal-box{margin:16px 28px;padding:10px 14px;border:1.5px solid #b71c1c;border-radius:5px;font-size:.75rem;color:#555;line-height:1.6;background:#fff8f8}
.legal-box strong{color:#b71c1c}
.sign-block{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:18px 28px 0;font-size:.75rem}
.sign-box{border:1px solid #ddd;border-radius:5px;padding:10px 12px;min-height:60px}
.sign-lbl{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#999;font-family:monospace;margin-bottom:6px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.reg-table th{background:#b71c1c!important;color:white!important}}
</style>
</head><body>
<div class="pdf-page" style="padding:0">
<div class="pdf-header" style="background:#7f0000">
  <h1>📋 Registre des Traitements Phytosanitaires</h1>
  <div class="pdf-sub" style="margin-top:4px">Format réglementaire — Décret n°2016-1595 · ${esc(prof.name||'Exploitation')} · ${periodLabel}</div>
</div>

<div style="margin:12px 28px 0;padding:8px 12px;background:#fff3e0;border:1px solid #e65100;border-radius:5px;font-size:.75rem;color:#e65100;line-height:1.5">
  <strong>⚠ Document de traçabilité obligatoire.</strong> Conserver 5 ans minimum (Art. L.254-6-1 C. Rural). Ce registre doit être tenu à disposition lors des contrôles officiels Phytosanitaires.
</div>

<div style="margin:8px 28px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
  <div class="pdf-field"><div class="pdf-field-lbl">Exploitant / Responsable</div><div class="pdf-field-val">${esc(prof.name||'—')}</div></div>
  <div class="pdf-field"><div class="pdf-field-lbl">Localisation exploitation</div><div class="pdf-field-val">${esc(prof.loc||'—')}</div></div>
  <div class="pdf-field"><div class="pdf-field-lbl">Période couverte</div><div class="pdf-field-val">${periodLabel}</div></div>
</div>

<div style="padding:0 28px">
<table class="reg-table">
<thead><tr>
  <th>#</th>
  <th>Date application</th>
  <th>Culture / Espèce</th>
  <th>Parcelle / Emplacement</th>
  <th>N° AMM</th>
  <th>Dénomination commerciale</th>
  <th>Matière(s) active(s)</th>
  <th>Dose appliquée</th>
  <th>Volume bouillie</th>
  <th>Surface traitée</th>
  <th>Cible (organisme nuisible)</th>
  <th>DAR (j)</th>
  <th>Justification</th>
  <th>Opérateur / Applicateur</th>
</tr></thead>
<tbody>${tableRows||`<tr><td colspan="14" style="text-align:center;color:#999;font-style:italic;padding:14px">Aucun traitement enregistré pour la période sélectionnée.</td></tr>`}</tbody>
</table>
</div>

<div class="legal-box" style="margin-top:16px">
  <strong>Références réglementaires :</strong> Art. L.254-6-1 et R.254-22 à R.254-24 du Code Rural et de la Pêche Maritime ·
  Décret n°2016-1595 du 25/11/2016 · Arrêté du 4 mai 2017 (registre des traitements phytosanitaires) ·
  Règlement (CE) n°1107/2009 (mise sur le marché produits phyto) ·
  Données Agri'Mieux DGER — Indicateur IFT.<br>
  <strong>Champs AMM :</strong> Numéro d'Autorisation de Mise sur le Marché obligatoire pour tout produit homologué (source e-phy.anses.fr).
</div>

<div class="sign-block">
  <div class="sign-box"><div class="sign-lbl">Responsable exploitation</div><div style="margin-top:20px;border-bottom:1px solid #ddd"></div><div style="font-size:.75rem;color:#bbb;margin-top:3px">Signature / Date</div></div>
  <div class="sign-box"><div class="sign-lbl">Conseiller phytosanitaire</div><div style="margin-top:20px;border-bottom:1px solid #ddd"></div><div style="font-size:.75rem;color:#bbb;margin-top:3px">Signature / Date</div></div>
  <div class="sign-box"><div class="sign-lbl">Contrôleur officiel</div><div style="margin-top:20px;border-bottom:1px solid #ddd"></div><div style="font-size:.75rem;color:#bbb;margin-top:3px">Visa / Date contrôle</div></div>
</div>

${_pdfFooter()}
</div>
<script>window.onload=()=>{document.title='Registre_Phyto_AgriMer_${new Date().getFullYear()}';window.print();};<\/script>
</body></html>`;

  _pdfOpen(html);
}

function exportPhytoCSV() {
  const cfg = getCfg();
  const rows = _getPhytoEvents(cfg.phytoFilterFrom||'', cfg.phytoFilterTo||'');
  if (!rows.length) { toast('Aucun traitement à exporter', true); return; }
  const headers = ['Date','Sujet','Espèce','Produit','N° AMM','Dose (L/ha)','Volume bouillie (L/ha)','Surface (ha)','DAR (j)','Cible','Justification','Opérateur','Alerte DAR'];
  const csvRows = rows.map(r => {
    const e = r.ev, p = r.plant;
    return [
      e.date||'',
      (p.name||'').replace(/[";]/g,' '),
      (p.species||'').replace(/[";]/g,' '),
      (e.phytoProduit||'').replace(/[";]/g,' '),
      e.phytoAMM||'',
      e.phytoDose||'',
      e.phytoVolume||'',
      e.phytoSurface||'',
      e.phytoDAR||'',
      (e.phytoTarget||'').replace(/[";]/g,' '),
      (e.phytoJustif||'').replace(/[";]/g,' '),
      (e.phytoOperateur||'').replace(/[";]/g,' '),
      r.darWarn ? 'OUI' : ''
    ].map(v=>`"${v}"`).join(',');
  });
  const csv = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registre_phyto_${todayStr()}.csv`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);}, 1000);
  toast('Export CSV registre phyto téléchargé ✓');
}

window._checkDARInForm              = _checkDARInForm;
window._getPhytoEvents              = _getPhytoEvents;
window.renderProfPhyto              = renderProfPhyto;
window.generatePhytoRegisterPDF     = generatePhytoRegisterPDF;
window.generatePhytoRegisterPDF_AgriMer = generatePhytoRegisterPDF_AgriMer;
window.exportPhytoCSV               = exportPhytoCSV;
