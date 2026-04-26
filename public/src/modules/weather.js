import { esc } from '../lib/esc.js';

const T       = k    => window.T?.(k) ?? k;
const getLd   = ()   => window.getLd?.() ?? {};
const getCfg  = ()   => window.getCfg?.() ?? {};
const setCfg  = cfg  => window.setCfg?.(cfg);
const toast   = msg  => window.toast?.(msg);
const helpBtn = k    => window.helpBtn?.(k) ?? '';
const isPot   = p    => window.isPot?.(p) ?? false;

// ─── State ────────────────────────────────────────────────────────────────────

export let WX = { data: null, loading: false, err: null, coords: null, city: '' };
window.WX = WX;

// ─── Init / fetch ─────────────────────────────────────────────────────────────

export function initWeather() {
  try {
    const cached = sessionStorage.getItem('wx_cache');
    if (cached) {
      const c = JSON.parse(cached);
      if (Date.now() - c.ts < 3600000) {
        WX.data = c.data; WX.coords = c.coords; WX.city = c.city || '';
        updateWxWidget(); return;
      }
    }
    const coordsCached = sessionStorage.getItem('wx_coords');
    if (coordsCached) {
      WX.coords = JSON.parse(coordsCached);
      WX.city = sessionStorage.getItem('wx_city') || '';
      fetchWeather(); return;
    }
    const lsSaved = localStorage.getItem('agrumes_weather_location');
    if (lsSaved) {
      const s = JSON.parse(lsSaved);
      if (s.coords) {
        WX.coords = s.coords; WX.city = s.city || '';
        sessionStorage.setItem('wx_coords', JSON.stringify(WX.coords));
        sessionStorage.setItem('wx_city', WX.city);
        fetchWeather(); return;
      }
    }
  } catch {}
  WX.err = 'no_location'; updateWxWidget();
}

export function _wxRequestGeo() {
  if (!navigator.geolocation) { WX.err = 'denied'; updateWxWidget(); return; }
  WX.loading = true; WX.err = null; updateWxWidget();
  navigator.geolocation.getCurrentPosition(
    pos => {
      WX.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      sessionStorage.setItem('wx_coords', JSON.stringify(WX.coords));
      try { localStorage.setItem('agrumes_weather_location', JSON.stringify({ coords: WX.coords, city: WX.city, savedAt: Date.now() })); } catch {}
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${WX.coords.lat}&lon=${WX.coords.lon}&format=json&accept-language=fr`)
        .then(r => r.json()).then(d => {
          WX.city = d.address?.city || d.address?.town || d.address?.village || d.address?.municipality || '';
          sessionStorage.setItem('wx_city', WX.city);
          try { localStorage.setItem('agrumes_weather_location', JSON.stringify({ coords: WX.coords, city: WX.city, savedAt: Date.now() })); } catch {}
          updateWxWidget();
        }).catch(() => {});
      fetchWeather();
    },
    () => { WX.loading = false; WX.err = 'denied'; updateWxWidget(); }
  );
}

export async function fetchWeather() {
  if (!WX.coords) return;
  WX.loading = true; WX.err = null; updateWxWidget();
  try {
    const { lat, lon } = WX.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m,winddirection_10m,windgusts_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,precipitation_sum,sunrise,sunset,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant&current_weather=true&timezone=auto&forecast_days=7`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    WX.data = await r.json();
    sessionStorage.setItem('wx_cache', JSON.stringify({ data: WX.data, coords: WX.coords, city: WX.city, ts: Date.now() }));
  } catch { WX.err = 'fetch'; }
  WX.loading = false; updateWxWidget();
  const wgEl = document.getElementById('wg-container');
  if (wgEl) wgEl.innerHTML = window.renderNeedsGauges?.() ?? '';
  recordTempHistory();
}

// ─── Temperature history + GJC ───────────────────────────────────────────────

export function recordTempHistory() {
  if (!WX.data) return;
  const daily = WX.data.daily;
  if (!daily || !daily.time?.length) return;
  const todayISO = daily.time[0];
  const todayMin = Math.round(daily.temperature_2m_min[0] * 10) / 10;
  const todayMax = Math.round(daily.temperature_2m_max[0] * 10) / 10;
  const city = WX.city || '';
  let changed = false;
  window.plants = (window.plants || []).map(p => {
    const isOutdoor = !isPot(p) || ['extérieur','jardin','terrasse','pied de mur exposé S','pied de mur exposé SE','pied de mur exposé SO','plein champ'].includes(p.location);
    if (!isOutdoor) return p;
    const hist = p.tempHistory || [];
    if (hist.some(h => h.date === todayISO)) return p;
    changed = true;
    const newEntry = { date: todayISO, min: todayMin, max: todayMax, city };
    const newHist  = [...hist, newEntry].sort((a,b) => a.date > b.date ? -1 : 1).slice(0, 365);
    return { ...p, tempHistory: newHist };
  });
  if (changed) window.saveData?.();
  _updateGJCCumul();
  _checkBBCHAlerts();
}

export function _updateGJCCumul() {
  const BASE_TEMP  = 10;
  const now        = new Date();
  const year       = now.getFullYear();
  const marchFirst = new Date(year, 2, 1);
  const plants     = window.plants || [];

  const dateMap = {};
  plants.forEach(p => {
    const isOutdoor = !isPot(p) || ['extérieur','jardin','terrasse','pied de mur exposé S',
      'pied de mur exposé SE','pied de mur exposé SO','plein champ'].includes(p.location);
    if (!isOutdoor) return;
    (p.tempHistory || []).forEach(h => {
      const d = new Date(h.date);
      if (d < marchFirst || d > now) return;
      if (!dateMap[h.date]) dateMap[h.date] = { min: h.min, max: h.max, n: 1 };
      else {
        dateMap[h.date].min = (dateMap[h.date].min * dateMap[h.date].n + h.min) / (dateMap[h.date].n + 1);
        dateMap[h.date].max = (dateMap[h.date].max * dateMap[h.date].n + h.max) / (dateMap[h.date].n + 1);
        dateMap[h.date].n++;
      }
    });
  });

  const gjc     = Object.values(dateMap).reduce((sum, d) => sum + Math.max(0, (d.min + d.max) / 2 - BASE_TEMP), 0);
  const rounded = Math.round(gjc);
  const cfg     = getCfg();
  const firedYear = cfg.notifBBCHFiredYear;
  const fired     = firedYear === year ? (cfg.notifBBCHFired || {}) : {};
  setCfg({ ...cfg, gjcCumul: rounded, notifBBCHFired: fired, notifBBCHFiredYear: year });
  window.checkPhenologyTransition?.(plants);
}

export function checkPhenologyTransition(plantsArr) {
  if (!window.__CCA_phenology) return;
  const gjc = getCfg().gjcCumul || 0;
  (plantsArr || window.plants || []).filter(p => p && p.species).forEach(p => {
    const key  = `agrumes_pheno_last_${p.id}`;
    let   prev = null;
    try { prev = JSON.parse(localStorage.getItem(key)); } catch {}
    const curr = window.__CCA_phenology.getPhenologyForSpecies(p.species, gjc);
    if (prev) {
      if (prev.principal !== curr.principal.principal) {
        const title = T('pheno.notif.stageChange');
        const body  = T('pheno.notif.stageBody').replace('{plant}', p.name).replace('{stage}', T(curr.principal.i18nKey));
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/carnet-agrumes/icon.svg' });
        } else { toast(`${curr.principal.icon} ${p.name} — ${title} : ${T(curr.principal.i18nKey)}`); }
      }
      if (curr.secondaryAlert && prev.secondaryCode !== curr.secondaryCode) {
        const title = T('pheno.notif.alertTitle');
        const body  = T('pheno.notif.alertBody73').replace('{plant}', p.name);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/carnet-agrumes/icon.svg' });
        } else { toast(`⚠ ${body}`, true); }
      }
    }
    localStorage.setItem(key, JSON.stringify({
      principal: curr.principal.principal, secondaryCode: curr.secondaryCode,
      secondaryAlert: curr.secondaryAlert, gjc
    }));
  });
}

export function _checkBBCHAlerts() {
  const BBCH_STAGES = window.BBCH_STAGES || [];
  const cfg   = getCfg();
  const gjc   = cfg.gjcCumul || 0;
  const year  = new Date().getFullYear();
  const fired = cfg.notifBBCHFired || {};
  const newly = BBCH_STAGES.filter(s => gjc >= s.gjc && !fired[`${s.id}_${year}`])
    .map(s => ({ stage: s, key: `${s.id}_${year}` }));
  if (!newly.length) return;

  const newFired = { ...fired };
  newly.forEach(a => { newFired[a.key] = true; });
  setCfg({ ...getCfg(), notifBBCHFired: newFired });

  const notifCfg = window.getNotifCfg?.() || {};
  if (notifCfg.bbch && 'Notification' in window && Notification.permission === 'granted') {
    const icon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="28">🍊</text></svg>';
    newly.forEach(a => {
      const s       = a.stage;
      const payload = { title: `${s.icon} BBCH ${s.bbch} — ${s.label}`, body: s.action, tag: 'bbch_' + s.id };
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(reg => reg.showNotification(payload.title, { body: payload.body, tag: payload.tag, icon }))
          .catch(() => { try { new Notification(payload.title, { body: payload.body, tag: payload.tag, icon }); } catch {} });
      } else { try { new Notification(payload.title, { body: payload.body, tag: payload.tag, icon }); } catch {} }
    });
  }
  if (window.page === 'dashboard') window.render?.();
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export async function searchCity() {
  const v = document.getElementById('wx-city-inp')?.value?.trim();
  if (!v) return;
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(v)}&count=1&language=fr`);
    const d = await r.json();
    if (!d.results?.length) { toast('Ville introuvable', true); return; }
    const g = d.results[0];
    WX.coords = { lat: g.latitude, lon: g.longitude };
    WX.city   = g.name + (g.country_code ? ', ' + g.country_code : '');
    sessionStorage.setItem('wx_coords', JSON.stringify(WX.coords));
    sessionStorage.setItem('wx_city',   WX.city);
    fetchWeather();
  } catch { toast('Erreur de recherche', true); }
}

export function lunarPhase() {
  const REF     = new Date('2000-01-06T18:14:00Z').getTime();
  const SYNODIC = 29.53059 * 86400000;
  const now     = Date.now();
  const age     = ((now - REF) % SYNODIC + SYNODIC) % SYNODIC;
  const pct     = age / SYNODIC;
  const ageDays = age / 86400000;
  const days    = Math.round(ageDays);
  const illumination = (1 - Math.cos(pct * 2 * Math.PI)) / 2;
  let icon, label, advice, isWaxing;
  if      (pct<0.0169||pct>=0.9831) { icon='🌑'; label=T('misc.moonNvl');          isWaxing=true;  advice=T('misc.moonAdvNvl'); }
  else if (pct<0.0847)               { icon='🌒'; label=T('misc.moonCroissNaiss');  isWaxing=true;  advice=T('misc.moonAdvCroissNaiss'); }
  else if (pct<0.2331)               { icon='🌒'; label=T('misc.moonPremCroiss');   isWaxing=true;  advice=T('misc.moonAdvPremCroiss'); }
  else if (pct<0.2669)               { icon='🌓'; label=T('misc.moonPremQ');        isWaxing=true;  advice=T('misc.moonAdvPremQ'); }
  else if (pct<0.4831)               { icon='🌔'; label=T('misc.moonGibbCroiss');   isWaxing=true;  advice=T('misc.moonAdvGibbCroiss'); }
  else if (pct<0.5169)               { icon='🌕'; label=T('misc.moonPleine');       isWaxing=false; advice=T('misc.moonAdvPleine'); }
  else if (pct<0.6669)               { icon='🌖'; label=T('misc.moonGibbDec');      isWaxing=false; advice=T('misc.moonAdvGibbDec'); }
  else if (pct<0.7331)               { icon='🌗'; label=T('misc.moonDernQ');        isWaxing=false; advice=T('misc.moonAdvDernQ'); }
  else if (pct<0.9169)               { icon='🌘'; label=T('misc.moonDernCroiss');   isWaxing=false; advice=T('misc.moonAdvDernCroiss'); }
  else                               { icon='🌑'; label=T('misc.moonFinCycle');      isWaxing=false; advice=T('misc.moonAdvFinCycle'); }

  const phaseTargets = [0, 0.25, 0.5, 0.75];
  const phaseNames   = [T('misc.moonNextNvl'), T('misc.moonNextPremQ'), T('misc.moonNextPleine'), T('misc.moonNextDernQ')];
  let nextPhaseLabel = '', nextPhaseDays = 0;
  for (let i = 0; i < phaseTargets.length; i++) {
    const target = phaseTargets[i];
    const diff   = target > pct ? target - pct : 1 - pct + target;
    if (nextPhaseDays === 0 || diff < nextPhaseDays / SYNODIC * SYNODIC) {
      nextPhaseLabel = phaseNames[i];
      nextPhaseDays  = Math.round(diff * 29.53);
    }
  }
  return { icon, label, advice, days, pct, illumination, illPct: Math.round(illumination * 100), ageDays, isWaxing, nextPhaseLabel, nextPhaseDays };
}

export function beaufort(kmh) {
  if (kmh<1)   return { b:0,  lbl:T('misc.bft0') };
  if (kmh<6)   return { b:1,  lbl:T('misc.bft1') };
  if (kmh<12)  return { b:2,  lbl:T('misc.bft2') };
  if (kmh<20)  return { b:3,  lbl:T('misc.bft3') };
  if (kmh<29)  return { b:4,  lbl:T('misc.bft4') };
  if (kmh<39)  return { b:5,  lbl:T('misc.bft5') };
  if (kmh<50)  return { b:6,  lbl:T('misc.bft6') };
  if (kmh<62)  return { b:7,  lbl:T('misc.bft7') };
  if (kmh<75)  return { b:8,  lbl:T('misc.bft8') };
  if (kmh<89)  return { b:9,  lbl:T('misc.bft9') };
  if (kmh<103) return { b:10, lbl:T('misc.bft10') };
  if (kmh<118) return { b:11, lbl:T('misc.bft11') };
  return { b:12, lbl:T('misc.bft12') };
}

export function getGelAlert()            { const c=getCfg(); return { enabled:!!c.gelAlertEnabled, threshold:c.gelAlertThreshold??2 }; }
export function setGelAlert(en, thresh)  { const c=getCfg(); setCfg({...c, gelAlertEnabled:en, gelAlertThreshold:thresh??2}); updateWxWidget(); const wg=document.getElementById('wg-container'); if(wg) wg.innerHTML=window.renderNeedsGauges?.()??''; }
export function toggleGelAlert()         { const g=getGelAlert(); setGelAlert(!g.enabled, g.threshold); }
export function setGelThreshold(v)       { const g=getGelAlert(); setGelAlert(g.enabled, parseFloat(v)); const el=document.getElementById('gel-thresh-display'); if(el) el.textContent=v+'°C'; }

export function updateWxWidget() {
  const el = document.getElementById('wx-inner');
  if (el) el.innerHTML = renderWxInner();
}

export function renderWxInner() {
  if (WX.err==='no_location') return `<div class="wx-perm"><button class="btn btn-p btn-sm" style="width:100%;margin-bottom:8px" onclick="_wxRequestGeo()">${T('misc.wxLocate')}</button><div class="wx-city-row"><input id="wx-city-inp" class="wx-city-inp" placeholder="${T('misc.wxCityPh')}" onkeydown="if(event.key==='Enter')searchCity()"/><button class="btn btn-p btn-sm" onclick="searchCity()">OK</button></div></div>`;
  if (WX.loading) return `<div class="wx-loading">${T('misc.wxLoading')}</div>`;
  if (WX.err==='denied') return `<div class="wx-perm"><p>${T('misc.wxPermMsg')}</p><div class="wx-city-row"><input id="wx-city-inp" class="wx-city-inp" placeholder="${T('misc.wxCityPh')}" onkeydown="if(event.key==='Enter')searchCity()"/><button class="btn btn-p btn-sm" onclick="searchCity()">OK</button></div></div>`;
  if (WX.err==='fetch') return `<div class="wx-err">${T('misc.wxErrFetch')} <button onclick="fetchWeather()" style="color:var(--blue);text-decoration:underline">${T('misc.wxRetry')}</button></div>`;
  if (!WX.data) return `<div class="wx-loading">${T('misc.wxLoading')}</div>`;

  const cw = WX.data.current_weather;
  if (!cw) return `<div class="wx-err">${T('misc.wxErrData')} <button onclick="fetchWeather()" style="color:var(--blue);text-decoration:underline">${T('misc.wxRetryBtn')}</button></div>`;

  const wmoInfo  = window.wmoInfo  || (() => ({ i:'🌤' }));
  const dayName  = window.dayName  || ((d,i) => i===0 ? 'Auj.' : d);

  const cwi    = wmoInfo(cw.weathercode || 0);
  const daily  = WX.data.daily  || {};
  const hourly = WX.data.hourly || {};
  const todayMax = daily.temperature_2m_max?.[0] ?? cw.temperature;
  const todayMin = daily.temperature_2m_min?.[0] ?? cw.temperature;

  const now        = new Date();
  const dateLabel  = now.toLocaleDateString(getLd().locale||'fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const dateCapital= dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  const srRaw   = daily.sunrise?.[0] || '';
  const ssRaw   = daily.sunset?.[0]  || '';
  const srTime  = srRaw ? new Date(srRaw).toLocaleTimeString(getLd().locale||'fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—';
  const ssTime  = ssRaw ? new Date(ssRaw).toLocaleTimeString(getLd().locale||'fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—';
  const dayLenMs= srRaw && ssRaw ? new Date(ssRaw) - new Date(srRaw) : 0;
  const dayLenH = dayLenMs ? Math.floor(dayLenMs/3600000)+'h'+String(Math.floor((dayLenMs%3600000)/60000)).padStart(2,'0') : '';

  const moon = lunarPhase();

  const nowISO = now.toISOString().slice(0,13);
  const htimes = hourly.time || [];
  let hIdx = htimes.findIndex(t => t >= nowISO);
  if (hIdx < 0) hIdx = 0;
  const hSlice  = htimes.slice(hIdx, hIdx+13);
  const temps   = (hourly.temperature_2m||[]).slice(hIdx, hIdx+13);
  const precips = (hourly.precipitation_probability||[]).slice(hIdx, hIdx+13);
  const codes   = (hourly.weathercode||[]).slice(hIdx, hIdx+13);
  const hHumid  = hourly.relative_humidity_2m || [];
  const humidNow= hHumid.length > hIdx ? Math.round(hHumid[hIdx]) : null;

  function humidComfort(rh) {
    if (rh===null) return { lbl:'—', c:'var(--muted)' };
    const ld = getLd().misc || {};
    if (rh<30) return { lbl:ld.humVeryDry||'Très sec',     c:'#e65100' };
    if (rh<40) return { lbl:ld.humDry||'Sec',              c:'#f57c00' };
    if (rh<=60) return { lbl:ld.humIdeal||'Idéal',         c:'#2e7d32' };
    if (rh<=75) return { lbl:ld.humHumid||'Humide',        c:'#1565c0' };
    if (rh<=85) return { lbl:ld.humVeryHumid||'Très humide', c:'#0d47a1' };
    return { lbl:ld.humSat||'Saturé', c:'#880e4f' };
  }
  const hComfort = humidComfort(humidNow);

  const hWspd   = hourly.windspeed_10m  || [];
  const hWdir   = hourly.winddirection_10m || [];
  const hWgust  = hourly.windgusts_10m  || [];
  const wSamples= Math.min(3, Math.max(1, hWspd.length - hIdx));
  const windSpd = hWspd.length > hIdx
    ? Math.round(hWspd.slice(hIdx, hIdx+wSamples).reduce((a,v) => a+v, 0) / wSamples)
    : Math.round(cw.windspeed || 0);
  const windDirDeg  = hWdir.length > hIdx ? hWdir[hIdx] : (cw.winddirection || 0);
  const windGusts   = hWgust.length > hIdx ? Math.round(Math.max(...hWgust.slice(hIdx, Math.min(hIdx+3, hWgust.length)))) : null;
  const windDomDir  = daily.winddirection_10m_dominant?.[0] ?? windDirDeg;
  const dirNames    = ['N','NE','E','SE','S','SO','O','NO'];
  const windDirLbl  = dirNames[Math.round(windDirDeg/45)%8];
  const windDomLbl  = dirNames[Math.round(windDomDir/45)%8];
  const bft         = beaufort(windSpd);
  const arrowDeg    = (windDirDeg + 180) % 360;
  const tomorrowMin = daily.temperature_2m_min?.[1] ?? null;

  const hourlyHtml = hSlice.map((t,i) => {
    const h = new Date(t).getHours();
    const wi = wmoInfo(codes[i]);
    const p  = precips[i];
    const isNow = i === 0;
    return `<div class="wx-hour${isNow?' now-hr':''}"><div class="h-time">${isNow?'Mnt.':String(h).padStart(2,'0')+'h'}</div><div class="h-icon">${wi.i}</div><div class="h-temp">${Math.round(temps[i])}°</div><div class="h-rain">${p>15?p+'%':''}</div></div>`;
  }).join('');

  const weeklyHtml = (daily.time||[]).map((d,i) => {
    const wi = wmoInfo((daily.weathercode||[])[i]||0);
    return `<div class="wx-day${i===0?' today-day':''}"><div class="d-name">${dayName(d,i)}</div><div class="d-icon">${wi.i}</div><div class="d-hi">${Math.round((daily.temperature_2m_max||[])[i]||0)}°</div><div class="d-lo">${Math.round((daily.temperature_2m_min||[])[i]||0)}°</div></div>`;
  }).join('');

  // GJC / phénologie forecast block
  const dailyTmax = daily.temperature_2m_max || [];
  const dailyTmin = daily.temperature_2m_min || [];
  const isWinter  = now.getMonth() < 2 || now.getMonth() > 9;
  const BASE_TEMP = 10;
  let gjcForecast = 0;
  dailyTmax.forEach((tmax,i) => { gjcForecast += Math.max(0, ((tmax + (dailyTmin[i]||tmax))/2) - BASE_TEMP); });
  gjcForecast = Math.round(gjcForecast);
  const hourlyTemps    = hourly.temperature_2m || [];
  const coldHoursWeek  = hourlyTemps.filter(t => t < 7).length;
  const coldHoursToday = hourlyTemps.slice(hIdx, hIdx+24).filter(t => t < 7).length;
  const gjcTotal   = getCfg().gjcCumul || 0;
  const gjcDisplay = gjcTotal + gjcForecast;
  let phenoMsg = '';
  if (!isWinter) {
    if      (gjcDisplay<200)  phenoMsg = '🌸 Pré-floraison / débourrement attendu';
    else if (gjcDisplay<400)  phenoMsg = '🌸 Floraison en cours pour espèces précoces';
    else if (gjcDisplay<700)  phenoMsg = '🍋 Nouaison et développement fruits';
    else if (gjcDisplay<1000) phenoMsg = '🍊 Véraison approche sur variétés précoces';
    else                      phenoMsg = '🟠 Maturité en cours';
  } else { phenoMsg = '❄️ Dormance hivernale — cumul heures de froid actif'; }

  const getBBCHCurrentStage = window.getBBCHCurrentStage || (() => null);
  const getBBCHNextStage    = window.getBBCHNextStage    || (() => null);
  const BBCH_STAGES         = window.BBCH_STAGES         || [];
  const bbchCur  = getBBCHCurrentStage(gjcDisplay);
  const bbchNext = getBBCHNextStage(gjcDisplay);
  const maxGJC   = 1200;
  const pctCur   = Math.min(Math.round(gjcDisplay/maxGJC*100), 100);

  const bbchBar = (!isWinter && dailyTmax.length >= 2) ? (() => {
    const stageMarkers = BBCH_STAGES.map(s => {
      const pct = Math.min(Math.round(s.gjc/maxGJC*100), 100);
      return `<div title="${s.label} (BBCH ${s.bbch})" style="position:absolute;left:${pct}%;top:-5px;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;border:2px solid white;background:${gjcDisplay>=s.gjc?'var(--g2)':'var(--cream3)'};box-shadow:0 0 0 1px ${gjcDisplay>=s.gjc?'var(--g2)':'#ccc'}"></div>`;
    }).join('');
    return `<div style="margin-top:8px">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
  <span style="font-size:.75rem;font-weight:700;color:var(--text-accent)">${bbchCur?bbchCur.icon+' '+bbchCur.label:'❄️ Pré-saison'}</span>
  <span style="font-size:.75rem;color:var(--muted)">GJC ${gjcDisplay} / ${maxGJC}</span>
</div>
<div style="position:relative;height:6px;background:var(--cream3);border-radius:3px;margin-bottom:10px">
  <div style="width:${pctCur}%;height:6px;background:linear-gradient(90deg,#1565c0,var(--g2),var(--amber3));border-radius:3px"></div>
  ${stageMarkers}
</div>
${bbchNext?`<div style="font-size:.75rem;color:var(--muted)">Prochain stade : ${bbchNext.icon} <strong>${bbchNext.label}</strong> (BBCH ${bbchNext.bbch}) — encore ${Math.max(0,bbchNext.gjc-gjcDisplay)} GJC · <em>${bbchNext.action}</em></div>`:'<div style="font-size:.75rem;color:var(--text-accent);font-weight:600">🏁 Tous les stades atteints cette saison</div>'}
</div>`;
  })() : '';

  const phenoBlock = dailyTmax.length >= 2 ? `<div style="padding:10px 14px;border-bottom:1px solid var(--cream3);background:linear-gradient(90deg,rgba(74,124,89,.04),rgba(255,255,255,0))">
<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--g3);margin-bottom:6px;font-weight:700">🌡 Phénologie — 7 jours à venir${helpBtn('gjc')}</div>
<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
  <div style="text-align:center">
    <div style="font-size:1.05rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${gjcForecast>0?'var(--amber3)':'var(--muted)'}">${gjcForecast>0?'+'+gjcForecast:0}</div>
    <div style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">GJC semaine</div>
    <div style="font-size:.75rem;color:var(--muted)">base 10°C</div>
  </div>
  <div style="width:1px;height:32px;background:var(--cream3);flex-shrink:0"></div>
  <div style="text-align:center">
    <div style="font-size:1.05rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${coldHoursWeek>20?'#1565c0':'var(--muted)'}">${coldHoursWeek}</div>
    <div style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.07em">H. froid</div>
    <div style="font-size:.75rem;color:var(--muted)">< 7°C · 7j</div>
  </div>
  <div style="width:1px;height:32px;background:var(--cream3);flex-shrink:0"></div>
  <div style="flex:1;min-width:100px">
    <div style="font-size:.75rem;color:var(--text);line-height:1.4">${phenoMsg}</div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:2px">Indicateur — conditions météo locales</div>
  </div>
</div>
${bbchBar}
<div id="cca-pheno-dash"></div>
</div>` : '<div id="cca-pheno-dash"></div>';

  const moonSvg = (() => {
    const f=moon.illumination, r=21, cx=22;
    const b=(r*Math.abs(1-2*f)).toFixed(2);
    const isW=moon.isWaxing;
    let mc;
    if (isW) {
      mc = f<=0.5
        ? `<rect x="${cx}" y="0" width="${cx}" height="44" fill="white"/><ellipse cx="${cx}" cy="${cx}" rx="${b}" ry="${r}" fill="black"/>`
        : `<rect x="${cx}" y="0" width="${cx}" height="44" fill="white"/><g clip-path="url(#mcL)"><ellipse cx="${cx}" cy="${cx}" rx="${b}" ry="${r}" fill="white"/></g>`;
    } else {
      mc = f<=0.5
        ? `<rect x="0" y="0" width="${cx}" height="44" fill="white"/><ellipse cx="${cx}" cy="${cx}" rx="${b}" ry="${r}" fill="black"/>`
        : `<rect x="0" y="0" width="${cx}" height="44" fill="white"/><g clip-path="url(#mcR)"><ellipse cx="${cx}" cy="${cx}" rx="${b}" ry="${r}" fill="white"/></g>`;
    }
    return `<svg viewBox="0 0 44 44">
  <defs>
    <clipPath id="mcL"><rect x="0" y="0" width="22" height="44"/></clipPath>
    <clipPath id="mcR"><rect x="22" y="0" width="22" height="44"/></clipPath>
    <mask id="moonM"><circle cx="22" cy="22" r="21" fill="black"/>${mc}</mask>
  </defs>
  <circle cx="22" cy="22" r="21" fill="#1a1a2e" stroke="rgba(255,255,255,.15)" stroke-width=".7"/>
  <circle cx="22" cy="22" r="21" fill="#f5f0e0" mask="url(#moonM)"/>
  <circle cx="22" cy="22" r="21" fill="none" stroke="rgba(245,240,224,.12)" stroke-width="2"/>
</svg>`;
  })();

  return `
<div class="wx-today-bar">
  <div class="wx-today-cell">
    <div class="wx-today-lbl">${T('misc.today2')||'Auj.'}</div>
    <div class="wx-today-val">${dateCapital.split(' ').slice(0,3).join(' ')}</div>
    <div class="wx-today-sub">${dateCapital.split(' ').slice(3).join(' ')}</div>
  </div>
  <div class="wx-today-cell" style="align-items:flex-end">
    <div class="wx-today-lbl">${T('misc.wxConditions')||'Conditions'}</div>
    <div class="wx-today-val">${cwi.i} ${Math.round(cw.temperature)}°C</div>
    <div class="wx-today-sub" title="${esc(WX.city)||''}">▲ ${Math.round(todayMax)}° / ▼ ${Math.round(todayMin)}° · <span style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:bottom">${esc(WX.city)||'position détectée'}</span></div>
  </div>
</div>
<div class="wx-sun-row">
  <div class="wx-sun-item"><span class="wx-sun-ico">🌅</span><div><div class="wx-sun-t">${srTime}</div><div class="wx-sun-lbl">${T('misc.wxSunrise')}</div></div></div>
  <div style="width:1px;height:28px;background:var(--cream3);flex-shrink:0"></div>
  <div class="wx-sun-item"><span class="wx-sun-ico">🌇</span><div><div class="wx-sun-t">${ssTime}</div><div class="wx-sun-lbl">${T('misc.wxSunset')}</div></div></div>
  ${dayLenH?`<div style="width:1px;height:28px;background:var(--cream3);flex-shrink:0"></div><div class="wx-sun-item"><span class="wx-sun-ico">☀️</span><div><div class="wx-sun-t">${dayLenH}</div><div class="wx-sun-lbl">${T('misc.wxDayLen')}</div></div></div>`:''}
  <div style="margin-left:auto;display:flex;align-items:center;gap:4px">
    <div class="wx-refresh" onclick="fetchWeather()" style="font-size:.75rem">↺</div>
    <div class="wx-refresh" onclick="WX.err='no_location';WX.data=null;WX.coords=null;sessionStorage.removeItem('wx_cache');sessionStorage.removeItem('wx_coords');localStorage.removeItem('agrumes_weather_location');updateWxWidget()" style="font-size:.75rem" title="Changer la localisation">📍</div>
  </div>
</div>
<div class="wx-moon-section">
  <div class="wx-moon-top">
    <div class="wx-moon-disc">${moonSvg}</div>
    <div style="flex:1;min-width:0">
      <div class="wx-moon-phase">${moon.icon} ${moon.label}</div>
      <div class="wx-moon-meta">J+${moon.days} · ${T('misc.wxMoonAge')}</div>
      <div class="wx-moon-ill">${moon.illPct}% illuminé · ${moon.isWaxing?T('misc.wxMoonWaxing'):T('misc.wxMoonWaning')}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">${T('misc.wxMoonNext')}</div>
      <div style="font-size:.78rem;font-weight:600;color:#5b64a0">${moon.nextPhaseLabel}</div>
      <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${T('misc.wxMoonIn')} ${moon.nextPhaseDays}${T('misc.daysAgo')[0]}</div>
    </div>
  </div>
  <button class="help-btn" onclick="event.stopPropagation();showHelp('lune')" aria-label="Aide lune" title="Aide" style="position:absolute;top:10px;right:10px">?</button>
  <div class="wx-moon-advice">${moon.advice}</div>
  <div class="wx-moon-cycle">
    ${Array.from({length:29},(_,i)=>{ const p=i/29; const ill=(1-Math.cos(p*2*Math.PI))/2; const isCur=i===Math.min(28,Math.floor(moon.ageDays)); const l=Math.round(20+ill*70); return`<div class="wx-moon-phase-pip" style="background:${isCur?'#e8941a':`hsl(240,20%,${l}%)`}" title="J+${i}"></div>`; }).join('')}
  </div>
  <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px;padding:0 1px"><span>🌑 J0</span><span>🌓 J7</span><span>🌕 J15</span><span>🌗 J22</span><span>J29</span></div>
</div>
<div class="wx-wind-row">
  <div class="wx-wind-arrow" style="transform:rotate(${arrowDeg}deg)" title="Direction vent">↑</div>
  <div style="flex:1">
    <div style="display:flex;align-items:baseline;gap:6px"><span class="wx-wind-spd">${windSpd} km/h</span><span style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${windDirLbl}</span></div>
    <div class="wx-wind-bft">Beaufort ${bft.b} — ${bft.lbl}</div>
    ${windGusts?`<div class="wx-wind-gust">${T('misc.wxWindFrom')} ${windGusts} km/h · ${T('misc.wxWindDom')} ${windDomLbl}</div>`:''}
  </div>
  <div style="text-align:right">
    <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">${T('misc.wxMinToday')}</div>
    <div style="font-size:1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${todayMin<=2?'#c0392b':todayMin<=5?'#e65100':todayMin<=10?'#f57c00':'var(--g2)'}">${Math.round(todayMin)}°C</div>
    ${tomorrowMin!==null?`<div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${T('misc.wxMinTomorrow')} ${Math.round(tomorrowMin)}°</div>`:''}
  </div>
</div>
<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--cream3);background:linear-gradient(90deg,rgba(21,101,192,.04),rgba(255,255,255,0))">
  <span style="font-size:1.3rem;flex-shrink:0">💧</span>
  <div style="flex:1">
    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:2px"><span style="font-size:1.05rem;font-weight:700;color:var(--text-strong);font-family:'JetBrains Mono',monospace">${humidNow!==null?humidNow+'%':'—'}</span>${helpBtn('humidite')}<span style="font-size:.75rem;font-weight:600;color:${hComfort.c}">${hComfort.lbl}</span></div>
    <div style="font-size:.75rem;color:var(--muted)">${T('misc.wxHumLabel')}</div>
    <div style="margin-top:4px;height:4px;background:var(--cream3);border-radius:2px;overflow:hidden"><div style="height:100%;width:${humidNow??0}%;background:linear-gradient(90deg,#e3f2fd,#1565c0);border-radius:2px;transition:width .4s"></div></div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
    <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em">${T('misc.wxHumNext')}</div>
    <div style="display:flex;gap:3px;align-items:flex-end">${hHumid.slice(hIdx,hIdx+6).map((h,i)=>{const pct=Math.round(h);return`<div style="display:flex;flex-direction:column;align-items:center;gap:1px"><div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${pct}%</div><div style="width:8px;height:${Math.max(4,Math.round(pct/5))}px;background:${pct>75?'#1565c0':pct>60?'#42a5f5':pct>40?'#90caf9':'#e3f2fd'};border-radius:1px;opacity:${i===0?1:.7}"></div></div>`;}).join('')}</div>
  </div>
</div>
<div class="wx-hourly-wrap"><div class="wx-hourly">${hourlyHtml}</div></div>
<div class="wx-week-wrap"><div class="wx-week">${weeklyHtml}</div></div>
${phenoBlock}`;
}

// ─── ETP (Evapotranspiration) ─────────────────────────────────────────────────

function _calcRa(latDeg, doy) {
  const phi   = latDeg * Math.PI / 180;
  const dr    = 1 + 0.033 * Math.cos(2 * Math.PI * doy / 365);
  const delta = 0.409 * Math.sin(2 * Math.PI * doy / 365 - 1.39);
  const ws    = Math.acos(-Math.tan(phi) * Math.tan(delta));
  const Gsc   = 0.0820;
  return (24 * 60 / Math.PI) * Gsc * dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
}

export function calcETP_HS(tmax, tmin, latDeg, doy) {
  if (tmax == null || tmin == null || latDeg == null || tmax < tmin) return null;
  const Ra  = _calcRa(latDeg, doy);
  const etp = 0.0023 * Ra * ((tmax+tmin)/2 + 17.8) * Math.sqrt(tmax - tmin);
  return Math.max(0, Math.round(etp * 10) / 10);
}

export function calcKcCitrus(isPotted, month) {
  const kcTerre = [0.65,0.65,0.70,0.80,0.80,0.75,0.70,0.70,0.75,0.75,0.70,0.65];
  const kcPot   = [0.55,0.55,0.62,0.72,0.72,0.68,0.63,0.63,0.68,0.68,0.62,0.55];
  return (isPotted ? kcPot : kcTerre)[Math.max(0, Math.min(11, (month||1)-1))];
}

const RU_COEFF = { 'argileux':2.0,'limoneux':1.8,'limoneux-sableux':1.5,'sableux':0.8,'argileux-calcaire':1.6 };

function _calcRU(plant) {
  if (!isPot(plant)) {
    return Math.round((parseFloat(plant.soilDepth)||60) * (RU_COEFF[plant.sol]||1.5));
  }
  const sz   = parseFloat(plant.potSize) || 30;
  const hPot = sz * 0.9;
  return Math.round(hPot * 0.6 * 1.4);
}

function _calcBilanHydrique(plant) {
  const ru = _calcRU(plant);
  if (!WX.data?.daily || !WX.coords) return { ru, etcTotal:null, rainTotal:null, deficit:null };
  const daily = WX.data.daily;
  const tmax  = daily.temperature_2m_max || [];
  const tmin  = daily.temperature_2m_min || [];
  const rain  = daily.precipitation_sum  || [];
  const n     = Math.min(7, tmax.length);
  let etcTotal=0, rainTotal=0;
  for (let i=0; i<n; i++) {
    const doy   = Math.ceil((new Date(daily.time?.[i]||Date.now()) - new Date(new Date().getFullYear(),0,0)) / 86400000);
    const etp   = calcETP_HS(tmax[i], tmin[i], WX.coords.lat, doy) || 0;
    const month = new Date(daily.time?.[i]||Date.now()).getMonth()+1;
    const kc    = calcKcCitrus(!isPot(plant), month);
    let sf = 1.0;
    if (isPot(plant)) { const sz=parseFloat(plant.potSize)||30; sf=sz<25?0.40:sz<35?0.55:sz<45?0.70:0.85; }
    etcTotal  += etp * kc * sf;
    rainTotal += rain[i] || 0;
  }
  etcTotal  = Math.round(etcTotal  * 10) / 10;
  rainTotal = Math.round(rainTotal * 10) / 10;
  const bilan  = Math.round((rainTotal - etcTotal) * 10) / 10;
  const deficit= Math.max(0, -bilan);
  const surplus= Math.max(0,  bilan);
  const pct    = ru > 0 ? Math.round(deficit/ru*100) : 0;
  return { ru, etcTotal, rainTotal, bilan, deficit, surplus, recommendation: deficit>0 ? Math.round(deficit*1.2*10)/10 : null, pct, n };
}

export function getETPForPlant(plant) {
  if (!WX.data?.daily || !WX.coords) return { etp:null, etc:null, kc:null };
  const daily = WX.data.daily;
  const tmax  = daily.temperature_2m_max?.[0];
  const tmin  = daily.temperature_2m_min?.[0];
  const doy   = Math.ceil((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  const month = new Date().getMonth() + 1;
  const etp   = calcETP_HS(tmax, tmin, WX.coords.lat, doy);
  if (etp===null) return { etp:null, etc:null, kc:null };
  const kc = calcKcCitrus(!isPot(plant), month);
  let sf = 1.0;
  if (isPot(plant)) { const sz=parseFloat(plant.potSize)||30; sf=sz<25?0.40:sz<35?0.55:sz<45?0.70:0.85; }
  return { etp, etc: Math.round(etp*kc*sf*10)/10, kc };
}

export function getETPToday() {
  if (!WX.data?.daily || !WX.coords) return null;
  const daily = WX.data.daily;
  const doy   = Math.ceil((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  return calcETP_HS(daily.temperature_2m_max?.[0], daily.temperature_2m_min?.[0], WX.coords.lat, doy);
}

export function isETPEnabled()  { return !!getCfg().etpExpertMode; }
export function toggleETPMode() { const c=getCfg(); setCfg({...c, etpExpertMode:!c.etpExpertMode}); window.render?.(); }

export function renderETPPanel() {
  if (!isETPEnabled()) return '';
  const etp = getETPToday();
  if (etp===null) return '';
  const month   = new Date().getMonth()+1;
  const plants  = (window.plants||[]).filter(p =>
    !isPot(p) || ['extérieur','jardin','terrasse'].includes(p.location));
  const rows = plants.map(p => {
    const { etc, kc } = getETPForPlant(p);
    const bar  = etc!==null ? Math.min(100, Math.round((etc/8)*100)) : 0;
    const bh   = _calcBilanHydrique(p);
    const def  = bh.deficit;
    const rec  = bh.recommendation;
    const bhPct= bh.pct||0;
    const alert= def!==null && def > bh.ru*0.3;
    const bhRow= bh.deficit!==null ? `<div style="display:flex;align-items:center;gap:5px;margin-top:2px"><div style="flex:1;height:4px;background:var(--cream3);border-radius:2px;overflow:hidden"><div style="width:${Math.min(bhPct,100)}%;height:4px;background:${alert?'#c62828':'#2d7dd2'};border-radius:2px"></div></div><span style="font-size:.75rem;font-weight:700;color:${alert?'#c62828':'var(--muted)'}"> ${def>0?'−'+def+' mm':'+'+bh.surplus+' mm'}${rec?' → apport '+rec+' mm':''}</span></div>` : '';
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--cream3)">
  <div style="flex:1;min-width:0">
    <div style="font-size:.78rem;font-weight:600;color:var(--text-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</div>
    <div style="font-size:.75rem;color:var(--muted)">${isPot(p)?'🪴':'🌳'} Kc ${kc!==null?kc.toFixed(2):'—'} · RU ${bh.ru} mm</div>
    ${bhRow}
  </div>
  <div style="width:60px;height:6px;background:var(--cream3);border-radius:3px;flex-shrink:0"><div style="width:${bar}%;height:6px;background:#2d7dd2;border-radius:3px"></div></div>
  <div style="font-size:.78rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${alert?'#c62828':'#2d7dd2'};min-width:44px;text-align:right">${etc!==null?etc+' mm':'—'}</div>
</div>`;
  }).join('');
  const kcMean = calcKcCitrus(false, month);
  return `<div class="nv-card" style="border-left:3px solid #2d7dd2;margin-top:10px">
<div class="nv-hdr"><span class="nv-hdr-title">💧 ${T('misc.etpTitle')}</span><span class="nv-hdr-badge" style="background:rgba(45,125,210,.1);color:#2d7dd2">${etp} ${T('misc.etpUnit')}</span></div>
<div style="padding:8px 14px 4px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <span style="font-size:.7rem;color:var(--muted)">${T('misc.etpKcLabel')} : <strong>${kcMean.toFixed(2)}</strong></span>
    <span style="font-size:.75rem;color:var(--muted);font-style:italic">${T('misc.etpMethodNote')}</span>
  </div>
  ${plants.length ? rows : '<div style="font-size:.78rem;color:var(--muted);font-style:italic;padding:8px 0">Aucun sujet extérieur / pleine terre.</div>'}
</div>
<div style="padding:5px 14px 10px;font-size:.75rem;color:var(--muted);font-style:italic;line-height:1.4">${T('misc.etpTooltip')}</div>
</div>`;
}

export function weatherFactor() {
  if (!WX.data) return { N:1, P:1, K:1 };
  const temp = WX.data.current_weather?.temperature ?? 15;
  const rain = WX.data.daily?.precipitation_sum?.[0] ?? 0;
  return { N: temp>25?1.15:temp<10?0.85:1, P:1, K:rain>10?1.1:1, Ca:1, Mg:1 };
}

// ─── Global exposure ──────────────────────────────────────────────────────────

window.initWeather           = initWeather;
window._wxRequestGeo         = _wxRequestGeo;
window.fetchWeather          = fetchWeather;
window.recordTempHistory     = recordTempHistory;
window._updateGJCCumul       = _updateGJCCumul;
window.checkPhenologyTransition = checkPhenologyTransition;
window._checkBBCHAlerts      = _checkBBCHAlerts;
window.searchCity            = searchCity;
window.lunarPhase            = lunarPhase;
window.beaufort              = beaufort;
window.getGelAlert           = getGelAlert;
window.setGelAlert           = setGelAlert;
window.toggleGelAlert        = toggleGelAlert;
window.setGelThreshold       = setGelThreshold;
window.updateWxWidget        = updateWxWidget;
window.renderWxInner         = renderWxInner;
window.calcETP_HS            = calcETP_HS;
window.calcKcCitrus          = calcKcCitrus;
window.getETPForPlant        = getETPForPlant;
window.getETPToday           = getETPToday;
window.isETPEnabled          = isETPEnabled;
window.toggleETPMode         = toggleETPMode;
window.renderETPPanel        = renderETPPanel;
window.weatherFactor         = weatherFactor;
