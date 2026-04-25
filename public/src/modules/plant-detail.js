'use strict';
import { esc } from '../lib/esc.js';
const T = k => window.T?.(k) ?? k;

const fmtDate = v => window.fmtDate?.(v) ?? '';
const helpBtn = k => window.helpBtn?.(k) ?? '';
const getFertById = id => window.getFertById?.(id) ?? null;
const fertNPKBadges = f => window.fertNPKBadges?.(f) ?? '';
const isPot = p => window.isPot?.(p) ?? true;
const getVergerData = () => window.getVergerData?.() ?? {};

let _selId, _plants, _eb, _nurseryData, _detHistOpen;

function renderDetail(){
  const STATUS=window.STATUS??{};
  const ET=window.ET??{};
  const LO_TERRE=window.LO_TERRE??[];
  const LO_POT=window.LO_POT??[];
  const SUN_EXP=window.SUN_EXP??[];
  const EXPO=window.EXPO??[];
  const SOL=window.SOL??[];
  const PROT=window.PROT??[];
  const SP=window.SP??[];
  const ET_POT_ONLY=window.ET_POT_ONLY??[];
  const ET_TERRE_ONLY=window.ET_TERRE_ONLY??[];
  const BOUTURE_STATUS=window.BOUTURE_STATUS??{};
  const p=_plants.find(x=>x.id===_selId);if(!p)return'';
  const eb=_eb;
  const nurseryData=_nurseryData;
  const isTerre=eb.cultureType==='terre';
  const isConserv=(window.getProfile?.().profileType||'collectionneur')==='conservatoire';
  const so=Object.entries(STATUS).map(([k,v])=>`<option value="${k}"${eb.status===k?' selected':''}>${v.label}</option>`).join('');
  const loArr=isTerre?LO_TERRE:LO_POT;
  const lo=loArr.map(l=>`<option${eb.location===l?' selected':''}>${l}</option>`).join('');
  const ph=p.photos||[],gh=window.getGH?.();
  const allEvs=[...p.events].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const relevantET=Object.entries(ET).filter(([k])=>{if(k==='modification')return false;if(isTerre&&ET_POT_ONLY.includes(k))return false;if(!isTerre&&ET_TERRE_ONLY.includes(k))return false;return true});
  const _curDet=eb.determinations?.[eb.currentDetermination];
  const detBadge=_curDet?`<div style="font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:1px">${{confirmed:'✓ Confirmé',probable:'~ Probable',uncertain:'? Incertain'}[_curDet.confidence]||''}</div>`:'';
  return`
<div class="dh"><div class="dh-sp">${esc(p.species)}</div><div class="dh-nm">${esc(p.name)}</div>${p.accessionId?`<div class="dh-accid" style="font-family:'JetBrains Mono',monospace;font-size:.72rem;color:var(--muted);letter-spacing:.05em;margin-top:1px" title="Accession ID (non modifiable)">${esc(p.accessionId)}</div>`:''} ${p.variety?`<div class="dh-vr">var. ${esc(p.variety)}${p.rootstock&&p.rootstock!=='Inconnu'?` · sur ${esc(p.rootstock)}`:''}</div>`:''} ${detBadge}<div class="dh-ct-badge ${isTerre?'terre':'pot'}">${isTerre?'🌳 Pleine terre':'🪴 Culture en pot'}</div></div>
<div class="dsec"><div class="dstl">Galerie photographique <span>${ph.length} photo${ph.length!==1?'s':''}</span></div>
<div id="uprog" class="uprog"><div style="font-size:.75rem;color:var(--muted)" id="uplbl">${T('misc.detailUpload')}</div><div class="upbw"><div class="upb" id="upb"></div></div></div>
<div class="pgal">${ph.map((x,_i)=>`<div class="ptmb" data-action="open-ph-gallery" data-pid="${p.id}" data-idx="${_i}"><img src="${esc(x.url)}" alt="${esc(x.caption||'')}" loading="lazy"/><div class="ptdt">${x.caption?esc(x.caption.slice(0,22)):fmtDate(x.date)}</div><button class="ptdl" onclick="event.stopPropagation();delPh('${p.id}','${x.id}','${esc(x.ghPath||'')}')">✕</button></div>`).join('')}<label class="pabtn"><span style="font-size:1.2rem">📷</span><span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-align:center">Ajouter</span><input type="file" accept="image/*" capture="environment" style="display:none" onchange="handlePhoto(event,'${p.id}')"/></label></div>
${!gh?`<p style="font-size:.75rem;color:var(--muted);margin-top:3px">Photos : configurez GitHub dans Profil 🌿</p>`:''}
</div>
<div class="dsec"><div class="dstl">Mode de culture</div><div class="ct-toggle"><button class="ct-btn${!isTerre?' active-pot':''}" data-action="switch-ct" data-ct="pot">🪴 En pot</button><button class="ct-btn${isTerre?' active-terre':''}" data-action="switch-ct" data-ct="terre">🌳 Pleine terre</button></div></div>
<div class="dsec"><div class="dstl">${T('misc.detailBotId')}</div>
<div class="dr"><span class="drl">${T('misc.detailVarLbl')}</span><span class="drv" style="max-width:100%;flex:1">
<div class="sp-combo">
<input id="ed-vr" value="${esc(eb.variety)}" oninput="eb.variety=this.value;detailSearchVariety(this.value)" onfocus="detailSearchVariety(this.value)" onblur="setTimeout(()=>document.getElementById('ed-vr-res')?.classList.remove('show'),200)" placeholder="nom de cultivar, saisie libre…" autocomplete="off"/>
<div class="gbif-results" id="ed-vr-res"></div>
</div>
</span></div>
<div class="dr"><span class="drl">Espèce</span><span class="drv" style="max-width:100%;flex:1">
<div class="sp-combo">
<datalist id="sp-list">${SP.map(s=>`<option value="${esc(s)}">`).join('')}</datalist>
<input id="ed-sp" list="sp-list" value="${esc(eb.species)}" oninput="eb.species=this.value" onkeyup="searchGBIF('ed-sp','gbif-sp-res')" onblur="closeGBIF('gbif-sp-res')" placeholder="Citrus × sinensis, saisie libre…" autocomplete="off"/>
<button class="gbif-btn" data-action="search-gbif">🔎 Rechercher sur GBIF / citrusgenomedb.org</button>
<div class="gbif-results" id="gbif-sp-res"></div>
</div>
</span></div>
<div class="dr"><span class="drl">Porte-greffe</span><span class="drv">
<div class="sp-combo">
<input id="ed-rs" value="${esc(eb.rootstock)}"
  oninput="eb.rootstock=this.value;rsSearch(this.value,'ed-rs','ed-rs-res')"
  onfocus="rsSearch(this.value,'ed-rs','ed-rs-res')"
  onblur="setTimeout(()=>document.getElementById('ed-rs-res')?.classList.remove('show'),200)"
  placeholder="Poncirus trifoliata, saisie libre…" autocomplete="off"/>
<div class="gbif-results" id="ed-rs-res"></div>
</div>
</span></div>
<div class="dr" style="flex-direction:column;align-items:flex-start;gap:5px;padding:5px 0">
  <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
    <span class="drl" style="font-weight:600">Historique des déterminations (${eb.determinations?.length||0})</span>
    <div style="display:flex;gap:5px">
      <button data-action="toggle-det-hist" style="font-size:.72rem;padding:2px 7px;border:1px solid var(--cream3);border-radius:5px;background:var(--cream2);cursor:pointer">${_detHistOpen?'▲':'▼'}</button>
      <button data-action="open-new-determination" style="font-size:.72rem;padding:2px 7px;border:1px solid var(--cream3);border-radius:5px;background:var(--cream2);cursor:pointer">+ Nouvelle</button>
    </div>
  </div>
  ${_detHistOpen?window._renderDetHistory?.()??'':''}
</div>
<div class="dr"><span class="drl">${isTerre?'Date plantation':'Date acquisition'}</span><span class="drv" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">
<input type="date" id="ed-ad" value="${esc(isTerre?eb.plantingDate:eb.acquisitionDate)}" oninput="${isTerre?'eb.plantingDate':'eb.acquisitionDate'}=this.value" style="flex:1;min-width:110px"/>
<select id="ed-dp" onchange="eb.datePrecision=this.value" style="font-size:.75rem;padding:2px 4px;border:1px solid var(--cream3);border-radius:5px;background:var(--cream)">
${['full','month','year','unknown'].map(v=>`<option value="${v}"${eb.datePrecision===v?' selected':''}>${T('datePrecision.'+v)}</option>`).join('')}
</select>
</span></div>
<div class="dsec" style="margin-top:8px"><div class="dstl">Origine &amp; provenance</div>
<div class="dr"><span class="drl">Type d'acquisition</span><span class="drv"><select id="ed-pvt" onchange="eb.provenanceType=this.value">${Object.entries(T('provenanceType')||{}).map(([v,l])=>`<option value="${v}"${eb.provenanceType===v?' selected':''}>${esc(l)}</option>`).join('')}</select></span></div>
<div class="dr"><span class="drl">Mode</span><span class="drv"><select id="ed-pvm" onchange="eb.provenanceMode=this.value">${Object.entries(T('provenanceMode')||{}).map(([v,l])=>`<option value="${v}"${eb.provenanceMode===v?' selected':''}>${esc(l)}</option>`).join('')}</select></span></div>
<div class="dr"><span class="drl">Type de production</span><span class="drv"><select id="ed-pdt" onchange="eb.productionType=this.value">${Object.entries(T('productionType')||{}).map(([v,l])=>`<option value="${v}"${eb.productionType===v?' selected':''}>${esc(l)}</option>`).join('')}</select></span></div>
<div class="dr" style="align-items:flex-start"><span class="drl" style="padding-top:4px">Précisions</span><span class="drv" style="flex:1"><textarea id="ed-pvd" oninput="eb.provenanceDetail=this.value" style="width:100%;min-height:52px;border:1px solid var(--cream3);border-radius:5px;padding:4px 6px;font-size:.79rem;background:var(--cream);resize:vertical">${esc(eb.provenanceDetail)}</textarea></span></div>
</div>
<div class="dr"><span class="drl">Fournisseur</span><span class="drv"><input type="text" id="ed-as" value="${esc(eb.acquisitionSource)}" oninput="eb.acquisitionSource=this.value" placeholder="pépinière, pays d'origine…"/></span></div>
<div class="dr"><span class="drl">Valeur d'assurance (€)</span><span class="drv"><input type="number" id="ed-insval" value="${esc(eb.insuranceValue||'')}" oninput="eb.insuranceValue=this.value" min="0" step="1" placeholder="valeur de remplacement estimée…"/></span></div>
${isConserv?`<div class="dr"><span class="drl">N° accession</span><span class="drv" style="display:flex;gap:5px;align-items:center"><input type="text" id="ed-acc" value="${esc(p.accessionNumber||'')}" oninput="eb.accessionNumber=this.value" placeholder="ex : 2024-0042" style="flex:1"/><button class="btn btn-sm" style="font-size:.75rem;padding:2px 7px;flex-shrink:0" onclick="document.getElementById('ed-acc').value=_nextAccessionNumber();eb.accessionNumber=document.getElementById('ed-acc').value">Auto</button></span></div>
<div class="dr"><span class="drl">Statut IUCN</span><span class="drv"><select id="ed-iucn" onchange="eb.iucnStatus=this.value"><option value="">—</option>${['LC','NT','VU','EN','CR','EW','EX'].map(s=>`<option value="${s}" ${(p.iucnStatus||'')==s?'selected':''}>${s}</option>`).join('')}</select></span></div>
<div class="dr"><span class="drl">Statut conserv.</span><span class="drv"><select id="ed-cst" onchange="eb.conservStatus=this.value"><option value="vivant" ${(p.conservStatus||'vivant')==='vivant'?'selected':''}>Vivant</option><option value="perdu" ${(p.conservStatus||'')==='perdu'?'selected':''}>Perdu</option><option value="en_dépôt" ${(p.conservStatus||'')==='en_dépôt'?'selected':''}>En dépôt</option><option value="prêté" ${(p.conservStatus||'')==='prêté'?'selected':''}>Prêté</option></select></span></div>
<div class="dr"><span class="drl">Origine géo.</span><span class="drv"><input type="text" id="ed-prov-country" value="${esc((p.provenance||{}).country||'')}" oninput="eb.provenance={...(eb.provenance||{}),country:this.value}" placeholder="Pays…" style="width:100%"/></span></div>
<div class="dr"><span class="drl">Collecteur</span><span class="drv"><input type="text" id="ed-prov-col" value="${esc((p.provenance||{}).collector||'')}" oninput="eb.provenance={...(eb.provenance||{}),collector:this.value}" placeholder="Nom du collecteur…" style="width:100%"/></span></div>
<div class="dr"><span class="drl">Institution donatrice</span><span class="drv"><input type="text" id="ed-prov-don" value="${esc((p.provenance||{}).donorInstitution||'')}" oninput="eb.provenance={...(eb.provenance||{}),donorInstitution:this.value}" placeholder="ex : INRAE, CIRAD…" style="width:100%"/></span></div>`:''}
</div>
${window.renderSpeciesKB?.(p)??''}
<div class="dsec"><div class="dstl">${T('misc.detailStateSize')}</div>
<div class="dr"><span class="drl">Statut sanitaire</span><span class="drv"><select id="ed-st" onchange="eb.status=this.value">${so}</select></span></div>
<div class="dr"><span class="drl">${isTerre?'Emplacement jardin':'Emplacement'}</span><span class="drv"><select id="ed-lo" onchange="eb.location=this.value;if(eb.locationData)eb.locationData.zone=this.value">${lo}</select></span></div>
<div class="dr"><span class="drl">Section / Parcelle</span><span class="drv"><input id="ed-lo-sec" type="text" value="${esc(eb.locationData?.section||'')}" oninput="eb.locationData.section=this.value" placeholder="ex: carré B" style="width:120px"></span></div>
<div class="dr"><span class="drl">Position précise</span><span class="drv"><input id="ed-lo-pos" type="text" value="${esc(eb.locationData?.position||'')}" oninput="eb.locationData.position=this.value" placeholder="ex: rang 2, place 4" style="width:150px"></span></div>
<div class="dr"><span class="drl">GPS</span><span class="drv"><span id="ed-lo-gps" style="font-size:.8rem;color:var(--muted)">${eb.locationData?.lat?`${eb.locationData.lat}, ${eb.locationData.lng}`:'Non défini'}</span> <button class="btn btn-sm" data-action="get-location-gps" style="font-size:.75rem;padding:3px 8px;margin-left:6px">📍</button></span></div>
${window.__CCA_location?.renderEmplacementDisplay(p)||''}
${!isTerre?`<div class="dr"><span class="drl">Ø pot (cm)</span><span class="drv"><input type="number" id="ed-pt" value="${esc(eb.potSize)}" oninput="eb.potSize=this.value" style="width:62px"></span></div>`:''}
<div class="dr"><span class="drl">Hauteur (cm)</span><span class="drv"><input type="number" id="ed-ht" value="${esc(eb.height)}" oninput="eb.height=this.value" style="width:62px"></span></div>
<div class="dr"><span class="drl">Ø couronne (cm)</span><span class="drv"><input type="number" id="ed-cr" value="${esc(eb.crownDiameter)}" oninput="eb.crownDiameter=this.value" style="width:62px"></span></div>
<div class="dr"><span class="drl">Ensoleillement</span><span class="drv"><select id="ed-sun" onchange="eb.sunExposure=this.value">${SUN_EXP.map(s=>`<option${eb.sunExposure===s?' selected':''}>${s}</option>`).join('')}</select></span></div>
<div class="dr"><span ${T('misc.detailLastWater')}ier arrosage</span><span class="drv"><input type="date" id="ed-lw" value="${esc(eb.lastWatering)}" oninput="eb.lastWatering=this.value"/></span></div>
<div class="dr"><span class="drl">${T('misc.detailLastFert')}</span><span class="drv"><input type="date" id="ed-lf" value="${esc(eb.lastFertilization)}" oninput="eb.lastFertilization=this.value"/></span></div>
<div class="dr"><span class="drl">${T('misc.detailLastTaille')}</span><span class="drv"><input type="date" id="ed-lt" value="${esc(eb.lastTaille)}" oninput="eb.lastTaille=this.value"/></span></div>
${!isTerre?`<div class="dr"><span class="drl">Dernier rempotage 🪴</span><span class="drv"><input type="date" id="ed-lr" value="${esc(eb.lastRempotage)}" oninput="eb.lastRempotage=this.value"/></span></div>`:''}
</div>
${isTerre?`<div class="dsec terre-sec"><div class="dstl" style="color:var(--terra)">${T('misc.detailGroundCond')}</div>
<div class="dr"><span class="drl">Exposition</span><span class="drv"><select id="ed-ex" onchange="eb.exposition=this.value">${EXPO.map(e=>`<option${eb.exposition===e?' selected':''}>${e}</option>`).join('')}</select></span></div>
<div class="dr"><span class="drl">${T('misc.profSoil')}</span><span class="drv"><select id="ed-so" onchange="eb.sol=this.value">${SOL.map(s=>`<option${eb.sol===s?' selected':''}>${s}</option>`).join('')}</select></span></div>
<div class="dr"><span class="drl">Profondeur sol <span style="font-size:.75rem;color:var(--muted)">(cm)</span></span><span class="drv"><input id="ed-sdepth" type="number" min="10" max="200" step="10" value="${eb.soilDepth||''}" placeholder="ex: 60" oninput="eb.soilDepth=parseInt(this.value)||null" style="border:1px solid var(--cream3);border-radius:5px;padding:2px 5px;font-size:.79rem;background:var(--cream);max-width:80px"/></span></div>
<div class="dr"><span class="drl">Protection hivernale</span><span class="drv"><select id="ed-pr" onchange="eb.protection=this.value">${PROT.map(p2=>`<option${eb.protection===p2?' selected':''}>${p2}</option>`).join('')}</select></span></div>
</div>`:''}
<div class="dsec"><div class="dstl">Notes de culture</div><textarea class="notea" id="ed-nt" oninput="eb.notes=this.value">${esc(eb.notes)}</textarea></div>
${window._renderRUBilanSection?.(p)??''}
${window._renderDripSection?.(p)??''}
${window.renderIoTSection?.(p)??''}
${renderTailleHistory(p)}
${(()=>{const bts=(nurseryData.boutures||[]).filter(b=>b.sourceId===p.id&&!b.archived);if(!bts.length)return'';return`<div class="dsec"><div class="dstl">🌿 Boutures prélevées (${bts.length})</div>${bts.map(b=>{const st=BOUTURE_STATUS[b.status||'en_cours'];return`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--cream3)" data-action="nav" data-page="pro" data-pro-view="pepiniere" data-nurs-view="boutures"><div style="flex:1;min-width:0"><div style="font-size:.8rem;font-weight:600">${fmtDate(b.date)}${b.method?' · '+esc(b.method):''}</div><div style="font-size:.7rem;color:var(--muted)">×${b.nbPrelevees||'?'} prélevées${b.nbEnracinées!=null?' · '+b.nbEnracinées+' enracinées':''}</div></div><span style="font-size:.75rem;padding:1px 6px;border-radius:8px;background:${st.bg};color:${st.color};font-family:'JetBrains Mono',monospace;flex-shrink:0">${st.label}</span></div>`}).join('')}<button class="btn btn-sm" style="margin-top:6px;font-size:.7rem" onclick="event.stopPropagation();openBoutureModal(null);document.getElementById('bt-src').value='${p.id}'">+ Nouvelle bouture depuis ce sujet</button></div>`;})()}
${!isTerre?renderRempotageHistory(p):''}
${!isTerre?`<div class="dsec"><div class="dstl">☀ Sorti au soleil aujourd'hui</div><div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0"><div style="font-size:.78rem;color:var(--text);flex:1">Marquer ce sujet comme sorti pour prendre le soleil — l'alerte gel du soir vous rappellera de le rentrer.</div><label class="sw" style="flex-shrink:0;margin-left:12px"><input type="checkbox" ${isSorti(p.id)?'checked':''} onchange="toggleSorti('${p.id}')"><span class="sw-track"></span></label></div></div>`:''}
${!isTerre?renderHivernageHistory(p):''}
${renderDiagHistory(p)}
${renderGraffageRegistry(p)}
${renderTempHistory(p)}
${window.renderSeasonalTotals?.(p)??''}
<div id="cca-pheno-det"></div>
${(()=>{if(!window.__CCA_wiki||!eb.species)return'';const _wSlug=eb.species.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,80);const _wPage=window.__CCA_wiki.getPage(_wSlug);if(!_wPage)return'';return`<div style="padding:6px 0"><button class="cca-wiki-link" data-action="open-wiki-article" data-slug="${_wSlug}">📖 ${T('wiki.seeArticle')} — ${esc(_wPage.title)}</button></div>`})()}
${(()=>{if(!window.__CCA_drip)return'';const _dSys=window.__CCA_drip.getSystemForPlant(p.id);if(!_dSys)return'';const _dLabel=(T('drip.circuit')||'Circuit : {name}').replace('{name}',esc(_dSys.name));return`<div style="padding:6px 0"><button class="cca-drip-link" data-action="open-drip-detail" data-id="${_dSys.id}">💧 ${_dLabel}</button></div>`;})()}
<div class="dsec"><div class="dstl">${T('misc.detailJournal')}${helpBtn('evenements')}<span style="display:flex;align-items:center;gap:8px"><span style="color:var(--muted)">${allEvs.length} entrée${allEvs.length!==1?'s':''}</span><label style="display:flex;align-items:center;gap:3px;font-size:.75rem;cursor:pointer;font-weight:400"><input type="checkbox" id="show-audit" onchange="toggleAudit()" style="width:11px;height:11px"/>${T('misc.detailModif')}</label></span></div>
${allEvs.length?`<div class="tl">${allEvs.map(ev=>renderEvEntry(ev,p.id)).join('')}</div>`:`<div class="noev">${T('misc.evNoRecord')}</div>`}
</div>
<div style="height:16px"></div>
<div class="savebar"><button class="btn btn-a" style="flex:1" data-action="open-add-event" data-id="${p.id}">${T('misc.detailAddEvent')}</button><button class="btn btn-p" style="flex:1" data-action="save-detail">Enregistrer</button><button class="btn btn-sm" style="background:var(--g1);color:white;width:36px;padding:0;flex-shrink:0" data-action="open-diag" data-id="${p.id}" title="${T('misc.diagTitle')}">🔬</button><button class="btn btn-sm" style="background:var(--g2);color:white;width:36px;padding:0;flex-shrink:0" data-action="open-pdf-menu" data-id="${p.id}" title="${T('misc.pdfBtnPlant')}">📄</button><button class="btn btn-sm" style="background:#74ac00;color:white;width:36px;padding:0;flex-shrink:0" data-action="export-inat" data-id="${p.id}" title="Exporter vers iNaturalist / GBIF">🌍</button>${helpBtn('fiche')}<button class="btn btn-d btn-sm" data-action="conf-del" data-id="${p.id}">🗑</button></div>`}

function renderEvEntry(ev,plantId){
  const ET=window.ET??{};
  const et=ET[ev.type]||ET.observation,isA=ev.audit,isBulk=ev.bulk;
  const bb=isBulk?`<span style="font-size:.75rem;background:rgba(232,148,26,.12);color:var(--amber3);border-radius:4px;padding:1px 4px;ma${T('misc.collBulkTag')}:3px">collectif</span>`:'';
  const fert=ev.fertilizerId?getFertById(ev.fertilizerId):null;
  const npkLine=fert?`<div class="fert-li-npk" style="margin-top:3px">${fertNPKBadges(fert)}<span style="font-size:.75rem;color:var(--muted);font-style:italic;margin-left:4px">${esc(fert.name)}</span></div>`:'';
  const graftBadges=ev.type==='greffage'?`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
    ${ev.greffon?`<span class="graft-badge">🌱 ${esc(ev.greffon)}</span>`:''}
    ${ev.porteGreffe?`<span class="graft-badge">🌿 ${esc(ev.porteGreffe)}</span>`:''}
    ${ev.lotId?`<span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:${et.c};opacity:.8">${esc(ev.lotId)}</span>`:''}
    ${ev.lotQty?`<span class="graft-badge">×${ev.lotQty}</span>`:''}
    ${ev.reprisePct!=null?`<span style="font-size:.75rem;background:rgba(56,142,60,.12);color:#388e3c;padding:1px 7px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-weight:600">✓ ${ev.reprisePct}% (${ev.repriseQty||'?'} plants)</span>`:''}
    ${ev.disponibilite&&ev.reprisePct==null?`<span style="font-size:.75rem;color:${et.c};font-family:'JetBrains Mono',monospace">⏱ dispo ${fmtDate(ev.disponibilite)}</span>`:''}
  </div>
  ${ev.reprisePct==null&&!isA?`<button class="btn" style="font-size:.75rem;padding:2px 8px;margin-top:5px;background:rgba(56,142,60,.1);color:#388e3c;border-color:rgba(56,142,60,.3)" onclick="event.stopPropagation();openGraftRepriseModal('${plantId}','${ev.id}')">${T('misc.evGraftReprise')}</button>`:''}`:''
  const wfBtn=ev.type==='récolte'&&!isA?`<button class="btn btn-sm" style="font-size:.7rem;padding:2px 7px;margin-right:5px;background:rgba(21,101,192,.08);color:#1565c0;border-color:rgba(21,101,192,.2)" onclick="event.stopPropagation();_workflowScheduleCalendar('${plantId}')">📅 Planifier</button>`:'';
  return`<div class="tev${isA?' audit':''}\" ${isA?'style="display:none"':''}><div style="position:absolute;left:-17px;top:4px;width:9px;height:9px;border-radius:50%;background:${fert?.color||et.c};border:2px solid var(--cream)"></div><div class="tevdt">${fmtDate(ev.date)}</div><div class="tevbg" style="background:${et.bg};color:${et.c}">${et.i} ${et.label}${bb}</div><div class="tevds">${esc(ev.description)}</div>${npkLine}${graftBadges}${wfBtn}<button class="tevdl" data-action="del-ev" data-pid="${plantId}" data-eid="${ev.id}">× supprimer</button></div>`
}

function toggleAudit(){const show=document.getElementById('show-audit')?.checked;document.querySelectorAll('.tev.audit').forEach(el=>el.style.display=show?'':'none')}

function renderDiagHistory(p){
  const DIAG_CATALOGUE=window.DIAG_CATALOGUE??[];
  const diagEvs=[...p.events]
    .filter(e=>e.diagId&&!e.audit)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  if(!diagEvs.length)return'';

  const DIAG_CAT_ICONS={insecte:'🐛',champignon:'🍄',carence:'🌿',virus:'⚠',inconnu:'🔬'};

  return`<div class="dsec" style="border-left:3px solid #5c6bc0">
<div class="dstl" style="color:#5c6bc0">🔬 Historique diagnostics
  <span style="font-weight:400;color:var(--muted)">${diagEvs.length} diagnostic${diagEvs.length>1?'s':''}</span>
</div>
${diagEvs.map(ev=>{
  const cond=DIAG_CATALOGUE.find(c=>c.id===ev.diagId);
  const catIcon=cond?DIAG_CAT_ICONS[cond.cat]||'🔬':'🔬';
  const conf=ev.diagConfidence?Math.round(ev.diagConfidence*100):null;
  const src=ev.diagSource==='claude'?'IA':'local';
  const confColor=ev.diagConfidence>=0.7?'#2e7d32':ev.diagConfidence>=0.45?'#e65100':'#9e9e9e';
  return`<div style="padding:8px 0;border-bottom:1px solid var(--cream2)">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
    <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted)">${fmtDate(ev.date)}</span>
    <span style="font-size:.75rem;background:rgba(92,107,192,.1);color:#5c6bc0;padding:1px 6px;border-radius:6px;font-family:'JetBrains Mono',monospace">${src}</span>
    ${conf!==null?`<span style="font-size:.75rem;color:${confColor};font-family:'JetBrains Mono',monospace;font-weight:600">${conf}%</span>`:''}
  </div>
  <div style="font-size:.8rem;font-weight:600;color:var(--text)">${catIcon} ${esc(ev.diagId.replace(/_/g,' '))}</div>
  <div style="font-size:.75rem;color:var(--muted);margin-top:2px;line-height:1.4">${esc(ev.description.replace(/^\[Diagnostic[^\]]*\]\s*/,'').slice(0,120))}${ev.description.length>120?'…':''}</div>
</div>`;
}).join('')}
</div>`;
}

function renderGraffageRegistry(plant){
  const grafts=plant.events.filter(e=>e.type==='greffage'&&!e.audit)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!grafts.length)return'';

  const completed=grafts.filter(e=>e.reprisePct!=null);
  const avgReprise=completed.length
    ?Math.round(completed.reduce((s,e)=>s+(e.reprisePct||0),0)/completed.length)
    :null;
  const stockTotal=completed.reduce((s,e)=>s+(e.repriseQty||0),0);
  const pending=grafts.filter(e=>e.reprisePct==null).reduce((s,e)=>s+(e.lotQty||0),0);
  const now=new Date();

  const rows=grafts.map(ev=>{
    const daysSince=Math.floor((now-new Date(ev.date))/86400000);
    const dispo=ev.disponibilite?new Date(ev.disponibilite):null;
    const daysUntil=dispo?Math.floor((dispo-now)/86400000):null;
    const dispoLabel=dispo
      ?(daysUntil<0?`<span style="color:#c62828">dépassé</span>`
        :daysUntil<=28?`<span style="color:#e65100;font-weight:600">dans ${daysUntil}j</span>`
        :fmtDate(ev.disponibilite))
      :'—';
    const repriseBlock=ev.reprisePct!=null
      ?`<span style="font-size:.75rem;background:rgba(56,142,60,.1);color:#388e3c;padding:1px 6px;border-radius:7px;font-family:'JetBrains Mono',monospace;font-weight:600">✓ ${ev.reprisePct}% — ${ev.repriseQty||'?'} plants${ev.repriseDate?' ('+fmtDate(ev.repriseDate)+')':''}</span>`
      :`<button class="btn" style="font-size:.75rem;padding:1px 7px;background:rgba(56,142,60,.08);color:#388e3c;border-color:rgba(56,142,60,.25)" data-action="open-graft-reprise" data-pid="${plant.id}" data-eid="${ev.id}">${T('misc.evGraftReprise')}</button>`;
    return`<div style="padding:8px 0;border-bottom:1px solid rgba(56,142,60,.12)">
  <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px">
    <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted)">${fmtDate(ev.date)}</span>
    ${ev.methode?`<span style="font-size:.75rem;background:rgba(56,142,60,.1);color:#388e3c;padding:1px 6px;border-radius:6px">${esc(ev.methode)}</span>`:''}
    ${ev.lotId?`<span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--g3);font-weight:600">${esc(ev.lotId)}</span>`:''}
    ${ev.lotQty?`<span style="font-size:.75rem;color:var(--muted)">×${ev.lotQty} greffons</span>`:''}
  </div>
  <div style="font-size:.8rem;font-weight:600;color:var(--text);margin-bottom:3px">
    ${ev.greffon?`🌱 ${esc(ev.greffon)}`:''} ${ev.greffon&&ev.porteGreffe?'→ ':''} ${ev.porteGreffe?`🌿 ${esc(ev.porteGreffe)}`:''}
  </div>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    ${repriseBlock}
    ${dispo&&ev.reprisePct!=null?`<span style="font-size:.75rem;color:var(--muted)">dispo : ${dispoLabel}</span>`:''}
    ${ev.reprisePct!=null?`<button onclick="event.stopPropagation();_workflowAddToCatalog('${plant.id}','${ev.id}')" style="font-size:.7rem;padding:2px 7px;background:rgba(45,90,61,.08);color:var(--text-accent);border:1px solid rgba(45,90,61,.2);border-radius:5px;cursor:pointer">📦 Catalogue</button>`:''}
  </div>
</div>`;
  }).join('');

  const statsHtml=(completed.length||stockTotal)?`<div style="display:flex;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px solid rgba(56,142,60,.15);margin-top:4px">
    ${avgReprise!=null?`<span style="font-size:.7rem;color:#388e3c;font-family:'JetBrains Mono',monospace;font-weight:600">${T('misc.graftAvgReprise')} : ${avgReprise}%</span>`:''}
    ${stockTotal?`<span style="font-size:.7rem;color:#388e3c;font-family:'JetBrains Mono',monospace">${T('misc.graftStock')} : ${stockTotal} plants</span>`:''}
    ${pending?`<span style="font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${pending} greffons en attente d'évaluation</span>`:''}
  </div>`:'';

  return`<div class="dsec" style="border-left:3px solid #388e3c">
<div class="dstl" style="color:#388e3c">🌿 ${T('misc.graftRegistry')}
  <span style="font-weight:400;color:var(--muted)">${grafts.length} lot${grafts.length>1?'s':''}</span>
</div>
${rows}
${statsHtml}
</div>`;
}

function renderTempHistory(p){
  const hist=p.tempHistory||[];
  const isOutdoor=!isPot(p)||['extérieur','jardin','terrasse','pied de mur exposé S','pied de mur exposé SE','pied de mur exposé SO','plein champ'].includes(p.location);
  const isTerre=!isPot(p);

  const statusBadge=isOutdoor
    ?`<span class="temp-outdoor-badge out">${T('misc.tempActive')}</span>`
    :`<span class="temp-outdoor-badge in">${T('misc.tempSuspended')}</span>`;

  if(!hist.length)return`<div class="temp-hist-card">
<div class="temp-hist-title"><span>${T('misc.tempHistTitle')}</span>${statusBadge}</div>
<div style="font-size:.78rem;color:var(--muted);font-style:italic">${T('misc.tempNone')}</div>
</div>`;

  const allMins=hist.map(h=>h.min);
  const allMaxs=hist.map(h=>h.max);
  const absMin=Math.min(...allMins);
  const absMax=Math.max(...allMaxs);
  const absMinEntry=hist.find(h=>h.min===absMin);
  const absMaxEntry=hist.find(h=>h.max===absMax);

  const globalMin=Math.min(absMin,-5);
  const globalMax=Math.max(absMax,35);
  const range=globalMax-globalMin||1;

  const recent=[...hist].sort((a,b)=>a.date>b.date?-1:1);
  const chart=recent.slice(0,30).reverse();

  const bars=chart.map(h=>{
    const minPct=Math.round(((h.min-globalMin)/range)*100);
    const maxPct=Math.round(((h.max-globalMin)/range)*100);
    const barMinLeft=Math.min(minPct,maxPct);
    const barWidth=Math.abs(maxPct-minPct)||2;
    const gelWarn=h.min<=2;
    return`<div class="temp-hist-row" style="${gelWarn?'background:rgba(21,101,192,.04)':''}">
<div class="temp-hist-date">${fmtDate(h.date)}</div>
<div class="temp-hist-bar-wrap">
  <div class="temp-hist-bar-min" style="left:0;width:${minPct}%"></div>
  <div style="position:absolute;top:1px;left:${barMinLeft}%;width:${barWidth}%;height:4px;background:linear-gradient(90deg,#1565c0,#c0392b);border-radius:2px;opacity:.55"></div>
  <div class="temp-hist-bar-max" style="left:${maxPct}%;width:${100-maxPct}%;background:#c0392b;opacity:.15;border-radius:0 3px 3px 0"></div>
</div>
<div class="temp-hist-vals">
  <span class="temp-hist-min">${h.min>0?'+':''}${h.min}°</span>
  <span style="color:var(--muted);font-size:.75rem">/</span>
  <span class="temp-hist-max">+${h.max}°</span>
</div>
${gelWarn?`<span style="font-size:.75rem;color:#1565c0;font-family:'JetBrains Mono',monospace">${T('misc.detailGelBadge')}</span>`:''}
</div>`;
  }).join('');

  return`<div class="temp-hist-card">
<div class="temp-hist-title">
  <span>${T('misc.tempHistTitle')} — ${hist.length} ${T('misc.tempReleveS')}</span>${helpBtn('temperatures')}
  ${statusBadge}
</div>
<div class="temp-extremes-row">
  <div class="temp-extreme cold">
    <span class="temp-extreme-val">${absMin>0?'+':''}${absMin}°C</span>
    <span class="temp-extreme-lbl">${T('misc.tempColdRecord')}</span>
    <span class="temp-extreme-date">${absMinEntry?fmtDate(absMinEntry.date):''}</span>
  </div>
  <div class="temp-extreme hot">
    <span class="temp-extreme-val">+${absMax}°C</span>
    <span class="temp-extreme-lbl">${T('misc.tempHotRecord')}</span>
    <span class="temp-extreme-date">${absMaxEntry?fmtDate(absMaxEntry.date):''}</span>
  </div>
  <div style="flex:1;background:var(--cream2);border-radius:8px;padding:9px 10px;text-align:center;border:1px solid var(--cream3)">
    <span style="font-size:1.1rem;font-weight:700;font-family:'EmojiFirst','Playfair Display',serif;display:block;line-height:1;color:var(--text-accent)">${hist.length}</span>
    <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-top:3px;display:block">Jours enreg.</span>
    <span style="font-size:.75rem;color:var(--muted);margin-top:2px;display:block">📍 ${esc(hist[0]?.city||'—')}</span>
  </div>
</div>
${chart.length>0?`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">${T('misc.detailTempDays')}</div>${bars}`:''}
${hist.length>30?`<details style="margin-top:8px"><summary style="font-size:.76rem;color:var(--g3);cursor:pointer;padding:6px 0">▾ Voir tous les ${hist.length} relevés</summary><div style="margin-top:8px">${recent.map(h=>{
  const gelWarn=h.min<=2;
  return`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--cream3);font-size:.75rem">
  <span style="font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:.75rem">${fmtDate(h.date)}</span>
  <span style="display:flex;gap:10px;align-items:center">
    <span class="temp-hist-min">${h.min>0?'+':''}${h.min}°</span>
    <span class="temp-hist-max">+${h.max}°</span>
    ${gelWarn?`<span style="font-size:.75rem;color:#1565c0">❄</span>`:''}
    ${h.city?`<span style="font-size:.75rem;color:var(--muted);font-style:italic">📍${esc(h.city.split(',')[0])}</span>`:''}
  </span>
</div>`}).join('')}</div></details>`:''}
</div>`;
}

function renderTailleHistory(p){
  const ET=window.ET??{};
  const tailleEvs=[...p.events]
    .filter(e=>e.type==='taille'&&!e.audit)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!tailleEvs.length)return`<div style="margin:0 14px 10px;font-size:.78rem;color:var(--muted);font-style:italic;padding:8px 0">${T('misc.tailleNone')}</div>`;

  return`<div class="dsec" style="border-left:3px solid ${ET.taille.c}">
<div class="dstl" style="color:${ET.taille.c}">${T('misc.tailleTitle')} <span style="font-weight:400;color:var(--muted)">${tailleEvs.length} ${T('misc.tailleEntry')}${tailleEvs.length>1?'s':''}</span></div>
${tailleEvs.map(ev=>{
  const typeLbl=ev.tailleType?`<span style="font-size:.75rem;font-weight:700;padding:1px 6px;border-radius:10px;background:${ET.taille.bg};color:${ET.taille.c};font-family:'JetBrains Mono',monospace">${esc(ev.tailleType)}</span> `:'';
  const parties=ev.partiesTaille?`<div style="font-size:.75rem;color:var(--muted);margin-top:2px">Parties : ${esc(ev.partiesTaille)}</div>`:'';
  const hautAvant=ev.hauteurAvant?`<span style="font-size:.75rem;color:var(--muted)">Avant ${ev.hauteurAvant}cm</span> `:'' ;
  const hautApres=ev.hauteurApres?`<span style="font-size:.75rem;color:var(--g3)">→ Après ${ev.hauteurApres}cm</span>`:'';
  const mesures=(hautAvant||hautApres)?`<div style="margin-top:3px;display:flex;gap:8px;flex-wrap:wrap">${hautAvant}${hautApres}</div>`:'';
  return`<div class="seas-ev-row" style="flex-direction:column;align-items:flex-start;padding:7px 0">
  <div style="display:flex;gap:7px;align-items:center;width:100%">
    <span class="seas-ev-date">${fmtDate(ev.date)}</span>
    ${typeLbl}
    ${ev.bulk?`<span style="font-size:.75rem;background:rgba(232,148,26,.14);color:var(--amber3);borde${T('misc.collBulkTag')}4px;padding:1px 4px">collectif</span>`:''}
  </div>
  <div class="seas-ev-name" style="margin-top:3px">${esc(ev.description)}</div>
  ${parties}${mesures}
  </div>`;
}).join('')}
</div>`;
}

function renderRempotageHistory(p){
  const ET=window.ET??{};
  const rempEvs=[...p.events]
    .filter(e=>e.type==='rempotage'&&!e.audit)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!rempEvs.length)return`<div style="margin:0 14px 10px;font-size:.78rem;color:var(--muted);font-style:italic;padding:8px 0">${T('misc.rempNone')}</div>`;

  return`<div class="dsec" style="border-left:3px solid ${ET.rempotage.c}">
<div class="dstl" style="color:${ET.rempotage.c}">${T('misc.rempTitle')} <span style="font-weight:400;color:var(--muted)">${rempEvs.length} ${T('misc.rempNew').replace('→ Nouveau ∅','').trim()||T('misc.tailleEntry')}${rempEvs.length>1?'s':''}</span></div>
${rempEvs.map(ev=>{
  const potInfo=(ev.ancienPot||ev.nouveauPot)?
    `<div style="display:flex;gap:12px;margin-top:3px;flex-wrap:wrap">
      ${ev.ancienPot?`<span style="font-size:.75rem;color:var(--muted)">Ancien ∅ ${ev.ancienPot} cm</span>`:''}
      ${ev.nouveauPot?`<span style="font-size:.75rem;color:var(--g3);font-weight:600">→ Nouveau ∅ ${ev.nouveauPot} cm</span>`:''}
    </div>`:'' ;
  const substrat=ev.substratRemp?`<div style="font-size:.75rem;color:var(--muted);margin-top:2px">Substrat : ${esc(ev.substratRemp)}</div>`:'';
  const racines=ev.observationsRacines?`<div style="font-size:.75rem;color:var(--brown);font-style:italic;margin-top:2px">Racines : ${esc(ev.observationsRacines)}</div>`:'';
  return`<div class="seas-ev-row" style="flex-direction:column;align-items:flex-start;padding:7px 0">
  <div style="display:flex;gap:7px;align-items:center;width:100%">
    <span class="seas-ev-date">${fmtDate(ev.date)}</span>
    ${ev.bulk?`<span style="font-size:.75rem;background:rgba(232,148,26,.14);color:var(${T('misc.collBulkTag')};border-radius:4px;padding:1px 4px">collectif</span>`:''}
  </div>
  <div class="seas-ev-name" style="margin-top:3px">${esc(ev.description)}</div>
  ${potInfo}${substrat}${racines}
  </div>`;
}).join('')}
</div>`;
}

function _archivePlanForPlant(plant){
  try{
    const verger=getVergerData();
    let foundParcelId=null,foundPos=null;
    for(const [parcelId,positions] of Object.entries(verger.planPositions||{})){
      if(positions[plant.id]){
        foundParcelId=parcelId;
        foundPos=positions[plant.id];
        break;
      }
    }
    if(!foundParcelId||!foundPos)return null;
    const parcel=(verger.parcelles||[]).find(p=>p.id===foundParcelId);
    if(!parcel||!parcel.boundary||parcel.boundary.length<3)return null;

    const W=200,H=144,PAD=12;
    const lats=parcel.boundary.map(p=>p[0]);
    const lngs=parcel.boundary.map(p=>p[1]);
    const minLat=Math.min(...lats),maxLat=Math.max(...lats);
    const minLng=Math.min(...lngs),maxLng=Math.max(...lngs);
    const midLat=(minLat+maxLat)/2;
    const mPerLat=111320,mPerLng=111320*Math.cos(midLat*Math.PI/180);
    const widthM=(maxLng-minLng)*mPerLng,heightM=(maxLat-minLat)*mPerLat;
    const scale=widthM>0&&heightM>0?Math.min((W-PAD*2)/widthM,(H-PAD*2)/heightM):1;
    const project=([lat,lng])=>({
      x:PAD+(lng-minLng)*mPerLng*scale,
      y:H-PAD-(lat-minLat)*mPerLat*scale
    });

    const polyPts=parcel.boundary.map(project).map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const plantPos=project([
      parcel.freehand?(foundPos.y*(maxLat-minLat)+minLat):(minLat+foundPos.y*(maxLat-minLat)),
      parcel.freehand?(foundPos.x*(maxLng-minLng)+minLng):(minLng+foundPos.x*(maxLng-minLng))
    ]);
    let px,py;
    if(parcel.freehand){
      px=PAD+foundPos.x*(W-PAD*2);
      py=PAD+foundPos.y*(H-PAD*2);
    } else {
      const projPt=project([minLat+foundPos.y*(maxLat-minLat),minLng+foundPos.x*(maxLng-minLng)]);
      px=projPt.x;py=projPt.y;
    }

    const crownM=(parseFloat(plant.crownDiameter)||60)/200;
    const crownPx=Math.max(4,Math.min(16,crownM*scale));

    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
      +`<rect width="${W}" height="${H}" fill="#faf5eb"/>`
      +`<polygon points="${polyPts}" fill="#e8f5e9" stroke="#2d5a3d" stroke-width="1.5" stroke-linejoin="round"/>`
      +`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${crownPx}" fill="rgba(232,148,26,0.35)" stroke="#e8941a" stroke-width="1.5"/>`
      +`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#e8941a"/>`
      +`<text x="${px.toFixed(1)}" y="${(py-crownPx-3).toFixed(1)}" text-anchor="middle" font-size="9" font-family="JetBrains Mono,monospace" fill="#c97d14" font-weight="700">${esc(plant.name.slice(0,12))}</text>`
      +`</svg>`;

    return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
  }catch(e){
    return null;
  }
}

function renderHivernageHistory(p){
  const hivEvs=[...p.events]
    .filter(e=>(e.type==='hivernage'||e.type==='sortie')&&!e.audit)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  if(!hivEvs.length){
    return`<div style="margin:0 14px 10px;font-size:.78rem;color:var(--muted);font-style:italic;padding:8px 0">${T('misc.hivNone')}</div>`;
  }

  const seasons=[];
  let current=null;
  hivEvs.forEach(ev=>{
    if(ev.type==='hivernage'){
      if(current)seasons.push({...current,sortie:null,sortieEv:null});
      current={rentree:ev.date,rentreeEv:ev,sortie:null,sortieEv:null};
    } else {
      if(current){current.sortie=ev.date;current.sortieEv=ev;seasons.push({...current});current=null;}
      else seasons.push({rentree:null,rentreeEv:null,sortie:ev.date,sortieEv:ev});
    }
  });
  if(current)seasons.push({...current});
  seasons.reverse();

  const locBadge=p.location==='intérieur'
    ?`<span style="font-size:.75rem;background:#eceff1;color:#455a64;padding:2px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace">❄ En hivernage</span>`
    :`<span style="font-size:.75rem;background:#e8f5e9;color:#388e3c;padding:2px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace">${T('misc.detailExtBtn')}</span>`;

  return`<div class="dsec" style="border-left:3px solid #455a64">
<div class="dstl" style="color:#455a64">${T('misc.hivTitle')}
  <span style="font-weight:400;color:var(--muted)">${seasons.length} saison${seasons.length>1?'s':''}</span>
  ${locBadge}
</div>
${seasons.map(s=>{
  const hasEnd=!!s.sortie;
  const duration=s.rentree&&s.sortie
    ?Math.round((new Date(s.sortie)-new Date(s.rentree))/86400000)
    :s.rentree?Math.round((Date.now()-new Date(s.rentree))/86400000):null;
  const dStr=duration!==null?`${duration}j`:'';
  const sc=hasEnd?'#388e3c':'#455a64';
  const bg=hasEnd?'#e8f5e9':'#eceff1';
  const lbl=hasEnd?'Terminé':'En cours ❄';
  return`<div style="padding:9px 0;border-bottom:1px solid var(--cream3)">
<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">
  <span style="font-size:.75rem;font-weight:700;color:${sc};background:${bg};padding:1px 8px;border-radius:10px;font-family:'JetBrains Mono',monospace">${lbl}</span>
  ${dStr?`<span style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${dStr}</span>`:''}
  ${s.rentreeEv?.bulk||s.sortieEv?.bulk?`<span style="font-size:.75rem;background:rgba(232,148,26,${T('misc.collBulkTag')}r:var(--amber3);border-radius:4px;padding:1px 5px">collectif</span>`:''}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  <div>
    <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:#455a64;margin-bottom:2px">${T('misc.detailIntBtn')}</div>
    ${s.rentree?`<div style="font-size:.84rem;font-weight:600;color:var(--text)">${fmtDate(s.rentree)}</div>${s.rentreeEv?.description?`<div style="font-size:.75rem;color:var(--muted);font-style:italic;margin-top:1px;line-height:1.4">${esc(s.rentreeEv.description)}</div>`:''}`
      :`<div style="font-size:.76rem;color:var(--muted);font-style:italic">${T('misc.detailNotFilled')}</div>`}
  </div>
  <div>
    <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:#388e3c;margin-bottom:2px">☀ Sortie</div>
    ${s.sortie?`<div style="font-size:.84rem;font-weight:600;color:var(--text)">${fmtDate(s.sortie)}</div>${s.sortieEv?.description?`<div style="font-size:.75rem;color:var(--muted);font-style:italic;margin-top:1px;line-height:1.4">${esc(s.sortieEv.description)}</div>`:''}`
      :`<div style="font-size:.76rem;color:#455a64;font-style:italic">En hivernage ❄</div>`}
  </div>
</div>
${s.rentreeEv?.planArchive?`
<div style="margin-top:8px;padding:6px 8px;background:var(--amber2);border-radius:8px;border:1px solid rgba(232,148,26,.25)">
  <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--amber3);margin-bottom:6px">📍 Position sur le plan au moment de la rentrée</div>
  <img src="${s.rentreeEv.planArchive}" style="width:100%;border-radius:6px;display:block;border:1px solid rgba(232,148,26,.3)" alt="Plan archivé"/>
</div>`:''}
</div>`;
}).join('')}
</div>`;
}

export function mount(container, ctx){
  _selId        = ctx.selId;
  _plants       = ctx.plants       ?? [];
  _eb           = ctx.eb           ?? {};
  _nurseryData  = ctx.nurseryData  ?? {};
  _detHistOpen  = ctx.detHistOpen  ?? false;
  container.innerHTML = renderDetail();
  window._mountPheno?.('detail');
}

window.__CCA_detail = { mount };
window._archivePlanForPlant = _archivePlanForPlant;
window.toggleAudit = toggleAudit;
