'use strict';
import { esc } from '../lib/esc.js';
const T = k => window.T?.(k) ?? k;

const VAR_SOURCES={
  GCVC: {label:'GCVC/UCR',    url:'https://citrusvariety.ucr.edu/collection/',                                          color:'#2e7d32'},
  MCCDD:{label:'MCCDD/UCR',   url:'https://citrusvariety.ucr.edu/modern-citrus-cultivars-descriptive-database',         color:'#1565c0'},
  INRAE:{label:'INRAE-CIRAD', url:'https://www6.montpellier.inrae.fr/agap/Ressources-genetiques/BRC-Citrus',            color:'#6a1b9a'},
  GRIN: {label:'USDA GRIN',   url:'https://www.ars-grin.gov/',                                                          color:'#c77800'},
  EPPO: {label:'EPPO',        url:'https://gd.eppo.int/taxon/1CIDG',                                                    color:'#37474f'},
  GBIF: {label:'GBIF',        url:'https://www.gbif.org/',                                                              color:'#0097a7'},
};

const VARIETY_SOURCE_MAP={
  'Fukumoto Navel':'MCCDD','Powell Navel':'MCCDD','Newhall Navel':'MCCDD','Leng Navel':'MCCDD',
  'Rohde Red Navel':'MCCDD','Gillette Navel':'MCCDD','Parent Navel':'MCCDD',
  'Midknight Valencia':'MCCDD','Olinda Valencia':'MCCDD','Delta Seedless Valencia':'MCCDD',
  'Tango':'MCCDD','W. Murcott':'MCCDD','Shiranui (Sumo/Dekopon)':'MCCDD',
  'Sugar Belle':'MCCDD','Spring Honey':'MCCDD','Autumn Honey':'MCCDD',
  'Ojai Pixie':'MCCDD','Daisy':'MCCDD','Seedless Valencia Pride':'MCCDD',
  'Sunburst':'MCCDD','Fallglo':'MCCDD','Fairchild':'MCCDD',
  'Hernandina':'MCCDD','Oronules':'MCCDD','Esbal':'MCCDD',
  'Tomatera':'MCCDD','Loretina':'MCCDD','Clemenrubi':'MCCDD',
  'Beatriz':'MCCDD','Barberina':'MCCDD','Champagne (clementine)':'MCCDD',
  'Dobashi Beni':'MCCDD','Miho Wase':'MCCDD','Imamura Early':'MCCDD',
  'Yamashita Satsuma':'MCCDD','Sugiyama':'MCCDD','Ueno Wase':'MCCDD','Kuno':'MCCDD',
  'Thompson Pink':'MCCDD','Henderson':'MCCDD','Triumph (grapefruit)':'MCCDD',
  'Foster Pink':'MCCDD','Marsh Seedless':'MCCDD',
  'Primofiori Mesero':'MCCDD','Lunario':'MCCDD','Monachello':'MCCDD',
  'Eureka Cook':'MCCDD','Génova':'MCCDD',
  'Thong Dee':'MCCDD','Khao Yai':'MCCDD','Kao Phuang':'MCCDD',
  'San Joaquin Pink':'MCCDD',
  'Alstonville':'MCCDD','Crimson Tide':'MCCDD','Sunrise Lime':'MCCDD',
  'Temple':'MCCDD','Topaz (tangor)':'MCCDD',
  'Corsica 1':'INRAE','Corsica 2':'INRAE','Corsica 4':'INRAE','Corsica N':'INRAE',
  'Tarocco Nucellare':'INRAE','Tarocco Rosso':'INRAE','Tarocco Gallo':'INRAE',
  'Moreau (sang.)':'INRAE','Sanguinello Comune':'INRAE','Brasiliano':'INRAE',
  'Entrefino':'INRAE','Doblefina':'INRAE',
  'Bigarade INRAE':'INRAE','Bouquetier à fruit doux':'INRAE',
  'Afourar':'INRAE','Citrus reshni Afourar':'INRAE',
  'Xie Shan Satsuma':'INRAE','Saijo':'INRAE',
  'Satsuma Guagua':'INRAE','Tardivo di Ciaculli (INRAE)':'INRAE',
  'Femminello Zagara Bianca':'INRAE','Femminello Zagara Bianca INRAE':'INRAE',
  'Citroniero de Menton':'INRAE','Santa Teresa (limon)':'INRAE',
  'Nossirah (bergamot)':'INRAE','Bergamot Bianco':'INRAE',
  'Limonette de Marrakech':'INRAE',
  'Minneola':'GRIN','Orlando (tangelo)':'GRIN',
  'Satsuma USDA Sel.':'GRIN','Page (tangelo)':'GRIN',
};

const CITRUS_VARIETIES={
'Citrus × sinensis':[
  'Washington Navel','Robertson','Carter','Barnfield','Chislett',
  'Bitters Newhall','Atwood','California Rojo','Autumn Gold','Ceridwen',
  'Cogan','Cluster','Apopka','Bey',
  'Lane Late','Late Navel','Cara Cara','Navelate',
  'Fukumoto Navel','Powell Navel','Newhall Navel','Leng Navel',
  'Rohde Red Navel','Gillette Navel','Parent Navel',
  'Valencia','Campbell Valencia','Chapman Valencia','Coarse Valencia',
  'Midknight Valencia','Olinda Valencia','Delta Seedless Valencia',
  'Moro','Tarocco','Sanguinello','Bream Tarocco','Burris Valencia Blood',
  'Tarocco Nucellare','Tarocco Rosso','Tarocco Gallo',
  'Moreau (sang.)','Sanguinello Comune','Brasiliano',
  'Entrefino','Doblefina',
  'Hamlin','Shamouti','Pineapple','Trovita','Salustiana',
  'Cadenera','Biondo Comune','Navelina','Biondo Riccio',
  'Boukhobza','Argentine','Jaffa','Maltaise demi-sanguine',
  'Acidless (CRC)',
  'Ambersweet','Chironja',
],

'Citrus × clementina':[
  'Clemenules (Nules)','Fina','Marisol','Oroval','Monreal','Arrufatina',
  'Nour','Caffin','Algerian','Ain Taoujdate','Sidi Aissa',
  'Clementard','Carte Noir',
  'Commune di Calabria','Clementina di Sicilia',
  'Hernandina','Oronules','Esbal','Tomatera','Loretina',
  'Clemenrubi','Beatriz','Barberina','Champagne (clementine)',
  'Corsica 1','Corsica 2','Corsica 4','Corsica N',
  'Clementine × Pearl','Clementine × Silverhill',
],

'Citrus unshiu':[
  'Okitsu','Miyagawa','Owari','Aoshima','Clausellina',
  'Armstrong','China S-1','China S-2','China S-3',
  'Aguzdera','Wase',
  'Dobashi Beni','Miho Wase','Imamura Early','Yamashita Satsuma',
  'Sugiyama','Ueno Wase','Kuno',
  'Xie Shan Satsuma','Saijo','Satsuma Guagua',
],

'Citrus reticulata':[
  'Dancy','Ponkan','Wilking','Kinnow','Emperor','Batangas',
  'Changsha','Sun Chu Sha Kat','Canton','Beledy',
  'Gold Nugget','Tango','WOW','Tahoe Gold',
  'Yosemite Gold','Shasta Gold','Yuba',
  'Pixie','Lee','Nova','Minneola','Orlando',
  'Fremont','Page','Fortune','Encore','Murcott (Honey)',
  'Avana Apireno','Avana Tardivo di Ciaculli',
  'Shiranui (Sumo/Dekopon)','W. Murcott','Sugar Belle',
  'Spring Honey','Autumn Honey','Ojai Pixie','Daisy',
  'Sunburst','Fallglo','Fairchild','Vernia',
  'Seedless Valencia Pride',
  'Tardivo di Ciaculli (INRAE)','Afourar',
  'Cleopatra',
],

'Citrus × limon':[
  'Eureka','Allen Eureka','Allen variegated Eureka','Cascade Eureka',
  'Lisbon','Villafranca','Primofiori','Verna','Femminello',
  'Femminello Siracusano','Femminello S. Teresa','Interdonato',
  'Berna','Arancino','Corpaci','Adamopolou',
  'Bitrouni','Atmore','Bergamotto Lisbon',
  'Eureka Variegated','Fleurs (Quatre Saisons)',
  'Primofiori Mesero','Lunario','Monachello','Eureka Cook','Génova',
  'Femminello Zagara Bianca','Santa Teresa (limon)','Citroniero de Menton',
  'Meyer','Improved Meyer',
],

'Citrus × meyeri':['Meyer','Improved Meyer'],

'Citrus × aurantiifolia':['Key lime','Mexican lime','Chulo','Castelo'],
'Citrus × latifolia':['Bearss (Persian)','Tahitian','Pond'],
'Citrus × floridana':['Eustis limequat','Tavares limequat'],

'Citrus × limonia':[
  'Rangpur','Australian Red Rangpur','Baishaishu Rangpur','Borneo Rangpur',
  'Kusaie lime',
],

'Citrus limetta':[
  'Limonette de Marrakech','Lipo','Palestinian Sweet',
  'Bahman #1','Bahman #2','C & M Sweet Lime',
],

'Citrus × paradisi':[
  'Marsh','Ruby Red','Rio Red','Star Ruby','Flame',
  'Duncan','Cecily','Camulos','Oroblanco (hybrid)',
  'Melogold (hybrid)','Cocktail (hybrid)','Chironja',
  'Thompson Pink','Henderson','Triumph (grapefruit)',
  'Foster Pink','Marsh Seedless','San Joaquin Pink',
],

'Citrus maxima':[
  'Chandler','Banpeiyu','Banokan','Arajon','Asahikan',
  'Anseikan','Alemoen','African pummelo','Chinese pummelo',
  'Siamese sweet','Siamese pink',
  'Thong Dee','Khao Yai','Kao Phuang',
],

'Citrus medica':[
  'Etrog','Diamante','Main de Bouddha (sarcodactylis)',
  'Citron of Commerce','Arizona 861','Badhri','Bengal',
],

'Citrus × bergamia':[
  'Femminello Bergamotto','Fantastico','Castagnaro','Calabrese',
  'Nossirah (bergamot)','Bergamot Bianco',
],

'Citrus × aurantium':[
  'Bouquet de Fleurs','Chinotto','Chinotto broadleaf',
  'Bouquetier de Nice','Apepu','Standard sour','Fraser Seville',
  'Bergamotto Fantastico','Goutoucheng','Zhuluan',
  'Bigarade INRAE','Bouquetier à fruit doux',
],

'Citrus hystrix':['Combava','Kaffir lime','Makrut','Cabuyao'],
'Citrus × junos':['Yuzu','Yuzu SRA','Yuko','Hanayuzu'],
'Citrus sudachi':['Sudachi'],
'Citrus ichangensis':['Ichang papeda'],
'Citrus depressa':['Shikuwasa (flat lemon)'],
'Citrus natsudaidai':['Natsudaidai (summer mandarin)'],
'Citrus tamurana':['Hyuganatsu'],
'Citrus × nobilis':[
  'King','Murcott tangor','Dancy tangor','Ellendale',
  'Temple','Topaz (tangor)',
],

'Fortunella margarita':['Nagami','Nagami Nordmann (seedless)','Centennial variegated'],
'Fortunella japonica':['Marumi'],
'Fortunella crassifolia':['Meiwa'],
'Fortunella hindsii':['Hong Kong kumquat'],
'Fortunella sp.':['Fukushu (Changshou)','Jiangsu kumquat'],

'× Citrofortunella microcarpa':['Calamondin','Calamondin sport','Calushu'],
'× Citrofortunella':['Faustrime','Limequat'],

'Microcitrus australasica':[
  'Pink Ice','Rainforest Pearl','Red (var. sanguinea)',
  "Durham's Emerald","Judy's Everbearing",
  'Alstonville','Crimson Tide','Sunrise Lime','Lime Caviar',
],
'Microcitrus australis':['Australian round lime'],
'Microcitrus australasica var. sanguinea':['Australian red pulp finger lime'],

'Poncirus trifoliata':[
  'Standard','Flying Dragon','Rubidoux','Rich 16-6',
  'Pomeroy','Barnes','Argentina','Australian',
],

'Citrus × bizarria':['Bizzarria (Florence chimera)'],
'Citrus macrophylla':['Alemow','Colo'],
'Citrus volkameriana':['Volkamer'],

'Aegle marmelos':['Bael','Bengal quince'],
'Clausena lansium':['Wampee'],
'Bergera koenigii':['Curry leaf (Murraya)'],
};

const RS_CATEGORIES=[
  {label:'Trifoliates',badge:'PT',items:['Poncirus trifoliata','Poncirus trifoliata Flying Dragon','Poncirus trifoliata Rubidoux','Poncirus trifoliata Rich 16-6','Poncirus trifoliata Pomeroy']},
  {label:'Citranges (C. sinensis × PT)',badge:'CTG',items:['Citrange Carrizo','Citrange Troyer','Citrange C-32','Citrange C-35','Citrange Benton','Citrange Rusk']},
  {label:'Citrumelos (C. paradisi × PT)',badge:'CTM',items:['Citrumelo Swingle 4475','Citrumelo C-190']},
  {label:'Citrandarins',badge:'CTD',items:['Forner-Alcaide 5® (Fa5®)','Citrandarin C-146','Citrandarin X639 (Cléopâtre × Poncirus)']},
  {label:'Mandariniers',badge:'MAN',items:['Cléopâtre (Citrus reshni)','Sunki (Citrus sunki)','Sun Chu Sha Kat']},
  {label:'Citronniers & rough lemons',badge:'CIT',items:['Citrus volkameriana','Citrus macrophylla (Alemow)','Rough lemon Schaub']},
  {label:'Limettiers',badge:'LIM',items:['Rangpur lime Borneo']},
  {label:'Bigaradiers',badge:'BIG',items:['Bigaradier (Citrus × aurantium)','Sour orange Standard']},
  {label:'HLB-tolerants',badge:'HLB',items:['US-802','US-812','US-852']},
  {label:'Autres',badge:'—',items:['Franc de semis','Inconnu']},
];

function _rsBadgeColor(badge){
  return{PT:'#2e7d32',CTG:'#1565c0',CTM:'#0277bd',CTD:'#00838f',MAN:'#6a1b9a',CIT:'#c77800',LIM:'#2e7d32',BIG:'#c62828',HLB:'#37474f','—':'#9e9e9e'}[badge]||'#9e9e9e';
}

function _varBadge(name,fallback='GCVC'){
  const key=VARIETY_SOURCE_MAP[name]||fallback;
  const src=VAR_SOURCES[key]||VAR_SOURCES.GCVC;
  return`<span class="gbif-rank" style="background:${src.color}18;color:${src.color};border:1px solid ${src.color}30">${src.label}</span>`;
}

function _vrToSp(){
  if(!window.__vrToSp){
    window.__vrToSp={};
    Object.entries(CITRUS_VARIETIES).forEach(([sp,vars])=>{
      vars.forEach(v=>{if(!window.__vrToSp[v])window.__vrToSp[v]=sp;});
    });
  }
  return window.__vrToSp;
}

function openAddPlant(){
  if(window.isReadOnly?.()){window.toast?.('Mode lecture seule — modifications désactivées');return;}
  const td=window.todayStr?.()??'';
  const STATUS=window.STATUS??{};
  const SP=window.SP??[];
  let currentCT='pot';

  function buildBotSection(){
    return`
<div class="ff">
  <label>${T('misc.detailVarLbl')}
    <a href="https://citrusvariety.ucr.edu/citrus-varieties" target="_blank" style="font-size:.75rem;color:var(--amber3);text-decoration:none;margin-left:6px;font-family:'JetBrains Mono',monospace" title="Source: Givaudan Citrus Variety Collection, UC Riverside">GCVC/UCR ↗</a>
  </label>
  <div class="sp-combo">
    <input id="ap-vr-input" placeholder="ex: Nules, Tarocco, Okitsu — suggestions GCVC/UCR…"
      onfocus="apSuggestVarieties(document.getElementById('ap-sp-input')?.value||'')"
      oninput="window._apVarDebounce&&clearTimeout(window._apVarDebounce);window._apVarDebounce=setTimeout(()=>apSearchVariety(this.value),400)"
      onblur="setTimeout(()=>document.getElementById('ap-vr-res')?.classList.remove('show'),200)"/>
    <div class="gbif-results" id="ap-vr-res"></div>
  </div>
</div>
<div class="ff">
  <label>${T('misc.detailSpLbl')}</label>
  <div class="sp-combo">
    <datalist id="ap-sp-list">${SP.map(s=>`<option value="${esc(s)}">`).join('')}</datalist>
    <input id="ap-sp-input" list="ap-sp-list" placeholder="ex: Citrus × sinensis — GCVC/UCR ou GBIF…" autocomplete="off"
      onfocus="apFocusSpecies()"
      oninput="window._apDebounce&&clearTimeout(window._apDebounce);window._apDebounce=setTimeout(()=>apSearchSpecies(this.value),340)"
      onblur="setTimeout(()=>document.getElementById('ap-sp-res')?.classList.remove('show'),200)"/>
    <div class="gbif-results" id="ap-sp-res"></div>
  </div>
</div>
<div class="frow2">
  <div class="ff">
    <label>Porte-greffe</label>
    <div class="sp-combo">
      <input id="ap-rs-input" placeholder="Poncirus trifoliata, Carrizo…" autocomplete="off"
        oninput="rsSearch(this.value,'ap-rs-input','ap-rs-res')"
        onfocus="rsSearch(this.value,'ap-rs-input','ap-rs-res')"
        onblur="setTimeout(()=>document.getElementById('ap-rs-res')?.classList.remove('show'),200)"/>
      <div class="gbif-results" id="ap-rs-res"></div>
    </div>
  </div>
  <div class="ff">
    <label>Type d'acquisition</label>
    <select id="ap-pvt">${Object.entries(T('provenanceType')||{}).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select>
  </div>
  <div class="ff">
    <label>Mode de provenance</label>
    <select id="ap-pvm">${Object.entries(T('provenanceMode')||{}).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select>
  </div>
  <div class="ff">
    <label>Type de production</label>
    <select id="ap-pdt">${Object.entries(T('productionType')||{}).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('')}</select>
  </div>
  <div class="ff">
    <label>Précisions provenance</label>
    <input id="ap-pvd" placeholder="pépinière, pays d'origine, donateur…"/>
  </div>
  <input type="hidden" id="ap-or" value="acheté"/>
</div>`;}

  function rf(){
    const LO_POT=window.LO_POT??[];
    const LO_TERRE=window.LO_TERRE??[];
    const SUN_EXP=window.SUN_EXP??[];
    const EXPO=window.EXPO??[];
    const SOL=window.SOL??[];
    const PROT=window.PROT??[];
    const isPM=currentCT==='pot';
    const loArr=isPM?LO_POT:LO_TERRE;
    document.getElementById('ap-ct-form').innerHTML=`<div class="msec ${isPM?'':'terre'}">Mode de culture</div>
<div class="ct-toggle" style="margin-bottom:14px">
  <button class="ct-btn${isPM?' active-pot':''}" data-action="ap-switch-ct" data-ct="pot">🪴 En pot</button>
  <button class="ct-btn${!isPM?' active-terre':''}" data-action="ap-switch-ct" data-ct="terre">🌳 Pleine terre</button>
</div>
<div class="frow2">
  <div class="ff"><label>${isPM?'Ø pot (cm)':'Hauteur estimée (cm)'}</label><input id="ap-sz" type="number" placeholder="${isPM?'ex:40':'ex:60'}"/></div>
  <div class="ff"><label>Emplacement</label><select id="ap-lo">${loArr.map(l=>`<option>${l}</option>`).join('')}</select></div>
</div>
<div class="frow2">
  <div class="ff"><label>Section / Parcelle</label><input id="ap-lo-sec" type="text" placeholder="ex: carré B"/></div>
  <div class="ff"><label>Position précise</label><input id="ap-lo-pos" type="text" placeholder="ex: rang 2, place 4"/></div>
</div>
<div class="frow2">
  <div class="ff"><label>Ensoleillement</label><select id="ap-sun">${SUN_EXP.map(s=>`<option>${s}</option>`).join('')}</select></div>
  ${!isPM?`<div class="ff"><label>Exposition</label><select id="ap-ex">${EXPO.map(e=>`<option>${e}</option>`).join('')}</select></div>`:`<div class="ff"></div>`}
</div>
${!isPM?`<div class="frow2">
  <div class="ff"><label>Type de sol</label><select id="ap-so">${SOL.map(s=>`<option>${s}</option>`).join('')}</select></div>
  <div class="ff"><label>Protection hivernale</label><select id="ap-pr">${PROT.map(p=>`<option>${p}</option>`).join('')}</select></div>
</div>`:''}
<div class="ff"><label>${isPM?'Date acquisition':'Date plantation'}</label><input id="ap-dt" type="date" value="${td}"/></div>`;}

  window.showModal?.(`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
<h3 style="margin:0">${T('misc.collAddSubjectBtn')}</h3>
<button data-action="close-modal-nav" data-page="dashboard" style="width:32px;height:32px;border-radius:50%;background:var(--cream3);color:var(--text);font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" title="Fermer sans enregistrer">✕</button>
</div>
<div class="ff"><label>Nom *</label><input id="ap-nm" placeholder="ex : Meyer n°1, Yuzu jardin…"/></div>
${buildBotSection()}
<div class="ff"><label>${T('misc.detailSupplierLbl')}</label><input id="ap-sr" placeholder="pépinière, pays d'origine…"/></div>

<div id="ap-ct-form"></div>
<div class="ff"><label>${T('misc.detailStatusLbl')}</label><select id="ap-st">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></div>
<div class="ff"><label>Notes</label><textarea id="ap-nt" placeholder="Observations générales, caractéristiques notables…"></textarea></div>
<div class="fact">
  <button class="btn" style="background:var(--cream3);color:var(--text)" data-action="close-modal-nav" data-page="dashboard">${T('misc.detailCancelBtn')}</button>
  <button class="btn btn-p" data-action="submit-ap">${T('misc.detailAddBtn')}</button>
</div>`);

  window.apSwitchCT=(ct)=>{currentCT=ct;rf()};
  window._apCT=()=>currentCT;
  rf();
}

function apFocusSpecies(){
  const SP=window.SP??[];
  const res=document.getElementById('ap-sp-res');if(!res)return;
  const q=document.getElementById('ap-sp-input')?.value||'';
  if(q.length>=2){apSearchSpecies(q);return;}
  const items=SP.slice(0,10);
  res.classList.add('show');
  res.innerHTML=`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);padding:5px 10px;border-bottom:1px solid var(--cream3)">Espèces — liste GCVC/UCR</div>`+
    items.map(s=>`<div class="gbif-item" onclick="apApplySpecies('${esc(s)}')">${esc(s)}<span class="gbif-rank">liste</span></div>`).join('');
}

async function apSearchSpecies(q){
  const SP=window.SP??[];
  const res=document.getElementById('ap-sp-res');if(!res)return;
  if(!q||q.length<2){res.classList.remove('show');return;}
  res.classList.add('show');
  const localMatches=SP.filter(s=>s.toLowerCase().includes(q.toLowerCase())).slice(0,6);
  res.innerHTML=localMatches.map(s=>`<div class="gbif-item" onclick="apApplySpecies('${esc(s)}')">${esc(s)}<span class="gbif-rank">local</span></div>`).join('')+
    (q.length>=3?`<div class="gbif-loading">🔎 GBIF en cours…</div>`:'');
  if(q.length>=3){
    const items=await window.gbifSearch?.(q)??[];
    const combined=[...new Set([...localMatches,...items.map(x=>x.canonicalName)])].slice(0,12);
    res.innerHTML=combined.map(s=>{
      const isLocal=localMatches.includes(s);
      return`<div class="gbif-item" onclick="apApplySpecies('${esc(s)}')">${esc(s)}<span class="gbif-rank">${isLocal?'liste':'GBIF'}</span></div>`;
    }).join('')||`<div class="gbif-loading">Aucun résultat. Saisissez librement.</div>`;
  }
}

function apApplySpecies(name){
  const inp=document.getElementById('ap-sp-input');
  if(inp)inp.value=name;
  document.getElementById('ap-sp-res')?.classList.remove('show');
  apSuggestVarieties(name);
}

async function grinSearchVariety(q){
  try{
    const url=`https://npgsweb.ars-grin.gov/GRINGlobal/json/lookup/taxon?q=Citrus+${encodeURIComponent(q)}&limit=10`;
    const ctrl=new AbortController();const tid=setTimeout(()=>ctrl.abort(),4000);
    const r=await fetch(url,{signal:ctrl.signal});clearTimeout(tid);
    if(!r.ok)return[];
    const data=await r.json();
    return(data||[]).map(x=>x.name||x.taxon_name||x.label||'').filter(Boolean).slice(0,6);
  }catch{return[];}
}

function apSuggestVarieties(species){
  const res=document.getElementById('ap-vr-res');if(!res)return;
  const cultivars=CITRUS_VARIETIES[species]||[];
  if(!cultivars.length){res.classList.remove('show');return;}
  res.classList.add('show');
  const src=VAR_SOURCES.GCVC;
  const header=`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);padding:5px 10px;border-bottom:1px solid var(--cream3);display:flex;justify-content:space-between;align-items:center"><span>Cultivars — ${esc(species)}</span><div style="display:flex;gap:5px">${Object.entries(VAR_SOURCES).filter(([k])=>k!=='GRIN'&&k!=='GBIF'&&k!=='EPPO').map(([k,s])=>`<a href="${s.url}" target="_blank" style="font-size:.75rem;color:${s.color};text-decoration:none;white-space:nowrap">${s.label} ↗</a>`).join('')}</div></div>`;
  res.innerHTML=header+cultivars.map(v=>`<div class="gbif-item" onclick="apApplyVariety('${esc(v)}')">${esc(v)}${_varBadge(v)}</div>`).join('');
}

async function apSearchVariety(q){
  const res=document.getElementById('ap-vr-res');if(!res)return;
  const sp=document.getElementById('ap-sp-input')?.value||'';
  if(!q||q.length<2){apSuggestVarieties(sp);return;}
  res.classList.add('show');
  const allCultivars=sp?(CITRUS_VARIETIES[sp]||[]):Object.values(CITRUS_VARIETIES).flat();
  const localMatches=allCultivars.filter(v=>v.toLowerCase().includes(q.toLowerCase()));
  const srcLinks=Object.entries(VAR_SOURCES).filter(([k])=>k!=='GBIF').map(([k,s])=>`<a href="${s.url}" target="_blank" style="font-size:.75rem;color:${s.color};text-decoration:none">${s.label} ↗</a>`).join(' · ');
  const header=`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);padding:5px 10px;border-bottom:1px solid var(--cream3);display:flex;flex-wrap:wrap;justify-content:space-between;gap:3px;align-items:center"><span>« ${esc(q)} »</span><div style="display:flex;flex-wrap:wrap;gap:4px">${srcLinks}</div></div>`;
  res.innerHTML=header+(localMatches.length
    ? localMatches.slice(0,12).map(v=>`<div class="gbif-item" onclick="apApplyVariety('${esc(v)}')">${esc(v)}${_varBadge(v)}</div>`).join('')
    : `<div class="gbif-loading">🔎 Recherche GRIN & GBIF…</div>`);
  if(q.length>=3){
    const [grinItems,gbifItems]=await Promise.all([
      grinSearchVariety(q),
      (async()=>{try{const searchQ=sp?`${sp} ${q}`:q;const items=await window.gbifSearch?.(searchQ)??[];return items.filter(x=>x.canonicalName&&x.canonicalName!==sp).map(x=>x.canonicalName);}catch{return[];}})()
    ]);
    const grinSet=new Set(grinItems.map(x=>x.toLowerCase()));
    const combined=[...new Set([...localMatches,...grinItems,...gbifItems])].slice(0,16);
    const nothing=!combined.length;
    res.innerHTML=header+(combined.length
      ? combined.map(v=>{
          const isLocal=localMatches.includes(v);
          const isGrin=!isLocal&&grinSet.has(v.toLowerCase());
          const badge=isLocal?_varBadge(v):isGrin?`<span class="gbif-rank" style="background:${VAR_SOURCES.GRIN.color}18;color:${VAR_SOURCES.GRIN.color};border:1px solid ${VAR_SOURCES.GRIN.color}30">GRIN</span>`:`<span class="gbif-rank" style="background:${VAR_SOURCES.GBIF.color}18;color:${VAR_SOURCES.GBIF.color};border:1px solid ${VAR_SOURCES.GBIF.color}30">GBIF</span>`;
          return`<div class="gbif-item" onclick="apApplyVariety('${esc(v)}')">${esc(v)}${badge}</div>`;
        }).join('')
      : `<div class="gbif-loading">Aucun cultivar trouvé dans les bases.</div>`)
    +(nothing?`<div style="font-size:.75rem;color:var(--amber3);padding:6px 10px;border-top:1px solid var(--cream3)">⚠ variété non référencée — saisie libre acceptée</div>`:'');
  }
}

function apApplyVariety(name){
  const inp=document.getElementById('ap-vr-input');
  if(inp)inp.value=name;
  document.getElementById('ap-vr-res')?.classList.remove('show');
  const spInp=document.getElementById('ap-sp-input');
  if(spInp){
    const mapped=_vrToSp()[name];
    if(mapped)spInp.value=mapped;
  }
}

async function detailSearchVariety(q){
  const res=document.getElementById('ed-vr-res');if(!res)return;
  const spVal=document.getElementById('ed-sp')?.value||'';
  if(!q||q.length<2){
    const cultivars=CITRUS_VARIETIES[spVal]||[];
    if(!cultivars.length){res.classList.remove('show');return;}
    res.classList.add('show');
    const hdr=`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);padding:5px 10px;border-bottom:1px solid var(--cream3)">Cultivars — ${esc(spVal)}</div>`;
    res.innerHTML=hdr+cultivars.map(v=>`<div class="gbif-item" onclick="detailApplyVariety('${esc(v)}')">${esc(v)}${_varBadge(v)}</div>`).join('');
    return;
  }
  res.classList.add('show');
  const allCultivars=spVal?(CITRUS_VARIETIES[spVal]||[]):Object.values(CITRUS_VARIETIES).flat();
  const matches=allCultivars.filter(v=>v.toLowerCase().includes(q.toLowerCase()));
  res.innerHTML=(matches.length
    ? matches.slice(0,12).map(v=>`<div class="gbif-item" onclick="detailApplyVariety('${esc(v)}')">${esc(v)}${_varBadge(v)}</div>`).join('')
    : `<div class="gbif-loading">🔎 Recherche GRIN & GBIF…</div>`);
  if(q.length>=3){
    const [grinItems,gbifItems]=await Promise.all([
      grinSearchVariety(q),
      (async()=>{try{const searchQ=spVal?`${spVal} ${q}`:q;const items=await window.gbifSearch?.(searchQ)??[];return items.filter(x=>x.canonicalName&&x.canonicalName!==spVal).map(x=>x.canonicalName);}catch{return[];}})()
    ]);
    const grinSet=new Set(grinItems.map(x=>x.toLowerCase()));
    const combined=[...new Set([...matches,...grinItems,...gbifItems])].slice(0,16);
    const nothing=!combined.length;
    res.innerHTML=(combined.length
      ? combined.map(v=>{
          const isLocal=matches.includes(v);
          const isGrin=!isLocal&&grinSet.has(v.toLowerCase());
          const badge=isLocal?_varBadge(v):isGrin?`<span class="gbif-rank" style="background:${VAR_SOURCES.GRIN.color}18;color:${VAR_SOURCES.GRIN.color};border:1px solid ${VAR_SOURCES.GRIN.color}30">GRIN</span>`:`<span class="gbif-rank" style="background:${VAR_SOURCES.GBIF.color}18;color:${VAR_SOURCES.GBIF.color};border:1px solid ${VAR_SOURCES.GBIF.color}30">GBIF</span>`;
          return`<div class="gbif-item" onclick="detailApplyVariety('${esc(v)}')">${esc(v)}${badge}</div>`;
        }).join('')
      : `<div class="gbif-loading">Aucun cultivar trouvé. Saisie libre acceptée.</div>`)
    +(nothing?`<div style="font-size:.75rem;color:var(--amber3);padding:6px 10px;border-top:1px solid var(--cream3)">⚠ variété non référencée — saisie libre acceptée</div>`:'');
  }
}

function rsSearch(q,inputId,resultsId){
  const res=document.getElementById(resultsId);if(!res)return;
  const lq=(q||'').toLowerCase().trim();
  let html='';
  if(!lq){
    RS_CATEGORIES.forEach(cat=>{
      const bcolor=_rsBadgeColor(cat.badge);
      html+=`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);padding:4px 10px 2px;background:var(--cream2);border-bottom:1px solid var(--cream3);text-transform:uppercase;letter-spacing:.07em">${esc(cat.label)}</div>`;
      html+=cat.items.map(it=>`<div class="gbif-item" onclick="rsApply('${esc(it)}','${inputId}','${resultsId}')">${esc(it)}<span class="gbif-rank" style="background:${bcolor}18;color:${bcolor}">${cat.badge}</span></div>`).join('');
    });
  } else {
    let count=0;
    RS_CATEGORIES.forEach(cat=>{
      const matches=cat.items.filter(it=>it.toLowerCase().includes(lq));
      if(!matches.length)return;
      const bcolor=_rsBadgeColor(cat.badge);
      html+=`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted);padding:4px 10px 2px;background:var(--cream2);border-bottom:1px solid var(--cream3);text-transform:uppercase;letter-spacing:.07em">${esc(cat.label)}</div>`;
      html+=matches.map(it=>`<div class="gbif-item" onclick="rsApply('${esc(it)}','${inputId}','${resultsId}')">${esc(it)}<span class="gbif-rank" style="background:${bcolor}18;color:${bcolor}">${cat.badge}</span></div>`).join('');
      count+=matches.length;
    });
    if(!count) html=`<div class="gbif-loading">Aucun porte-greffe connu — saisie libre acceptée.</div>`;
  }
  res.innerHTML=html;
  res.classList.add('show');
}

function rsApply(name,inputId,resultsId){
  const inp=document.getElementById(inputId);
  if(inp){inp.value=name;inp.dispatchEvent(new Event('input'));}
  setTimeout(()=>document.getElementById(resultsId)?.classList.remove('show'),80);
}

function submitAP(){
  const n=document.getElementById('ap-nm')?.value?.trim();if(!n){alert('Nom requis');return}
  const ct=window._apCT?.()??'pot',isPM=ct==='pot',sz=document.getElementById('ap-sz')?.value||'';
  const speciesVal=document.getElementById('ap-sp-input')?.value?.trim()||'';
  const varietyVal=document.getElementById('ap-vr-input')?.value?.trim()||'';
  const rootstockVal=document.getElementById('ap-rs-input')?.value?.trim()||'Inconnu';
  const sd=window._apScanData||{};
  let notes=document.getElementById('ap-nt')?.value||'';
  if(sd.lot)notes=(notes?notes+'\n':'')+`Passeport phytosanitaire UE — Lot : ${sd.lot}${sd.operator?' / Opérateur : '+sd.operator:''}`;
  const p={
    id:window.gid?.()??crypto.randomUUID(),name:n,cultureType:ct,photos:[],
    accessionId:window.generateAccessionId?.()??'',
    datePrecision:'full',
    provenance:{},
    events:[{id:window.gid?.()??crypto.randomUUID(),date:window.todayStr?.()??'',type:'observation',
      description:'Sujet ajouté à la collection.'+(sd.lot?` Passeport UE lot ${sd.lot}.`:''),bulk:false}],
    species:speciesVal,variety:varietyVal,rootstock:rootstockVal,
    origin:document.getElementById('ap-or')?.value||'acheté',
    provenanceType:document.getElementById('ap-pvt')?.value||'inconnu',
    provenanceMode:document.getElementById('ap-pvm')?.value||'inconnu',
    productionType:document.getElementById('ap-pdt')?.value||'inconnu',
    provenanceDetail:document.getElementById('ap-pvd')?.value?.trim()||'',
    acquisitionDate:isPM?document.getElementById('ap-dt')?.value||'':'',
    plantingDate:!isPM?document.getElementById('ap-dt')?.value||'':'',
    acquisitionSource:document.getElementById('ap-sr')?.value||'',
    potSize:isPM?sz:'',height:!isPM?sz:'',crownDiameter:'',
    location:document.getElementById('ap-lo')?.value||'',
    locationData:{zone:document.getElementById('ap-lo')?.value||'',section:document.getElementById('ap-lo-sec')?.value?.trim()||'',position:document.getElementById('ap-lo-pos')?.value?.trim()||'',lat:null,lng:null},
    sunExposure:document.getElementById('ap-sun')?.value||'',
    exposition:!isPM?document.getElementById('ap-ex')?.value||'':'',
    sol:!isPM?document.getElementById('ap-so')?.value||'':'',
    protection:!isPM?document.getElementById('ap-pr')?.value||'':'',
    status:document.getElementById('ap-st')?.value||'bon',
    notes,lastWatering:'',lastFertilization:'',
  };
  window._ccaAddPlant?.(p);
  window.toast?.(`${n} ajouté ✓`);
  window.openDetail?.(p.id);
}

window.__CCA_plant_form = { openAddPlant };
window.openAddPlant      = openAddPlant;
window.apFocusSpecies    = apFocusSpecies;
window.apSearchSpecies   = apSearchSpecies;
window.apApplySpecies    = apApplySpecies;
window.apSuggestVarieties= apSuggestVarieties;
window.apSearchVariety   = apSearchVariety;
window.apApplyVariety    = apApplyVariety;
window.detailSearchVariety = detailSearchVariety;
window.rsSearch          = rsSearch;
window.rsApply           = rsApply;
window.submitAP          = submitAP;
