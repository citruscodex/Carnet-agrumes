import { esc } from '../lib/esc.js';

const T            = k       => window.T?.(k) ?? k;
const getLang      = ()      => window.getLang?.() ?? 'fr';
const toast        = (m, e)  => window.toast?.(m, e);
const getSpeciesKB = sp      => window.getSpeciesKB?.(sp);
const compress     = (f, mw) => window.compress?.(f, mw);
const getCfg       = ()      => window.getCfg?.();
const setCfg       = v       => window.setCfg?.(v);
const render       = ()      => window.render?.();
const saveData     = ()      => window.saveData?.();
const sha256       = async m => window.sha256?.(m);
const obf          = (s, k)  => window.obf?.(s, k);
const dob          = (o, k)  => window.dob?.(o, k);
const helpBtn      = k       => window.helpBtn?.(k) ?? '';
const gid          = ()      => window.gid?.();
const todayStr     = ()      => window.todayStr?.() ?? new Date().toISOString().slice(0, 10);

function _getPlants()  { return window.plants ?? []; }
function _setPlants(v) { window.plants = v; }

let _diagPid      = null;
let _diagStep     = 1;
let _diagB64      = null;
let _diagZones    = new Set();
let _diagSymptom  = null;
let _diagLeafAge  = null;
let _diagImageUrl = null;
let _lastDiagResult = null;

const DIAG_CATALOGUE=[
  {id:'cochenille_farineuse',name:'Cochenille farineuse',sci:'Planococcus citri',cat:'insecte',
   zones:['feuille','rameau','fruit'],primary:'depot',secondary:['deform'],
   requireZones:null,requireSymptom:'depot',
   confCap:0.85,specificity:0.15,leafContext:'any',sev:2,
   treat:{fr:'Huile blanche + savon insecticide. Éliminer les fourmis (vecteurs). Lâchers de Cryptolaemus montrouzieri en bio.',
          en:'White oil + insecticidal soap. Remove ants (vectors). Release Cryptolaemus montrouzieri for biocontrol.',
          es:'Aceite blanco + jabón insecticida. Eliminar hormigas. Suelta de Cryptolaemus montrouzieri.',
          it:'Olio bianco + sapone insetticida. Eliminare le formiche. Lancio di Cryptolaemus montrouzieri.',
          pt:'Óleo branco + sabão inseticida. Eliminar formigas. Largas de Cryptolaemus montrouzieri.'},
   caution:null,kb:'Cochenille farineuse'},

  {id:'cochenille_virgule',name:'Cochenille virgule',sci:'Lepidosaphes beckii',cat:'insecte',
   zones:['rameau','fruit','tronc'],primary:'depot',secondary:['spot'],
   requireZones:['rameau','fruit','tronc'],requireSymptom:'depot',
   confCap:0.82,specificity:0.10,leafContext:'any',sev:2,
   treat:{fr:'Huile blanche en hiver (dormance). Insecticide systémique au printemps sur larves mobiles.',
          en:'White oil in winter (dormancy). Systemic insecticide in spring on mobile larvae.',
          es:'Aceite blanco en invierno. Insecticida sistémico en primavera sobre larvas móviles.',
          it:'Olio bianco in inverno. Insetticida sistemico in primavera sulle larve mobili.',
          pt:'Óleo branco no inverno. Inseticida sistémico na primavera sobre larvas móveis.'},
   caution:null,kb:'Cochenille virgule'},

  {id:'mineuse',name:'Mineuse des agrumes',sci:'Phyllocnistis citrella',cat:'insecte',
   zones:['feuille'],primary:'gallery',secondary:['deform'],
   requireZones:['feuille'],requireSymptom:'gallery',
   confCap:0.88,specificity:0.28,leafContext:'any',sev:2,
   treat:{fr:'Kaolin pulvérisé sur pousses. Spinosad ou azadirachtine. Filets anti-insectes sur jeunes arbres.',
          en:'Kaolin on new shoots. Spinosad or azadirachtin. Insect nets on young trees.',
          es:'Caolín en brotes. Spinosad o azadiractina. Mallas antiinsectos en árboles jóvenes.',
          it:'Caolino sui germogli. Spinosad o azadiractina. Reti antiinsetti sugli alberi giovani.',
          pt:'Caulino nos rebentos. Espinosade ou azadiractina. Redes anti-insetos em árvores jovens.'},
   caution:null,kb:'Mineuse des agrumes'},

  {id:'araignee_rouge',name:'Araignée rouge',sci:'Panonychus citri',cat:'insecte',
   zones:['feuille'],primary:'spot',secondary:['yellow'],
   requireZones:['feuille'],requireSymptom:'spot',
   confCap:0.80,specificity:0.12,leafContext:'any',sev:2,
   treat:{fr:'Acaricide homologué (bifenazate, spiromésifène). Huile blanche en prévention. Brumisation pour augmenter l\'hygrométrie.',
          en:'Registered acaricide (bifenazate, spiromesifen). White oil preventively. Misting to increase humidity.',
          es:'Acaricida homologado. Aceite blanco preventivo. Nebulización para aumentar humedad.',
          it:'Acaricida registrato. Olio bianco preventivo. Nebulizzazione per aumentare umidità.',
          pt:'Acaricida registado. Óleo branco preventivo. Nebulização para aumentar humidade.'},
   caution:null,kb:'Araignée rouge'},

  {id:'puceron_noir',name:'Puceron noir',sci:'Toxoptera aurantii',cat:'insecte',
   zones:['feuille','rameau'],primary:'deform',secondary:['yellow','depot'],
   requireZones:null,requireSymptom:'deform',
   confCap:0.80,specificity:0.10,leafContext:'any',sev:1,
   treat:{fr:'Pyrèthre naturel ou savon noir dilué. Larves de coccinelles. Jet d\'eau fort sur colonies.',
          en:'Natural pyrethrum or diluted black soap. Ladybird larvae. Strong water jet on colonies.',
          es:'Piretro natural o jabón negro. Larvas de mariquita. Chorro de agua fuerte.',
          it:'Piretro naturale o sapone nero. Larve di coccinella. Getto d\'acqua forte.',
          pt:'Piretro natural ou sabão negro. Larvas de joaninha. Jato de água forte.'},
   caution:null,kb:'Puceron noir'},

  {id:'psylle',name:'Psylle asiatique des agrumes',sci:'Diaphorina citri',cat:'insecte',
   zones:['feuille','rameau'],primary:'depot',secondary:['deform'],
   requireZones:null,requireSymptom:'depot',
   confCap:0.72,specificity:0.08,leafContext:'any',sev:3,
   treat:{fr:'Insecticide systémique (imidaclopride). Lâchers de Tamarixia radiata. Surveiller toute la collection. Signaler à la DGAL si confirmé.',
          en:'Systemic insecticide (imidacloprid). Release Tamarixia radiata. Monitor whole collection. Report to authorities if confirmed.',
          es:'Insecticida sistémico. Suelta de Tamarixia radiata. Vigilar toda la colección. Notificar si se confirma.',
          it:'Insetticida sistemico. Lancio di Tamarixia radiata. Monitorare tutta la collezione. Segnalare se confermato.',
          pt:'Inseticida sistémico. Largas de Tamarixia radiata. Monitorar toda a coleção. Reportar se confirmado.'},
   caution:'Vecteur potentiel du HLB (Huanglongbing). Si suspecté, isoler immédiatement et contacter le SRAL/DRAAF de votre région.',kb:null},

  {id:'fumagine',name:'Fumagine',sci:'Capnodium citri',cat:'champignon',
   zones:['feuille','rameau','fruit'],primary:'depot',secondary:['yellow'],
   requireZones:null,requireSymptom:'depot',
   confCap:0.82,specificity:0.18,leafContext:'any',sev:1,
   treat:{fr:'Traiter en priorité l\'insecte causateur (cochenille, puceron). Laver les feuilles à l\'eau savonneuse. Améliorer la ventilation.',
          en:'Treat the causal insect first (scale, aphid). Wash leaves with soapy water. Improve ventilation.',
          es:'Tratar el insecto causante. Lavar hojas con agua jabonosa. Mejorar ventilación.',
          it:'Trattare prima l\'insetto causale. Lavare le foglie con acqua saponata. Migliorare ventilazione.',
          pt:'Tratar primeiro o inseto causador. Lavar folhas com água saponada. Melhorar ventilação.'},
   caution:null,kb:'Fumagine'},

  {id:'alternariose',name:'Alternariose',sci:'Alternaria alternata',cat:'champignon',
   zones:['feuille','fruit'],primary:'spot',secondary:['drop'],
   requireZones:['feuille','fruit'],requireSymptom:'spot',
   confCap:0.75,specificity:0.10,leafContext:'any',sev:2,
   treat:{fr:'Fongicide cuivrique préventif à l\'automne. Éviter les blessures. Ramasser les feuilles tombées. Bouillie bordelaise en début de saison.',
          en:'Preventive copper fungicide in autumn. Avoid injuries. Collect fallen leaves. Bordeaux mixture at season start.',
          es:'Fungicida cúprico preventivo en otoño. Evitar heridas. Recoger hojas caídas.',
          it:'Fungicida rameico preventivo in autunno. Evitare ferite. Raccogliere le foglie cadute.',
          pt:'Fungicida cúprico preventivo no outono. Evitar feridas. Recolher folhas caídas.'},
   caution:null,kb:'Alternariose'},

  {id:'anthracnose',name:'Anthracnose',sci:'Colletotrichum gloeosporioides',cat:'champignon',
   zones:['feuille','rameau'],primary:'spot',secondary:['drop','deform'],
   requireZones:null,requireSymptom:'spot',
   confCap:0.75,specificity:0.10,leafContext:'any',sev:2,
   treat:{fr:'Fongicide cuivrique au printemps (sortie hivernage). Taille des parties atteintes + désinfection des outils. Améliorer l\'aération.',
          en:'Copper fungicide in spring (after wintering). Prune affected parts + disinfect tools. Improve airflow.',
          es:'Fungicida cúprico en primavera. Podar partes afectadas + desinfectar herramientas.',
          it:'Fungicida rameico in primavera. Potare le parti colpite + disinfettare gli attrezzi.',
          pt:'Fungicida cúprico na primavera. Podar partes afetadas + desinfetar ferramentas.'},
   caution:null,kb:'Anthracnose'},

  {id:'phytophthora',name:'Phytophthora (gomme du collet)',sci:'Phytophthora citrophthora',cat:'champignon',
   zones:['tronc','racine'],primary:'depot',secondary:['yellow','drop'],
   requireZones:['tronc','racine'],requireSymptom:null,
   confCap:0.80,specificity:0.22,leafContext:'any',sev:3,
   treat:{fr:'Drainer immédiatement le sol. Fongicide systémique (métalaxyl ou fosétyl-Al) au collet. Éviter les arrosages au pied. Utiliser porte-greffe résistant.',
          en:'Drain soil immediately. Systemic fungicide (metalaxyl or fosetyl-Al) at base. Avoid watering at the trunk. Use resistant rootstock.',
          es:'Drenar el suelo inmediatamente. Fungicida sistémico al cuello. Evitar riego al pie.',
          it:'Drenare immediatamente il suolo. Fungicida sistemico al colletto. Evitare irrigazione al piede.',
          pt:'Drenar o solo imediatamente. Fungicida sistémico no colo. Evitar rega ao pé.'},
   caution:null,kb:'Phytophthora'},

  {id:'botrytis',name:'Botrytis (pourriture grise)',sci:'Botrytis cinerea',cat:'champignon',
   zones:['feuille','fruit','rameau'],primary:'depot',secondary:['drop'],
   requireZones:null,requireSymptom:'depot',
   confCap:0.72,specificity:0.10,leafContext:'any',sev:2,
   treat:{fr:'Supprimer les parties atteintes. Réduire l\'humidité (ventilation). Fongicide à base de boscalide ou de thiophanate-méthyl. Éviter les blessures.',
          en:'Remove affected parts. Reduce humidity (ventilation). Boscalid or thiophanate-methyl fungicide. Avoid injuries.',
          es:'Eliminar partes afectadas. Reducir humedad. Fungicida (boscalida). Evitar heridas.',
          it:'Rimuovere le parti colpite. Ridurre umidità. Fungicida (boscalide). Evitare ferite.',
          pt:'Remover partes afetadas. Reduzir humidade. Fungicida (boscalida). Evitar feridas.'},
   caution:null,kb:null},

  {id:'carence_fer',name:'Carence en fer (chlorose ferrique)',sci:null,cat:'carence',
   zones:['feuille'],primary:'yellow',secondary:[],
   requireZones:['feuille'],requireSymptom:'yellow',
   confCap:0.70,specificity:0.05,leafContext:'young',sev:2,
   treat:{fr:'Chélate de fer en arrosage ou foliaire (pH substrat cible : 5,5–6,5). Acidifier le substrat (soufre, tourbe). Vérifier le porte-greffe.',
          en:'Iron chelate in irrigation or foliar spray (target substrate pH: 5.5–6.5). Acidify substrate (sulfur, peat). Check rootstock.',
          es:'Quelato de hierro en riego o foliar (pH sustrato 5,5–6,5). Acidificar sustrato. Verificar portainjerto.',
          it:'Chelato di ferro in irrigazione o fogliare (pH substrato 5,5–6,5). Acidificare substrato.',
          pt:'Quelato de ferro em rega ou foliar (pH substrato 5,5–6,5). Acidificar substrato.'},
   caution:null,kb:null},

  {id:'carence_mg',name:'Carence en magnésium',sci:null,cat:'carence',
   zones:['feuille'],primary:'yellow',secondary:[],
   requireZones:['feuille'],requireSymptom:'yellow',
   confCap:0.68,specificity:0.05,leafContext:'old',sev:1,
   treat:{fr:'Sulfate de magnésie en foliaire (20 g/L, 2×/an). Apport au sol de dolomite en pleine terre. Éviter excès de potassium.',
          en:'Foliar magnesium sulfate (20 g/L, 2×/year). Dolomite application in ground. Avoid excess potassium.',
          es:'Sulfato de magnesio foliar. Dolomita al suelo. Evitar exceso de potasio.',
          it:'Solfato di magnesio fogliare. Dolomite al suolo. Evitare eccesso di potassio.',
          pt:'Sulfato de magnésio foliar. Dolomite ao solo. Evitar excesso de potássio.'},
   caution:null,kb:null},

  {id:'carence_zn',name:'Carence en zinc',sci:null,cat:'carence',
   zones:['feuille'],primary:'deform',secondary:['yellow'],
   requireZones:['feuille'],requireSymptom:'deform',
   confCap:0.68,specificity:0.08,leafContext:'young',sev:2,
   treat:{fr:'Sulfate de zinc en foliaire ou en sol (chélate Zn EDTA). Éviter pH > 7 (blocage zinc en milieu calcaire).',
          en:'Zinc sulfate foliar or soil application (Zn EDTA chelate). Avoid pH > 7 (zinc lockout in alkaline soil).',
          es:'Sulfato de zinc foliar o en suelo. Evitar pH > 7.',
          it:'Solfato di zinco fogliare o al suolo. Evitare pH > 7.',
          pt:'Sulfato de zinco foliar ou ao solo. Evitar pH > 7.'},
   caution:null,kb:null},

  {id:'carence_n',name:'Carence en azote',sci:null,cat:'carence',
   zones:['feuille'],primary:'yellow',secondary:['drop'],
   requireZones:['feuille'],requireSymptom:'yellow',
   confCap:0.65,specificity:0.04,leafContext:'any',sev:2,
   treat:{fr:'Engrais azoté soluble (nitrate de calcium, urée). Reprendre la fertilisation si en pause hivernale. Vérifier la fréquence d\'arrosage.',
          en:'Soluble nitrogen fertiliser (calcium nitrate, urea). Resume fertilisation if on winter pause. Check watering frequency.',
          es:'Fertilizante nitrogenado soluble. Reanudar fertilización si en pausa invernal.',
          it:'Fertilizzante azotato solubile. Riprendere fertilizzazione se in pausa invernale.',
          pt:'Fertilizante azotado solúvel. Retomar fertilização se em pausa invernal.'},
   caution:null,kb:null},

  {id:'asphyxie',name:'Asphyxie racinaire / excès d\'eau',sci:null,cat:'carence',
   zones:['feuille','racine'],primary:'drop',secondary:['yellow'],
   requireZones:null,requireSymptom:'drop',
   confCap:0.72,specificity:0.12,leafContext:'any',sev:3,
   treat:{fr:'Cesser immédiatement les arrosages. Dépotter et inspecter les racines (brunes → couper). Rempoter dans substrat drainant. Aérer les racines.',
          en:'Stop watering immediately. Unpot and inspect roots (brown → cut). Repot in draining substrate. Aerate roots.',
          es:'Detener riegos inmediatamente. Destiesar e inspeccionar raíces. Replantar en sustrato drenante.',
          it:'Interrompere irrigazione immediatamente. Invasare e ispezionare radici. Rinvasare in substrato drenante.',
          pt:'Parar rega imediatamente. Tirar do vaso e inspecionar raízes. Revasar em substrato drenante.'},
   caution:null,kb:null},

  {id:'tristeza',name:'Tristeza (CTV)',sci:'Citrus tristeza virus',cat:'virus',
   zones:['rameau'],primary:'deform',secondary:['yellow'],
   requireZones:['rameau'],requireSymptom:'deform',
   confCap:0.30,specificity:0,leafContext:'any',sev:3,
   treat:{fr:'Pas de traitement curatif. Utiliser des porte-greffes tolérants (Poncirus trifoliata, Citrange Carrizo). Contrôler les pucerons (vecteurs). Matériel certifié.',
          en:'No curative treatment. Use tolerant rootstocks (Poncirus trifoliata, Citrange Carrizo). Control aphids (vectors). Use certified plant material.',
          es:'Sin tratamiento curativo. Usar portainjertos tolerantes. Controlar pulgones (vectores). Material certificado.',
          it:'Nessun trattamento curativo. Usare portinnesti tolleranti. Controllare afidi (vettori). Materiale certificato.',
          pt:'Sem tratamento curativo. Usar porta-enxertos tolerantes. Controlar afídios (vetores). Material certificado.'},
   caution:'Virus sous surveillance phytosanitaire. Ce diagnostic heuristique ne peut pas confirmer la Tristeza. Seul un test sérologique (ELISA) ou PCR est fiable. Contacter la DRAAF si suspicion fondée.',kb:'Tristeza CTV'},

  {id:'hlb',name:'HLB — Huanglongbing (Greening)',sci:'Candidatus Liberibacter asiaticus',cat:'virus',
   zones:['feuille'],primary:'yellow',secondary:['deform','drop'],
   requireZones:['feuille'],requireSymptom:'yellow',
   confCap:0.25,specificity:0,leafContext:'any',sev:3,
   treat:{fr:'Aucun traitement curatif. Isoler immédiatement la plante. Détruire le végétal suspect sur décision officielle. Ne pas déplacer.',
          en:'No curative treatment. Isolate the plant immediately. Destroy suspect plant on official decision. Do not move it.',
          es:'Sin tratamiento curativo. Aislar la planta. Destruir bajo decisión oficial. No mover.',
          it:'Nessun trattamento curativo. Isolare la pianta. Distruggere su decisione ufficiale. Non spostare.',
          pt:'Sem tratamento curativo. Isolar a planta. Destruir por decisão oficial. Não transportar.'},
   caution:'ORGANISME NUISIBLE RÉGLEMENTÉ. Le jaunissement seul ne suffit PAS à diagnostiquer le HLB. Seul un test PCR certifié est fiable. Contacter le SRAL/DRAAF de votre région AVANT tout déplacement.',kb:null},

  {id:'chancre',name:'Chancre bactérien',sci:'Xanthomonas citri subsp. citri',cat:'virus',
   zones:['feuille','fruit'],primary:'spot',secondary:['deform'],
   requireZones:['feuille','fruit'],requireSymptom:'spot',
   confCap:0.28,specificity:0,leafContext:'any',sev:3,
   treat:{fr:'Cuivre préventif sur plaies. Désinfecter les outils. Éviter les tailles en période humide. Isoler la plante. Signaler à la DRAAF si confirmé.',
          en:'Preventive copper on wounds. Disinfect tools. Avoid pruning in wet conditions. Isolate plant. Report to DRAAF if confirmed.',
          es:'Cobre preventivo en heridas. Desinfectar herramientas. Aislar planta. Notificar si se confirma.',
          it:'Rame preventivo sulle ferite. Disinfettare attrezzi. Isolare pianta. Segnalare se confermato.',
          pt:'Cobre preventivo nas feridas. Desinfetar ferramentas. Isolar planta. Reportar se confirmado.'},
   caution:'Bactériose réglementée. Les lésions surélevées avec halo jaune sont caractéristiques mais nécessitent confirmation par laboratoire agréé. Contacter le SRAL avant tout déplacement du végétal.',kb:'Chancre bactérien'}
];
function diagnoseLocal(zones, symptom, species, month, leafAge){
  const kb = getSpeciesKB(species);
  const candidates=[];

  DIAG_CATALOGUE.forEach(cond=>{
    if(cond.requireZones && !cond.requireZones.some(rz=>zones.includes(rz))) return;
    if(cond.requireSymptom && cond.requireSymptom !== symptom) return;

    let score=0;

    const matchingZones=cond.zones.filter(z=>zones.includes(z));
    if(matchingZones.length===0&&cond.zones.length>0){
      if(cond.requireZones) score+=0.10; // at least the gate was relevant
    } else {
      score+=Math.min(0.35, 0.25+(matchingZones.length-1)*0.05);
    }

    if(cond.primary===symptom){
      score+=0.45;
      if(cond.specificity>0) score+=cond.specificity;
    } else if(cond.secondary.includes(symptom)){
      score+=0.18;
    } else {
      return; // no symptom match at all → skip
    }

    if(leafAge && cond.cat==='carence' && zones.includes('feuille')){
      if(cond.leafContext==='young' && leafAge==='young') score+=0.10;
      if(cond.leafContext==='old'   && leafAge==='old')   score+=0.10;
      if(cond.leafContext==='young' && leafAge==='old')   score-=0.12;
      if(cond.leafContext==='old'   && leafAge==='young') score-=0.12;
    }

    const kbPest=kb?.pests?.find(p=>p.name===cond.kb);
    if(kbPest){
      score+=0.05;
      if(kbPest.months?.includes(month)) score+=0.08;
      if(kbPest.risk===3) score+=0.05;
    }

    const catCaps={insecte:0.85,champignon:0.78,carence:0.72,virus:0.30};
    const cap=Math.min(cond.confCap, catCaps[cond.cat]??0.85);
    const finalConf=Math.min(cap, Math.max(0, score));

    if(finalConf>=0.38) candidates.push({...cond,confidence:finalConf});
  });

  candidates.sort((a,b)=>b.confidence-a.confidence);

  const lang=getLang();
  const best=candidates[0];
  return{
    primary: best
      ? {
          id:best.id,name:best.name,sci:best.sci,cat:best.cat,
          confidence:best.confidence,sev:best.sev,
          treatment:best.treat[lang]||best.treat.fr,
          caution:best.caution
        }
      : {id:'inconnu',name:T('misc.diagNoMatch'),sci:null,cat:'inconnu',confidence:0,sev:1,treatment:'',caution:null},
    alternatives: candidates.slice(1,3).map(c=>({
      id:c.id,name:c.name,sci:c.sci,cat:c.cat,
      confidence:c.confidence,
      treatment:c.treat[lang]||c.treat.fr,
      caution:c.caution,
      note:''
    })),
    source:'local'
  };
}
function getClaudeKey(){
  const c=getCfg();
  return (c.pwdHash&&c.claudeKeyObf)?dob(c.claudeKeyObf,c.pwdHash.slice(0,16)):null;
}

async function saveClaudeKey(){
  const raw=document.getElementById('claude-key-input')?.value?.trim();
  const pw=document.getElementById('claude-pw-input')?.value;
  if(!raw)return;
  if(raw&&!raw.startsWith('sk-ant-'))return toast(T('misc.diagApiInvalid'),true);
  const cfg=getCfg();
  if(!cfg?.pwdHash)return toast(T('misc.diagApiNoPwd'),true);
  const h=await sha256(pw||'');
  if(h!==cfg.pwdHash)return toast(T('misc.diagApiWrongPwd'),true);
  setCfg({...cfg,claudeKeyObf:obf(raw,cfg.pwdHash.slice(0,16))});
  toast(T('misc.diagApiSaved'));
  render();
}

function clearClaudeKey(){
  const cfg=getCfg();
  const {claudeKeyObf,...rest}=cfg;
  setCfg(rest);
  toast(T('misc.diagApiCleared'));
  render();
}


function _buildDiagPrompt(context){
  const lang=getLang();
  const langName={fr:'french',en:'english',es:'spanish',it:'italian',pt:'portuguese'}[lang]||'english';
  const zone=(context.zones&&context.zones.length>1)?context.zones.join(', '):(context.zone||'');
  const symptom=context.symptom||'';
  const species=context.species||'unknown citrus';
  return`You are an expert citrus phytopathologist. Analyse the image and return ONLY valid JSON (no markdown).

Plant: ${species}. Photo zone: ${zone}. Main symptom reported: ${symptom}.

Diagnosable conditions:
INSECTS: Planococcus citri (mealybug), Lepidosaphes beckii (purple scale), Phyllocnistis citrella (leafminer), Panonychus citri (red spider mite), Toxoptera aurantii (black aphid), Diaphorina citri (Asian citrus psyllid)
FUNGI: Capnodium citri (sooty mold), Alternaria alternata, Colletotrichum gloeosporioides (anthracnose), Phytophthora citrophthora (foot rot), Botrytis cinerea (grey mould)
DEFICIENCIES: iron chlorosis, magnesium deficiency, zinc deficiency, nitrogen deficiency, root asphyxia
VIRUS/BACTERIA: Citrus tristeza virus, Huanglongbing (HLB), Xanthomonas citri (citrus canker)

Respond in ${langName}. Return ONLY this JSON structure:
{
  "primary":{"id":"condition_id","name":"Common name","sci":"Scientific name or null","cat":"insecte|champignon|carence|virus|inconnu","confidence":0.85,"sev":2,"treatment":"Full treatment text","caution":null},
  "alternatives":[{"id":"id","name":"name","confidence":0.3,"note":"brief note"}],
  "context_notes":"Brief observation about image quality or visible symptoms"
}
sev: 1=low, 2=moderate, 3=high/urgent. caution: regulatory alert text or null.
If unidentifiable: use id="inconnu", confidence=0, sev=1.`;
}

async function diagnoseClaude(b64jpeg, context){
  const key=getClaudeKey();
  if(!key)throw new Error('no_key');

  const cfg=getCfg();
  if(!cfg.claudeConsentGiven){
    if(!confirm(T('misc.diagApiFirst')))throw new Error('cancelled');
    setCfg({...cfg,claudeConsentGiven:true});
  }

  const resp=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':key,
      'anthropic-version':'2023-06-01'
    },
    body:JSON.stringify({
      model:'claude-opus-4-6',
      max_tokens:1024,
      messages:[{
        role:'user',
        content:[
          {type:'image',source:{type:'base64',media_type:'image/jpeg',data:b64jpeg}},
          {type:'text',text:_buildDiagPrompt(context)}
        ]
      }]
    })
  });

  if(resp.status===429)throw new Error('quota');
  if(!resp.ok)throw new Error(`api_${resp.status}`);

  const data=await resp.json();
  const raw=data.content?.[0]?.text||'';
  return _parseDiagResponse(raw,context);
}

function _parseDiagResponse(raw, context){
  try{
    const clean=raw.replace(/```(?:json)?/g,'').trim();
    const parsed=JSON.parse(clean);
    const lang=getLang();
    const pr=parsed.primary||{};
    const local=DIAG_CATALOGUE.find(c=>c.id===pr.id);
    const treatment=pr.treatment||(local?.treat?.[lang]||local?.treat?.fr)||'';
    return{
      primary:{
        id:pr.id||'inconnu',
        name:pr.name||T('misc.diagNoMatch'),
        sci:pr.sci||null,
        cat:pr.cat||'inconnu',
        confidence:parseFloat(pr.confidence)||0,
        sev:parseInt(pr.sev)||1,
        treatment,
        caution:pr.caution||local?.caution||null
      },
      alternatives:(parsed.alternatives||[]).slice(0,3).map(a=>({
        id:a.id,name:a.name,confidence:parseFloat(a.confidence)||0,note:a.note||'',cat:DIAG_CATALOGUE.find(c=>c.id===a.id)?.cat||'inconnu'
      })),
      context_notes:parsed.context_notes||'',
      source:'claude'
    };
  }catch{
    return{primary:{id:'inconnu',name:T('misc.diagNoMatch'),sci:null,cat:'inconnu',confidence:0,sev:1,treatment:'',caution:null},alternatives:[],context_notes:raw.slice(0,120),source:'claude'};
  }
}


function getPlantNetKey(){const c=getCfg();return(c.pwdHash&&c.pnKeyObf)?dob(c.pnKeyObf,c.pwdHash.slice(0,16)):null;}
async function savePlantNetKey(){
  const raw=document.getElementById('pn-key-input')?.value?.trim();
  const pw=document.getElementById('pn-pw-input')?.value;
  if(!raw)return;
  const cfg=getCfg();
  if(!cfg?.pwdHash)return toast(T('misc.diagApiNoPwd'),true);
  const h=await sha256(pw||'');
  if(h!==cfg.pwdHash)return toast(T('misc.diagApiWrongPwd'),true);
  setCfg({...cfg,pnKeyObf:obf(raw,cfg.pwdHash.slice(0,16))});
  toast(T('misc.pnKeySet')+' ✓');render();
}
function clearPlantNetKey(){const cfg=getCfg();const{pnKeyObf,...rest}=cfg;setCfg(rest);toast(T('misc.apiKeyRemove'));render();}

function getPlantIdKey(){const c=getCfg();return(c.pwdHash&&c.pidKeyObf)?dob(c.pidKeyObf,c.pwdHash.slice(0,16)):null;}
async function savePlantIdKey(){
  const raw=document.getElementById('pid-key-input')?.value?.trim();
  const pw=document.getElementById('pid-pw-input')?.value;
  if(!raw)return;
  const cfg=getCfg();
  if(!cfg?.pwdHash)return toast(T('misc.diagApiNoPwd'),true);
  const h=await sha256(pw||'');
  if(h!==cfg.pwdHash)return toast(T('misc.diagApiWrongPwd'),true);
  setCfg({...cfg,pidKeyObf:obf(raw,cfg.pwdHash.slice(0,16))});
  toast(T('misc.pidKeySet')+' ✓');render();
}
function clearPlantIdKey(){const cfg=getCfg();const{pidKeyObf,...rest}=cfg;setCfg(rest);toast(T('misc.apiKeyRemove'));render();}

function _b64toBlob(b64,type='image/jpeg'){
  const bin=atob(b64),arr=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type});
}

async function identifyPlantNet(b64jpeg){
  const key=getPlantNetKey();
  if(!key||!b64jpeg)return null;
  const lang=getLang();
  const organ='auto'; // let PlantNet decide
  const fd=new FormData();
  fd.append('images',_b64toBlob(b64jpeg),'photo.jpg');
  fd.append('organs',organ);
  const resp=await fetch(
    `https://my-api.plantnet.org/v2/identify/weurope?api-key=${encodeURIComponent(key)}&lang=${lang}&include-related-images=false`,
    {method:'POST',body:fd}
  );
  if(!resp.ok){
    if(resp.status===404)return{noMatch:true}; // no species found
    throw new Error('pn_'+resp.status);
  }
  const data=await resp.json();
  const best=data.results?.[0];
  if(!best||best.score<0.1)return{noMatch:true};
  return{
    scientificName:best.species?.scientificName||'',
    commonName:best.species?.commonNames?.[0]||'',
    score:Math.round(best.score*100),
    family:best.species?.family?.scientificName||'',
    gbifId:best.gbif?.id||null,
    results:data.results.slice(0,3).map(r=>({
      name:r.species?.scientificName||'',
      common:r.species?.commonNames?.[0]||'',
      score:Math.round(r.score*100)
    }))
  };
}

async function diagnosePlantId(b64jpeg,speciesHint){
  const key=getPlantIdKey();
  if(!key||!b64jpeg)return null;
  const lang=getLang();
  const body={
    images:[`data:image/jpeg;base64,${b64jpeg}`],
    similar_images:false,
    health:'only',
    language:lang==='pt'?'pt-PT':lang
  };
  const resp=await fetch('https://plant.id/api/v3/health_assessment',{
    method:'POST',
    headers:{'Api-Key':key,'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  if(!resp.ok)throw new Error('pid_'+resp.status);
  const data=await resp.json();
  const result=data.result||{};
  const isHealthy=result.is_healthy?.probability??1;
  const diseases=(result.disease?.suggestions||[])
    .filter(d=>d.probability>0.05)
    .slice(0,4)
    .map(d=>({
      id:d.id,
      name:d.name,
      probability:Math.round(d.probability*100),
      treatment:{
        chemical:d.details?.treatment?.chemical?.[0]||'',
        biological:d.details?.treatment?.biological?.[0]||'',
        prevention:d.details?.treatment?.prevention?.[0]||''
      },
      description:d.details?.description||''
    }));
  return{
    isHealthyPct:Math.round(isHealthy*100),
    diseases,
    source:'plantid'
  };
}

function _pidMapToLocal(pidName){
  const map={
    'mealybug':'cochenille_farineuse',
    'scale insect':'cochenille_virgule',
    'citrus leafminer':'mineuse',
    'spider mite':'araignee_rouge','red mite':'araignee_rouge',
    'aphid':'puceron_noir','black aphid':'puceron_noir',
    'psyllid':'psylle','asian citrus psyllid':'psylle',
    'sooty mold':'fumagine','sooty mould':'fumagine',
    'alternaria':'alternariose',
    'anthracnose':'anthracnose',
    'phytophthora':'phytophthora','root rot':'phytophthora','foot rot':'phytophthora',
    'botrytis':'botrytis','gray mold':'botrytis','grey mould':'botrytis',
    'iron deficiency':'carence_fer','chlorosis':'carence_fer',
    'magnesium deficiency':'carence_mg',
    'zinc deficiency':'carence_zn',
    'nitrogen deficiency':'carence_n',
    'overwatering':'asphyxie','waterlogging':'asphyxie',
    'tristeza':'tristeza','ctv':'tristeza',
    'hlb':'hlb','greening':'hlb','huanglongbing':'hlb',
    'canker':'chancre','citrus canker':'chancre'
  };
  const lower=pidName.toLowerCase();
  for(const[k,v] of Object.entries(map)){
    if(lower.includes(k))return v;
  }
  return null;
}

function _parsePlantIdResult(pidData, lang){
  if(!pidData||!pidData.diseases||pidData.diseases.length===0){
    if(pidData?.isHealthyPct>70){
      return{
        primary:{id:'sain',name:T('misc.pidHealthy'),sci:null,cat:'inconnu',confidence:pidData.isHealthyPct/100,sev:1,treatment:'',caution:null},
        alternatives:[],source:'plantid',isHealthy:true,isHealthyPct:pidData.isHealthyPct
      };
    }
    return null;
  }
  const top=pidData.diseases[0];
  const localId=_pidMapToLocal(top.name);
  const localEntry=localId?DIAG_CATALOGUE.find(c=>c.id===localId):null;
  const treatment=localEntry?(localEntry.treat[lang]||localEntry.treat.fr):
    [top.treatment.chemical,top.treatment.biological,top.treatment.prevention].filter(Boolean).join('. ')||'';
  return{
    primary:{
      id:localId||'pid_'+top.id,
      name:localEntry?localEntry.name:top.name,
      sci:localEntry?.sci||null,
      cat:localEntry?.cat||'inconnu',
      confidence:top.probability/100,
      sev:localEntry?.sev||(top.probability>70?3:top.probability>40?2:1),
      treatment,
      caution:localEntry?.caution||null,
      pidName:top.name,
      pidDescription:top.description
    },
    alternatives:pidData.diseases.slice(1,3).map(d=>{
      const lid=_pidMapToLocal(d.name);
      const le=lid?DIAG_CATALOGUE.find(c=>c.id===lid):null;
      return{id:lid||d.id,name:le?le.name:d.name,sci:le?.sci||null,
             cat:le?.cat||'inconnu',confidence:d.probability/100,note:'Plant.id'};
    }),
    source:'plantid',
    isHealthyPct:pidData.isHealthyPct
  };
}

function openDiag(pid){
  _diagPid=pid; _diagStep=1; _diagB64=null; _diagZones=new Set(); _diagSymptom=null; _diagLeafAge=null; _diagImageUrl=null;
  _renderDiagPanel();
}
function closeDiag(){document.getElementById('diag-panel')?.remove();}

function _renderDiagPanel(){
  document.getElementById('diag-panel')?.remove();
  const panel=document.createElement('div');
  panel.className='diag-panel'; panel.id='diag-panel';
  panel.innerHTML=`<div class="diag-panel-bg" onclick="closeDiag()"></div>
<div class="diag-panel-body" role="dialog">
  <div class="diag-panel-header">
    <span class="diag-panel-title">🔬 ${T('misc.diagTitle')}</span>${helpBtn('diagnostic')}
    <button class="diag-panel-close" onclick="closeDiag()" aria-label="Fermer">✕</button>
  </div>
  <div class="diag-panel-inner" id="diag-panel-inner">${_diagStepHtml()}</div>
</div>`;
  document.body.appendChild(panel);
  setTimeout(()=>panel.querySelector('.diag-panel-close')?.focus(),60);
}

function _diagStepHtml(){
  const steps=`<div class="diag-steps">
    <div class="diag-step ${_diagStep>=1?(_diagStep>1?'done':'active'):''}"></div>
    <div class="diag-step ${_diagStep>=2?(_diagStep>2?'done':'active'):''}"></div>
    <div class="diag-step ${_diagStep>=3?'active':''}"></div>
  </div>`;
  if(_diagStep===1) return steps+_diagStep1Html();
  if(_diagStep===2) return steps+_diagStep2Html();
  return steps+_diagStep3Html();
}

function _diagStep1Html(){
  const p=plants.find(x=>x.id===_diagPid);
  const ph=p?.photos||[];
  const gallerySect=ph.length?`<div style="margin-bottom:10px">
    <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Photos de la fiche</div>
    <div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:4px">${ph.map((ph,i)=>`<img src="${esc(ph.url)}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;border:2px solid transparent;cursor:pointer" onclick="_diagSelectUrl('${esc(ph.url)}')" class="diag-gal-thumb" data-i="${i}"/>`).join('')}</div>
  </div>`:'';
  return`${gallerySect}
<div style="font-size:.7rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Nouvelle photo</div>
<div class="diag-source-btns">
  <label class="diag-src-btn" for="diag-cam-in"><span>📷</span><span>${T('misc.diagSourcePhoto')}</span></label>
  <label class="diag-src-btn" for="diag-file-in"><span>📁</span><span>${T('misc.diagSourceImport')}</span></label>
</div>
<input id="diag-cam-in" type="file" accept="image/*" capture="environment" style="display:none" onchange="_diagHandleFile(event)"/>
<input id="diag-file-in" type="file" accept="image/*" style="display:none" onchange="_diagHandleFile(event)"/>
<p style="font-size:.75rem;color:var(--muted);text-align:center;margin-top:8px">${T('misc.diagNoPhoto')}</p>`;
}

function _diagStep2Html(){
  const allZone=['feuille','rameau','fruit','tronc','racine'];
  const isPlante=allZone.every(x=>_diagZones.has(x));
  const zones=[
    {k:'plante_entiere',l:T('misc.diagZonePlant')},
    {k:'feuille',l:T('misc.diagZoneLeaf')},{k:'rameau',l:T('misc.diagZoneBranch')},
    {k:'fruit',l:T('misc.diagZoneFruit')},{k:'tronc',l:T('misc.diagZoneTrunk')},
    {k:'racine',l:T('misc.diagZoneRoot')}
  ];
  const symptoms=[
    {k:'yellow',l:T('misc.diagSymYellow')},{k:'spot',l:T('misc.diagSymSpot')},
    {k:'depot',l:T('misc.diagSymDeposit')},{k:'gallery',l:T('misc.diagSymGallery')},
    {k:'deform',l:T('misc.diagSymDeform')},{k:'drop',l:T('misc.diagSymDrop')}
  ];
  const hasZone=_diagZones.size>0;
  const hasSym=!!_diagSymptom;
  const zoneCount=isPlante?'toutes':String(_diagZones.size);
  const badge=hasZone?`<span style="font-size:.75rem;background:#5c6bc0;color:white;border-radius:8px;padding:1px 6px;margin-left:5px">${zoneCount}</span>`:'';
  const preview=_diagB64
    ?`<img src="data:image/jpeg;base64,${_diagB64}" class="diag-preview"/>`
    :`<div style="background:var(--cream2);border-radius:10px;height:100px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.8rem;margin-bottom:12px">Photo sélectionnée ✓</div>`;
  const zChips=zones.map(z=>{
    const sel=z.k==='plante_entiere'?isPlante:_diagZones.has(z.k);
    return`<div class="diag-chip${sel?' selected':''}" onclick="_diagToggleZone('${z.k}')">${z.l}</div>`;
  }).join('');
  const leafHtml=_diagZones.has('feuille')
    ?`<div class="diag-hdr" style="margin-top:8px">Âge des feuilles affectées</div><div class="diag-chip-row"><div class="diag-chip${_diagLeafAge==='young'?' selected':''}" onclick="_diagSetLeafAge('young')">🌱 Jeunes (apex)</div><div class="diag-chip${_diagLeafAge==='old'?' selected':''}" onclick="_diagSetLeafAge('old')">🍃 Vieilles (base)</div><div class="diag-chip${_diagLeafAge==='both'?' selected':''}" onclick="_diagSetLeafAge('both')">Toutes</div></div>`
    :'';
  const sChips=symptoms.map(s=>`<div class="diag-chip${_diagSymptom===s.k?' selected':''}" onclick="_diagSetSymptom('${s.k}')">${s.l}</div>`).join('');
  const engine=getClaudeKey()&&_diagB64
    ?`<div class="diag-engine-lbl" style="color:#5c6bc0">🤖 Analyse IA · Claude claude-opus-4-6</div>`
    :`<div class="diag-engine-lbl">○ Diagnostic heuristique local</div>`;
  const btn=(!hasZone||!hasSym)
    ?`<div style="font-size:.7rem;color:var(--muted);text-align:center;padding:6px 0;font-style:italic">${!hasZone?'Sélectionnez au moins une zone ↑':'Sélectionnez un symptôme ↑'}</div><button class="btn" style="width:100%;font-size:.84rem;opacity:.35;pointer-events:none;background:var(--cream3);color:var(--muted);border-color:var(--cream3)" disabled>${T('misc.diagAnalyseBtn')}</button>`
    :`<button class="btn btn-p" style="width:100%;font-size:.84rem;${getClaudeKey()&&_diagB64?'background:#5c6bc0;border-color:#5c6bc0;color:white':''}" onclick="_diagAnalyse()">${T('misc.diagAnalyseBtn')}</button>`;
  return`${preview}<div class="diag-hdr">${T('misc.diagZoneLbl')} ${badge} <span style="font-size:.75rem;font-weight:400;color:var(--muted);">(multi-sélection)</span></div><div class="diag-chip-row" style="flex-wrap:wrap">${zChips}</div>${leafHtml}<div class="diag-hdr" style="margin-top:8px">${T('misc.diagSymLbl')}</div><div class="diag-chip-row">${sChips}</div><div style="margin-top:14px">${engine}${btn}</div>`;
}

function _diagStep3Html(){
  return`<div class="diag-analyzing"><div class="diag-spinner"></div><span>${T('misc.diagAnalyzing')}</span></div>`;
}

async function _diagHandleFile(e){
  const f=e.target.files[0]; if(!f)return;
  try{
    const b64=await compress(f, getClaudeKey()?1200:900);
    _diagB64=b64;
    _diagStep=2;
    document.getElementById('diag-panel-inner').innerHTML=_diagStepHtml();
  }catch(err){ toast('Erreur chargement photo',true); }
}

async function _diagSelectUrl(url){
  _diagImageUrl=url;
  try{
    const resp=await fetch(url,{mode:'cors'});
    if(resp.ok){
      const blob=await resp.blob();
      const b64=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=e=>res(e.target.result.split(',')[1]);fr.onerror=rej;fr.readAsDataURL(blob);});
      _diagB64=b64;
    } else { _diagB64=null; }
  }catch{ _diagB64=null; }
  _diagStep=2;
  document.getElementById('diag-panel-inner').innerHTML=_diagStepHtml();
}

function _diagToggleZone(z){
  if(z==='plante_entiere'){
    const allZ=['feuille','rameau','fruit','tronc','racine'];
    const allSelected=allZ.every(x=>_diagZones.has(x));
    _diagZones.clear();
    if(!allSelected) allZ.forEach(x=>_diagZones.add(x));
    _diagLeafAge=null;
  } else {
    if(_diagZones.has(z)) _diagZones.delete(z);
    else _diagZones.add(z);
    if(z==='feuille'&&!_diagZones.has('feuille')) _diagLeafAge=null;
  }
  document.getElementById('diag-panel-inner').innerHTML=_diagStepHtml();
}
function _diagSetZone(z){ _diagToggleZone(z); }
function _diagSetLeafAge(a){ _diagLeafAge=a; document.getElementById('diag-panel-inner').innerHTML=_diagStepHtml(); }
function _diagSetSymptom(s){ _diagSymptom=s; document.getElementById('diag-panel-inner').innerHTML=_diagStepHtml(); }

async function _diagAnalyse(){
  _diagStep=3;
  const inner=document.getElementById('diag-panel-inner');
  inner.innerHTML=_diagStepHtml();
  const p=plants.find(x=>x.id===_diagPid);
  const month=new Date().getMonth()+1;
  const zonesArr=[..._diagZones];
  const context={zones:zonesArr,zone:zonesArr[0]||'',symptom:_diagSymptom,species:p?.species||'',month};
  const lang=getLang();

  const enginesRun=[];

  let confirmedSpecies=p?.species||'';
  let plantNetData=null;
  if(getPlantNetKey()&&_diagB64){
    try{
      _diagSetStatus(T('misc.pnRunning'));
      plantNetData=await identifyPlantNet(_diagB64);
      enginesRun.push('plantnet');
      if(plantNetData&&!plantNetData.noMatch&&plantNetData.score>30){
        if(!confirmedSpecies||confirmedSpecies==='Autre'||plantNetData.score>60){
          confirmedSpecies=plantNetData.scientificName;
        }
      }
    }catch(e){
      console.warn('PlantNet error:',e.message);
    }
  }

  context.species=confirmedSpecies;

  let plantIdResult=null;
  if(getPlantIdKey()&&_diagB64){
    try{
      _diagSetStatus(T('misc.pidRunning'));
      const raw=await diagnosePlantId(_diagB64,confirmedSpecies);
      if(raw){
        plantIdResult=_parsePlantIdResult(raw,lang);
        if(plantIdResult)enginesRun.push('plantid');
      }
    }catch(e){
      if(!e.message.startsWith('pid_401'))
        toast(T('misc.diagApiError')+' Plant.id: '+e.message,true);
    }
  }

  let claudeResult=null;
  if(getClaudeKey()&&_diagB64){
    try{
      _diagSetStatus(T('misc.diagAnalyzing'));
      claudeResult=await diagnoseClaude(_diagB64,context);
      enginesRun.push('claude');
    }catch(err){
      if(err.message==='cancelled'){_renderDiagPanel();return;}
      if(err.message==='quota')toast(T('misc.diagApiQuota'),true);
      else if(err.message!=='no_key')console.warn('Claude error:',err.message);
    }
  }

  const localResult=diagnoseLocal([..._diagZones],_diagSymptom,confirmedSpecies,month,_diagLeafAge);
  enginesRun.push('local');

  let finalResult=localResult;
  if(claudeResult&&claudeResult.primary.id!=='inconnu') finalResult=claudeResult;
  if(plantIdResult&&plantIdResult.primary.id!=='inconnu'&&
     (plantIdResult.primary.confidence>0.35||!claudeResult)){
    finalResult=plantIdResult;
  }
  if(plantIdResult?.isHealthyPct)finalResult.isHealthyPct=plantIdResult.isHealthyPct;

  finalResult.enginesRun=enginesRun;
  finalResult.plantNetData=plantNetData;
  finalResult.allResults={plantid:plantIdResult,claude:claudeResult,local:localResult};

  _diagShowResult(finalResult);
}

function _diagSetStatus(msg){
  const inner=document.getElementById('diag-panel-inner');
  if(inner)inner.innerHTML=`<div class="diag-analyzing"><div class="diag-spinner"></div><span style="font-size:.8rem;color:var(--muted)">${esc(msg)}</span></div>`;
}


const DIAG_SOURCES={
  cochenille_farineuse:[
    {label:'EPPO — Planococcus citri',
     url:'https://gd.eppo.int/taxon/PLNCCI'},
    {label:'CABI — Citrus mealybug',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.41868'}
  ],
  cochenille_virgule:[
    {label:'EPPO — Lepidosaphes beckii',
     url:'https://gd.eppo.int/taxon/LEPIBE'},
    {label:'CABI — Purple scale',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.30008'}
  ],
  mineuse:[
    {label:'EPPO — Phyllocnistis citrella',
     url:'https://gd.eppo.int/taxon/PHYNCI'},
    {label:'ANSES — Mineuse des agrumes',
     url:'https://www.anses.fr/fr/content/la-mineuse-des-agrumes'}
  ],
  araignee_rouge:[
    {label:'EPPO — Panonychus citri',
     url:'https://gd.eppo.int/taxon/PANOCI'},
    {label:'CABI — Citrus red mite',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.38914'}
  ],
  puceron_noir:[
    {label:'EPPO — Toxoptera aurantii',
     url:'https://gd.eppo.int/taxon/TOXPAU'},
    {label:'CABI — Black citrus aphid',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.54445'}
  ],
  psylle:[
    {label:'EPPO — Diaphorina citri (fiche complète)',
     url:'https://gd.eppo.int/taxon/DIAACI'},
    {label:'EFSA — Asian citrus psyllid risk assessment',
     url:'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2019.5812'},
    {label:'ANSES — Psylle asiatique des agrumes',
     url:'https://www.anses.fr/fr/content/psylle-asiatique-des-agrumes'}
  ],
  fumagine:[
    {label:'CABI — Capnodium citri (sooty mold)',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.10004'},
    {label:'UCR — Sooty mold on citrus',
     url:'https://citrusvariety.ucr.edu/diseases/sootymold'}
  ],
  alternariose:[
    {label:'EPPO — Alternaria alternata on citrus',
     url:'https://gd.eppo.int/taxon/ALTEAL'},
    {label:'CABI — Alternaria alternata',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.3927'}
  ],
  anthracnose:[
    {label:'EPPO — Colletotrichum gloeosporioides',
     url:'https://gd.eppo.int/taxon/COLLGL'},
    {label:'CABI — Citrus anthracnose',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.13908'}
  ],
  phytophthora:[
    {label:'EPPO — Phytophthora citrophthora',
     url:'https://gd.eppo.int/taxon/PHYTCO'},
    {label:'CABI — Citrus gummosis',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.13910'},
    {label:'UCR — Phytophthora root rot & crown rot',
     url:'https://citrusvariety.ucr.edu/diseases/phytophthora'}
  ],
  botrytis:[
    {label:'EPPO — Botrytis cinerea',
     url:'https://gd.eppo.int/taxon/BOTFCI'},
    {label:'CABI — Botrytis grey mould',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.9927'}
  ],
  carence_fer:[
    {label:'INRAE — Chlorose ferrique des agrumes',
     url:'https://www6.montpellier.inrae.fr/agap/Ressources-genetiques/BRC-Citrus'},
    {label:'CABI — Iron deficiency in citrus',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.90711'},
    {label:'UCR — Citrus nutrition: iron',
     url:'https://citrusvariety.ucr.edu/production/nutrition'}
  ],
  carence_mg:[
    {label:'UCR — Citrus nutrition: magnesium',
     url:'https://citrusvariety.ucr.edu/production/nutrition'},
    {label:'CABI — Magnesium deficiency in citrus',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.90711'}
  ],
  carence_zn:[
    {label:'UCR — Citrus nutrition: zinc',
     url:'https://citrusvariety.ucr.edu/production/nutrition'},
    {label:'CABI — Zinc deficiency (little leaf)',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.90711'}
  ],
  carence_n:[
    {label:'UCR — Citrus nutrition guidelines',
     url:'https://citrusvariety.ucr.edu/production/nutrition'},
    {label:'CABI — Nitrogen deficiency in citrus',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.90711'}
  ],
  asphyxie:[
    {label:'CABI — Waterlogging & root asphyxia in citrus',
     url:'https://www.cabidigitallibrary.org/doi/10.1079/cabicompendium.13910'},
    {label:'UCR — Citrus rootstock tolerance to waterlogging',
     url:'https://citrusvariety.ucr.edu/production/rootstocks'}
  ],
  tristeza:[
    {label:'EPPO — Citrus tristeza virus (fiche officielle)',
     url:'https://gd.eppo.int/taxon/CTV000'},
    {label:'EFSA — CTV pest risk assessment',
     url:'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2014.3910'},
    {label:'ANSES — Tristeza des agrumes',
     url:'https://www.anses.fr/fr/content/tristeza-des-agrumes'}
  ],
  hlb:[
    {label:'EPPO — Candidatus Liberibacter (HLB)',
     url:'https://gd.eppo.int/taxon/LIBEAS'},
    {label:'EFSA — Huanglongbing risk assessment (EU)',
     url:'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.8069'},
    {label:'ANSES — Huanglongbing (greening)',
     url:'https://www.anses.fr/fr/content/huanglongbing-hlb-greening-des-agrumes'},
    {label:'USDA APHIS — HLB program',
     url:'https://www.aphis.usda.gov/plant-pests-diseases/citrus-health/hlb'}
  ],
  chancre:[
    {label:'EPPO — Xanthomonas citri (chancre bactérien)',
     url:'https://gd.eppo.int/taxon/XANTCI'},
    {label:'EFSA — Citrus canker risk assessment',
     url:'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2014.3617'},
    {label:'ANSES — Chancre bactérien des agrumes',
     url:'https://www.anses.fr/fr/content/chancre-bacterien-des-agrumes'}
  ]
};

function getDiagSources(id){
  return DIAG_SOURCES[id]||[];
}

function _diagShowResult(result){
  const el=document.getElementById('diag-panel-inner'); if(!el)return;
  const lang=getLang();
  const pr=result.primary;
  const confPct=Math.round(pr.confidence*100);
  const confColor=pr.confidence>=0.7?'#2e7d32':pr.confidence>=0.45?'#e65100':'#9e9e9e';

  const catBadge=`<span class="diag-cat-badge diag-cat-${pr.cat}">${pr.cat}</span>`;
  const sevLabel=[T('misc.diagSev1'),T('misc.diagSev2'),T('misc.diagSev3')][pr.sev-1]||'';
  const sevCls=`diag-sev-${pr.sev}`;

  const cautionHtml=pr.caution?`<div class="diag-caution-box">
    <div class="diag-caution-title">${T('misc.diagCautionTitle')}</div>
    <div style="font-size:.78rem;line-height:1.5">${esc(pr.caution)}</div>
  </div>`:'';

  const altHtml=result.alternatives.length?`<div style="margin-top:10px">
    <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">${T('misc.diagAlternatives')}</div>
    ${result.alternatives.map(a=>`<div class="diag-alt-row">
      <span class="diag-cat-badge diag-cat-${a.cat}" style="flex-shrink:0">${a.cat}</span>
      <span style="flex:1;font-size:.76rem">${esc(a.name)}${a.sci?` <em style="font-size:.75rem;color:var(--muted)">(${esc(a.sci)})</em>`:''}</span>
      <span style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${Math.round(a.confidence*100)}%</span>
    </div>`).join('')}
  </div>`:'';

  const p=plants.find(x=>x.id===_diagPid);
  const kb=getSpeciesKB(p?.species);
  const kbMatch=kb?.pests?.find(pest=>pest.name===pr.kb);
  const kbHtml=kbMatch?`<div style="margin-top:8px;padding:7px 10px;background:rgba(92,107,192,.07);border-radius:8px;font-size:.75rem;color:#5c6bc0">
    📚 Référencé dans la fiche culturale de <em>${esc(p.species)}</em>
  </div>`:'';

  el.innerHTML=`<div style="margin-bottom:8px">
  ${cautionHtml}
  <div class="diag-result-primary">
    <div class="diag-result-name">${esc(pr.name)}</div>
    ${pr.sci?`<div class="diag-result-sci">${esc(pr.sci)}</div>`:''}
    ${catBadge}
    <div class="diag-conf-bar"><div class="diag-conf-fill" style="width:${confPct}%;background:${confColor}"></div></div>
    <div style="font-size:.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-bottom:6px">${T('misc.diagConfidence')} : ${confPct}%</div>
    <div class="${sevCls}">● ${sevLabel}</div>
  </div>
  ${pr.treatment?`<div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:10px 0 5px">${T('misc.diagTreatment')}</div>
  <div class="diag-treatment">${esc(pr.treatment)}</div>`:''}
  ${kbHtml}
  ${altHtml}
  ${(()=>{
    const srcs=getDiagSources(pr.id);
    if(!srcs.length||pr.id==='inconnu') return'';
    return`<div style="margin-top:10px;background:rgba(92,107,192,.05);border:1px solid rgba(92,107,192,.15);border-radius:10px;padding:10px 12px">
      <div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:#5c6bc0;margin-bottom:7px;font-weight:700">📖 Sources scientifiques de référence</div>
      <div style="font-size:.75rem;color:var(--muted);line-height:1.5;margin-bottom:8px;font-style:italic">Ce diagnostic est une aide à l'identification. Consultez les ressources ci-dessous et un technicien agréé avant toute décision phytosanitaire.</div>
      ${srcs.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid rgba(92,107,192,.1);text-decoration:none;color:inherit">
        <span style="font-size:.75rem;color:#5c6bc0;flex-shrink:0">↗</span>
        <span style="font-size:.75rem;color:#5c6bc0;line-height:1.4">${esc(s.label)}</span>
      </a>`).join('')}
    </div>`;
  })()}
  <div class="diag-actions">
    ${pr.id!=='inconnu'?`<button class="btn btn-p" onclick="_diagCreateTreatment()">${T('misc.diagCreateEvent')}</button>`:''}
    ${pr.sev>=2?`<button class="btn" style="background:rgba(245,124,0,.1);color:#e65100;border-color:rgba(245,124,0,.3)" onclick="_diagSetWatchlist()">${T('misc.diagChangeStatus')}</button>`:''}
    <button class="btn" style="background:var(--cream2);color:var(--muted)" onclick="_diagSaveObs('${esc(pr.name)}','${confPct}','${esc(pr.treatment||'')}')">
      ${T('misc.diagSaveObs')}
    </button>
    <button class="btn" style="background:transparent;color:var(--muted);font-size:.76rem" onclick="openDiag('${_diagPid}')">${T('misc.diagNewDiag')}</button>
  </div>
  ${result.source==='local'&&result.primary.cat==='virus'?`<div style="font-size:.75rem;color:#c62828;text-align:center;padding:4px 10px;margin-top:-4px;line-height:1.5">⚠ Diagnostic heuristique non confirmatoire pour les virus — test de laboratoire requis</div>`:''}
  ${result.source==='local'&&result.primary.cat==='carence'&&result.primary.confidence<0.55?`<div style="font-size:.75rem;color:#e65100;text-align:center;padding:4px 10px;margin-top:-4px;line-height:1.5">⚠ Plusieurs carences ont des symptômes proches — analyse de sol ou foliaire recommandée</div>`:''}
  ${result.primary.cat==='carence'?`<div style="text-align:right;margin-top:6px"><button class="btn cca-alert-carence" style="background:rgba(46,125,50,.08);color:#2e7d32;border-color:rgba(46,125,50,.25);font-size:.78rem" data-action="open-guide-chapter" data-guide-anchor="chapitre-10-diagnostiquer-et-corriger-les-carences">${esc(T('guide.readMore')||'📖 Comprendre')}</button></div>`:''}

  ${(()=>{const pn=result.plantNetData;if(!pn||pn.noMatch)return'';
    return`<div style="background:rgba(45,90,61,.06);border-radius:9px;padding:8px 11px;margin-bottom:8px;border:1px solid rgba(45,90,61,.15)"><div style="font-size:.75rem;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.09em;color:var(--g3);margin-bottom:5px;font-weight:700">🌿 ${T('misc.diagSpeciesConfirm')} — PlantNet</div><div style="font-size:.8rem;font-weight:600;font-style:italic;color:var(--text-strong)">${esc(pn.scientificName)}</div>${pn.commonName?`<div style="font-size:.7rem;color:var(--muted)">${esc(pn.commonName)}</div>`:''}<div style="font-size:.75rem;color:var(--g3);margin-top:3px;font-family:'JetBrains Mono',monospace">Confiance : ${pn.score}%${pn.results?.length>1?' · '+pn.results.slice(1).map(r=>r.name+' '+r.score+'%').join(', '):''}</div></div>`;
  })()}
  ${(()=>{const engines=result.enginesRun||[];if(!engines.length)return'';
    const badges={plantnet:`<span style="background:rgba(45,90,61,.12);color:#2d5a3d;font-size:.75rem;padding:2px 7px;border-radius:6px;font-family:'JetBrains Mono',monospace">🌿 PlantNet</span>`,plantid:`<span style="background:rgba(92,107,192,.12);color:#5c6bc0;font-size:.75rem;padding:2px 7px;border-radius:6px;font-family:'JetBrains Mono',monospace">🔬 Plant.id</span>`,claude:`<span style="background:rgba(232,148,26,.12);color:#c77900;font-size:.75rem;padding:2px 7px;border-radius:6px;font-family:'JetBrains Mono',monospace">🤖 Claude</span>`,local:`<span style="background:var(--cream2);color:var(--muted);font-size:.75rem;padding:2px 7px;border-radius:6px;font-family:'JetBrains Mono',monospace">○ local</span>`};
    return`<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:4px">${engines.map(e=>badges[e]||'').join('')}</div>`;
  })()}
  <div class="diag-source-tag">${result.source==='claude'?T('misc.diagClaudeMode'):result.source==='plantid'?T('misc.pidResult'):T('misc.diagLocalMode')}</div>
</div>`;
  _lastDiagResult=result;
}

function _diagCreateTreatment(){
  closeDiag();
  if(!_lastDiagResult||!_diagPid)return;
  openEventForm(_diagPid,'traitement');
  setTimeout(()=>{
    const ds=document.getElementById('ev-ds');
    if(ds)ds.value=`[${_lastDiagResult.primary.name}] ${_lastDiagResult.primary.treatment||''}`;
  },120);
}

function _diagSetWatchlist(){
  if(!_diagPid)return;
  const target=_lastDiagResult?.primary?.sev===3?'traitement':'vigilance';
  plants=plants.map(p=>p.id===_diagPid?{...p,status:target}:p);
  saveData();
  toast(`Statut → ${STATUS[target]?.label||target} ✓`);
  closeDiag();
  render();
}

function _diagSaveObs(name,conf,treat){
  if(!_diagPid)return;
  const ev={id:gid(),date:todayStr(),type:'observation',bulk:false,
    description:`[Diagnostic] ${name} (${conf}%) — ${treat}`,
    diagId:_lastDiagResult?.primary?.id,
    diagConfidence:parseFloat(conf)/100};
  plants=plants.map(p=>p.id===_diagPid?{...p,events:[ev,...p.events]}:p);
  saveData();
  toast('Observation enregistrée ✓');
  closeDiag();
  render();
}

window.DIAG_CATALOGUE      = DIAG_CATALOGUE;
window.diagnoseLocal       = diagnoseLocal;
window.diagnoseClaude      = diagnoseClaude;
window.identifyPlantNet    = identifyPlantNet;
window.diagnosePlantId     = diagnosePlantId;
window.openDiag            = openDiag;
window.closeDiag           = closeDiag;
window.getClaudeKey        = getClaudeKey;
window.saveClaudeKey       = saveClaudeKey;
window.clearClaudeKey      = clearClaudeKey;
window.getPlantNetKey      = getPlantNetKey;
window.savePlantNetKey     = savePlantNetKey;
window.clearPlantNetKey    = clearPlantNetKey;
window.getPlantIdKey       = getPlantIdKey;
window.savePlantIdKey      = savePlantIdKey;
window.clearPlantIdKey     = clearPlantIdKey;
window._diagHandleFile     = _diagHandleFile;
window._diagSelectUrl      = _diagSelectUrl;
window._diagToggleZone     = _diagToggleZone;
window._diagSetZone        = _diagSetZone;
window._diagSetLeafAge     = _diagSetLeafAge;
window._diagSetSymptom     = _diagSetSymptom;
window._diagAnalyse        = _diagAnalyse;
window._diagSetStatus      = _diagSetStatus;
window._diagShowResult     = _diagShowResult;
window._diagCreateTreatment = _diagCreateTreatment;
window._diagSetWatchlist   = _diagSetWatchlist;
window._diagSaveObs        = _diagSaveObs;
