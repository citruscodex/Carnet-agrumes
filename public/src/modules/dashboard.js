'use strict';
import { esc } from '../lib/esc.js';

// Wrapper i18n — T est une function declaration dans l'inline script (donc sur window)
const T = k => window.T?.(k) ?? k;

// État injecté par mount() à chaque affichage du dashboard
let _plants, _nurseryData;

export function mount(container, ctx) {
  _plants       = ctx.plants       ?? [];
  _nurseryData  = ctx.nurseryData  ?? { semis:[], grafts:[], boutures:[] };
  container.innerHTML = _renderDash();
  window._mountPheno?.('dash');
}

window.__CCA_dashboard = { mount };

// ── Dispatcher profil ─────────────────────────────────────────────────────────

function _renderDash() {
  const pType = (window.getProfile().profileType) || 'collectionneur';
  if (pType === 'pepinieriste')  return _renderDashPepinieriste();
  if (pType === 'arboriculteur') return _renderDashArboriculteur();
  if (pType === 'conservatoire') return _renderDashConservatoire();
  return _renderDashCollectionneur();
}

// ── Blocs transversaux ────────────────────────────────────────────────────────

function _dashWeatherGelBlock() {
  const gel = window.getGelAlert();
  const gelForecastTemp = window.WX?.data?.daily?.temperature_2m_min?.[0] ?? null;
  const tomorrowMin     = window.WX?.data?.daily?.temperature_2m_min?.[1] ?? null;
  const triggered   = gel.enabled && gelForecastTemp !== null && gelForecastTemp <= gel.threshold;
  const tomorrowWarn= gel.enabled && !triggered && tomorrowMin !== null && tomorrowMin <= gel.threshold;
  let alertBanner = '';
  if (triggered)    alertBanner = `<div class="gel-alert-banner danger"><div class="gel-alert-ico">🚨</div><div class="gel-alert-text"><div class="gel-alert-title">Alerte gel active — ${Math.round(gelForecastTemp)}°C prévu aujourd'hui</div><div class="gel-alert-sub">Minimum en dessous du seuil (${gel.threshold}°C). Vérifiez la protection de vos agrumes en pot et pleine terre.</div></div></div>`;
  else if (tomorrowWarn) alertBanner = `<div class="gel-alert-banner"><div class="gel-alert-ico">❄️</div><div class="gel-alert-text"><div class="gel-alert-title">Risque gel demain — ${Math.round(tomorrowMin)}°C prévu</div><div class="gel-alert-sub">Anticipez la rentrée des pots sensibles. Seuil : ${gel.threshold}°C.</div></div></div>`;
  let sortisBanner = '';
  const sortisPl = window.getSortisPlants();
  if (sortisPl.length > 0 && gel.enabled && (triggered || tomorrowWarn)) {
    const names   = sortisPl.map(p => `<span style="font-weight:700">${esc(p.name)}</span>`).join(', ');
    const urgency = triggered ? 'danger' : '';
    sortisBanner  = `<div class="gel-alert-banner ${urgency}" style="margin-bottom:8px"><div class="gel-alert-ico">☀️</div><div class="gel-alert-text"><div class="gel-alert-title">⚠ ${sortisPl.length} sujet${sortisPl.length>1?'s':''} à rentrer ce soir</div><div class="gel-alert-sub">${names} — marqué${sortisPl.length>1?'s':''} comme sorti${sortisPl.length>1?'s':''} au soleil.</div></div><button style="background:rgba(255,255,255,.18);border:none;border-radius:8px;color:white;font-size:.75rem;padding:4px 9px;cursor:pointer;flex-shrink:0;white-space:nowrap" data-action="nav" data-page="collection">Voir →</button></div>`;
  } else if (sortisPl.length > 0 && !gel.enabled) {
    sortisBanner = `<div style="background:rgba(232,148,26,.08);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;border:1px solid rgba(232,148,26,.2);display:flex;align-items:center;gap:10px"><span style="font-size:1rem">☀️</span><div style="font-size:.75rem;color:var(--amber3);flex:1">${sortisPl.length} sujet${sortisPl.length>1?'s':''} sorti${sortisPl.length>1?'s':''} au soleil — activez l'alerte gel pour recevoir des rappels de rentrée.</div></div>`;
  }
  const _nc = window.getNotifCfg();
  const _nActive = [_nc.gel,_nc.watering,_nc.fert,_nc.graft,_nc.bbch].filter(Boolean).length;
  const notifIndicator = _nc.enabled
    ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:rgba(45,90,61,.06);border-radius:8px;margin-bottom:6px;border:1px solid rgba(45,90,61,.12)"><span style="font-size:.75rem;color:var(--g2)">🔔 ${_nActive} notification${_nActive>1?'s':''} active${_nActive>1?'s':''}</span><button style="background:none;border:none;color:var(--g2);font-size:.75rem;cursor:pointer;padding:2px 6px;border-radius:6px;font-weight:600" data-action="nav" data-page="settings" data-prof-view="notifs">Gérer →</button></div>`
    : `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:rgba(100,100,100,.05);border-radius:8px;margin-bottom:6px;border:1px solid rgba(100,100,100,.12)"><span style="font-size:.75rem;color:var(--muted)">🔕 Notifications désactivées</span><button style="background:none;border:none;color:var(--muted);font-size:.75rem;cursor:pointer;padding:2px 6px;border-radius:6px;font-weight:600" data-action="nav" data-page="settings" data-prof-view="notifs">Activer →</button></div>`;
  return `${sortisBanner}${alertBanner}${notifIndicator}<div class="wx-card"><div id="wx-inner">${window.renderWxInner?.() ?? ''}</div></div>`;
}

function _dashEventsBlock(limit) {
  const ET  = window.ET  ?? {};
  const evs = _plants.flatMap(p => p.events.map(e => ({...e,pn:p.name,pi:p.id,ct:p.cultureType||'pot'}))).filter(e=>!e.audit).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0, limit || 6);
  return evs.length
    ? evs.map(ev => {
        const et  = ET[ev.type] || ET.observation;
        const bb  = ev.bulk ? `<span style="font-size:.75rem;background:rgba(232,148,26,.14);color:var(--amber3);border-radius:4px;padding:1px 4px;margin-left:3px">${T('misc.collBulkTag')}</span>` : '';
        const ctb = ev.ct === 'terre' ? `<span style="font-size:.75rem;color:var(--terra);margin-left:3px">🌳</span>` : `<span style="font-size:.75rem;color:var(--g3);margin-left:3px">🪴</span>`;
        return `<div class="evrow" data-action="open-plant" data-id="${ev.pi}"><div class="evdot" style="background:${et.c}"></div><div style="flex:1;min-width:0"><div class="evpl">${esc(ev.pn)}${ctb}</div><div class="evds">${et.i} ${et.label}${bb} · ${esc(ev.description.slice(0,50))}${ev.description.length>50?'…':''}</div></div><div class="evdt">${window.fmtDate(ev.date)}</div></div>`;
      }).join('')
    : `<div style="color:var(--muted);font-style:italic;padding:14px 0">${T('misc.noData')}</div>`;
}

function _dashSeasonBanner() {
  const s = window.getSz();
  return `<div id="sbanner"><div class="sb-ph">${T('misc.periodCurrent')}</div><div class="sb-nm">${s.i} ${s.p}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px;margin-top:4px"><div><div style="font-size:.75rem;color:rgba(255,255,255,.32);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">${T('misc.statPot')}</div>${s.pot.slice(0,2).map(t=>`<div class="sb-tp">${esc(t)}</div>`).join('')}</div><div><div style="font-size:.75rem;color:rgba(255,255,255,.32);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">${T('misc.statGround')}</div>${s.terre.slice(0,2).map(t=>`<div class="sb-tp">${esc(t)}</div>`).join('')}</div></div></div>`;
}

// ── Profil Collectionneur ─────────────────────────────────────────────────────

function _renderDashCollectionneur() {
  if (!_plants.length && !localStorage.getItem('cca_onboarding_done')) {
    return `<div class="page" style="padding:32px 20px;text-align:center">
<div style="font-size:3.5rem;margin-bottom:16px">🍊</div>
<h2 style="font-size:1.3rem;font-weight:700;color:var(--g1);margin-bottom:8px">Bienvenue sur CitrusCodex !</h2>
<p style="font-size:.9rem;color:var(--muted);line-height:1.6;max-width:320px;margin:0 auto 24px">Votre carnet de collection d'agrumes.<br>Commencez par ajouter votre premier sujet !</p>
<button class="btn btn-p" style="font-size:.95rem;padding:12px 28px;margin-bottom:24px" data-action="open-add-form">🌱 Ajouter mon premier agrume</button>
<div style="margin-top:4px;border-top:1px solid var(--cream3);padding-top:20px;text-align:left;max-width:320px;margin:20px auto 0">
  <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:12px;font-family:monospace">Découvrir CitrusCodex</div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <button class="btn btn-o" style="text-align:left;display:flex;align-items:center;gap:10px" onclick="wikiView='home';showPage('community')"><span style="font-size:1.1rem">📖</span><span style="font-size:.87rem">Wiki collaboratif agrumes</span></button>
    <button class="btn btn-o" style="text-align:left;display:flex;align-items:center;gap:10px" onclick="wikiView='observatoire';showPage('community')"><span style="font-size:1.1rem">🗺</span><span style="font-size:.87rem">Observatoire CitrusCodex</span></button>
    <button class="btn btn-o" style="text-align:left;display:flex;align-items:center;gap:10px" onclick="wikiView='bourse';showPage('community')"><span style="font-size:1.1rem">🔄</span><span style="font-size:.87rem">Bourse aux greffons</span></button>
  </div>
</div>
<button style="background:none;border:none;color:var(--muted);font-size:.75rem;cursor:pointer;margin-top:20px" onclick="localStorage.setItem('cca_onboarding_done','1');render()">Passer l'introduction</button>
</div>`;
  }
  const s       = window.getSz();
  const STATUS  = window.STATUS ?? {};
  const nPot    = _plants.filter(p => window.isPot(p)).length;
  const nTerre  = _plants.filter(p => !window.isPot(p)).length;
  const iss     = _plants.filter(p => ['vigilance','traitement','critique'].includes(p.status)).length;
  const nIotActive = _plants.filter(p => p.sensor?.enabled && p.sensor?.endpoint && window._iotIsFresh?.(p.sensor)).length;
  const als       = _plants.filter(p => { const u = window.getWateringUrgency(p); return ['vigilance','traitement','critique'].includes(p.status) || (u.rawDays !== null && u.effDays > u.t3); });
  const kbAlerts  = window.getKBAlerts().slice(0, 4);
  const graftAlerts = window.getGraftAlerts().slice(0, 3);
  const prof      = window.getProfile();
  const wish      = window.getWishlist().filter(w => w.status !== 'acquired').slice(0, 3);
  return `${_dashSeasonBanner()}
<div class="page">
${prof.name ? `<div style="font-size:.82rem;color:var(--muted);font-style:italic;margin-bottom:12px">${T('misc.greetHi')} ${esc(prof.name.split(' ')[0])} 👋</div>` : ''}
<div class="secttl">🌤 Météo locale${window.helpBtn?.('meteo') ?? ''}</div>
${_dashWeatherGelBlock()}
<div class="strow">
<div class="stcard"><div class="stlbl">${T('misc.statPot')}</div><div class="stval">${nPot}</div><div class="stsub">${T('misc.statSubjects')}</div></div>
<div class="stcard"><div class="stlbl">${T('misc.statGround')}</div><div class="stval" style="color:var(--terra)">${nTerre}</div><div class="stsub">${T('misc.statSubjects')}</div></div>
<div class="stcard"><div class="stlbl">${T('misc.statAttention')}</div><div class="stval" style="color:#c62828">${iss}</div><div class="stsub">${T('misc.toWatch') || 'à surveiller'}</div></div>
${nIotActive > 0 ? `<div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-pro-view="iot"><div class="stlbl">📡 Capteurs</div><div class="stval" style="color:var(--blue)">${nIotActive}</div><div class="stsub">actifs</div></div>` : `<div class="stcard"><div class="stlbl">${T('misc.statTotal')}</div><div class="stval">${_plants.length}</div><div class="stsub">${T('misc.statSubjects')}</div></div>`}
</div>
<div id="wg-container">${(()=>{try{return window.renderNeedsGauges?.()??'';}catch(e){return '';}})()}</div>
${(()=>{try{return window.renderETPPanel?.()??'';}catch(e){return '';}})()}
<div id="fg-container">${(()=>{try{return window.renderFertGauges?.()??'';}catch(e){return '';}})()}</div>
${als.length ? `<h3 class="secttl">${T('misc.watchPoints')}</h3>${als.map(p=>{const u=window.getWateringUrgency(p),d=u.rawDays,iw=d!==null&&u.effDays>u.t3;return`<div class="alcard ${p.status==='critique'?'danger':iw&&p.status==='bon'?'info':''}" data-action="open-plant" data-id="${p.id}"><div style="font-size:1rem;flex-shrink:0">${p.status==='critique'?'🚨':iw?'💧':'⚠️'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(p.name)}</div><div style="font-size:.75rem;color:var(--muted)">${p.status!=='bon'&&p.status!=='excellent'?STATUS[p.status]?.label:''}${iw?` · ${T('misc.wateringAgo')}${d}${T('misc.daysAgo')}`:''}</div></div></div>`;}).join('')}` : ''}
${wish.length ? `<h3 class="secttl">🌱 Wishlist — acquisitions souhaitées</h3>${wish.map(w=>`<div class="alcard info" data-action="nav" data-page="collection" data-coll-view="wishlist"><div style="font-size:1rem;flex-shrink:0">${{high:'🔴',med:'🟡',low:'🟢'}[w.priority]||'🟡'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(w.species)}</div><div style="font-size:.75rem;color:var(--muted)">${w.source||''} · ${{wanted:'Souhaité',searching:'En recherche',found:'Trouvé'}[w.status]||w.status}</div></div></div>`).join('')}<div style="text-align:right;margin-top:4px"><button class="btn btn-sm" style="font-size:.75rem" data-action="nav" data-page="collection" data-coll-view="wishlist">Voir tout →</button></div>` : ''}
${graftAlerts.length ? `<div style="margin-bottom:8px;background:#f0f7f0;border-radius:10px;border:1px solid rgba(56,142,60,.2);overflow:hidden"><div style="padding:8px 12px 4px;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:#388e3c;font-weight:700">🌿 Greffes</div>${graftAlerts.map(a=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-top:1px solid rgba(56,142,60,.1);font-size:.75rem"><span>${a.type==='graft_ready'?'🌿✓':'⏱'}</span><span style="flex:1"><strong>${esc(a.pname)}</strong> — ${esc(a.msg)}</span><button class="btn btn-sm" style="font-size:.75rem;padding:2px 7px;flex-shrink:0" data-action="sel-plant" data-id="${a.pid}">→</button></div>`).join('')}</div>` : ''}
${_renderDashBBCHCard()}
${(()=>{
  const _oadAlerts = window.getOADAlerts?.() ?? [];
  if (!_oadAlerts.length) return '';
  const rc = r => r===3?'#c62828':r===2?'#e65100':'#f9a825';
  const rl = r => r===3?'Élevé':r===2?'Modéré':'Faible';
  return `<div style="margin-bottom:8px;background:rgba(198,40,40,.04);border-radius:10px;border:1px solid rgba(198,40,40,.2);overflow:hidden">
    <div style="padding:8px 12px 4px;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:#c62828;font-weight:700">🔬 OAD — Risques phyto (7 jours)</div>
    ${_oadAlerts.map(a=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-top:1px solid rgba(198,40,40,.1);font-size:.75rem">
      <span style="font-weight:700;color:${rc(a.risk)};font-size:.75rem;font-family:'JetBrains Mono',monospace">${rl(a.risk)}</span>
      <span style="flex:1"><strong>${esc(a.plant.name)}</strong> — ${a.model.icon} ${a.model.name}</span>
      <button class="btn btn-sm" style="font-size:.75rem;padding:2px 7px;flex-shrink:0;color:#c62828;background:rgba(198,40,40,.08)" data-action="open-plant" data-id="${a.plant.id}">→</button>
    </div>`).join('')}
  </div>`;
})()}
${kbAlerts.length ? `<div style="margin-bottom:8px;background:#f5f5ff;border-radius:10px;border:1px solid rgba(92,107,192,.2);overflow:hidden"><div style="padding:8px 12px 4px;font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:#5c6bc0;font-weight:700">📚 Alertes KB</div>${kbAlerts.map(a=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-top:1px solid rgba(92,107,192,.1);font-size:.75rem"><span>${a.type==='pest'?(a.risk===3?'🔴':'🟡'):'✂️'}</span><span style="flex:1"><strong>${esc(a.pname)}</strong> — ${esc(a.msg)}</span><button class="btn btn-sm" style="font-size:.75rem;padding:2px 7px;flex-shrink:0" data-action="sel-plant" data-id="${a.pid}">→</button></div>`).join('')}</div>` : ''}
${(()=>{if(!window.__CCA_drip)return'';const _dSystems=window.__CCA_drip.getAllSystems();if(!_dSystems.length)return'';const _dToday=_dSystems.map(sys=>{const _dRes=window.__CCA_drip.calcSystemIrrigation(sys,_plants);return{sys,durationMin:_dRes.durationMin,overCount:(_dRes.overIrrigated||[]).length};});return`<div style="margin-bottom:8px;background:rgba(21,101,192,.04);border-radius:10px;border:1px solid rgba(21,101,192,.18);overflow:hidden"><div style="padding:8px 12px 4px;display:flex;align-items:center;justify-content:space-between"><span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--blue,#1565c0);font-weight:700">💧 ${T('drip.title')||"Irrigation"}</span><button class="btn btn-sm" style="font-size:.72rem;padding:2px 7px;color:var(--blue,#1565c0);background:rgba(21,101,192,.08)" data-action="nav" data-page="drip">${T('drip.manage')||'Gérer'} →</button></div>${_dToday.map(({sys,durationMin,overCount})=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-top:1px solid rgba(21,101,192,.1);font-size:.77rem"><span style="flex:1;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sys.name)}</span><span style="font-family:'JetBrains Mono',monospace;color:var(--blue,#1565c0)">${durationMin}min</span>${overCount?`<span class="cca-drip-over-tag">⚠ ${overCount}</span>`:''}</div>`).join('')}</div>`;})()}
<h3 class="secttl" style="margin-top:4px">${T('misc.lastEvents')}</h3>
${_dashEventsBlock(6)}
${(()=>{const nd=_nurseryData;const semis=(nd.semis||[]).filter(s=>!s.archived);const greffes=(nd.grafts||[]).filter(g=>!g.archived);const boutures=(nd.boutures||[]).filter(b=>!b.archived);if(!semis.length&&!greffes.length&&!boutures.length)return'';return`<h3 class="secttl" style="margin-top:4px">🌱 Pépinière</h3><div style="display:flex;gap:8px;margin-bottom:8px">${semis.length?`<div class="stcard" style="flex:1;cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="semis"><div class="stlbl">🌱 Semis</div><div class="stval">${semis.length}</div><div class="stsub">en cours</div></div>`:''}${greffes.length?`<div class="stcard" style="flex:1;cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="greffes"><div class="stlbl">✂️ Greffes</div><div class="stval" style="color:var(--text-accent)">${greffes.length}</div><div class="stsub">en cours</div></div>`:''}${boutures.length?`<div class="stcard" style="flex:1;cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="boutures"><div class="stlbl">🌿 Boutures</div><div class="stval" style="color:#1565c0">${boutures.length}</div><div class="stsub">en cours</div></div>`:''}</div>`;})()}
</div>`;
}

function _renderDashBBCHCard() {
  const cfg        = window.getCfg();
  const gjc        = cfg.gjcCumul || 0;
  const BBCH_STAGES= window.BBCH_STAGES ?? [];
  const cur        = window.getBBCHCurrentStage(gjc);
  const next       = window.getBBCHNextStage(gjc);
  const maxGJC     = 1200;
  const pct        = Math.min(Math.round(gjc / maxGJC * 100), 100);
  if (!cur && !next) return '';
  const markers = BBCH_STAGES.map(s => {
    const p      = Math.min(Math.round(s.gjc / maxGJC * 100), 100);
    const passed = gjc >= s.gjc;
    return '<div title="' + esc(s.label) + '" style="position:absolute;left:' + p + '%;top:-4px;transform:translateX(-50%);width:9px;height:9px;border-radius:50%;border:1.5px solid white;background:' + (passed ? 'var(--g2)' : 'var(--cream3)') + ';box-shadow:0 0 0 1px ' + (passed ? 'var(--g2)' : '#ccc') + '"></div>';
  }).join('');
  const curRow  = cur ? '<div style="display:flex;align-items:center;gap:8px;padding:4px 12px 2px;border-top:1px solid rgba(74,124,89,.1);font-size:.75rem"><span>' + cur.icon + '</span><span style="flex:1"><strong>' + esc(cur.label) + '</strong> (BBCH ' + cur.bbch + ') — <em style="color:var(--muted)">' + esc(cur.action) + '</em></span></div>' : '';
  const nextRow = next ? '<div style="display:flex;align-items:center;gap:8px;padding:4px 12px 8px;font-size:.75rem;color:var(--muted)"><span>→</span><span>Prochain : ' + next.icon + ' <strong>' + esc(next.label) + '</strong> dans ' + Math.max(0, next.gjc - gjc) + ' GJC</span></div>' : '<div style="padding:4px 12px 8px;font-size:.75rem;color:var(--text-accent);font-weight:600">🏁 Tous les stades atteints</div>';
  return '<div style="margin-bottom:8px;background:linear-gradient(135deg,rgba(74,124,89,.06),rgba(21,101,192,.04));border-radius:10px;border:1px solid rgba(74,124,89,.2);overflow:hidden">'
    + '<div style="padding:8px 12px 6px;font-size:.75rem;font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--text-accent);font-weight:700">🌸 Phénologie BBCH — GJC ' + gjc + ' / ' + maxGJC + '</div>'
    + '<div style="padding:0 12px 4px;position:relative;height:6px;background:var(--cream3);border-radius:3px;margin:0 12px 8px"><div style="width:' + pct + '%;height:6px;background:linear-gradient(90deg,#1565c0,var(--g2),var(--amber3));border-radius:3px"></div>' + markers + '</div>'
    + curRow + nextRow + '</div>';
}

// ── Profil Pépiniériste ───────────────────────────────────────────────────────

function _renderDashPepinieriste() {
  const prof     = window.getProfile();
  const nd       = window.getNursery();
  const sa       = window.getStockAlerts().slice(0, 4);
  const kbAlerts = window.getKBAlerts().slice(0, 3);
  const lotsActifs    = nd.orders.filter(o => o.status !== 'livré' && o.status !== 'annulé').length;
  const plantsReady   = nd.catalog.filter(c => (c.qtyAvail||0) > 0).length;
  const semisEnCours  = nd.semis.filter(s => !s.archived).length;
  const greffesEnCours= (nd.grafts||[]).filter(g => !g.archived).length;
  const caMonth = (()=>{const m=new Date().toISOString().slice(0,7);return(nd.orders||[]).filter(o=>o.status==='livré'&&(o.deliveredAt||'').startsWith(m)).reduce((s,o)=>s+(o.totalAmount||0),0);})();
  return `${_dashSeasonBanner()}
<div class="page">
${prof.name?`<div style="font-size:.82rem;color:var(--muted);font-style:italic;margin-bottom:12px">🌱 ${esc(prof.name.split(' ')[0])} — Espace Pépiniériste</div>`:''}
<div class="secttl">🌤 Météo &amp; Conditions${window.helpBtn?.('meteo')??''}</div>
${_dashWeatherGelBlock()}
<div class="strow">
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="orders"><div class="stlbl">📦 Commandes</div><div class="stval" style="color:var(--amber)">${lotsActifs}</div><div class="stsub">en cours</div></div>
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="catalog"><div class="stlbl">🌿 En catalogue</div><div class="stval" style="color:var(--text-accent)">${plantsReady}</div><div class="stsub">lots disponibles</div></div>
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="semis"><div class="stlbl">🌱 Semis</div><div class="stval">${semisEnCours}</div><div class="stsub">en cours</div></div>
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="greffes"><div class="stlbl">✂️ Greffes</div><div class="stval" style="color:var(--text-accent)">${greffesEnCours}</div><div class="stsub">en cours</div></div>
</div>
${caMonth>0?`<div style="background:linear-gradient(135deg,var(--g1),#1a4028);border-radius:10px;padding:10px 14px;margin-bottom:10px;color:white;display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:.75rem;opacity:.6;font-family:'JetBrains Mono',monospace">CA CE MOIS</div><div style="font-size:1.2rem;font-weight:700">${caMonth.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</div></div><button style="background:rgba(255,255,255,.14);border:none;border-radius:8px;color:white;font-size:.7rem;padding:5px 10px;cursor:pointer" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="rentabilite">📈 Détail →</button></div>`:''}
${sa.length?`<h3 class="secttl">📦 Stocks critiques</h3>${sa.map(a=>`<div class="alcard ${a.empty?'danger':'info'}" data-action="nav" data-page="fert" data-fert-view="stocks"><div style="font-size:1rem;flex-shrink:0">${a.empty?'🔴':'⚠️'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.name)}</div><div style="font-size:.75rem;color:var(--muted)">${a.currentQty} ${window._stockUnitLabel?.(a.unit)??''}${a.alertQty?' · seuil '+a.alertQty:''}</div></div></div>`).join('')}`:''}
${(()=>{const _oa=window.getOADAlerts?.()??[];if(!_oa.length)return'';const rc=r=>r===3?'#c62828':r===2?'#e65100':'#f9a825';const rl=r=>r===3?'Élevé':r===2?'Modéré':'Faible';return`<h3 class="secttl">🔬 OAD Risques phyto</h3>${_oa.map(a=>`<div class="alcard ${a.risk===3?'danger':'info'}" data-action="open-plant" data-id="${a.plant.id}"><div style="font-size:1rem;flex-shrink:0">${a.model.icon}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.plant.name)}</div><div style="font-size:.75rem;color:${rc(a.risk)}">${rl(a.risk)} — ${a.model.name}</div></div></div>`).join('')}`;})()} ${kbAlerts.length?`<h3 class="secttl">📚 Alertes culturales</h3>${kbAlerts.map(a=>`<div class="alcard info" data-action="open-plant" data-id="${a.pid}"><div style="font-size:1rem;flex-shrink:0">${a.type==='pest'?(a.risk===3?'🔴':'🟡'):'✂️'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.pname)}</div><div style="font-size:.75rem;color:var(--muted)">${esc(a.msg)}</div></div></div>`).join('')}`:''}
<div style="display:flex;gap:8px;margin:12px 0 8px"><button class="btn btn-o" style="flex:1" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="dashboard">🌱 Pépinière</button></div>
<h3 class="secttl">${T('misc.lastEvents')}</h3>
${_dashEventsBlock(5)}
</div>`;
}

// ── Profil Arboriculteur ──────────────────────────────────────────────────────

function _renderDashArboriculteur() {
  const prof     = window.getProfile();
  const STATUS   = window.STATUS ?? {};
  const nTerre   = _plants.filter(p => !window.isPot(p)).length;
  const nPot     = _plants.filter(p => window.isPot(p)).length;
  const iss      = _plants.filter(p => ['vigilance','traitement','critique'].includes(p.status)).length;
  const sa       = window.getStockAlerts().slice(0, 3);
  const kbAlerts = window.getKBAlerts().slice(0, 4);
  const etp      = window.WX?.data?.daily;
  const etpVal   = etp ? (window.renderETPPanel?.() ?? '') : '';
  const today    = window.todayStr();
  const certifs  = window.getCertifs();
  const certifAlerts  = certifs.filter(c => { if(!c.expiryDate||c.status!=='actif')return false;const diff=(new Date(c.expiryDate)-new Date(today))/(1000*86400);return diff>=0&&diff<=90; });
  const expiredCertifs= certifs.filter(c => c.status==='actif'&&c.expiryDate&&c.expiryDate<today);
  const parcelles = window.getYieldParcelles();
  const totalPrev = parcelles.reduce((s,p)=>s+(parseFloat(p.yieldForecast)||0),0);
  const totalReel = parcelles.reduce((s,p)=>s+(parseFloat(p.yieldActual)||0),0);
  return `${_dashSeasonBanner()}
<div class="page">
${prof.name?`<div style="font-size:.82rem;color:var(--muted);font-style:italic;margin-bottom:12px">🌳 ${esc(prof.name.split(' ')[0])} — Espace Arboriculteur</div>`:''}
<div class="secttl">🌤 Météo &amp; Irrigation${window.helpBtn?.('meteo')??''}</div>
${_dashWeatherGelBlock()}
<div class="strow">
  <div class="stcard"><div class="stlbl">🌳 Pleine terre</div><div class="stval" style="color:var(--terra)">${nTerre}</div><div class="stsub">sujets</div></div>
  <div class="stcard"><div class="stlbl">🪴 En pot</div><div class="stval">${nPot}</div><div class="stsub">sujets</div></div>
  <div class="stcard"><div class="stlbl">⚠️ Vigilance</div><div class="stval" style="color:#c62828">${iss}</div><div class="stsub">à surveiller</div></div>
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-pro-view="certif"><div class="stlbl">🏅 Certifs</div><div class="stval" style="color:${(certifAlerts.length||expiredCertifs.length)?'var(--red)':'var(--g2)'}">${certifs.filter(c=>c.status==='actif').length}</div><div class="stsub">actives</div></div>
</div>
<div id="wg-container">${(()=>{try{return window.renderNeedsGauges?.()??'';}catch(e){return '';}})()}</div>
${etpVal}
<div id="fg-container">${(()=>{try{return window.renderFertGauges?.()??'';}catch(e){return '';}})()}</div>
${expiredCertifs.length?`<h3 class="secttl">🏅 Certifications expirées</h3>${expiredCertifs.map(c=>`<div class="alcard danger" data-action="nav" data-page="pro" data-pro-view="certif"><div style="font-size:1rem;flex-shrink:0">❌</div><div><div style="font-size:.84rem;font-weight:600">${esc(c.type)}${c.body?' · '+esc(c.body):''}</div><div style="font-size:.75rem;color:var(--muted)">Expirée le ${window.fmtDate(c.expiryDate)}</div></div></div>`).join('')}`:''}
${certifAlerts.length?`<h3 class="secttl">⏰ Certifications à renouveler</h3>${certifAlerts.map(c=>`<div class="alcard info" data-action="nav" data-page="pro" data-pro-view="certif"><div style="font-size:1rem;flex-shrink:0">🏅</div><div><div style="font-size:.84rem;font-weight:600">${esc(c.type)}${c.body?' · '+esc(c.body):''}</div><div style="font-size:.75rem;color:var(--muted)">Expire le ${window.fmtDate(c.expiryDate)}</div></div></div>`).join('')}`:''}
${parcelles.length?`<h3 class="secttl">🍊 Récolte ${new Date().getFullYear()}</h3><div style="display:flex;gap:8px;margin-bottom:8px"><div class="stcard" style="flex:1;cursor:pointer" data-action="nav" data-page="pro" data-pro-view="recolte"><div class="stlbl">Prévu</div><div class="stval" style="font-size:.95rem;color:var(--blue)">${totalPrev.toLocaleString('fr-FR',{maximumFractionDigits:0})} kg</div><div class="stsub">${parcelles.length} parcelle(s)</div></div><div class="stcard" style="flex:1;cursor:pointer" data-action="nav" data-page="pro" data-pro-view="recolte"><div class="stlbl">Récolté</div><div class="stval" style="font-size:.95rem;color:var(--text-accent)">${totalReel.toLocaleString('fr-FR',{maximumFractionDigits:0})} kg</div><div class="stsub">${totalPrev?Math.round(totalReel/totalPrev*100)+'%':'—'} réalisé</div></div></div>`:''}
${sa.length?`<h3 class="secttl">📦 Stocks critiques</h3>${sa.map(a=>`<div class="alcard ${a.empty?'danger':'info'}" data-action="nav" data-page="fert" data-fert-view="stocks"><div style="font-size:1rem;flex-shrink:0">${a.empty?'🔴':'⚠️'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.name)}</div><div style="font-size:.75rem;color:var(--muted)">${a.currentQty} ${window._stockUnitLabel?.(a.unit)??''}</div></div></div>`).join('')}`:''}
${(()=>{const _oa=window.getOADAlerts?.()??[];if(!_oa.length)return'';const rc=r=>r===3?'#c62828':r===2?'#e65100':'#f9a825';const rl=r=>r===3?'Élevé':r===2?'Modéré':'Faible';return`<h3 class="secttl">🔬 OAD Risques phyto</h3>${_oa.map(a=>`<div class="alcard ${a.risk===3?'danger':'info'}" data-action="open-plant" data-id="${a.plant.id}"><div style="font-size:1rem;flex-shrink:0">${a.model.icon}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.plant.name)}</div><div style="font-size:.75rem;color:${rc(a.risk)}">${rl(a.risk)} — ${a.model.name}</div></div></div>`).join('')}`;})()} ${kbAlerts.length?`<h3 class="secttl">🌿 Alertes culturales &amp; phyto</h3>${kbAlerts.map(a=>`<div class="alcard ${a.type==='pest'&&a.risk===3?'danger':'info'}" data-action="open-plant" data-id="${a.pid}"><div style="font-size:1rem;flex-shrink:0">${a.type==='pest'?(a.risk===3?'🔴':'🟡'):'✂️'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.pname)}</div><div style="font-size:.75rem;color:var(--muted)">${esc(a.msg)}</div></div></div>`).join('')}`:''}
<div style="display:flex;gap:8px;margin:12px 0 8px"><button class="btn btn-o" style="flex:1" data-action="nav" data-page="pro" data-pro-view="certif">🏅 Certifications</button><button class="btn btn-o" style="flex:1" data-action="nav" data-page="pro" data-pro-view="recolte">🍊 Récolte</button></div>
<div style="display:flex;gap:8px;margin-bottom:8px"><button class="btn btn-o" style="flex:1" data-action="nav" data-page="pro" data-pro-view="phyto">🌿 Registre phyto</button><button class="btn btn-o" style="flex:1" data-action="nav" data-page="pro" data-pro-view="lots">📦 Lots</button></div>
<h3 class="secttl">${T('misc.lastEvents')}</h3>
${_dashEventsBlock(5)}
</div>`;
}

// ── Profil Conservatoire ──────────────────────────────────────────────────────

function _renderDashConservatoire() {
  const prof      = window.getProfile();
  const accPlants = _plants.filter(p => p.accessionNumber);
  const noAcc     = _plants.filter(p => !p.accessionNumber);
  const activeEx  = window.getExchanges().filter(e => e.status === 'active');
  const iucnCounts= {VU:0,EN:0,CR:0,EW:0};
  _plants.forEach(p => { if (p.iucnStatus && iucnCounts[p.iucnStatus] !== undefined) iucnCounts[p.iucnStatus]++; });
  const threatened = iucnCounts.VU + iucnCounts.EN + iucnCounts.CR + iucnCounts.EW;
  const kbAlerts   = window.getKBAlerts().slice(0, 3);
  const recentAcc  = accPlants.slice(-3).reverse();
  return `${_dashSeasonBanner()}
<div class="page">
${prof.name?`<div style="font-size:.82rem;color:var(--muted);font-style:italic;margin-bottom:12px">🏛 ${esc(prof.name.split(' ')[0])} — Collection vivante</div>`:''}
<div class="secttl">🌤 Conditions météo${window.helpBtn?.('meteo')??''}</div>
${_dashWeatherGelBlock()}
<div class="strow">
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-cons-view="accessions"><div class="stlbl">🔢 Accessions</div><div class="stval" style="color:var(--blue)">${accPlants.length}</div><div class="stsub">enregistrées</div></div>
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-cons-view="exchanges"><div class="stlbl">🔄 Échanges</div><div class="stval" style="color:${activeEx.length?'var(--amber)':'var(--g2)'}">${activeEx.length}</div><div class="stsub">actifs</div></div>
  <div class="stcard" style="cursor:pointer" data-action="nav" data-page="pro" data-cons-view="taxonomy"><div class="stlbl">🌿 Taxons</div><div class="stval" style="color:var(--text-accent)">${[...new Set(_plants.map(p=>p.species).filter(Boolean))].length}</div><div class="stsub">distincts</div></div>
  <div class="stcard"><div class="stlbl">⚠️ Menacés</div><div class="stval" style="color:${threatened?'var(--red)':'var(--g2)'}">${threatened}</div><div class="stsub">IUCN VU+</div></div>
</div>
${noAcc.length?`<div class="alcard" style="background:rgba(232,148,26,.08);border:1px solid rgba(232,148,26,.2)"><div style="font-size:1rem;flex-shrink:0">⚠️</div><div><div style="font-size:.84rem;font-weight:600">${noAcc.length} sujet(s) sans accession</div><div style="font-size:.75rem;color:var(--muted)">Assignez des numéros depuis chaque fiche plante.</div></div></div>`:''}
${activeEx.length?`<h3 class="secttl">🔄 Échanges en cours</h3>${activeEx.slice(0,3).map(e=>`<div class="alcard info" data-action="nav" data-page="pro" data-cons-view="exchanges"><div style="font-size:1rem;flex-shrink:0">${{pret:'📤',depot:'📥',echange:'🔄',cession:'📋'}[e.type]||'🔄'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(e.partnerInstitution||'—')}</div><div style="font-size:.75rem;color:var(--muted)">${{pret:'Prêt',depot:'Dépôt',echange:'Échange',cession:'Cession'}[e.type]||e.type}${e.dateReturn?' · retour '+window.fmtDate(e.dateReturn):''}</div></div></div>`).join('')}`:''}
${recentAcc.length?`<h3 class="secttl">🔢 Accessions récentes</h3>${recentAcc.map(p=>`<div class="alcard info" data-action="open-plant" data-id="${p.id}"><div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--blue);font-weight:700;flex-shrink:0;writing-mode:vertical-lr;transform:rotate(180deg)">${esc(p.accessionNumber)}</div><div><div style="font-size:.84rem;font-weight:600">${esc(p.name)}</div><div style="font-size:.75rem;color:var(--muted);font-style:italic">${esc(p.species||'')}${p.iucnStatus?' · '+p.iucnStatus:''}</div></div></div>`).join('')}`:''}
${kbAlerts.length?`<h3 class="secttl">📚 Alertes culturales</h3>${kbAlerts.map(a=>`<div class="alcard ${a.risk===3?'danger':'info'}" data-action="open-plant" data-id="${a.pid}"><div style="font-size:1rem;flex-shrink:0">${a.type==='pest'?(a.risk===3?'🔴':'🟡'):'✂️'}</div><div><div style="font-size:.84rem;font-weight:600">${esc(a.pname)}</div><div style="font-size:.75rem;color:var(--muted)">${esc(a.msg)}</div></div></div>`).join('')}`:''}
<div style="display:flex;gap:8px;margin:12px 0 8px"><button class="btn btn-p" style="flex:1" data-action="nav" data-page="pro" data-cons-view="accessions">📋 Accessions</button><button class="btn btn-p" style="flex:1" data-action="cons-label-pdf">🏷 Étiquettes</button><button class="btn btn-p" style="flex:1" data-action="export-bgci">📤 BGCI</button></div>
<h3 class="secttl">${T('misc.lastEvents')}</h3>
${_dashEventsBlock(5)}
</div>`;
}
