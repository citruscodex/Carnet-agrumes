import { esc } from '../lib/esc.js';

const T       = k => window.T?.(k) ?? k;
const getLd   = () => window.getLd?.() ?? {};
const fmtDate = v => window.fmtDate?.(v) ?? '';
const getCfg  = () => window.getCfg?.() ?? {};
const getProfile = () => window.getProfile?.() ?? {};
const getAmendById  = id => window.getAmendById?.(id);
const getFertById   = id => window.getFertById?.(id);
const helpBtn       = k  => window.helpBtn?.(k) ?? '';
const fertNPKBadges = f  => window.fertNPKBadges?.(f) ?? '';
const getEpandageEntries = () => window.getEpandageEntries?.() ?? [];
const sumAppliedNPK = p  => window.sumAppliedNPK?.(p) ?? {N:0,P:0,K:0};
const annualNPK     = p  => window.annualNPK?.(p) ?? {N:0,P:0,K:0};
const getSpeciesKB  = sp => window.getSpeciesKB?.(sp);

let _ctx = {};

// ─── Stock helpers ────────────────────────────────────────────────────────────

function _stockUnitLabel(unit) {
  return {kg:T('misc.stockUnitKg'),L:T('misc.stockUnitL'),g:T('misc.stockUnitG'),unité:T('misc.stockUnitUnit')}[unit]||unit||'';
}

function _stockTypeLabel(type) {
  return {fert:T('misc.stockTypeFert'),amend:T('misc.stockTypeAmend'),phyto:T('misc.stockTypePhyto'),autre:T('misc.stockTypeAutre')}[type]||type||'';
}

function _stockBadge(item) {
  const cur = item.currentQty || 0;
  const thr = item.alertQty;
  if (cur <= 0)                  return {cls:'stock-badge-empty', lbl:T('misc.stockEmpty')};
  if (thr != null && cur <= thr) return {cls:'stock-badge-low',   lbl:T('misc.stockLow')};
  return {cls:'stock-badge-ok', lbl:T('misc.stockOk')};
}

function _stockQtyColor(item) {
  const b = _stockBadge(item);
  return b.cls === 'stock-badge-ok' ? '#2e7d32' : b.cls === 'stock-badge-low' ? '#e65100' : '#c62828';
}

// ─── Fert profiles ────────────────────────────────────────────────────────────

function renderFertProfiles() {
  const { fertilizers } = _ctx;
  return`<div style="font-size:.8rem;color:var(--muted);margin-bottom:14px;line-height:1.5">Vos profils d'engrais sont sélectionnables lors de chaque événement "fertilisation". Modifiez-les librement selon votre pratique.</div>
${fertilizers.map(f=>renderFertCard(f)).join('')}
<button class="btn btn-p" style="width:100%;margin-top:4px" onclick="openAddFert()">${T('misc.fertNewBtn')}</button>`;
}

function renderFertCard(f) {
  return`<div class="fp-card">
<div class="fp-card-head">
  <div><div class="fp-name">${esc(f.name)}</div><div class="fp-type">${esc(f.type)} · ${esc(f.action)}</div></div>
  <div style="width:14px;height:14px;border-radius:50%;background:${f.color};flex-shrink:0;margin-top:3px"></div>
</div>
<div class="fp-npk-row">
  <div class="fp-elem N"><div class="fp-elem-val">${f.N}</div><div class="fp-elem-lbl">N</div></div>
  <div class="fp-elem P"><div class="fp-elem-val">${f.P}</div><div class="fp-elem-lbl">P</div></div>
  <div class="fp-elem K"><div class="fp-elem-val">${f.K}</div><div class="fp-elem-lbl">K</div></div>
  ${f.Ca?`<div class="fp-elem Ca"><div class="fp-elem-val">${f.Ca}</div><div class="fp-elem-lbl">Ca</div></div>`:''}
  ${f.Mg?`<div class="fp-elem Mg"><div class="fp-elem-val">${f.Mg}</div><div class="fp-elem-lbl">Mg</div></div>`:''}
</div>
${f.notes?`<div class="fp-notes">${esc(f.notes)}</div>`:''}
<div class="fp-btns">
  <button class="btn btn-p btn-sm" onclick="openEditFert('${f.id}')">✏ Modifier</button>
  <button class="btn btn-d btn-sm" onclick="deleteFert('${f.id}')">Supprimer</button>
</div>
</div>`;
}

// ─── Amendment profiles ───────────────────────────────────────────────────────

function renderAmendProfiles() {
  const { amendments } = _ctx;
  return`<div style="font-size:.8rem;color:var(--muted);margin-bottom:14px;line-height:1.5">Les amendements modifient les propriétés physiques ou chimiques du substrat (pH, structure, drainage). Ils s'ajoutent en supplément des engrais NPK lors d'un événement fertilisation.</div>
${amendments.map(a=>renderAmendCard(a)).join('')}
<button class="btn btn-p" style="width:100%;margin-top:4px" onclick="openAddAmend()">${T('misc.fertAmendNewBtn')}</button>`;
}

function renderAmendCard(a) {
  const compBadges=[];
  if(a.N)compBadges.push(`<span class="npk-badge" style="background:rgba(45,90,61,.12);color:#2d5a3d">N${a.N}</span>`);
  if(a.P)compBadges.push(`<span class="npk-badge" style="background:rgba(232,148,26,.12);color:#c97d14">P${a.P}</span>`);
  if(a.K)compBadges.push(`<span class="npk-badge" style="background:rgba(21,101,192,.12);color:#1565c0">K${a.K}</span>`);
  if(a.Ca)compBadges.push(`<span class="npk-badge" style="background:rgba(139,69,19,.1);color:#7a4e2d">Ca${a.Ca}</span>`);
  if(a.Mg)compBadges.push(`<span class="npk-badge" style="background:rgba(74,124,89,.1);color:#4a7c59">Mg${a.Mg}</span>`);
  if(a.S)compBadges.push(`<span class="npk-badge" style="background:rgba(232,225,26,.15);color:#9a7c00">S${a.S}</span>`);
  if(a.C)compBadges.push(`<span class="npk-badge" style="background:rgba(100,72,30,.12);color:#64481e">C${a.C}</span>`);
  return`<div class="fp-card" style="border-left:3px solid var(--terra)">
<div class="fp-card-head">
  <div><div class="fp-name">${esc(a.name)}</div><div class="fp-type">${esc(a.type)}</div></div>
  <span class="amend-badge">🪨</span>
</div>
${compBadges.length?`<div class="fp-npk-row" style="margin-bottom:6px">${compBadges.join('')}</div>`:''}
${a.notes?`<div class="fp-notes">${esc(a.notes)}</div>`:''}
<div class="fp-btns">
  <button class="btn btn-p btn-sm" onclick="openEditAmend('${a.id}')">✏ Modifier</button>
  <button class="btn btn-d btn-sm" onclick="deleteAmend('${a.id}')">Supprimer</button>
</div>
</div>`;
}

// ─── Stocks tab ───────────────────────────────────────────────────────────────

function renderStocksTab() {
  const { fertilizers, amendments, stockData } = _ctx;
  const items = stockData.items;
  if (!items.length) {
    return `<div style="padding:20px 14px;text-align:center;color:var(--muted);font-style:italic">${T('misc.stockNoData')}</div>
<button class="btn btn-p" style="width:calc(100% - 28px);margin:0 14px" onclick="openStockModal(null)">${T('misc.stockNewBtn')}</button>`;
  }

  const cards = items.map(item => {
    const badge    = _stockBadge(item);
    const cur      = item.currentQty || 0;
    const thr      = item.alertQty || 0;
    const maxBar   = Math.max(cur, thr * 2, 1);
    const pct      = Math.min(100, Math.round((cur / maxBar) * 100));
    const barColor = _stockQtyColor(item);
    const linked   = item.linkedId
      ? (item.type === 'fert'  ? fertilizers.find(f => f.id === item.linkedId)
       : item.type === 'amend' ? amendments.find(a  => a.id === item.linkedId)
       : null)
      : null;
    const linkedLabel = linked ? esc(linked.name) : (item.linkedName ? esc(item.linkedName) : '');

    const movs = (item.movements || []).slice(0, 3);
    const movHtml = movs.length ? `<div style="margin-top:8px;border-top:1px solid var(--cream3);padding-top:6px">
${movs.map(m => `<div class="stock-mov-row">
  <div class="stock-mov-dot" style="background:${m.type==='in'?'#2e7d32':'#c62828'}"></div>
  <div class="stock-mov-date">${fmtDate(m.date)}</div>
  <div class="stock-mov-qty" style="color:${m.type==='in'?'#2e7d32':'#c62828'}">${m.type==='in'?'+':'-'}${m.qty} ${_stockUnitLabel(item.unit)}</div>
  <div class="stock-mov-note">${esc(m.note||'')}</div>
</div>`).join('')}
</div>` : '';

    return `<div class="stock-card">
  <div class="stock-card-header" onclick="openStockModal('${item.id}')">
    <div>
      <div class="stock-card-name">${esc(item.name)}</div>
      <div class="stock-card-type">${_stockTypeLabel(item.type)}${linkedLabel ? ' · ' + linkedLabel : ''}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${barColor}">${cur} ${_stockUnitLabel(item.unit)}</div>
      <span class="stock-badge ${badge.cls}">${badge.lbl}</span>
    </div>
  </div>
  <div class="stock-qty-bar">
    <div class="stock-qty-fill" style="width:${pct}%;background:${barColor}"></div>
  </div>
  ${thr ? `<div class="stock-linked">⚠ seuil : ${thr} ${_stockUnitLabel(item.unit)}</div>` : ''}
  ${movHtml}
  <button class="btn btn-sm" style="margin-top:8px;font-size:.7rem;width:100%;background:var(--cream2);color:var(--text-strong)"
    onclick="event.stopPropagation();openStockMovModal('${item.id}')">+ ${T('misc.stockMovAddBtn')}</button>
</div>`;
  }).join('');

  return `<div style="padding:8px 14px 0;display:flex;justify-content:flex-end">
  <button class="btn btn-p" style="font-size:.76rem;padding:5px 12px" onclick="openStockModal(null)">${T('misc.stockNewBtn')}</button>
</div>
<div style="padding:8px 14px 20px">${cards}</div>`;
}

// ─── PPF ──────────────────────────────────────────────────────────────────────

function renderPPF() {
  const { plants } = _ctx;
  const cfg      = getCfg();
  const surfaces = cfg.ppfSurfaces || {};
  const campYear = cfg.ppfYear || new Date().getFullYear();
  const loc      = getLd().locale || 'fr-FR';
  const PRO_PROFILES = window.PRO_PROFILES ?? [];
  const isPro    = PRO_PROFILES.includes((getProfile().profileType)||'collectionneur');
  if (!isPro) return '<div style="padding:20px;color:var(--muted);text-align:center">Disponible pour les profils Pro.</div>';

  const rows = plants.map(p => {
    const target  = annualNPK(p);
    const applied = sumAppliedNPK(p);
    const surf    = parseFloat(surfaces[p.id]) || null;
    const kb      = getSpeciesKB(p.species);
    const noteNPK = kb?.npk?.note || '';
    const solde   = {
      N: Math.round((applied.N - target.N) * 10) / 10,
      P: Math.round((applied.P - target.P) * 10) / 10,
      K: Math.round((applied.K - target.K) * 10) / 10,
    };
    const status =
      (applied.N === 0 && applied.P === 0 && applied.K === 0) ? 'none' :
      (solde.N >= 0 && solde.P >= 0 && solde.K >= 0) ? 'ok' :
      (solde.N < -target.N * 0.5 || solde.P < -target.P * 0.5 || solde.K < -target.K * 0.5) ? 'deficit' :
      'partial';
    return { p, target, applied, solde, surf, noteNPK, status };
  });

  const tot = rows.reduce((acc, r) => {
    acc.tN += r.target.N;  acc.tP += r.target.P;  acc.tK += r.target.K;
    acc.aN += r.applied.N; acc.aP += r.applied.P; acc.aK += r.applied.K;
    return acc;
  }, {tN:0,tP:0,tK:0,aN:0,aP:0,aK:0});

  function _soldeChip(v, ref) {
    if (v === 0) return `<span style="color:var(--muted)">0</span>`;
    const col = v >= 0 ? '#2e7d32' : (Math.abs(v) > ref * 0.5 ? '#c62828' : '#e65100');
    return `<span style="color:${col};font-weight:700">${v > 0 ? '+' : ''}${v}</span>`;
  }

  function _npkBar(applied, target, key, col) {
    if (!target[key]) return '<span style="color:var(--muted);font-size:.75rem">—</span>';
    const pct = Math.min(Math.round(applied[key] / target[key] * 100), 150);
    const barCol = pct >= 100 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
    return `<div style="display:flex;align-items:center;gap:4px">
      <div style="width:36px;height:5px;background:var(--cream3);border-radius:3px;overflow:hidden;flex-shrink:0">
        <div style="width:${Math.min(pct,100)}%;height:5px;background:${barCol};border-radius:3px"></div>
      </div>
      <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:${barCol}">${applied[key]}/${target[key]}g</span>
    </div>`;
  }

  const statusIcon  = {ok:'✅',partial:'🟡',deficit:'🔴',none:'⬜'};
  const statusLabel = {ok:'Couvert',partial:'Partiel',deficit:'Déficit',none:'Non renseigné'};

  const tableRows = rows.map(r => `
    <tr style="border-bottom:1px solid var(--cream3)">
      <td style="padding:6px 8px">
        <div style="font-size:.78rem;font-weight:600;color:var(--text-strong)">${esc(r.p.name)}</div>
        <div style="font-size:.75rem;color:var(--muted);font-style:italic">${esc(r.p.species||'—')}</div>
        ${r.noteNPK ? `<div style="font-size:.75rem;color:var(--muted);margin-top:1px">${esc(r.noteNPK.slice(0,60))}${r.noteNPK.length>60?'…':''}</div>` : ''}
      </td>
      <td style="padding:6px 4px;text-align:center">
        <input type="number" min="0" step="0.01" placeholder="ha"
          value="${r.surf||''}"
          oninput="_ppfSetSurface('${r.p.id}',this.value)"
          style="width:60px;padding:3px 5px;border:1px solid var(--cream3);border-radius:5px;font-size:.75rem;text-align:center"/>
      </td>
      <td style="padding:4px 8px">
        <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--text-accent)">N ${r.target.N}g</div>
        <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--amber3)">P ${r.target.P}g</div>
        <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--blue)">K ${r.target.K}g</div>
      </td>
      <td style="padding:4px 8px">
        ${_npkBar(r.applied, r.target, 'N', '#2d5a3d')}
        ${_npkBar(r.applied, r.target, 'P', '#e8941a')}
        ${_npkBar(r.applied, r.target, 'K', '#1565c0')}
      </td>
      <td style="padding:6px 8px;text-align:center">
        <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace">
          N ${_soldeChip(r.solde.N, r.target.N)}<br>
          P ${_soldeChip(r.solde.P, r.target.P)}<br>
          K ${_soldeChip(r.solde.K, r.target.K)}
        </div>
      </td>
      <td style="padding:6px 8px;text-align:center">
        <span style="font-size:.7rem">${statusIcon[r.status]||'⬜'}</span>
        <div style="font-size:.75rem;color:var(--muted)">${statusLabel[r.status]||''}</div>
      </td>
    </tr>`).join('');

  return `
<div style="padding:0 0 20px">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px 6px">
    <div>
      <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--text-accent);font-weight:700">📋 Plan Prévisionnel de Fumure${helpBtn('ppf')}</div>
      <div style="font-size:.75rem;color:var(--muted);margin-top:2px">Campagne
        <select onchange="setCfg({...getCfg(),ppfYear:parseInt(this.value)});render()"
          style="font-size:.75rem;border:none;background:transparent;color:var(--text-accent);font-weight:700;cursor:pointer">
          ${[campYear-1,campYear,campYear+1].map(y=>`<option value="${y}"${y===campYear?' selected':''}>${y}</option>`).join('')}
        </select>
      </div>
    </div>
    <button class="btn btn-sm" style="font-size:.75rem;background:rgba(198,40,40,.08);color:#c62828;border:1px solid rgba(198,40,40,.2)"
      onclick="_ppfPDF(${campYear})">📄 PDF</button>
  </div>

  <div style="display:flex;gap:8px;padding:0 14px 10px;flex-wrap:wrap">
    ${[
      {k:'N',col:'#2d5a3d', t:Math.round(tot.tN), a:Math.round(tot.aN)},
      {k:'P',col:'#e8941a', t:Math.round(tot.tP), a:Math.round(tot.aP)},
      {k:'K',col:'#1565c0', t:Math.round(tot.tK), a:Math.round(tot.aK)},
    ].map(e=>{
      const pct=e.t?Math.min(Math.round(e.a/e.t*100),150):0;
      const col=pct>=100?'#2e7d32':pct>=50?'#e65100':'#c62828';
      return `<div style="flex:1;min-width:90px;background:var(--cream2);border-radius:9px;padding:8px 10px">
        <div style="font-size:.75rem;font-weight:700;color:${e.col};text-transform:uppercase;letter-spacing:.07em">${e.k} total</div>
        <div style="font-size:1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${col}">${e.a}g</div>
        <div style="font-size:.75rem;color:var(--muted)">/ ${e.t}g visé · ${e.t?pct+'%':'—'}</div>
        <div style="height:4px;background:var(--cream3);border-radius:2px;margin-top:4px;overflow:hidden">
          <div style="width:${Math.min(pct,100)}%;height:4px;background:${col};border-radius:2px"></div>
        </div>
      </div>`;
    }).join('')}
  </div>

  <div style="padding:0 14px 6px;font-size:.75rem;color:var(--muted);line-height:1.6">
    Besoins calculés sur 12 mois glissants via la base de connaissances espèces + taille de pot/culture en pleine terre.
    Renseignez la surface (ha) pour un PPF certifiable. Solde = apporté − besoin.
  </div>

  <div style="overflow-x:auto;padding:0 14px">
    <table style="width:100%;border-collapse:collapse;font-size:.76rem">
      <thead>
        <tr style="border-bottom:2px solid var(--cream3)">
          <th style="text-align:left;padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Sujet / Espèce</th>
          <th style="padding:6px 4px;font-size:.75rem;color:var(--muted);font-weight:600">Surface<br><span style="font-weight:400">ha</span></th>
          <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Besoin<br>N/P/K</th>
          <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Apporté<br>(12 mois)</th>
          <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600;text-align:center">Solde</th>
          <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600;text-align:center">Statut</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <div style="margin:12px 14px 0;background:rgba(21,101,192,.05);border-left:3px solid rgba(21,101,192,.3);padding:7px 10px;border-radius:0 6px 6px 0;font-size:.75rem;color:var(--muted);line-height:1.5">
    ℹ Ce PPF est établi à titre indicatif. Pour une démarche certifiée (AB, HVE, GlobalGAP), faites valider par un conseiller agréé.
    Les besoins N/P/K sont calculés d'après les références INRAE/CTIFL pour agrumes.
  </div>
</div>`;
}

// ─── Épandage ─────────────────────────────────────────────────────────────────

function renderEpandage() {
  const { plants } = _ctx;
  const entries  = getEpandageEntries();
  const cfg      = getCfg();
  const surfaces = cfg.ppfSurfaces || {};
  const loc      = getLd().locale || 'fr-FR';
  const PRO_PROFILES = window.PRO_PROFILES ?? [];
  const EPANDAGE_TYPES = window.EPANDAGE_TYPES ?? [];
  const isPro    = PRO_PROFILES.includes((getProfile().profileType)||'collectionneur');
  if (!isPro) return '<div style="padding:20px;color:var(--muted);text-align:center">Disponible pour les profils Pro.</div>';

  const typeMap   = Object.fromEntries(EPANDAGE_TYPES.map(t => [t.id, t]));
  const campYear  = cfg.ppfYear || new Date().getFullYear();
  const campFrom  = new Date(campYear + '-01-01');
  const campTo    = new Date(campYear + '-12-31');

  const campEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d >= campFrom && d <= campTo;
  });

  const byType = {};
  campEntries.forEach(e => {
    if (!byType[e.matiere]) byType[e.matiere] = {n:0, dose:0};
    byType[e.matiere].n++;
    byType[e.matiere].dose += parseFloat(e.dose)||0;
  });

  const kpiHtml = Object.entries(byType).map(([tid, v]) => {
    const t = typeMap[tid]||{icon:'⬜',label:tid,unit:''};
    return `<div style="flex:1;min-width:90px;background:var(--cream2);border-radius:9px;padding:8px 10px">
      <div style="font-size:.75rem;font-weight:700;color:var(--text-accent)">${t.icon} ${t.label}</div>
      <div style="font-size:1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--text-strong)">${v.dose.toFixed(1)}</div>
      <div style="font-size:.75rem;color:var(--muted)">${t.unit} · ${v.n} apport${v.n>1?'s':''}</div>
    </div>`;
  }).join('');

  const rows = entries.map(e => {
    const t    = typeMap[e.matiere]||{icon:'⬜',label:e.matiere||'—',unit:''};
    const p    = plants.find(pl => pl.id === e.plantId);
    const surf = e.surface || (p ? parseFloat(surfaces[p.id])||null : null);
    const znt  = e.zntDist ? (e.zntDist < 5 ? '🔴' : e.zntDist < 10 ? '🟡' : '✅') : '—';
    return `<tr style="border-bottom:1px solid var(--cream3)">
      <td style="padding:6px 8px;font-size:.76rem">${e.date}</td>
      <td style="padding:6px 8px;font-size:.78rem;font-weight:600">${t.icon} ${t.label}</td>
      <td style="padding:6px 8px;font-size:.76rem">${p ? esc(p.name) : esc(e.parcelleLabel||'—')}</td>
      <td style="padding:6px 8px;font-size:.76rem;text-align:right;font-family:'JetBrains Mono',monospace">${e.dose||'—'} ${t.unit}</td>
      <td style="padding:6px 8px;font-size:.76rem;text-align:center">${surf ? surf+' ha' : '—'}</td>
      <td style="padding:6px 8px;font-size:.76rem;text-align:center">${znt} ${e.zntDist ? e.zntDist+'m' : ''}</td>
      <td style="padding:6px 8px;font-size:.75rem;color:var(--muted)">${esc((e.notes||'').slice(0,40))}${(e.notes||'').length>40?'…':''}</td>
      <td style="padding:6px 4px;text-align:center">
        <button class="btn btn-sm" style="font-size:.75rem;padding:2px 7px" onclick="_openEpandageModal('${e.id}')">✏</button>
        <button class="btn btn-sm" style="font-size:.75rem;padding:2px 7px;color:#c62828;background:rgba(198,40,40,.08)"
          onclick="if(confirm('Supprimer cet apport ?')){deleteEpandageEntry('${e.id}');render();}">✕</button>
      </td>
    </tr>`;
  }).join('');

  return `<div style="padding:0 0 20px">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px 6px">
      <div>
        <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--text-accent);font-weight:700">🪣 Cahier d'épandage${helpBtn('epandage')}</div>
        <div style="font-size:.75rem;color:var(--muted);margin-top:2px">Campagne ${campYear} · ${campEntries.length} apport${campEntries.length>1?'s':''} enregistré${campEntries.length>1?'s':''}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm" style="font-size:.75rem;background:rgba(198,40,40,.08);color:#c62828;border:1px solid rgba(198,40,40,.2)"
          onclick="_epandagePDF(${campYear})">📄 PDF</button>
        <button class="btn btn-sm" style="font-size:.75rem" onclick="_openEpandageModal(null)">+ Apport</button>
      </div>
    </div>

    ${campEntries.length ? `<div style="display:flex;gap:8px;padding:0 14px 10px;flex-wrap:wrap">${kpiHtml}</div>` : ''}

    <div style="margin:0 14px 10px;background:rgba(21,101,192,.05);border-left:3px solid rgba(21,101,192,.3);padding:7px 10px;border-radius:0 6px 6px 0;font-size:.75rem;color:var(--muted);line-height:1.5">
      ℹ Obligation réglementaire : tout épandage de matière organique doit être enregistré (date, nature, dose, parcelle, distance ZNT).
      Délai de conservation : 5 ans. Export PDF disponible pour inspection ou audit HVE/AB.
    </div>

    ${entries.length ? `
    <div style="overflow-x:auto;padding:0 14px">
      <table style="width:100%;border-collapse:collapse;font-size:.76rem">
        <thead>
          <tr style="border-bottom:2px solid var(--cream3)">
            <th style="text-align:left;padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Date</th>
            <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Matière</th>
            <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Parcelle / Sujet</th>
            <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600;text-align:right">Dose</th>
            <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600;text-align:center">Surface</th>
            <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600;text-align:center">ZNT</th>
            <th style="padding:6px 8px;font-size:.75rem;color:var(--muted);font-weight:600">Notes</th>
            <th style="padding:6px 4px"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` : `<div style="padding:28px 14px;text-align:center;color:var(--muted);font-size:.84rem">
      <div style="font-size:1.8rem;margin-bottom:8px">🪣</div>
      <div style="font-weight:600;margin-bottom:4px">Aucun épandage enregistré</div>
      <div style="font-size:.75rem">Cliquez "+ Apport" pour saisir un épandage de matière organique.</div>
    </div>`}
  </div>`;
}

// ─── Fertilization list ───────────────────────────────────────────────────────

function renderFertList(allEvs) {
  if(!allEvs.length)return`<div style="text-align:center;padding:40px;color:var(--muted);font-style:italic">${T('misc.fertNoRecord')}</div>`;
  return allEvs.map(ev=>{
    const fert=ev.fertilizerId?getFertById(ev.fertilizerId):null;
    const amend=ev.amendmentId?getAmendById(ev.amendmentId):null;
    const ctb=ev.ct==='terre'?'🌳':'🪴';
    const wBadge=ev.weightG?`<span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--amber3);background:var(--amber2);padding:1px 5px;border-radius:6px;margin-left:4px">${ev.weightG}g</span>`:'';
    return`<div class="fert-list-item" style="border-left-color:${fert?.color||'#8b5e3c'}" onclick="showPage('collection');openDetail('${ev.pid}')">
<div class="fert-li-date">${fmtDate(ev.date)}</div>
<div class="fert-li-plant">${ctb} ${esc(ev.pn)}${wBadge}</div>
<div class="fert-li-desc">${esc(ev.description)}</div>
${fert?`<div class="fert-li-npk">${fertNPKBadges(fert)}<span style="font-size:.75rem;color:var(--muted);font-style:italic;margin-left:4px">${esc(fert.name)} · ${esc(fert.type)}</span></div>`:''}
${amend?`<div style="margin-top:3px"><span class="amend-badge">🪨 ${esc(amend.name)}</span></div>`:''}
</div>`;}).join('');
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function renderFertCal(allCalEvs) {
  const { calYear, calMonth, calHidden } = _ctx;
  const ET = window.ET ?? {};
  const CAL_TYPES = window.CAL_TYPES ?? [];

  const d=new Date(calYear,calMonth,1);
  const monthLabel=d.toLocaleDateString(getLd().locale||'fr-FR',{month:'long',year:'numeric'});
  const firstDow=(d.getDay()+6)%7;
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const daysInPrev=new Date(calYear,calMonth,0).getDate();
  const todayKey=new Date().toISOString().split('T')[0];

  const visEvs=allCalEvs.filter(e=>!calHidden.has(e.type));
  const monthPrefix=`${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const monthEvs=visEvs.filter(e=>e.date&&e.date.startsWith(monthPrefix));

  const allMonthEvs=allCalEvs.filter(e=>e.date&&e.date.startsWith(monthPrefix));

  const evsByDay={};
  monthEvs.forEach(ev=>{
    if(!evsByDay[ev.date])evsByDay[ev.date]=[];
    evsByDay[ev.date].push(ev);
  });

  const allEvsByDay={};
  allMonthEvs.forEach(ev=>{
    if(!allEvsByDay[ev.date])allEvsByDay[ev.date]=[];
    allEvsByDay[ev.date].push(ev);
  });

  const allTypes=[...new Set(allCalEvs.map(e=>e.type))];
  const typeOrder=['fertilisation','hivernage','sortie','traitement','taille','rempotage','greffage','protection','floraison','fructification','récolte','arrosage','observation','modification','dégâts_gel'];
  const sortedTypes=typeOrder.filter(t=>allTypes.includes(t));

  const filterBar=`<div id="cal-filter-bar" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;padding:9px 10px;background:var(--white);border-radius:10px;border:1px solid var(--cream3)">
<div style="width:100%;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:3px;display:flex;justify-content:space-between;align-items:center">
  <span>${T('misc.calFilterTitle')}</span>
  <span style="display:flex;gap:6px">
    <button onclick="window._calShowAll()" style="font-size:.75rem;color:var(--g3);text-decoration:underline;cursor:pointer">${T('misc.calShowAll')}</button>
    <button onclick="window._calHideAll()" style="font-size:.75rem;color:var(--muted);text-decoration:underline;cursor:pointer">${T('misc.calHideAll')}</button>
  </span>
</div>
${sortedTypes.map(t=>{
  const et=ET[t]||ET.observation;
  const hidden=calHidden.has(t);
  const countAll=allCalEvs.filter(e=>e.type===t).length;
  const isModif=t==='modification';
  return`<button onclick="window._calToggleType('${t}')" style="display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:20px;font-size:.7rem;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .15s;${hidden?`background:var(--cream3);color:var(--muted);text-decoration:line-through`:`background:${et.bg};color:${et.c};border:1px solid ${et.c}30`}">${et.i} ${isModif?'Modifications fiches':et.label} <span style="opacity:.65">(${countAll})</span></button>`;
}).join('')}
</div>`;

  const typesPresent=[...new Set(monthEvs.map(e=>e.type))];
  const legendItems=typeOrder.filter(t=>typesPresent.includes(t)&&t!=='modification').map(t=>{
    const et=ET[t]||ET.observation;
    const count=monthEvs.filter(e=>e.type===t).length;
    return`<div class="cal-leg-item"><div class="cal-leg-dot" style="background:${et.c}"></div>${et.i} ${et.label} <span style="color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:.75rem">(${count})</span></div>`;
  }).join('');

  const usedFertIds=[...new Set(monthEvs.filter(e=>e.fertilizerId).map(e=>e.fertilizerId))];
  const fertLegend=usedFertIds.map(id=>{
    const f=getFertById(id);
    return f?`<div class="cal-leg-item"><div class="cal-leg-dot" style="background:${f.color};border:1px solid rgba(0,0,0,.08)"></div><em style="font-size:.75rem">${esc(f.name.split(' ').slice(0,3).join(' '))}</em></div>`:'';
  }).join('');

  const DOWS=['L','M','M','J','V','S','D'];
  let cells=DOWS.map(dow=>`<div class="cal-dow">${dow}</div>`).join('');

  for(let i=0;i<firstDow;i++)
    cells+=`<div class="cal-day other-month"><div class="cal-day-num">${daysInPrev-firstDow+1+i}</div></div>`;

  for(let dd=1;dd<=daysInMonth;dd++){
    const iso=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
    const evs=evsByDay[iso]||[];
    const allDayCount=(allEvsByDay[iso]||[]).length;
    const isToday=iso===todayKey;
    const isSel=window._calSelDay===iso;
    const hasHiv=evs.some(e=>e.type==='hivernage');
    const hasSortie=evs.some(e=>e.type==='sortie');
    const hasModif=(allEvsByDay[iso]||[]).some(e=>e.type==='modification')&&!calHidden.has('modification');

    const dotMap={};
    evs.filter(e=>e.type!=='modification').forEach(ev=>{
      const key=ev.type==='fertilisation'&&ev.fertilizerId?`f_${ev.fertilizerId}`:ev.type;
      if(!dotMap[key]){
        const c=ev.type==='fertilisation'&&ev.fertilizerId?(getFertById(ev.fertilizerId)?.color||(ET.fertilisation.c)):((ET[ev.type]||ET.observation).c);
        dotMap[key]={c,n:0,type:ev.type};
      }
      dotMap[key].n++;
    });
    if(hasModif){
      const modifCount=(allEvsByDay[iso]||[]).filter(e=>e.type==='modification').length;
      dotMap['modification']={c:ET.modification.c,n:modifCount,type:'modification'};
    }
    const dots=Object.values(dotMap).slice(0,7).map(({c,n,type})=>{
      const et=ET[type]||ET.observation;
      return`<div class="cal-dot" style="background:${c}" title="${et.label}${n>1?' ×'+n:''}"></div>`;
    }).join('');

    let extra='';
    if(hasHiv&&!calHidden.has('hivernage'))extra='border:1.5px solid #455a64!important';
    else if(hasSortie&&!calHidden.has('sortie'))extra='border:1.5px solid #388e3c!important';

    cells+=`<div class="cal-day${isToday?' today':''}${(evs.length>0||hasModif)?' has-events':''}${isSel?' today':''}" style="${extra}" onclick="window._calSelDay='${iso}';render();setTimeout(()=>document.getElementById('cal-day-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}),60)">
<div class="cal-day-num">${dd}</div>
${hasHiv&&!calHidden.has('hivernage')?`<div style="font-size:.75rem;color:#455a64;line-height:1">❄</div>`:''}
${hasSortie&&!calHidden.has('sortie')?`<div style="font-size:.75rem;color:#388e3c;line-height:1">☀</div>`:''}
${dots?`<div class="cal-dots">${dots}</div>`:''}
${allDayCount>3?`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);text-align:right;margin-top:1px">${allDayCount}</div>`:''}
</div>`;
  }

  const totalCells=firstDow+daysInMonth;
  const rem=(7-totalCells%7)%7;
  for(let i=1;i<=rem;i++)cells+=`<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;

  const total=monthEvs.length;
  const hiddenCount=allCalEvs.filter(e=>e.date&&e.date.startsWith(monthPrefix)&&calHidden.has(e.type)).length;

  let dayPanel='';
  if(window._calSelDay){
    const dayEvs=allEvsByDay[window._calSelDay]||[];
    const selLabel=new Date(window._calSelDay+'T12:00:00').toLocaleDateString(getLd().locale||'fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

    const byPlant={};
    dayEvs.forEach(ev=>{
      if(!byPlant[ev.pid])byPlant[ev.pid]={name:ev.pn,ct:ev.ct,evs:[]};
      byPlant[ev.pid].evs.push(ev);
    });
    const plantGroups=Object.values(byPlant).sort((a,b)=>a.name.localeCompare(b.name));

    if(dayEvs.length>0){
      dayPanel=`<div id="cal-day-panel" style="background:var(--white);border-radius:var(--r);border:2px solid var(--amber);box-shadow:var(--sh);overflow:hidden;animation:sup .18s ease">
<div style="background:var(--g1);padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
  <div>
    <div style="font-size:.84rem;font-weight:700;color:var(--white);font-style:italic">${selLabel}</div>
    <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--bark);margin-top:1px">${dayEvs.length} événement${dayEvs.length>1?'s':''} · ${plantGroups.length} sujet${plantGroups.length>1?'s':''}</div>
  </div>
  <button onclick="window._calSelDay=null;render()" style="color:rgba(255,255,255,.6);font-size:1.2rem;padding:4px 8px;cursor:pointer;flex-shrink:0">✕</button>
</div>
${plantGroups.map(group=>{
  const ctb=group.ct==='terre'?'🌳':'🪴';
  const mainEvs=group.evs.filter(e=>e.type!=='modification');
  const modifEvs=group.evs.filter(e=>e.type==='modification');
  return`<div style="border-bottom:2px solid var(--cream3)">
  <div style="background:var(--cream2);padding:7px 14px;display:flex;align-items:center;gap:7px;cursor:pointer" onclick="showPage('collection');openDetail('${group.evs[0].pid}');window._calSelDay=null">
    <span style="font-size:.88rem">${ctb}</span>
    <div>
      <div style="font-size:.84rem;font-weight:700;color:var(--text-strong)">${esc(group.name)}</div>
      <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${mainEvs.length} acte${mainEvs.length!==1?'s':''}${modifEvs.length>0?` · ${modifEvs.length} modif. fiche`:''}  → ouvrir la fiche</div>
    </div>
  </div>
  ${mainEvs.map(ev=>{
    const et=ET[ev.type]||ET.observation;
    const fert=ev.fertilizerId?getFertById(ev.fertilizerId):null;
    const amend=ev.amendmentId?getAmendById(ev.amendmentId):null;
    const wBadge=ev.weightG?`<span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--amber3);background:var(--amber2);padding:1px 5px;border-radius:5px;margin-left:5px">${ev.weightG}g</span>`:'';
    const bulkBadge=ev.bulk?`<span style="font-size:.75rem;background:rgba(232,148,26,.${T('misc.collBulkTag')}:var(--amber3);border-radius:4px;padding:1px 4px;margin-left:4px">collectif</span>`:'';
    const locNote=ev.type==='hivernage'?`<div style="font-size:.75rem;color:#455a64;margin-top:2px;font-weight:600">❄ Emplacement → intérieur</div>`:ev.type==='sortie'?`<div style="font-size:.75rem;color:#388e3c;margin-top:2px;font-weight:600">☀ Emplacement → extérieur</div>`:ev.type==='dégâts_gel'?`<div style="font-size:.75rem;color:#1565c0;margin-top:2px;font-weight:600">🍂 Constat de dommages liés au gel</div>`:'';
    const isHidden=calHidden.has(ev.type);
    return`<div style="padding:9px 14px;border-bottom:1px solid var(--cream3);display:flex;gap:9px;align-items:flex-start;${isHidden?'opacity:.38':''}" onclick="showPage('collection');openDetail('${group.evs[0].pid}');window._calSelDay=null;event.stopPropagation()">
  <div style="width:28px;height:28px;border-radius:50%;background:${et.bg};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${et.i}</div>
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:2px">
      <span style="font-size:.75rem;font-weight:700;color:${et.c};font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em">${et.label}</span>
      ${bulkBadge}
      ${isHidden?`<span style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${T('misc.detailNominated')}</span>`:''}
      ${wBadge}
    </div>
    <div style="font-size:.82rem;color:var(--text);line-height:1.45">${esc(ev.description)}</div>
    ${ev.tailleType?`<div style="font-size:.7rem;color:${et.c};margin-top:2px;font-family:'JetBrains Mono',monospace">${esc(ev.tailleType)}${ev.partiesTaille?' · '+esc(ev.partiesTaille):''}${ev.hauteurAvant&&ev.hauteurApres?' · '+ev.hauteurAvant+'→'+ev.hauteurApres+'cm':''}</div>`:''}
    ${ev.nouveauPot?`<div style="font-size:.7rem;color:${et.c};margin-top:2px">Ø ${ev.ancienPot||'?'}→${ev.nouveauPot} cm${ev.substratRemp?' · '+esc(ev.substratRemp):''}</div>`:''}
    ${ev.brix||ev.acidite||ev.qtyRecolte?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
      ${ev.qtyRecolte?`<span style="font-size:.75rem;background:#fff8e1;color:#c77900;padding:1px 7px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-weight:600">⚖ ${ev.qtyRecolte} kg</span>`:''}
      ${ev.brix?`<span style="font-size:.75rem;background:#fff8e1;color:#c77900;padding:1px 7px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-weight:600">🔬 ${ev.brix}°Brix</span>`:''}
      ${ev.acidite?`<span style="font-size:.75rem;background:#fff3e0;color:#e65100;padding:1px 7px;border-radius:8px;font-family:'JetBrains Mono',monospace">⚗ ${ev.acidite} g/L</span>`:''}
      ${ev.brixRatio?`<span style="font-size:.75rem;background:rgba(46,125,50,.1);color:#2e7d32;padding:1px 7px;border-radius:8px;font-family:'JetBrains Mono',monospace">ratio ${ev.brixRatio}</span>`:''}
      ${ev.stadeRecolte?`<span style="font-size:.75rem;background:rgba(199,121,0,.1);color:#c77900;padding:1px 6px;border-radius:8px">${esc(ev.stadeRecolte)}</span>`:''}
    </div>`:''}
    ${ev.diagId?`<div style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;background:rgba(92,107,192,.09);padding:2px 8px;border-radius:8px">
      <span style="font-size:.75rem">🔬</span>
      <span style="font-size:.75rem;color:#5c6bc0;font-family:'JetBrains Mono',monospace">${esc(ev.diagId.replace(/_/g,' '))}${ev.diagConfidence?' · '+Math.round(ev.diagConfidence*100)+'%':''}</span>
    </div>`:''}
    ${ev.type==='greffage'&&(ev.greffon||ev.lotId)?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
      ${ev.greffon?`<span class="graft-badge">🌱 ${esc(ev.greffon)}</span>`:''}
      ${ev.porteGreffe?`<span class="graft-badge">🌿 ${esc(ev.porteGreffe)}</span>`:''}
      ${ev.lotId?`<span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:${et.c}">${esc(ev.lotId)}${ev.lotQty?' · ×'+ev.lotQty:''}</span>`:''}
      ${ev.reprisePct!=null?`<span style="font-size:.75rem;background:rgba(56,142,60,.1);color:#388e3c;padding:1px 7px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-weight:600">✓ ${ev.reprisePct}% · ${ev.repriseQty||'?'} plants</span>`:''}
    </div>`:''}
    ${fert?`<div class="fert-li-npk" style="margin-top:3px">${fertNPKBadges(fert)}<span style="font-size:.75rem;color:var(--muted);font-style:italic;margin-left:4px">${esc(fert.name)}</span></div>`:''}
    ${amend?`<div style="margin-top:2px"><span class="amend-badge">🪨 ${esc(amend.name)}</span></div>`:''}
    ${locNote}
  </div>
</div>`;
  }).join('')}
  ${modifEvs.length>0&&!calHidden.has('modification')?`
  <details style="border-top:1px solid var(--cream3)">
    <summary style="padding:7px 14px;font-size:.75rem;color:${ET.modification.c};font-family:'JetBrains Mono',monospace;cursor:pointer;background:${ET.modification.bg};list-style:none;display:flex;align-items:center;gap:6px">
      📝 ${modifEvs.length} modification${modifEvs.length>1?'s':''} de fiche archivée${modifEvs.length>1?'s':''}
      <span style="font-size:.75rem;color:var(--muted);margin-left:auto">${T('misc.detailDetails')}</span>
    </summary>
    ${modifEvs.map(ev=>`<div style="padding:6px 14px 6px 20px;border-bottom:1px solid var(--cream3);font-size:.76rem;color:var(--text);line-height:1.4;background:var(--cream)">
    <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted)">📝</span> ${esc(ev.description)}
    </div>`).join('')}
  </details>
  `:''}
</div>`;
}).join('')}
</div>`;
    } else {
      dayPanel=`<div id="cal-day-panel" style="background:var(--cream2);border-radius:var(--r);padding:14px;text-align:center;border:1px solid var(--cream3)">
<div style="font-size:.82rem;color:var(--muted);font-style:italic">${T('misc.calNoEvent')||'Aucun événement le'} ${new Date(window._calSelDay+'T12:00:00').toLocaleDateString(getLd().locale||'fr-FR',{weekday:'long',day:'numeric',month:'long'})}.</div>
<button onclick="window._calSelDay=null;render()" style="margin-top:8px;font-size:.78rem;color:var(--g3);text-decoration:underline;cursor:pointer">Fermer</button>
</div>`;
    }
  }

  return`
<div class="cal-nav">
  <button onclick="window._calPrevMonth()">←</button>
  <h3>${monthLabel}${helpBtn('calendrier')}</h3>
  <button onclick="window._calNextMonth()">→</button>
</div>
${filterBar}
${fertLegend?`<div class="cal-legend" style="margin-top:4px;padding-top:5px;border-top:1px dashed var(--cream3);font-style:italic">${fertLegend}</div>`:''}
<div class="cal-grid">${cells}</div>
<div style="font-size:.75rem;color:var(--muted);text-align:center;font-style:italic;margin-top:6px;margin-bottom:4px">${total} événement${total!==1?'s':''} visible${total!==1?'s':''}${hiddenCount>0?` · <span style="color:var(--amber3)">${hiddenCount} masqué${hiddenCount>1?'s':''}</span>`:''} ce mois · Toucher un jour = détails</div>
${total===0?(()=>{
  const prevM=calMonth===0?11:calMonth-1;const prevY=calMonth===0?calYear-1:calYear;
  const nextM=calMonth===11?0:calMonth+1;const nextY=calMonth===11?calYear+1:calYear;
  const prevPfx=`${prevY}-${String(prevM+1).padStart(2,'0')}`;
  const nextPfx=`${nextY}-${String(nextM+1).padStart(2,'0')}`;
  const prevHas=allCalEvs.some(e=>e.date&&e.date.startsWith(prevPfx));
  const nextHas=allCalEvs.some(e=>e.date&&e.date.startsWith(nextPfx));
  if(!prevHas&&!nextHas&&allCalEvs.length===0)return'';
  return`<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0 4px">
    ${prevHas?`<button class="btn btn-o btn-sm" onclick="window._calPrevMonth()">${T('misc.calEmptyPrev')}</button>`:''}
    ${nextHas?`<button class="btn btn-o btn-sm" onclick="window._calNextMonth()">${T('misc.calEmptyNext')}</button>`:''}
    <button class="btn btn-pri btn-sm" onclick="window._calAddFirstEvent()">${T('misc.calEmptyAdd')}</button>
  </div>`;
})():''}
${dayPanel?`<div style="margin-top:12px">${dayPanel}</div>`:''}`
}

// ─── Fert page ────────────────────────────────────────────────────────────────

function renderFertPage() {
  const { plants, fertView } = _ctx;
  const CAL_TYPES  = window.CAL_TYPES  ?? [];
  const PRO_PROFILES = window.PRO_PROFILES ?? [];

  const allCalEvs=plants.flatMap(p=>
    p.events.filter(e=>CAL_TYPES.includes(e.type)&&(e.type!=='modification'||e.audit))
      .map(e=>({...e,pn:p.name,pid:p.id,ct:p.cultureType||'pot'}))
  ).sort((a,b)=>new Date(b.date)-new Date(a.date));

  const allFertEvs=allCalEvs.filter(e=>e.type==='fertilisation');

  return`<div class="page" style="padding-bottom:20px">
<div class="fert-tabs">
  <div class="fert-tab${fertView==='cal'?' active':''}" data-action="fert-view" data-view="cal">📅 Calendrier</div>
  <div class="fert-tab${fertView==='list'?' active':''}" data-action="fert-view" data-view="list">🌱 Fertilisation</div>
  <div class="fert-tab${fertView==='profiles'?' active':''}" data-action="fert-view" data-view="profiles">⚗ Engrais</div>
  <div class="fert-tab${fertView==='amendments'?' active':''}" data-action="fert-view" data-view="amendments">🪨 Amendements</div>
  <div class="fert-tab${fertView==='stocks'?' active':''}" data-action="fert-view" data-view="stocks">📦 Stocks</div>
  <div class="fert-tab${fertView==='substrats'?' active':''}" data-action="fert-view" data-view="substrats">🪴 Substrats</div>
  <div class="fert-tab${fertView==='guide'?' active':''}" data-action="fert-view" data-view="guide">📚 Guide</div>
  ${PRO_PROFILES.includes((getProfile().profileType)||'collectionneur')?`<div class="fert-tab${fertView==='ppf'?' active':''}" data-action="fert-view" data-view="ppf">📋 PPF</div><div class="fert-tab${fertView==='epandage'?' active':''}" onclick="window._setFertView('epandage')">🪣 Épandage</div>`:''}
</div>
${fertView==='cal'?renderFertCal(allCalEvs):fertView==='list'?renderFertList(allFertEvs):fertView==='profiles'?renderFertProfiles():fertView==='stocks'?renderStocksTab():fertView==='substrats'?'<div id="cca-substrats-root" style="min-height:200px"></div>':fertView==='guide'?'<div id="cca-guide-root" style="min-height:300px"></div>':fertView==='ppf'?renderPPF():renderAmendProfiles()}
</div>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function mount(container, ctx) {
  _ctx = ctx;
  const { fertView } = ctx;
  container.innerHTML = renderFertPage();
  if (fertView === 'substrats') {
    requestAnimationFrame(() => {
      const r = document.getElementById('cca-substrats-root');
      if (r && window.__CCA_substrats) window.__CCA_substrats.mount(r, T, ctx.plants);
      else if (r) r.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">⏳ Module substrats en cours de chargement…</div>';
    });
  } else if (fertView === 'guide') {
    const _pa = window._guidePendingAnchor;
    window._guidePendingAnchor = null;
    requestAnimationFrame(() => {
      const r = document.getElementById('cca-guide-root');
      if (r && window.__CCA_guide) window.__CCA_guide.mount(r, T, window.getLang, _pa);
      else if (r) r.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">⏳ Module guide en cours de chargement…</div>';
    });
  }
}

window.__CCA_fert = { mount };
