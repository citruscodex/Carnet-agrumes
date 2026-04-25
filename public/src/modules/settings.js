import { esc } from '../lib/esc.js';

const T          = k => window.T?.(k) ?? k;
const getLd      = () => window.getLd?.() ?? {};
const fmtDate    = v => window.fmtDate?.(v) ?? '';
const getCfg     = () => window.getCfg?.() ?? {};
const getProfile = () => window.getProfile?.() ?? {};
const getAmendById  = id => window.getAmendById?.(id);
const getFertById   = id => window.getFertById?.(id);
const helpBtn       = k  => window.helpBtn?.(k) ?? '';
const fertNPKBadges = f  => window.fertNPKBadges?.(f) ?? '';

let _ctx = {};

// ─── buildHistList ─────────────────────────────────────────────────────────────

export function buildHistList(allEvs, showModif, showActions) {
  const ET = window.ET ?? {};
  const filtered = allEvs.filter(e => e.audit ? showModif : showActions);
  if (!filtered.length) return `<div style="text-align:center;color:var(--muted);font-style:italic;padding:20px 0">${T('misc.profNoItems')}</div>`;

  let html = '';
  let lastMonth = '';
  filtered.forEach(ev => {
    const et     = ET[ev.type] || ET.observation;
    const isModif = ev.audit;
    const ctb    = ev.ct === 'terre' ? '🌳' : '🪴';
    const fert   = ev.fertilizerId ? getFertById(ev.fertilizerId) : null;
    const amend  = ev.amendmentId  ? getAmendById(ev.amendmentId)  : null;
    const evMonth = new Date(ev.date + 'T12:00:00').toLocaleDateString(getLd().locale || 'fr-FR', { month: 'long', year: 'numeric' });
    const evMonthCap = evMonth.charAt(0).toUpperCase() + evMonth.slice(1);
    if (evMonthCap !== lastMonth) {
      html += `<div class="hist-month-sep">${evMonthCap}</div>`;
      lastMonth = evMonthCap;
    }
    const npkLine = fert ? `<div class="fert-li-npk" style="margin-top:3px">${fertNPKBadges(fert)}<span style="font-size:.75rem;color:var(--muted);font-style:italic;margin-left:4px">${esc(fert.name)}</span></div>` : '';
    let extraLine = '';
    if (ev.tailleType) extraLine += `<div style="font-size:.7rem;color:${et.c};font-family:'JetBrains Mono',monospace;margin-top:2px">${esc(ev.tailleType)}${ev.partiesTaille ? ' · ' + esc(ev.partiesTaille) : ''}${ev.hauteurAvant && ev.hauteurApres ? ' · ' + ev.hauteurAvant + '→' + ev.hauteurApres + 'cm' : ''}</div>`;
    if (ev.nouveauPot) extraLine += `<div style="font-size:.7rem;color:${et.c};margin-top:2px">Ø ${ev.ancienPot || '?'}→${ev.nouveauPot} cm${ev.substratRemp ? ' · ' + esc(ev.substratRemp) : ''}</div>`;
    if (ev.brix || ev.acidite) extraLine += `<span style="font-size:.75rem;background:#fff8e1;color:#c77900;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace">${ev.brix ? ev.brix + '°Brix' : ''}${ev.brix && ev.acidite ? ' · ' : ''}${ev.acidite ? '⚗ ' + ev.acidite + ' g/L' : ''}</span>`;
    if (ev.type === 'greffage' && ev.greffon) extraLine += `<span class="graft-badge" style="font-size:.75rem">${esc(ev.greffon)}${ev.porteGreffe ? ' / ' + esc(ev.porteGreffe) : ''}${ev.lotId ? ' · ' + esc(ev.lotId) : ''}</span>`;    if (ev.weightG) extraLine += `<div style="font-size:.7rem;color:var(--amber3);font-family:'JetBrains Mono',monospace;margin-top:2px">${ev.weightG} g apportés</div>`;
    if (amend) extraLine += `<div style="margin-top:2px"><span class="amend-badge">🪨 ${esc(amend.name)}</span></div>`;
    const bulkBadge = ev.bulk ? `<span style="font-size:.75rem;background:rg${T('misc.collBulkTag')}8,26,.14);color:var(--amber3);border-radius:4px;padding:1px 5px;margin-left:4px">collectif</span>` : '';
    html += `<div class="hist-entry ${isModif ? 'is-modif' : 'is-action'}" onclick="showPage('collection');openDetail('${ev.pid}')">
<div class="hist-date">
  <span>${fmtDate(ev.date)}</span>
  <div style="display:flex;align-items:center;gap:5px">
    <div style="font-size:.75rem;padding:1px 6px;border-radius:8px;background:${et.bg};color:${et.c};font-family:'JetBrains Mono',monospace">${et.i} ${et.label}${bulkBadge}</div>
  </div>
</div>
<div class="hist-plant">${ctb} <span style="color:var(--text-strong)">${esc(ev.pn)}</span>${ev.pspecies ? `<span style="font-size:.75rem;color:var(--muted);font-style:italic;font-weight:400"> ${esc(ev.pspecies)}</span>` : ''}</div>
<div class="hist-desc">${esc(ev.description)}</div>
${npkLine}${extraLine}
</div>`;
  });
  return html;
}

// ─── renderProfHistory ─────────────────────────────────────────────────────────

function renderProfHistory() {
  const { plants } = _ctx;
  const allEvs = plants.flatMap(p =>
    p.events.map(e => ({ ...e, pn: p.name, pid: p.id, ct: p.cultureType || 'pot', pspecies: p.species || '' }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!allEvs.length) return `<div style="padding:24px;text-align:center;color:var(--muted);font-style:italic">${T('misc.profNoEvents')}</div>`;

  const totalAll     = allEvs.length;
  const totalModif   = allEvs.filter(e => e.audit).length;
  const totalActions = totalAll - totalModif;
  const firstDate    = allEvs[allEvs.length - 1]?.date;

  let html = `<div style="padding:12px 14px 8px">
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
  <div style="background:var(--white);border-radius:8px;padding:8px 12px;text-align:center;flex:1;box-shadow:var(--sh)">
    <div style="font-size:1.2rem;font-weight:700;font-family:'EmojiFirst','Playfair Display',serif;color:var(--text-strong)">${totalAll}</div>
    <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${T('misc.histTotalEntries')}</div>
  </div>
  <div style="background:var(--white);border-radius:8px;padding:8px 12px;text-align:center;flex:1;box-shadow:var(--sh)">
    <div style="font-size:1.2rem;font-weight:700;font-family:'EmojiFirst','Playfair Display',serif;color:var(--g3)">${totalActions}</div>
    <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${T('misc.histEvents')}</div>
  </div>
  <div style="background:var(--white);border-radius:8px;padding:8px 12px;text-align:center;flex:1;box-shadow:var(--sh)">
    <div style="font-size:1.2rem;font-weight:700;font-family:'EmojiFirst','Playfair Display',serif;color:#7b4eb5">${totalModif}</div>
    <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${T('misc.histModifs')}</div>
  </div>
</div>
${firstDate ? `<div style="font-size:.75rem;color:var(--muted);font-style:italic;margin-bottom:10px">Depuis le ${fmtDate(firstDate)} · ${plants.length} sujets</div>` : ''}
<div style="display:flex;gap:10px;margin-bottom:12px;align-items:center">
  <label style="font-size:.76rem;color:var(--text);display:flex;align-items:center;gap:5px;cursor:pointer">
    <input type="checkbox" id="hist-show-modif" checked onchange="renderHistFilter()" style="width:13px;height:13px;accent-color:#7b4eb5"/>
    <span>📝 Modifications de fiche</span>
  </label>
  <label style="font-size:.76rem;color:var(--text);display:flex;align-items:center;gap:5px;cursor:pointer">
    <input type="checkbox" id="hist-show-actions" checked onchange="renderHistFilter()" style="width:13px;height:13px;accent-color:var(--g3)"/>
    <span>✅ Événements</span>
  </label>
</div>
</div>
<div id="hist-list" style="padding:0 14px 20px">${buildHistList(allEvs, true, true)}</div>
<div style="padding:0 14px 10px"><button class="prof-action-btn pab-neutral" onclick="exportMonthlyReportPDF()">${T('misc.pdfBtnReport')}</button></div>`;

  return html;
}

// ─── renderProfSecurity ────────────────────────────────────────────────────────

function renderProfSecurity(isGhOk, gh, totalPhotos, cfg) {
  const srvToken = _ctx.srvToken;
  return `
<div style="padding:0 14px;margin-top:10px">
<div class="security-badge">${T('misc.securityBadge')}</div>
</div>
<div class="prof-section"><div class="prof-section-title">Authentification</div>
<div class="prof-row"><span class="prof-row-label">Authentification</span><span class="prof-row-val" style="font-size:.75rem;color:var(--text-accent)">${T('misc.profPwdActive')}</span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profTokenEnc')}</span><span class="prof-row-val" style="font-size:.75rem;color:var(--text-accent)">XOR + SHA-256</span></div>
<div class="prof-row"><span class="prof-row-label">Données</span><span class="prof-row-val" style="font-size:.75rem;color:var(--text-accent)">100% locales (localStorage)</span></div>
</div>
<button class="prof-action-btn pab-neutral" onclick="openChgPwd()">${T('misc.profChgPwd')}</button>
<div class="prof-section"><div class="prof-section-title">${T('misc.profGHSection')}</div>
<div class="prof-row"><span class="prof-row-label">Statut</span><span class="prof-row-val" style="display:flex;align-items:center;gap:4px"><span class="gh-status-dot" style="background:${isGhOk ? '#2e7d32' : '#f57c00'}"></span><span style="font-size:.78rem;color:${isGhOk ? '#2e7d32' : '#f57c00'}">${isGhOk ? 'Connecté' : 'Non configuré'}</span></span></div>
${gh ? `<div class="prof-row"><span class="prof-row-label">Dépôt</span><span class="prof-row-val" style="font-family:'JetBrains Mono',monospace;font-size:.75rem">${esc(gh.user)}/${esc(gh.repo)}</span></div>` : ''}
<div class="prof-row"><span class="prof-row-label">${T('misc.profGHPhotos')}</span><span class="prof-row-val">${totalPhotos}</span></div>
</div>
<button class="prof-action-btn pab-neutral" onclick="openEditGH()">${T('misc.profEditGH')}</button>

<div class="prof-section" style="border-left:3px solid #2d5a3d">
  <div class="prof-section-title" style="color:#2d5a3d">${T('misc.pnSection')}</div>
  ${cfg.pnKeyObf
    ? `<div class="prof-row"><span class="prof-row-label">Statut</span><span class="prof-row-val" style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#2d5a3d;flex-shrink:0"></span><span style="font-size:.78rem;color:#2d5a3d">${T('misc.pnKeySet')}</span></span></div><button class="prof-action-btn" style="background:rgba(198,40,40,.08);color:#c62828;border-color:rgba(198,40,40,.2);margin-top:6px" onclick="clearPlantNetKey()">${T('misc.apiKeyRemove')}</button>`
    : `<div style="font-size:.75rem;color:var(--muted);line-height:1.5;margin-bottom:10px">${T('misc.pnKeyHint')}</div>
       <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px"><label style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em">${T('misc.pnKeyLbl')}</label><input id="pn-key-input" type="password" placeholder="Clé PlantNet…" autocomplete="off" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.8rem;font-family:'JetBrains Mono',monospace;background:var(--white)"/></div>
       <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px;margin-top:8px"><label style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em">${T('misc.diagApiPwdLbl')}</label><input id="pn-pw-input" type="password" placeholder="••••••••" autocomplete="current-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.8rem;background:var(--white)"/></div>
       <button class="prof-action-btn" style="background:#2d5a3d;color:white;border-color:#2d5a3d;margin-top:10px" onclick="savePlantNetKey()">${T('misc.diagApiSave')}</button>`
  }
</div>
<div class="prof-section" style="border-left:3px solid #4a7c59">
  <div class="prof-section-title" style="color:#4a7c59">${T('misc.pidSection')}</div>
  ${cfg.pidKeyObf
    ? `<div class="prof-row"><span class="prof-row-label">Statut</span><span class="prof-row-val" style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#4a7c59;flex-shrink:0"></span><span style="font-size:.78rem;color:#4a7c59">${T('misc.pidKeySet')}</span></span></div><button class="prof-action-btn" style="background:rgba(198,40,40,.08);color:#c62828;border-color:rgba(198,40,40,.2);margin-top:6px" onclick="clearPlantIdKey()">${T('misc.apiKeyRemove')}</button>`
    : `<div style="font-size:.75rem;color:var(--muted);line-height:1.5;margin-bottom:10px">${T('misc.pidKeyHint')}</div>
       <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px"><label style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em">${T('misc.pidKeyLbl')}</label><input id="pid-key-input" type="password" placeholder="Clé Plant.id…" autocomplete="off" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.8rem;font-family:'JetBrains Mono',monospace;background:var(--white)"/></div>
       <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px;margin-top:8px"><label style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em">${T('misc.diagApiPwdLbl')}</label><input id="pid-pw-input" type="password" placeholder="••••••••" autocomplete="current-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.8rem;background:var(--white)"/></div>
       <button class="prof-action-btn" style="background:#4a7c59;color:white;border-color:#4a7c59;margin-top:10px" onclick="savePlantIdKey()">${T('misc.diagApiSave')}</button>`
  }
</div>
<div class="prof-section" style="border-left:3px solid #5c6bc0">
  <div class="prof-section-title" style="color:#5c6bc0">${T('misc.diagApiSection')}</div>
  ${cfg.claudeKeyObf
    ? `<div class="prof-row"><span class="prof-row-label">Statut</span>
       <span class="prof-row-val" style="display:flex;align-items:center;gap:6px">
         <span style="width:8px;height:8px;border-radius:50%;background:#5c6bc0;flex-shrink:0"></span>
         <span style="font-size:.78rem;color:#5c6bc0">${T('misc.diagApiKeySet')}</span>
       </span></div>
       <button class="prof-action-btn" style="background:rgba(198,40,40,.08);color:#c62828;border-color:rgba(198,40,40,.2);margin-top:6px" onclick="clearClaudeKey()">${T('misc.diagApiClear')}</button>`
    : `<div style="font-size:.75rem;color:var(--muted);line-height:1.5;margin-bottom:10px">${T('misc.diagApiKeyHint')}</div>
       <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px">
         <label style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em">${T('misc.diagApiKeyLbl')}</label>
         <input id="claude-key-input" type="password" placeholder="sk-ant-api03-…" autocomplete="off" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.8rem;font-family:'JetBrains Mono',monospace;background:var(--white)"/>
       </div>
       <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px;margin-top:8px">
         <label style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em">${T('misc.diagApiPwdLbl')}</label>
         <input id="claude-pw-input" type="password" placeholder="••••••••" autocomplete="current-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.8rem;background:var(--white)"/>
       </div>
       <button class="prof-action-btn" style="background:#5c6bc0;color:white;border-color:#5c6bc0;margin-top:10px" onclick="saveClaudeKey()">${T('misc.diagApiSave')}</button>
       <div style="font-size:.75rem;color:var(--muted);margin-top:8px;font-style:italic;line-height:1.5">${T('misc.diagApiKeyNone')}</div>`
  }
  <div style="font-size:.75rem;color:var(--muted);margin-top:8px;line-height:1.4;font-style:italic">${T('misc.diagApiPrivacy')}</div>
</div>

${srvToken ? `
<div class="prof-section" style="border-left:3px solid #c75b2a">
  <div class="prof-section-title" style="color:#c75b2a">Compte CitrusCodex (bêta)</div>
  <div class="prof-row"><span class="prof-row-label">Email</span><span class="prof-row-val" style="font-size:.8rem;font-family:'JetBrains Mono',monospace">${esc(sessionStorage.getItem('cca_srv_email') || '')}</span></div>
  <div id="srv-chg-pwd-form" style="display:none;margin-top:12px">
    <div id="srv-pwd-err" style="display:none;background:#fde8e8;color:#c62828;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:.85rem"></div>
    <div id="srv-pwd-ok" style="display:none;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:.85rem"></div>
    <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px"><label style="font-size:.75rem;color:var(--muted)">Mot de passe actuel</label><div class="pwd-wrap" style="width:100%"><input type="password" id="srv-cur-pwd" placeholder="••••••••" autocomplete="current-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.85rem;background:var(--white)"/><button type="button" class="pwd-eye" onclick="togglePwdVis('srv-cur-pwd')">👁</button></div></div>
    <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px;margin-top:8px"><label style="font-size:.75rem;color:var(--muted)">Nouveau mot de passe <span style="font-size:.72rem">(8+ car., 1 lettre, 1 chiffre)</span></label><div class="pwd-wrap" style="width:100%"><input type="password" id="srv-new-pwd" placeholder="••••••••" autocomplete="new-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.85rem;background:var(--white)"/><button type="button" class="pwd-eye" onclick="togglePwdVis('srv-new-pwd')">👁</button></div></div>
    <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px;margin-top:8px"><label style="font-size:.75rem;color:var(--muted)">Confirmer le nouveau mot de passe</label><div class="pwd-wrap" style="width:100%"><input type="password" id="srv-new-pwd2" placeholder="••••••••" autocomplete="new-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.85rem;background:var(--white)"/><button type="button" class="pwd-eye" onclick="togglePwdVis('srv-new-pwd2')">👁</button></div></div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-sm" style="flex:1;background:#c75b2a;color:white;border-color:#c75b2a" onclick="submitSrvChgPwd()">Changer</button>
      <button class="btn btn-sm btn-o" style="flex:1" onclick="document.getElementById('srv-chg-pwd-form').style.display='none'">Annuler</button>
    </div>
  </div>
  <button class="prof-action-btn pab-neutral" id="srv-chg-pwd-btn" onclick="document.getElementById('srv-chg-pwd-form').style.display='block';document.getElementById('srv-chg-pwd-btn').style.display='none'">🔑 Changer le mot de passe serveur</button>
</div>

<div class="prof-section" style="border-left:3px solid #c62828">
  <div class="prof-section-title" style="color:#c62828">Zone de danger</div>
  <div style="font-size:.8rem;color:var(--muted);margin-bottom:10px;line-height:1.5">La suppression de votre compte est <strong>définitive et irréversible</strong>. Toutes vos données seront effacées.</div>
  <div id="del-acct-form" style="display:none;margin-bottom:10px">
    <div id="del-acct-err" style="display:none;background:#fde8e8;color:#c62828;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:.85rem"></div>
    <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px"><label style="font-size:.75rem;color:var(--muted)">Confirmez votre mot de passe</label><div class="pwd-wrap" style="width:100%"><input type="password" id="del-pwd" placeholder="••••••••" autocomplete="current-password" style="width:100%;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.85rem;background:var(--white)"/><button type="button" class="pwd-eye" onclick="togglePwdVis('del-pwd')">👁</button></div></div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-sm" style="flex:1;background:#c62828;color:white;border-color:#c62828" onclick="submitDeleteAccount()">Supprimer définitivement</button>
      <button class="btn btn-sm btn-o" style="flex:1" onclick="document.getElementById('del-acct-form').style.display='none';document.getElementById('del-acct-btn').style.display='block'">Annuler</button>
    </div>
  </div>
  <button class="prof-action-btn" id="del-acct-btn" style="background:rgba(198,40,40,.08);color:#c62828;border-color:rgba(198,40,40,.25)" onclick="document.getElementById('del-acct-form').style.display='block';document.getElementById('del-acct-btn').style.display='none'">🗑 Supprimer mon compte</button>
</div>

<div class="prof-section" style="border-left:3px solid #1565c0">
  <div class="prof-section-title" style="color:#1565c0">📥 Mes données (RGPD)</div>
  <div style="font-size:.8rem;color:var(--muted);margin-bottom:10px;line-height:1.5">Téléchargez toutes vos données personnelles au format JSON (article 20 RGPD — droit à la portabilité).</div>
  <button class="prof-action-btn pab-neutral" id="btn-export-rgpd" onclick="submitExportRGPD()">📥 Télécharger toutes mes données</button>
</div>
${(()=>{const bk=localStorage.getItem('wikiV1_backup');if(!bk)return '';try{const p=JSON.parse(bk);const days=Math.max(0,Math.ceil((30*24*3600*1000-(Date.now()-new Date(p.archived_at).getTime()))/(1000*60*60*24)));return`<div class="prof-section" style="border-left:3px solid #795548"><div class="prof-section-title" style="color:#795548">📦 ${esc(T('wikiV1.backupTitle'))}</div><div style="font-size:.8rem;color:var(--muted);margin-bottom:10px;line-height:1.5">${esc(T('wikiV1.backupIntro').replace('{days}',days))}</div><button class="prof-action-btn pab-neutral" id="btn-dl-wikiv1-backup">${esc(T('wikiV1.downloadBackup'))}</button></div>`;}catch{return '';}})()}
` : ''}

<div class="prof-section" style="border-left:3px solid #ff9800">
  <div class="prof-section-title" style="color:#ff9800">💬 Donner mon avis</div>
  <div style="font-size:.8rem;color:var(--muted);margin-bottom:12px;line-height:1.5">Comment trouvez-vous CitrusCodex ?</div>
  <div id="feedback-stars" style="display:flex;gap:6px;margin-bottom:12px;font-size:1.4rem">
    ${[1, 2, 3, 4, 5].map(n => `<span style="cursor:pointer;opacity:.35" data-star="${n}" onclick="_setRating(${n})">★</span>`).join('')}
  </div>
  <textarea id="feedback-comment" placeholder="Vos impressions, suggestions…" style="width:100%;min-height:70px;padding:9px 11px;border:1px solid var(--cream3);border-radius:8px;font-size:.85rem;resize:vertical;background:var(--white)"></textarea>
  <div id="feedback-err" style="display:none;color:#c62828;font-size:.8rem;margin-top:6px"></div>
  <button class="prof-action-btn pab-neutral" style="margin-top:8px" id="btn-send-feedback" onclick="submitFeedback()">Envoyer mon avis</button>
</div>

<div class="prof-section">
  <div class="prof-section-title">📋 Informations</div>
  <div class="prof-row"><span class="prof-row-label">Version</span><span class="prof-row-val" style="font-family:'JetBrains Mono',monospace;font-size:.78rem">v${window.APP_VERSION ?? '?'}</span></div>
  <div class="prof-row"><span class="prof-row-label">Nouveautés</span><span class="prof-row-val"><a href="/changelog.html" target="_blank" style="color:#c75b2a;font-size:.82rem">📋 Voir le changelog</a></span></div>
  <div class="prof-row"><span class="prof-row-label">Légal</span><span class="prof-row-val" style="display:flex;gap:8px;font-size:.78rem"><a href="/cgu.html" target="_blank" style="color:#c75b2a">CGU</a><a href="/confidentialite.html" target="_blank" style="color:#c75b2a">Confidentialité</a><a href="/mentions-legales.html" target="_blank" style="color:#c75b2a">Mentions</a></span></div>
</div>

<div style="height:20px"></div>`;
}

// ─── renderSettings ────────────────────────────────────────────────────────────

function renderSettings() {
  const { plants, profView } = _ctx;
  const prof        = getProfile();
  const cfg         = getCfg();
  const gh          = window.getGH?.();
  const nPot        = plants.filter(p => window.isPot?.(p)).length;
  const nTerre      = plants.filter(p => !window.isPot?.(p)).length;
  const totalEvents = plants.reduce((n, p) => n + p.events.filter(e => !e.audit).length, 0);
  const totalPhotos = plants.reduce((n, p) => n + (p.photos?.length || 0), 0);
  const speciesSet  = new Set(plants.map(p => p.species));
  const isGhOk      = !!(window.getToken?.() && gh);
  const activeOp    = window.getActiveOperator?.();
  const PRO_PROFILES = window.PRO_PROFILES ?? [];

  const hero = `<div class="profile-hero"><div class="ph-avatar">🌿</div><div class="ph-info"><div class="ph-name">${esc(prof.name || 'Mon profil')}</div><div class="ph-role">${{ collectionneur: '🍋 Collectionneur · Agrumes', pepinieriste: '🌱 Pépiniériste · Agrumes', arboriculteur: '🌳 Arboriculteur · Agrumes', conservatoire: '🏛 Conservatoire · Agrumes' }[prof.profileType || 'collectionneur'] || '🍋 Collectionneur · Agrumes'}</div>${prof.loc ? `<div class="ph-loc">📍 ${esc(prof.loc)}</div>` : ''}${prof.bio ? `<div class="ph-loc" style="margin-top:2px">${esc(prof.bio)}</div>` : ''}${activeOp ? `<div style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:20px;padding:3px 10px 3px 6px;cursor:pointer" onclick="switchActiveOperator(null)"><div style="width:18px;height:18px;border-radius:50%;background:${activeOp.color};display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:white;flex-shrink:0">${esc(activeOp.name.slice(0, 1).toUpperCase())}</div><span style="font-size:.75rem;color:rgba(255,255,255,.85);font-family:'JetBrains Mono',monospace">${esc(activeOp.name)}</span><span style="font-size:.75rem;color:rgba(255,255,255,.45)">✕</span></div>` : ''}</div></div>
<div class="profile-stats"><div class="pstat"><div class="pstat-val">${nPot}</div><div class="pstat-lbl">🪴 En pot</div></div><div class="pstat"><div class="pstat-val" style="color:var(--terra)">${nTerre}</div><div class="pstat-lbl">🌳 Terre</div></div><div class="pstat"><div class="pstat-val">${speciesSet.size}</div><div class="pstat-lbl">${T('misc.profEspeces')}</div></div><div class="pstat"><div class="pstat-val">${totalEvents}</div><div class="pstat-lbl">${T('misc.profEntries')}</div></div></div>`;

  const tabs = `<div class="prof-tabs">
<div class="prof-tab${profView === 'profil' ? ' active' : ''}" onclick="window._setProfView('profil')">${T('misc.profTabProfile')}</div>
<div class="prof-tab${profView === 'securite' ? ' active' : ''}" onclick="window._setProfView('securite')">${T('misc.profTabSecurity')}</div>
<div class="prof-tab${profView === 'notifs' ? ' active' : ''}" onclick="window._setProfView('notifs')">${T('misc.notifTab')}</div>
<div class="prof-tab${profView === 'sync' ? ' active' : ''}" onclick="window._setProfView('sync')">☁ Sync</div>
<div class="prof-tab${profView === 'historique' ? ' active' : ''}" onclick="window._setProfView('historique')">${T('misc.profTabHistory')}</div>
</div>`;

  if (profView === 'historique') return hero + tabs + renderProfHistory();
  if (profView === 'securite')   return hero + tabs + renderProfSecurity(isGhOk, gh, totalPhotos, cfg);
  if (profView === 'notifs')     return hero + tabs + (window.renderProfNotifs?.() ?? '');
  if (profView === 'sync')       return hero + tabs + (window.renderProfSync?.() ?? '');

  const pType = prof.profileType || 'collectionneur';
  return hero + tabs + `
<div style="padding:10px 14px 4px">
<div style="background:var(--white);border-radius:10px;padding:11px 14px;border:1px solid var(--cream3);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
  <div>
    <div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">🌐 Langue / Language</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:2px">Interface language</div>
  </div>
  <select onchange="setLang(this.value)" style="font-size:.82rem;padding:6px 10px;border:1px solid var(--cream3);border-radius:8px;background:var(--cream2);color:var(--text-strong)">
    ${['fr', 'en', 'it', 'es', 'pt'].map(l => `<option value="${l}"${window.getLang?.() === l ? ' selected' : ''}>${{ fr: '🇫🇷 Français', en: '🇬🇧 English', it: '🇮🇹 Italiano', es: '🇪🇸 Español', pt: '🇵🇹 Português' }[l]}</option>`).join('')}
  </select>
</div>
<div style="background:rgba(21,101,192,.04);border-radius:10px;padding:11px 14px;border:1px solid rgba(21,101,192,.2);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:0;padding-right:12px">
    <div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">💧 ${T('drip.title') || "Systèmes d'irrigation"}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:2px">${T('drip.settingsDesc') || 'Circuits goutte-à-goutte par collection'}</div>
  </div>
  <button class="btn btn-sm" style="font-size:.8rem;background:rgba(21,101,192,.1);color:var(--blue,#1565c0);border:1px solid rgba(21,101,192,.2)" onclick="showPage('drip')">${T('drip.manage') || 'Gérer'}</button>
</div>
<div style="background:rgba(199,91,42,.05);border-radius:10px;padding:11px 14px;border:1px solid rgba(199,91,42,.2);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:0;padding-right:12px">
    <div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">🐛 ${T('bug.myReports') || 'Mes signalements'}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:2px">Rapports de bugs et demandes de fonctionnalités</div>
  </div>
  <button class="btn btn-sm" style="font-size:.8rem;background:rgba(199,91,42,.1);color:#c75b2a;border:1px solid rgba(199,91,42,.25)" onclick="showPage('my-bugs')">Voir →</button>
</div>
${window._srvUserRole?.() === 'admin' ? `<div style="background:rgba(198,40,40,.05);border-radius:10px;padding:11px 14px;border:1px solid rgba(198,40,40,.2);margin-bottom:8px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div style="flex:1;min-width:0;padding-right:12px"><div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">🐛 ${esc(T('bug.adminPanel') || 'Gestion des bugs')}</div><div style="font-size:.75rem;color:var(--muted);margin-top:2px">Vue admin — tous les rapports</div></div><button class="btn btn-sm" style="font-size:.8rem;background:rgba(198,40,40,.1);color:#c62828;border:1px solid rgba(198,40,40,.25)" onclick="showPage('admin-bugs')">Admin →</button></div><div style="font-size:.75rem;color:#c62828;background:rgba(198,40,40,.07);border-radius:6px;padding:5px 9px;display:flex;align-items:center;gap:6px"><span>🔓</span><span>Mode admin — accès à tous les modules (pépinière, arboriculteur, conservatoire) — comportement normal</span></div></div>` : ''}
<div style="background:var(--white);border-radius:10px;padding:11px 14px;border:1px solid var(--cream3);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:0;padding-right:12px">
    <div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">💧 ${T('misc.etpTitle')}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:2px">${T('misc.etpToggle')}</div>
  </div>
  <label class="notif-switch"><input type="checkbox" ${window.isETPEnabled?.() ? 'checked' : ''} onchange="toggleETPMode()"><span class="notif-slider"></span></label>
</div>
<div style="background:var(--white);border-radius:10px;padding:11px 14px;border:1px solid var(--cream3);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:0;padding-right:12px"><div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">🌙 Mode sombre</div><div style="font-size:.75rem;color:var(--muted);margin-top:2px">Thème sombre — adapté aux serres et caves</div></div>
  <label class="notif-switch"><input type="checkbox" ${window.isDarkMode?.() ? 'checked' : ''} onchange="toggleDarkMode();render()"><span class="notif-slider"></span></label>
</div>
<div style="background:var(--white);border-radius:10px;padding:11px 14px;border:1px solid var(--cream3);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:0;padding-right:12px"><div style="font-size:.82rem;font-weight:600;color:var(--text-strong)">🔒 Mode lecture seule</div><div style="font-size:.75rem;color:var(--muted);margin-top:2px">Bloque toute modification — consultation uniquement</div></div>
  <label class="notif-switch"><input type="checkbox" ${window.isReadOnly?.() ? 'checked' : ''} onchange="toggleReadOnly()"><span class="notif-slider"></span></label>
</div>
</div>
<div style="padding:0 14px 4px;margin-top:0"><div class="security-badge">${T('misc.securityBadge')} ${helpBtn('securite')}</div></div>
<div class="prof-section">
<div class="prof-section-title">Type de profil</div>
<div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px">
${window._srvUserRole?.() === 'admin'
  ? `<div class="cca-profile-badge" style="gap:8px">
  <span class="cca-profile-icon">${{ collectionneur: '🍋', pepinieriste: '🌱', arboriculteur: '🌳', conservatoire: '🏛' }[pType] || '🍋'}</span>
  <select onchange="switchProfileType(this.value)" style="background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:.85rem;cursor:pointer">
    ${['collectionneur', 'pepinieriste', 'arboriculteur', 'conservatoire'].map(t => `<option value="${t}"${t === pType ? ' selected' : ''}>${{ collectionneur: '🍋 Collectionneur', pepinieriste: '🌱 Pépiniériste', arboriculteur: '🌳 Arboriculteur', conservatoire: '🏛 Conservatoire' }[t]}</option>`).join('')}
  </select>
</div>
<div class="cca-profile-hint">⚙ Compte de test — switch local uniquement (ne modifie pas la BDD)</div>`
  : `<div class="cca-profile-badge">
  <span class="cca-profile-icon">${{ collectionneur: '🍋', pepinieriste: '🌱', arboriculteur: '🌳', conservatoire: '🏛' }[pType] || '🍋'}</span>
  <span style="font-weight:600;font-size:.88rem">${esc({ collectionneur: 'Collectionneur', pepinieriste: 'Pépiniériste', arboriculteur: 'Arboriculteur', conservatoire: 'Conservatoire' }[pType] || pType)}</span>
  <span class="cca-profile-locked">🔒 ${esc(T('profile.locked') || 'Verrouillé')}</span>
</div>
<div class="cca-profile-hint">${esc(T('profile.lockedHint') || "Type de profil géré par l'administrateur")}</div>`}
</div>
</div>
<div class="prof-section"><div class="prof-section-title">${T('misc.profPersonal')}</div>
<div class="prof-row"><span class="prof-row-label">Nom complet</span><span class="prof-row-val"><input type="text" id="pf-name" value="${esc(prof.name || '')}"/></span></div>
<div class="prof-row"><span class="prof-row-label">E-mail de récupération</span><span class="prof-row-val"><input type="email" id="pf-email" value="${esc(cfg.recoveryEmail || '')}" placeholder="email de récupération du mot de passe"/></span></div>
<div class="prof-row"><span class="prof-row-label">Localisation</span><span class="prof-row-val"><input type="text" id="pf-loc" value="${esc(prof.loc || '')}" placeholder="Ville, Région"/></span></div>
<div class="prof-row"><span class="prof-row-label">Description</span><span class="prof-row-val"><input type="text" id="pf-bio" value="${esc(prof.bio || '')}"/></span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profSince')}</span><span class="prof-row-val"><input type="text" id="pf-since" value="${esc(prof.since || '')}" placeholder="ex : 2015"/></span></div>
</div>
<div class="prof-section"><div class="prof-section-title">Ma collection · 🪴 Culture en pot</div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profOrangerie')}</span><span class="prof-row-val"><input type="text" id="pf-ovw" value="${esc(prof.orangerie || '')}" placeholder="ex : orangerie non chauffée"/></span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profSubstrate')}</span><span class="prof-row-val"><input type="text" id="pf-sub" value="${esc(prof.substrate || '')}" placeholder="ex : terreau + pouzzolane"/></span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profWater')}</span><span class="prof-row-val"><input type="text" id="pf-water" value="${esc(prof.water || '')}" placeholder="ex : eau de pluie"/></span></div>
</div>
<div class="prof-section"><div class="prof-section-title">Ma collection · 🌳 Pleine terre</div>
<div class="prof-row"><span class="prof-row-label">Type de sol</span><span class="prof-row-val"><input type="text" id="pf-soil" value="${esc(prof.soil || '')}" placeholder="ex : limoneux-sableux"/></span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profExpo')}</span><span class="prof-row-val"><input type="text" id="pf-expo" value="${esc(prof.expo || '')}" placeholder="ex : plein sud"/></span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profZone')}</span><span class="prof-row-val"><input type="text" id="pf-zone" value="${esc(prof.zone || '')}" placeholder="ex : USDA 8b, H2"/></span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profWinterStrat')}</span><span class="prof-row-val"><input type="text" id="pf-wintert" value="${esc(prof.wintert || '')}" placeholder="ex : voile P17 + paillage"/></span></div>
</div>
${pType === 'pepinieriste' ? `<div class="prof-section" style="border-left:3px solid var(--g2)"><div class="prof-section-title">🌱 Pépinière</div>
<div class="prof-row"><span class="prof-row-label">Raison sociale</span><span class="prof-row-val"><input type="text" id="pf-company" value="${esc(prof.company || '')}" placeholder="Nom de la pépinière"/></span></div>
<div class="prof-row"><span class="prof-row-label">N° SIRET</span><span class="prof-row-val"><input type="text" id="pf-siret" value="${esc(prof.siret || '')}" placeholder="123 456 789 00012"/></span></div>
<div class="prof-row"><span class="prof-row-label">Agrément pépiniériste</span><span class="prof-row-val"><input type="text" id="pf-agrement" value="${esc(prof.agrement || '')}" placeholder="N° RNPV"/></span></div>
<div class="prof-row"><span class="prof-row-label">Zone de vente</span><span class="prof-row-val"><input type="text" id="pf-salezone" value="${esc(prof.salezone || '')}" placeholder="ex : locale, nationale, UE"/></span></div>
<div class="prof-row"><span class="prof-row-label">Certifications</span><span class="prof-row-val"><input type="text" id="pf-certif" value="${esc(prof.certif || '')}" placeholder="ex : Agriculture Bio, HVE"/></span></div>
</div>` : ''}
${pType === 'arboriculteur' ? `<div class="prof-section" style="border-left:3px solid var(--terra)"><div class="prof-section-title">🌳 Exploitation</div>
<div class="prof-row"><span class="prof-row-label">Raison sociale</span><span class="prof-row-val"><input type="text" id="pf-company" value="${esc(prof.company || '')}" placeholder="Nom de l'exploitation"/></span></div>
<div class="prof-row"><span class="prof-row-label">N° SIRET</span><span class="prof-row-val"><input type="text" id="pf-siret" value="${esc(prof.siret || '')}" placeholder="123 456 789 00012"/></span></div>
<div class="prof-row"><span class="prof-row-label">Surface totale (ha)</span><span class="prof-row-val"><input type="number" id="pf-surface" min="0" step="0.1" value="${esc(prof.surface || '')}" placeholder="ex : 2.5"/></span></div>
<div class="prof-row"><span class="prof-row-label">N° PACAGE</span><span class="prof-row-val"><input type="text" id="pf-pacage" value="${esc(prof.pacage || '')}" placeholder="N° déclaration PAC"/></span></div>
<div class="prof-row"><span class="prof-row-label">Certifications</span><span class="prof-row-val"><input type="text" id="pf-certif" value="${esc(prof.certif || '')}" placeholder="ex : HVE3, Agriculture Bio, Label Rouge"/></span></div>
<div class="prof-row"><span class="prof-row-label">Canaux de vente</span><span class="prof-row-val"><input type="text" id="pf-salezone" value="${esc(prof.salezone || '')}" placeholder="ex : marché, grossiste, AMAPs"/></span></div>
</div>` : ''}
${pType === 'conservatoire' ? `<div class="prof-section" style="border-left:3px solid var(--blue)"><div class="prof-section-title">🏛 Institution</div>
<div class="prof-row"><span class="prof-row-label">Nom officiel</span><span class="prof-row-val"><input type="text" id="pf-company" value="${esc(prof.company || '')}" placeholder="ex : Conservatoire National des Agrumes"/></span></div>
<div class="prof-row"><span class="prof-row-label">Organisme de tutelle</span><span class="prof-row-val"><input type="text" id="pf-tutelle" value="${esc(prof.tutelle || '')}" placeholder="ex : INRAE, CIRAD, Collectivité"/></span></div>
<div class="prof-row"><span class="prof-row-label">Partenaires</span><span class="prof-row-val"><input type="text" id="pf-partners" value="${esc(prof.partners || '')}" placeholder="ex : UCR, USDA, BRC-Citrus"/></span></div>
<div class="prof-row"><span class="prof-row-label">Accès public</span><span class="prof-row-val"><input type="text" id="pf-access" value="${esc(prof.access || '')}" placeholder="ex : visites guidées sur RDV"/></span></div>
<div class="prof-row"><span class="prof-row-label">Référent scientifique</span><span class="prof-row-val"><input type="text" id="pf-scientist" value="${esc(prof.scientist || '')}" placeholder="Nom du responsable collections"/></span></div>
</div>` : ''}
<div class="prof-section"><div class="prof-section-title">${T('misc.profNotes')}</div>
<div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px">
<span class="prof-row-label">${T('misc.profNotes')}</span>
<textarea id="pf-notes" style="width:100%;border:1px solid var(--cream3);border-radius:6px;padding:8px 10px;font-size:.82rem;background:var(--amber2);color:var(--brown);font-style:italic;min-height:60px;resize:vertical">${esc(prof.notes || '')}</textarea>
</div></div>
<div class="prof-section" style="border-left:3px solid var(--g2)">
  <div class="prof-section-title">🗺 Observatoire communautaire</div>
  <div class="prof-row" style="flex-direction:column;align-items:flex-start;gap:6px">
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.82rem">
      <input type="checkbox" id="pf-obs-optin" ${prof.obsOptin ? 'checked' : ''} onchange="document.getElementById('pf-obs-commune-row').style.display=this.checked?'flex':'none'"/>
      <span>Participer à l'observatoire communautaire</span>
    </label>
    <div style="font-size:.75rem;color:var(--muted);line-height:1.4">Vos signalements seront publiés sous votre nom avec la maille commune. Aucune contribution anonyme n'est acceptée.</div>
  </div>
  <div class="prof-row" id="pf-obs-commune-row" style="display:${prof.obsOptin ? 'flex' : 'none'}">
    <span class="prof-row-label">Commune de référence <span style="color:#c62828">*</span></span>
    <span class="prof-row-val"><input type="text" id="pf-obs-commune" value="${esc(prof.obsCommune || '')}" placeholder="ex : Nice, Menton, Antibes…"/></span>
  </div>
</div>
<button class="prof-action-btn pab-green" onclick="saveProfile()">${T('misc.profSave')}</button>
<div class="prof-section"><div class="prof-section-title">Données${helpBtn('donnees')}</div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profSubjects')}</span><span class="prof-row-val">${plants.length} (${nPot} pot · ${nTerre} terre)</span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profEvents')}</span><span class="prof-row-val">${totalEvents}</span></div>
<div class="prof-row"><span class="prof-row-label">${T('misc.profPhotos')}</span><span class="prof-row-val">${totalPhotos}</span></div>
</div>
<button class="prof-action-btn pab-neutral" onclick="exportData()">${T('misc.profExport')}</button>
<button class="prof-action-btn pab-neutral" onclick="exportCollectionXLSX()" style="background:rgba(21,101,192,.06);border-color:rgba(21,101,192,.2);color:#1565c0">📊 Export Excel (XLSX)</button>
<button class="prof-action-btn pab-neutral" onclick="document.getElementById('imp-file').click()">${T('misc.profImport')}</button>
<input type="file" id="imp-file" accept=".json" style="display:none" onchange="importData(event)"/>
${['collectionneur', 'conservatoire'].includes(pType) ? `<button class="prof-action-btn pab-neutral" onclick="exportInsurancePDF()" style="background:rgba(21,101,192,.06);border-color:rgba(21,101,192,.2);color:#1565c0">📋 Rapport assurance</button>` : ''}
<button class="prof-action-btn pab-neutral" data-action="open-guide-chapter" data-guide-anchor="">📚 ${esc(T('guide.fullGuide') || 'Guide nutrition complet')}</button>
<button class="prof-action-btn pab-red" onclick="window.__CCA_AuthLogout?.logoutUser(T('misc.logoutConfirm'))">${T('misc.profLogout')}</button>
<div style="height:20px"></div>`;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function mount(container, ctx) {
  _ctx = ctx;
  container.innerHTML = renderSettings();
}

window.__CCA_settings = { mount };
window.buildHistList = buildHistList;
