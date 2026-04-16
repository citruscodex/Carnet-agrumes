var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=e=>String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),r=t({BBCH_STAGES:()=>i,estimateGJCFromDate:()=>l,getPhenologyForSpecies:()=>a,getSecondaryStage:()=>o,getStageActions:()=>s,getStagePests:()=>c,renderPhenologyCalendar:()=>b,renderPhenologyDetail:()=>y,renderPhenologyWidget:()=>v}),i=[{principal:0,stage:`bourgeons`,icon:`💤`,gjcThreshold:0,i18nKey:`pheno.stage.0`,descKey:`pheno.desc.0`,notes:{regulators:`pheno.note.reg.0`,remarks:`pheno.note.rem.0`},actions:{fertilization:`pheno.action.fert.0`,pruning:`pheno.action.prune.0`,irrigation:`pheno.action.irrig.0`},pests:[`pheno.pest.cochenilles`,`pheno.pest.acariens_hiv`],speciesOffsets:{"Citrus limon":-50,"Citrus sinensis":0,"Citrus reticulata":30,"Citrus paradisi":10,"Citrus aurantifolia":-30,Fortunella:50},secondary:[{code:`00`,i18nKey:`pheno.sub.00`,progressPercent:0},{code:`01`,i18nKey:`pheno.sub.01`,progressPercent:25},{code:`03`,i18nKey:`pheno.sub.03`,progressPercent:50},{code:`07`,i18nKey:`pheno.sub.07`,progressPercent:75},{code:`09`,i18nKey:`pheno.sub.09`,progressPercent:100}]},{principal:1,stage:`feuilles`,icon:`🌱`,gjcThreshold:50,i18nKey:`pheno.stage.1`,descKey:`pheno.desc.1`,notes:{regulators:`pheno.note.reg.1`,remarks:`pheno.note.rem.1`},actions:{fertilization:`pheno.action.fert.1`,pruning:`pheno.action.prune.1`,irrigation:`pheno.action.irrig.1`},pests:[`pheno.pest.pucerons`,`pheno.pest.mineuse`],speciesOffsets:{"Citrus limon":-40,"Citrus sinensis":0,"Citrus reticulata":25,"Citrus paradisi":10,"Citrus aurantifolia":-25,Fortunella:40},secondary:[{code:`10`,i18nKey:`pheno.sub.10`,progressPercent:0},{code:`11`,i18nKey:`pheno.sub.11`,progressPercent:25},{code:`15`,i18nKey:`pheno.sub.15`,progressPercent:60},{code:`19`,i18nKey:`pheno.sub.19`,progressPercent:100}]},{principal:3,stage:`pousses`,icon:`🌿`,gjcThreshold:200,i18nKey:`pheno.stage.3`,descKey:`pheno.desc.3`,notes:{regulators:null,remarks:`pheno.note.rem.3`},actions:{fertilization:`pheno.action.fert.3`,pruning:`pheno.action.prune.3`,irrigation:`pheno.action.irrig.3`},pests:[`pheno.pest.mineuse`,`pheno.pest.psylle`],speciesOffsets:{"Citrus limon":-20,"Citrus sinensis":0,"Citrus reticulata":15,"Citrus paradisi":5,"Citrus aurantifolia":-15,Fortunella:30},secondary:[{code:`31`,i18nKey:`pheno.sub.31`,progressPercent:0},{code:`32`,i18nKey:`pheno.sub.32`,progressPercent:35},{code:`39`,i18nKey:`pheno.sub.39`,progressPercent:100}]},{principal:5,stage:`inflorescence`,icon:`🌸`,gjcThreshold:450,i18nKey:`pheno.stage.5`,descKey:`pheno.desc.5`,notes:{regulators:null,remarks:`pheno.note.rem.5`},actions:{fertilization:`pheno.action.fert.5`,pruning:`pheno.action.prune.5`,irrigation:`pheno.action.irrig.5`},pests:[`pheno.pest.thrips`,`pheno.pest.acariens`],speciesOffsets:{"Citrus limon":-10,"Citrus sinensis":0,"Citrus reticulata":10,"Citrus paradisi":0,"Citrus aurantifolia":-10,Fortunella:20},secondary:[{code:`51`,i18nKey:`pheno.sub.51`,progressPercent:0},{code:`53`,i18nKey:`pheno.sub.53`,progressPercent:15},{code:`55`,i18nKey:`pheno.sub.55`,progressPercent:35},{code:`56`,i18nKey:`pheno.sub.56`,progressPercent:55},{code:`57`,i18nKey:`pheno.sub.57`,progressPercent:75},{code:`59`,i18nKey:`pheno.sub.59`,progressPercent:100}]},{principal:6,stage:`floraison`,icon:`🌼`,gjcThreshold:650,i18nKey:`pheno.stage.6`,descKey:`pheno.desc.6`,notes:{regulators:`pheno.note.reg.6`,remarks:`pheno.note.rem.6`},actions:{fertilization:`pheno.action.fert.6`,pruning:`pheno.action.prune.6`,irrigation:`pheno.action.irrig.6`},pests:[`pheno.pest.thrips_flo`,`pheno.pest.botrytis`],speciesOffsets:{"Citrus limon":0,"Citrus sinensis":0,"Citrus reticulata":10,"Citrus paradisi":0,"Citrus aurantifolia":-5,Fortunella:15},secondary:[{code:`60`,i18nKey:`pheno.sub.60`,progressPercent:0},{code:`61`,i18nKey:`pheno.sub.61`,progressPercent:20},{code:`65`,i18nKey:`pheno.sub.65`,progressPercent:50},{code:`67`,i18nKey:`pheno.sub.67`,progressPercent:80},{code:`69`,i18nKey:`pheno.sub.69`,progressPercent:100}]},{principal:7,stage:`fruit_dev`,icon:`🟢`,gjcThreshold:750,i18nKey:`pheno.stage.7`,descKey:`pheno.desc.7`,notes:{regulators:`pheno.note.reg.7`,remarks:`pheno.note.rem.7`},actions:{fertilization:`pheno.action.fert.7`,pruning:`pheno.action.prune.7`,irrigation:`pheno.action.irrig.7`},pests:[`pheno.pest.mouche_fruits`,`pheno.pest.cochenilles`,`pheno.pest.alternariose`],speciesOffsets:{"Citrus limon":0,"Citrus sinensis":0,"Citrus reticulata":5,"Citrus paradisi":10,"Citrus aurantifolia":0,Fortunella:5},secondary:[{code:`71`,i18nKey:`pheno.sub.71`,progressPercent:0},{code:`72`,i18nKey:`pheno.sub.72`,progressPercent:15},{code:`73`,i18nKey:`pheno.sub.73`,progressPercent:30,alert:!0},{code:`74`,i18nKey:`pheno.sub.74`,progressPercent:55},{code:`79`,i18nKey:`pheno.sub.79`,progressPercent:100}]},{principal:8,stage:`maturation`,icon:`🍊`,gjcThreshold:1e3,i18nKey:`pheno.stage.8`,descKey:`pheno.desc.8`,notes:{regulators:`pheno.note.reg.8`,remarks:`pheno.note.rem.8`},actions:{fertilization:`pheno.action.fert.8`,pruning:`pheno.action.prune.8`,irrigation:`pheno.action.irrig.8`},pests:[`pheno.pest.moisissures`,`pheno.pest.mouche_fruits`,`pheno.pest.pourriture`],speciesOffsets:{"Citrus limon":0,"Citrus sinensis":0,"Citrus reticulata":0,"Citrus paradisi":20,"Citrus aurantifolia":0,Fortunella:-10},secondary:[{code:`81`,i18nKey:`pheno.sub.81`,progressPercent:0},{code:`83`,i18nKey:`pheno.sub.83`,progressPercent:35},{code:`85`,i18nKey:`pheno.sub.85`,progressPercent:65},{code:`89`,i18nKey:`pheno.sub.89`,progressPercent:100}]},{principal:9,stage:`senescence`,icon:`🍂`,gjcThreshold:1200,i18nKey:`pheno.stage.9`,descKey:`pheno.desc.9`,notes:{regulators:null,remarks:`pheno.note.rem.9`},actions:{fertilization:`pheno.action.fert.9`,pruning:`pheno.action.prune.9`,irrigation:`pheno.action.irrig.9`},pests:[`pheno.pest.cochenilles`,`pheno.pest.fumagine`],speciesOffsets:{"Citrus limon":0,"Citrus sinensis":0,"Citrus reticulata":0,"Citrus paradisi":0,"Citrus aurantifolia":0,Fortunella:0},secondary:[{code:`91`,i18nKey:`pheno.sub.91`,progressPercent:0},{code:`93`,i18nKey:`pheno.sub.93`,progressPercent:50},{code:`97`,i18nKey:`pheno.sub.97`,progressPercent:100}]}];function a(e,t){let n=0,r=i.map(t=>(n+=t.speciesOffsets[e]??0,{idx:i.indexOf(t),adjustedThreshold:t.gjcThreshold+n})),a=0;for(let e=0;e<r.length;e++)r[e].adjustedThreshold<=t&&(a=e);let s=r[a],c=r[a+1]??null,l=i[a],u=c?i[a+1]:null,d=100,f=0;if(c){let e=c.adjustedThreshold-s.adjustedThreshold,n=t-s.adjustedThreshold;d=e>0?Math.min(100,Math.max(0,n/e*100)):100,f=Math.max(0,c.adjustedThreshold-t)}let p=o(l.principal,d);return{principal:l,secondaryCode:p.code,secondaryAlert:p.alert===!0,nextPrincipal:u,progressInPrincipal:d,gjcToNextPrincipal:f,adjustedThreshold:s.adjustedThreshold}}function o(e,t){let n=i.find(t=>t.principal===e);if(!n)return{code:`00`,i18nKey:`pheno.sub.00`,progressPercent:0};let r=n.secondary,a=r[0];for(let e of r)e.progressPercent<=t&&(a=e);return a}function s(e){let t=i.find(t=>t.principal===e);return t?t.actions:null}function c(e){let t=i.find(t=>t.principal===e);return t?t.pests:[]}function l(e,t,n=13){let r=Math.abs(e),i,a;r<25?(i=24,a=4):r<35?(i=18,a=8):r<45?(i=15,a=12):(i=12,a=14);let o=e>=0?105:287,s=new Date(t.getFullYear(),0,1),c=Math.floor((t-s)/864e5)+1,l=2*Math.PI/365,u=0;for(let e=1;e<=c;e++){let t=i+a*Math.sin(l*(e-o));u+=Math.max(0,t-n)}return Math.round(u*10)/10}var u={arrosage:`💧`,fertilisation:`🌱`,taille:`✂️`,traitement:`🧪`,floraison:`🌸`,fructification:`🍊`,récolte:`🧺`,observation:`👁`,rempotage:`🪴`,greffage:`🌿`,hivernage:`❄️`,sortie:`☀️`,protection:`🛡`,dégâts_gel:`🍂`,plantation:`🌳`},d={arrosage:`#2d7dd2`,fertilisation:`#8b5e3c`,taille:`#5c6bc0`,traitement:`#c62828`,floraison:`#d81b60`,fructification:`#e65100`,récolte:`#c77900`,observation:`#4a7c59`,rempotage:`#5d4037`,greffage:`#388e3c`,hivernage:`#455a64`,sortie:`#388e3c`,protection:`#78909c`,dégâts_gel:`#1565c0`,plantation:`#4a7c59`};function f(e){let t=e.species||`Citrus sinensis`,n=e.lat||44;return(e.events||[]).filter(e=>!e.audit&&e.date).map(e=>{try{let r=a(t,l(n,new Date(e.date),13));return{...e,_bbchCode:r.secondaryCode,_principalCode:r.principal.principal,_principalIcon:r.principal.icon,_principalI18nKey:r.principal.i18nKey}}catch{return{...e,_bbchCode:null,_principalCode:null}}})}var p=e=>e||(typeof window<`u`&&typeof window.T==`function`?window.T:e=>e);function m(e){let t=Math.abs(e),n,r;return t<25?(n=24,r=4):t<35?(n=18,r=8):t<45?(n=15,r=12):(n=12,r=14),{Tmoy:n,amplitude:r,offset:e>=0?105:287}}function h(e,t,n=13){let{Tmoy:r,amplitude:i,offset:a}=m(t),o=2*Math.PI/365,s=0;for(let t=1;t<=365;t++)if(s+=Math.max(0,r+i*Math.sin(o*(t-a))-n),s>=e)return t;return 366}var g=e=>Math.min(11,Math.floor((Math.min(e,365)-1)/30.44));function _(e){let t=0;return i.map(n=>(t+=n.speciesOffsets[e]??0,n.gjcThreshold+t))}function ee(e,t){let n=t[t.length-1]+200;return Math.min(100,Math.max(0,e/n*100))}function v(e,t,r){r=p(r);let s=e.species||`Citrus sinensis`;if(!e.species){let e=document.createElement(`div`);return e.className=`cca-pheno-widget`,e.innerHTML=`<p class="cca-pheno-no-species">${n(r(`pheno.widget.noSpecies`))}</p>`,e}let{principal:c,secondaryCode:l,secondaryAlert:m,nextPrincipal:h,progressInPrincipal:g,gjcToNextPrincipal:v}=a(s,t),y=_(s),b=ee(t,y),x=o(c.principal,g);c.actions.irrigation;let S=r(`pheno.notif.alertBody73`).replace(`{plant}`,e.name||``),C=y[y.length-1]+200,w=y.map((e,t)=>{let a=Math.min(99,e/C*100),o=i[t];return`<div class="cca-pheno-marker"
                   style="left:${a.toFixed(1)}%"
                   title="${n(r(o.i18nKey))} — ${n(o.icon)}"
                   data-principal="${o.principal}"></div>`}).join(``),E=h?`<div class="cca-pheno-next">
         ${n(r(`pheno.widget.next`))} : ${n(h.icon)}
         <strong>${n(r(h.i18nKey))}</strong>
         — ${Math.round(v)} GJC
       </div>`:``,{fertilization:D,pruning:O,irrigation:k}=c.actions,A=`
    <div class="cca-pheno-actions-grid" style="margin-top:6px">
      <div><strong>🌱</strong><br>${n(r(D))}</div>
      <div><strong>✂️</strong><br>${n(r(O))}</div>
      <div><strong>💧</strong><br>${n(r(k))}</div>
    </div>`,j=c.notes.regulators?`<div class="cca-pheno-action" style="margin-top:4px">🧪 ${n(r(c.notes.regulators))}</div>`:``,M=f(e).filter(e=>e._principalCode===c.principal).sort((e,t)=>new Date(t.date)-new Date(e.date)).slice(0,4),N=M.length?`
    <div class="cca-pheno-ev-section">
      <div class="cca-pheno-secttl" style="margin-top:8px;font-size:.72rem">
        📅 ${n(r(`pheno.events.title`))}
      </div>
      ${M.map(e=>{let t=u[e.type]||`📌`,r=d[e.type]||`#4a7c59`,i=e.date?new Date(e.date).toLocaleDateString(void 0,{day:`numeric`,month:`short`}):``;return`<div class="cca-pheno-ev-item">
          <span style="color:${n(r)}">${t}</span>
          <span style="flex:1;font-size:.78rem;color:var(--text)">${n(e.description||e.type)}</span>
          <span style="font-size:.72rem;color:var(--muted);white-space:nowrap">${n(i)}</span>
          ${e._bbchCode?`<span class="cca-pheno-sub-code" style="font-size:.65rem">${n(e._bbchCode)}</span>`:``}
        </div>`}).join(``)}
    </div>`:``,P=document.createElement(`div`);P.className=`cca-pheno-widget`,P.dataset.plantId=e.id||``,P.innerHTML=`
    <div class="cca-pheno-header">
      <span class="cca-pheno-icon">${n(c.icon)}</span>
      <span class="cca-pheno-stage">${n(r(c.i18nKey))}</span>
      <span class="cca-pheno-code">BBCH ${n(l)}</span>
    </div>
    <div class="cca-pheno-bar" role="progressbar"
         aria-valuenow="${Math.round(b)}" aria-valuemin="0" aria-valuemax="100">
      <div class="cca-pheno-bar-fill" style="width:${b.toFixed(1)}%"></div>
      ${w}
    </div>
    <div class="cca-pheno-slide-panel" style="display:none"></div>
    <div class="cca-pheno-sub">${n(r(x.i18nKey))}</div>
    ${A}
    ${j}
    <div class="cca-pheno-alert" style="display:${m?`block`:`none`}">
      ⚠ ${n(S)}
    </div>
    ${N}
    ${E}`;let F=P.querySelector(`.cca-pheno-slide-panel`),I=null;return P.querySelectorAll(`.cca-pheno-marker`).forEach(e=>{e.addEventListener(`click`,()=>{let t=parseInt(e.dataset.principal,10);if(I===t){F.style.display=`none`,F.innerHTML=``,I=null,P.querySelectorAll(`.cca-pheno-marker`).forEach(e=>e.classList.remove(`cca-pheno-marker-active`));return}let a=i.find(e=>e.principal===t);a&&(F.innerHTML=`<ul class="cca-pheno-sub-list" style="padding:6px 0">${a.secondary.map(e=>{let i=e.code===l&&t===c.principal;return`<li class="${i?`cca-pheno-sub-active`:`cca-pheno-sub-item`}">
          <span class="cca-pheno-sub-code">${n(e.code)}</span>
          <span>${n(r(e.i18nKey))}${e.alert?` ⚠`:``}</span>
          ${i?`<span style="margin-left:auto;font-size:.7rem;opacity:.6">●</span>`:``}
        </li>`}).join(``)}</ul>`,F.style.display=`block`,P.querySelectorAll(`.cca-pheno-marker`).forEach(e=>e.classList.remove(`cca-pheno-marker-active`)),e.classList.add(`cca-pheno-marker-active`),I=t)})}),P}function y(e,t,r){r=p(r);let s=e.species||`Citrus sinensis`,{principal:c,secondaryCode:l,secondaryAlert:m,nextPrincipal:g,progressInPrincipal:ee,gjcToNextPrincipal:v,adjustedThreshold:b}=a(s,t);o(c.principal,ee);let x=`
    <div class="cca-pheno-det-header">
      <span class="cca-pheno-det-icon">${n(c.icon)}</span>
      <div>
        <div class="cca-pheno-det-title">${n(r(c.i18nKey))}</div>
        <div class="cca-pheno-det-desc">${n(r(c.descKey))}</div>
        <div class="cca-pheno-code">BBCH ${n(l)}</div>
      </div>
    </div>`,S=`
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${n(r(`pheno.section.substages`))}</h4>
      <ul class="cca-pheno-sub-list">
        ${c.secondary.map(e=>`<li class="${e.code===l?`cca-pheno-sub-active`:`cca-pheno-sub-item`}">
            <span class="cca-pheno-sub-code">${n(e.code)}</span>
            <span>${n(r(e.i18nKey))}${e.alert?` ⚠`:``}</span>
          </li>`).join(``)}
      </ul>
    </section>`,{fertilization:C,pruning:w,irrigation:E}=c.actions,D=`
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${n(r(`pheno.section.actions`))}</h4>
      <div class="cca-pheno-actions-grid">
        <div><strong>${n(r(`pheno.label.fertilization`))}</strong><br>${n(r(C))}</div>
        <div><strong>${n(r(`pheno.label.pruning`))}</strong><br>${n(r(w))}</div>
        <div><strong>${n(r(`pheno.label.irrigation`))}</strong><br>${n(r(E))}</div>
      </div>
    </section>`,O=c.notes.regulators?`
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${n(r(`pheno.section.regulators`))}</h4>
      <p class="cca-pheno-note">${n(r(c.notes.regulators))}</p>
    </section>`:``,k=`
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${n(r(`pheno.section.pests`))}</h4>
      <ul class="cca-pheno-pest-list">
        ${c.pests.map(e=>`<li>${n(r(e))}</li>`).join(``)}
      </ul>
      ${m?`<div class="cca-pheno-alert">⚠ ${n(r(`pheno.notif.alertBody73`).replace(`{plant}`,e.name||``))}</div>`:``}
    </section>`,A=c.notes.remarks?`
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${n(r(`pheno.section.remarks`))}</h4>
      <p class="cca-pheno-note">${n(r(c.notes.remarks))}</p>
    </section>`:``,j=g?(()=>{let t=e.lat||44,i=h(b+v,t),a=i<366?new Date(new Date().getFullYear(),0,i).toLocaleDateString(void 0,{month:`long`,day:`numeric`}):`—`;return`
      <section class="cca-pheno-section">
        <h4 class="cca-pheno-secttl">${n(r(`pheno.section.next`))}</h4>
        <div class="cca-pheno-next-block">
          <span class="cca-pheno-det-icon">${n(g.icon)}</span>
          <div>
            <div><strong>${n(r(g.i18nKey))}</strong></div>
            <div>${n(r(`pheno.widget.gjcRemaining`).replace(`{n}`,Math.round(v)))}</div>
            <div>${n(r(`pheno.widget.estimatedDate`).replace(`{date}`,a))}</div>
          </div>
        </div>
      </section>`})():``,M=f(e),N=new Map;for(let e of i)N.set(e.principal,[]);for(let e of M)e._principalCode!==null&&N.has(e._principalCode)&&N.get(e._principalCode).push(e);let P=i.filter(e=>N.get(e.principal).length>0||e.principal===c.principal),F=P.length?`
    <section class="cca-pheno-section">
      <h4 class="cca-pheno-secttl">${n(r(`pheno.events.title`))}</h4>
      ${P.map(e=>{let t=N.get(e.principal).sort((e,t)=>new Date(t.date)-new Date(e.date)).slice(0,8);return`
          <div class="cca-pheno-ev-group${e.principal===c.principal?` cca-pheno-ev-group-current`:``}">
            <div class="cca-pheno-ev-group-title">
              ${n(e.icon)} ${n(r(e.i18nKey))} <span class="cca-pheno-sub-code">BBCH ${n(String(e.principal))}</span>
            </div>
            ${t.length?t.map(e=>{let t=u[e.type]||`📌`,r=d[e.type]||`#4a7c59`,i=e.date?new Date(e.date).toLocaleDateString(void 0,{day:`numeric`,month:`short`,year:`numeric`}):``;return`<div class="cca-pheno-ev-item">
                <span style="color:${n(r)}">${t}</span>
                <span style="flex:1;font-size:.78rem">${n(e.description||e.type)}</span>
                <span style="font-size:.72rem;color:var(--muted);white-space:nowrap">${n(i)}</span>
                ${e._bbchCode?`<span class="cca-pheno-sub-code" style="font-size:.65rem">${n(e._bbchCode)}</span>`:``}
              </div>`}).join(``):`<div class="cca-pheno-ev-none">${n(r(`pheno.events.none`))}</div>`}
          </div>`}).join(``)}
    </section>`:``,I=i.findIndex(e=>e.principal===c.principal),L=`
    <div class="cca-pheno-nav">
      <button class="cca-pheno-nav-btn" data-dir="-1"
              ${I===0?`disabled`:``}>◄</button>
      <span class="cca-pheno-nav-label">
        ${I+1} / ${i.length}
      </span>
      <button class="cca-pheno-nav-btn" data-dir="1"
              ${I===i.length-1?`disabled`:``}>►</button>
    </div>`,R=document.createElement(`div`);return R.className=`cca-pheno-detail`,R.dataset.plantId=e.id||``,R.dataset.principalIdx=String(I),R.innerHTML=x+S+D+O+k+A+j+F+L,R.querySelectorAll(`.cca-pheno-nav-btn`).forEach(t=>{t.addEventListener(`click`,()=>{let n=parseInt(t.dataset.dir,10),a=parseInt(R.dataset.principalIdx,10),o=Math.max(0,Math.min(i.length-1,a+n));if(o===a)return;let c=i[o],l=_(s),u=y(e,o<i.length-1?(l[o]+l[o+1])/2:l[o]+100,r);R.replaceWith(u),u.dispatchEvent(new CustomEvent(`pheno:navChange`,{bubbles:!0,detail:{principalCode:c.principal}}))})}),R}function b(e,t,r){r=p(r),t=t??e.lat??44;let a=_(e.species||`Citrus sinensis`),o=a.map((e,n)=>{let r=h(e,t,13),i=n<a.length-1?h(a[n+1],t,13):365;return{startMonth:g(r),endMonth:g(Math.min(i,365))}}),s=(new Date().getMonth()+new Date().getDate()/31)/12*100,c=Array.from({length:12},(e,t)=>new Date(2024,t,1).toLocaleDateString(void 0,{month:`short`})),l=f(e),m=new Map;for(let e of i)m.set(e.principal,[]);for(let e of l)e._principalCode!==null&&m.has(e._principalCode)&&m.get(e._principalCode).push(e);let ee=i.map((e,t)=>{let{startMonth:i,endMonth:a}=o[t],s=i/12*100,c=Math.max(4,(a-i+1)/12*100),l=(m.get(e.principal)||[]).filter(e=>e.date).map(e=>{let t=new Date(e.date),r=(t.getMonth()+(t.getDate()-1)/31)/12*100;u[e.type];let i=d[e.type]||`#4a7c59`,a=t.toLocaleDateString(void 0,{day:`numeric`,month:`short`}),o=`${e.type} — ${a}${e._bbchCode?` — BBCH ${e._bbchCode}`:``}`;return`<div class="cca-pheno-gantt-ev"
                     style="left:${r.toFixed(1)}%;color:${n(i)}"
                     title="${n(o)}">◆</div>`}).join(``);return`
      <div class="cca-pheno-gantt-row">
        <div class="cca-pheno-gantt-label">
          ${n(e.icon)}&nbsp;${n(r(e.i18nKey))}
        </div>
        <div class="cca-pheno-gantt-track">
          <div class="cca-pheno-gantt-bar"
               style="left:${s.toFixed(1)}%;width:${c.toFixed(1)}%"
               title="BBCH ${n(String(e.principal))} — ${n(r(e.i18nKey))}">
          </div>
          ${l}
        </div>
      </div>`}).join(``),v=c.map(e=>`<div class="cca-pheno-gantt-month">${n(e)}</div>`).join(``),y=document.createElement(`div`);return y.className=`cca-pheno-calendar`,y.dataset.plantId=e.id||``,y.innerHTML=`
    <div class="cca-pheno-gantt-header">
      <div class="cca-pheno-gantt-label-empty"></div>
      <div class="cca-pheno-gantt-months">${v}</div>
    </div>
    <div class="cca-pheno-gantt-body">
      ${ee}
      <div class="cca-pheno-gantt-today"
           title="${n(new Date().toLocaleDateString())}">
      </div>
    </div>`,y.querySelector(`.cca-pheno-gantt-body`).style.setProperty(`--cca-gantt-today-pct`,s.toFixed(2)),y}window.__CCA_phenology=r,typeof _mountPheno==`function`&&(document.getElementById(`cca-pheno-dash`)&&_mountPheno(`dash`),document.getElementById(`cca-pheno-det`)&&_mountPheno(`detail`));var x=t({createPage:()=>R,getAllPages:()=>I,getPage:()=>L,mount:()=>fe,openArticle:()=>de,parseMarkdown:()=>N,renderWikiArticle:()=>oe,renderWikiEditor:()=>se,renderWikiHistory:()=>ce,renderWikiPage:()=>ae,renderWikiSearch:()=>le,resetView:()=>ue,restoreRevision:()=>ne,saveRevision:()=>te,searchPages:()=>re}),S=`agrumes_wiki_pages`,C=[{slug:`especes`,icon:`🍊`,color:`#e65100`},{slug:`culture`,icon:`🌱`,color:`#388e3c`},{slug:`maladies`,icon:`🦠`,color:`#c62828`},{slug:`greffage`,icon:`✂️`,color:`#6a1b9a`},{slug:`histoire`,icon:`📜`,color:`#1565c0`},{slug:`general`,icon:`📄`,color:`#546e7a`}],w=Object.fromEntries(C.map(e=>[e.slug,e.color])),E=Object.fromEntries(C.map(e=>[e.slug,e.icon]));function D(e){return String(e||``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function O(){return`w`+Math.random().toString(36).slice(2,10)}function k(){return new Date().toISOString()}function A(e){if(!e)return``;let t=Math.floor((Date.now()-new Date(e))/1e3);if(t<60)return`à l'instant`;if(t<3600)return`il y a ${Math.floor(t/60)} min`;if(t<86400)return`il y a ${Math.floor(t/3600)} h`;let n=Math.floor(t/86400);return n<7?`il y a ${n}j`:n<30?`il y a ${Math.floor(n/7)} sem`:`il y a ${Math.floor(n/30)} mois`}function j(e,t){if(t){let n=t(`wiki.cat.`+e);if(n&&n!==`wiki.cat.`+e)return n}return{especes:`Espèces`,culture:`Culture`,maladies:`Maladies`,greffage:`Greffage`,histoire:`Histoire`,general:`Général`}[e]||e}function M(e,t,n){if(!t)return n;let r=t(e);return r&&r!==e?r:n}function N(e){if(!e)return``;let t=D(e),n={},r=0;return t=t.replace(/\[\^([^\]]+)\]/g,(e,t)=>(n[t]||(n[t]=++r),`<sup class="cca-wiki-sup">[${n[t]}]</sup>`)),t=t.replace(/^#### (.+)$/gm,`<h4 class="cca-wiki-h4">$1</h4>`),t=t.replace(/^### (.+)$/gm,`<h3 class="cca-wiki-h3">$1</h3>`),t=t.replace(/^## (.+)$/gm,`<h2 class="cca-wiki-h2">$1</h2>`),t=t.replace(/\*\*\*(.+?)\*\*\*/g,`<strong><em>$1</em></strong>`),t=t.replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`),t=t.replace(/\*(.+?)\*/g,`<em>$1</em>`),t=t.replace(/`([^`]+)`/g,`<code class="cca-wiki-code">$1</code>`),t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(e,t,n)=>`<a href="${D(/^https?:\/\//.test(n)?n:`#`)}" target="_blank" rel="noopener noreferrer" class="cca-wiki-link">${t}</a>`),t=t.replace(/^---$/gm,`<hr class="cca-wiki-hr"/>`),t=t.replace(/((?:^- .+(?:\n|$))+)/gm,e=>`<ul class="cca-wiki-ul">${e.trim().split(`
`).map(e=>`<li>${e.replace(/^- /,``)}</li>`).join(``)}</ul>`),t=t.split(/\n{2,}/).map(e=>(e=e.trim(),e?/^<(h[2-4]|ul|hr|div|p)/.test(e)?e:`<p class="cca-wiki-p">${e.replace(/\n/g,` `)}</p>`:``)).join(`
`),t}function P(){try{let e=localStorage.getItem(S);return e?JSON.parse(e):null}catch{return null}}function F(e){try{localStorage.setItem(S,JSON.stringify(e))}catch{}}function I(){let e=P();return e||=(ie(),P()||[]),e}function L(e){return I().find(t=>t.slug===e)||null}function R(e){let t=I(),n=k(),r=(e.slug||e.title.toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).replace(/\s+/g,`-`).replace(/[^a-z0-9-]/g,``)).slice(0,80),i={id:r,slug:r,title:e.title,category:e.category||`general`,createdBy:`local`,createdAt:n,revisions:[{id:O(),content:e.content||``,author:`local`,createdAt:n,summary:e.summary||`Création de la page`}],refs:e.refs||{}};return t.unshift(i),F(t),i}function te(e,t,n){let r=I(),i=r.findIndex(t=>t.slug===e);return i===-1?!1:(r[i].revisions.push({id:O(),content:t,author:`local`,createdAt:k(),summary:n||`Modification`}),F(r),!0)}function ne(e,t){let n=I(),r=n.find(t=>t.slug===e);if(!r)return!1;let i=r.revisions.find(e=>e.id===t);return i?(r.revisions.push({id:O(),content:i.content,author:`local`,createdAt:k(),summary:`Restauration — ${i.createdAt.slice(0,10)} (${D(i.summary)})`}),F(n),!0):!1}function re(e){if(!e)return I();let t=e.toLowerCase();return I().filter(e=>{let n=e.revisions[e.revisions.length-1];return e.title.toLowerCase().includes(t)||e.category.includes(t)||(n?.content||``).toLowerCase().includes(t)})}function ie(){let e=k(),t=(t,n,r,i,a)=>({id:t,slug:t,title:n,category:r,createdBy:`local`,createdAt:e,revisions:[{id:O(),content:i,author:`local`,createdAt:e,summary:`Article initial`}],refs:a||{}});F([t(`citrus-sinensis`,`Citrus sinensis`,`especes`,`## Oranger doux

L'oranger doux (*Citrus sinensis*) est l'une des espèces d'agrumes les plus cultivées au monde. Originaire d'Asie du Sud-Est, il est aujourd'hui dominant dans les pays méditerranéens, au Brésil et aux États-Unis.

## Description botanique

Arbre sempervirent de 5 à 10 m, à feuilles ovales à pétiole ailé. Fleurs blanches très odorantes. Fruit globuleux à écorce lisse, orange à maturité, pulpe sucrée non amère.

## Principales variétés

- **Navel** — ombilic caractéristique, sans pépin, récolte précoce (nov.–jan.)
- **Valencia** — tardive (avr.–juin), référence mondiale pour le jus industriel
- **Blood Oranges** (Moro, Tarocco, Sanguinello) — chair rouge-violacée anthocyanique

## Culture en pot

Substrat drainant obligatoire (pH 5,5–6,5). Exposition plein soleil (>6 h/j). Hivernage hors-gel impératif (> 5 °C). Fertilisation azotée au printemps et en été [^bain1958].

## Maladies principales

Sensible au HLB (*Candidatus Liberibacter asiaticus*), à la tristeza (CTV) sur bigaradier, et à la gomme de Phytophthora en sol lourd.`,{bain1958:{authors:[`Bain J.M.`],year:1958,title:`Morphological, anatomical and physiological changes in the developing fruit of the Valencia orange`,journal:`Australian Journal of Botany`,vol:`6`,pages:`1–24`}}),t(`citrus-limon`,`Citrus limon`,`especes`,`## Citronnier

*Citrus limon* est un hybride ancien, probablement issu du croisement entre un cédrat (*C. medica*) et une lime (*C. aurantifolia*). Cultivé depuis l'Antiquité en Méditerranée pour ses fruits acides riches en vitamine C [^tolkowsky1938].

## Description

Petit arbre semi-épineux (3–6 m). Feuilles vert clair à bord légèrement denté. Fleurs blanc-rosé teintées de violet à l'extérieur. Fruits ovoïdes jaunes à écorce rugueuse, pulpe très acide (6–8 % d'acide citrique).

## Variétés principales

- **Eureka** — production quasi continue, très commerciale, peu de graines
- **Lisbon** — plus épineuse, tolère mieux la chaleur sèche
- **Menton** (IGP) — citron de luxe, très aromatique, peau utilisée en gastronomie
- **Lunario** (4 Saisons) — remontante, floraison continue toute l'année

## Exigences culturales

Moins rustique que l'oranger : gèle dès −3 °C. Sol bien drainé, pH 5,5–6,5. Sensible à la chlorose ferrique en sol calcaire — apport de chélate de fer en végétation.

## Composition

Vitamine C (50–80 mg/100 mL), flavonoïdes (hespéridine, ériocitrine), huiles essentielles (limonène 65–70 %) dans l'écorce.`,{tolkowsky1938:{authors:[`Tolkowsky S.`],year:1938,title:`Hesperides: A History of the Culture and Use of Citrus Fruits`,journal:`John Bale, Sons & Curnow, London`,vol:``,pages:``}}),t(`citrus-reticulata`,`Citrus reticulata`,`especes`,`## Mandarinier

*Citrus reticulata* est l'espèce la plus diverse du genre, regroupant mandarines, clémentines, satsumas et tangerines. Plus de 200 cultivars sont répertoriés à ce jour [^swingle1943].

## Principaux sous-groupes

- **Satsuma** (*C. unshiu*) — la plus rustique (−7 °C), sans pépins, origine japonaise
- **Clémentine** — hybride mandarine × oranger, sans pépins si bien isolée
- **Tangerine** — groupe américain, peau lâche, facile à éplucher
- **Tangor** — hybride mandarine × oranger (Temple, Ortanique) aux arômes complexes

## Culture

Légèrement plus rustique que l'oranger. Les hivers frais favorisent la coloration orangée des fruits. Porte-greffe recommandé : *Poncirus trifoliata* en zone froide, Troyer Citrange en standard.

## Valeur nutritionnelle

Riche en bêta-carotène (provitamine A), vitamine C et flavonoïdes spécifiques : nobiletine et tangérétine, aux propriétés anti-inflammatoires documentées.`,{swingle1943:{authors:[`Swingle W.T.`,`Reece P.C.`],year:1943,title:`The botany of Citrus and its wild relatives`,journal:`The Citrus Industry, Vol. 1`,vol:``,pages:`129–474`}}),t(`greffe-ecusson`,`Greffe en écusson (T-budding)`,`greffage`,`## Technique

La greffe en écusson, ou *T-budding*, est la méthode de multiplication végétative la plus utilisée pour les agrumes. Elle consiste à insérer un œil (écusson) prélevé sur la variété désirée sous l'écorce d'un porte-greffe compatible [^castle1987].

## Période optimale

**Printemps** (avril–mai) et **fin d'été** (août–sept.) : l'écorce se décole facilement et la sève est en circulation active.

## Matériel nécessaire

- Greffoir à lame courbe propre et désinfectée
- Ruban de greffage (PVC ou raphia)
- Baguettes de bois du cultivar (rameaux semi-aoûtés, non feuillus)

## Protocole pas à pas

1. Choisir un porte-greffe en végétation active, diamètre ≥ 8 mm
2. Inciser en forme de **T** sur l'écorce, à 20–25 cm du sol
3. Prélever l'écusson sur la baguette (2 cm de longueur, avec fine tranche de bois)
4. Glisser l'écusson sous les lèvres du T sans dessécher
5. Ligaturer hermétiquement en laissant l'œil visible
6. **3–4 semaines plus tard** : vérifier la reprise (écusson vert et turgescent), décapiter le porte-greffe au-dessus de la greffe

## Taux de reprise

80–95 % en conditions optimales. L'échec principal vient d'un mauvais contact cambial ou d'un porte-greffe hors végétation active [^grosser2000].`,{castle1987:{authors:[`Castle W.S.`],year:1987,title:`Citrus rootstocks`,journal:`Rootstocks for Fruit Crops — Wiley`,vol:``,pages:`361–399`},grosser2000:{authors:[`Grosser J.W.`,`Gmitter F.G.`],year:2e3,title:`Protoplast fusion for production of tetraploids and triploids: Applications for scion and rootstock improvement in citrus`,journal:`HortScience`,vol:`35`,pages:`1040–1042`}}),t(`hlb-greening`,`Huanglongbing (HLB — Greening)`,`maladies`,`## La maladie la plus destructrice des agrumes

Le HLB (*Huanglongbing*, « maladie du dragon jaune ») est causé par la bactérie *Candidatus Liberibacter asiaticus* (CLas). Transmise par le psylle *Diaphorina citri*, elle est présente dans plus de 40 pays et dévaste les vergers de Floride, du Brésil et d'Asie du Sud-Est [^gottwald2010].

## Symptômes caractéristiques

- **Jaunissement asymétrique** des feuilles (*blotchy mottle*) — pathognomonique
- Fruits petits, asymétriques, amers, avec graines avortées
- Chute prématurée des fruits
- Dépérissement progressif irréversible en 3–8 ans

## Vecteur principal : *Diaphorina citri*

Psylle de 3–4 mm. Se reproduit exclusivement sur les jeunes pousses (*flush*) d'agrumes. Un seul individu infectieux peut contaminer de nombreux arbres lors de sa vie.

## Stratégies de lutte

- Utiliser exclusivement du **matériel végétal certifié** (CAC, DRS)
- Surveillance régulière des *flush* : plaque jaune englué, filets anti-insectes
- Traitement insecticide systémique préventif (imidaclopride, spirotetramat) selon AMM locale
- **Arracher et détruire** les arbres confirmés positifs — aucune guérison connue [^bove2006]

## Situation en Europe (2026)

Absent du continent européen. Foyer détecté aux Açores (île de São Jorge) en 2023. Surveillance phytosanitaire européenne renforcée aux frontières et dans les serres d'importation.`,{gottwald2010:{authors:[`Gottwald T.R.`],year:2010,title:`Current Epidemiological Understanding of Citrus Huanglongbing`,journal:`Annual Review of Phytopathology`,vol:`48`,pages:`119–139`},bove2006:{authors:[`Bové J.M.`],year:2006,title:`Huanglongbing: A Destructive, Newly-Emerging, Century-Old Disease of Citrus`,journal:`Journal of Plant Pathology`,vol:`88`,pages:`7–37`}})])}function ae(e){let t=I(),n={};C.forEach(e=>{n[e.slug]=0}),t.forEach(e=>{n[e.category]=(n[e.category]||0)+1});let r=C.map(t=>{let r=n[t.slug]||0;return`<div class="wiki-cat-card" data-action="go-cat" data-slug="${t.slug}">
      <div class="wiki-cat-icon">${t.icon}</div>
      <div><div class="wiki-cat-label">${D(j(t.slug,e))}</div><div class="wiki-cat-count">${r} article${r===1?``:`s`}</div></div>
    </div>`}).join(``),i=[...t].sort((e,t)=>{let n=e.revisions.at(-1)?.createdAt||e.createdAt;return(t.revisions.at(-1)?.createdAt||t.createdAt).localeCompare(n)}).slice(0,12).map(e=>{let t=w[e.category]||`#546e7a`;return`<div class="wiki-page-row" data-action="go-article" data-slug="${D(e.slug)}">
      <div class="wiki-page-cat-dot" style="background:${t}"></div>
      <div class="wiki-page-title">${D(e.title)}</div>
      <div class="wiki-page-meta">${A(e.revisions.at(-1)?.createdAt)}</div>
    </div>`}).join(``);return`<div class="wiki-home">
<div class="wiki-search-bar">
  <input id="cca-wiki-search" type="text" placeholder="${D(M(`wiki.search`,e,`Rechercher…`))}"/>
  <button class="wiki-search-btn" data-action="do-search">→</button>
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px 0">
  <div class="wiki-section-title" style="padding:0;margin:0">Catégories</div>
  <button class="btn btn-sm" style="font-size:.75rem" data-action="new-article">+ ${D(M(`wiki.newArticle`,e,`Nouvel article`))}</button>
</div>
<div class="wiki-cats">${r}</div>
<div class="wiki-section-title">Articles récents</div>
<div class="wiki-page-list">${i||`<div style="padding:12px 16px;color:var(--muted);font-size:.82rem">${D(M(`wiki.noArticles`,e,`Aucun article`))}</div>`}</div>
</div>`}function oe(e,t){let n=L(e);if(!n)return`<div style="padding:20px;color:var(--muted)">Article introuvable : ${D(e)}</div>`;let r=n.revisions.at(-1),i=C.find(e=>e.slug===n.category),a=Object.entries(n.refs||{}),o=a.length?`<div class="cca-wiki-refs">
  <div class="cca-wiki-refs-title">${D(M(`wiki.references`,t,`Notes et références`))}</div>
  ${a.map(([,e],t)=>`<div class="cca-wiki-ref-item"><sup>[${t+1}]</sup> ${D((e.authors||[]).join(`, `))} (${e.year||``}). <em>${D(e.title||``)}</em>. ${D(e.journal||``)}${e.vol?`, `+e.vol:``}${e.pages?`, p.\xA0`+e.pages:``}.</div>`).join(``)}
</div>`:``;return`<div class="wiki-article">
<div style="background:var(--g1);color:var(--white);padding:12px 16px">
  <div style="font-size:.72rem;color:rgba(255,255,255,.6);cursor:pointer;margin-bottom:4px" data-action="go-home">
    ← Wiki${i?` › `+i.icon+` `+j(i.slug,t):``}
  </div>
  <div style="font-size:1.05rem;font-weight:700">${D(n.title)}</div>
  <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
    <button class="wiki-search-btn" data-action="edit-article" data-slug="${D(e)}" style="font-size:.75rem;padding:4px 10px">${D(M(`wiki.edit`,t,`Modifier`))} ✏</button>
    <button class="wiki-search-btn" data-action="go-history" data-slug="${D(e)}" style="font-size:.75rem;padding:4px 10px;background:rgba(255,255,255,.15)">${D(M(`wiki.history`,t,`Historique`))} 🕐</button>
    <span style="font-size:.72rem;color:rgba(255,255,255,.5);margin-left:auto">${n.revisions.length} rév. · ${A(r?.createdAt)}</span>
  </div>
</div>
<div class="cca-wiki-body" style="padding:14px 16px 30px">
  ${N(r?.content||``)}
  ${o}
</div>
</div>`}function se(e,t){let n=e?L(e):null,r=n?.revisions.at(-1),i=!n,a=C.map(e=>`<option value="${e.slug}">${e.icon} ${j(e.slug,t)}</option>`).join(``);return`<div style="padding-bottom:80px">
<div style="background:var(--g1);color:var(--white);padding:12px 16px;display:flex;align-items:center;gap:10px">
  <button data-action="${i?`go-home`:`go-article`}" data-slug="${D(e||``)}"
    style="background:rgba(255,255,255,.15);color:white;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem">←</button>
  <div style="font-size:.9rem;font-weight:700">${D(i?M(`wiki.newArticle`,t,`Nouvel article`):n.title)}</div>
</div>
<div style="padding:12px 16px;display:flex;flex-direction:column;gap:10px">
  ${i?`
  <div>
    <label style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Titre *</label>
    <input id="cca-wiki-title" type="text" placeholder="Titre de l'article"
      style="width:100%;padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.88rem;margin-top:3px"/>
  </div>
  <div>
    <label style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Catégorie</label>
    <select id="cca-wiki-cat"
      style="width:100%;padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.88rem;margin-top:3px">${a}</select>
  </div>`:``}
  <div style="display:flex;gap:5px;flex-wrap:wrap">
    <button class="btn btn-sm" data-action="md-bold"   style="font-weight:700;font-size:.78rem">G</button>
    <button class="btn btn-sm" data-action="md-italic" style="font-style:italic;font-size:.78rem">I</button>
    <button class="btn btn-sm" data-action="md-h2"     style="font-size:.78rem">H2</button>
    <button class="btn btn-sm" data-action="md-bullet" style="font-size:.78rem">• Liste</button>
    <button class="btn btn-sm" data-action="md-link"   style="font-size:.78rem">🔗 Lien</button>
    <button class="btn btn-sm" data-action="md-ref"    style="font-size:.78rem">📚 Réf</button>
  </div>
  <textarea id="cca-wiki-content"
    style="width:100%;min-height:280px;padding:10px;border:1px solid var(--cream3);border-radius:7px;font-size:.84rem;font-family:'JetBrains Mono',monospace;resize:vertical;line-height:1.55;box-sizing:border-box"
    placeholder="Rédigez en Markdown… (## Titre, **gras**, *italique*, [^ref])">${D(r?.content||``)}</textarea>
  <div>
    <label style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">${D(M(`wiki.summary`,t,`Résumé de la modification`))} *</label>
    <input id="cca-wiki-summary" type="text"
      placeholder="${D(M(`wiki.summaryPh`,t,`Décrivez vos changements…`))}"
      style="width:100%;padding:8px 10px;border:1px solid var(--cream3);border-radius:7px;font-size:.88rem;margin-top:3px"/>
  </div>
  <div id="cca-wiki-preview" style="display:none;padding:12px 14px;border:1.5px solid var(--cream3);border-radius:8px;background:var(--cream2)"></div>
  <div style="display:flex;gap:8px">
    <button class="btn" data-action="preview-toggle" style="flex:1">${D(M(`wiki.preview`,t,`Prévisualiser`))}</button>
    <button class="btn btn-a" data-action="save-article" data-slug="${D(e||``)}" style="flex:1.5">${D(M(`wiki.save`,t,`Enregistrer`))}</button>
    <button class="btn" data-action="${i?`go-home`:`go-article`}" data-slug="${D(e||``)}"
      style="flex:1;background:var(--cream3);color:var(--text)">${D(M(`wiki.cancel`,t,`Annuler`))}</button>
  </div>
</div>
</div>`}function ce(e,t){let n=L(e);if(!n)return`<div style="padding:20px;color:var(--muted)">Article introuvable.</div>`;let r=[...n.revisions].reverse().map((n,r)=>{let i=r===0;return`<div style="padding:10px 0;border-bottom:1px solid var(--cream3)">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap">
    <span style="font-size:.75rem;font-family:'JetBrains Mono',monospace;color:var(--muted)">${n.createdAt.slice(0,16).replace(`T`,` `)}</span>
    ${i?`<span style="font-size:.7rem;background:rgba(45,90,61,.1);color:var(--text-accent);padding:1px 6px;border-radius:5px;font-weight:600">Actuelle</span>`:``}
  </div>
  <div style="font-size:.82rem;color:var(--text);margin-bottom:5px">${D(n.summary||`—`)}</div>
  <div style="display:flex;gap:6px">
    <button class="btn btn-sm" data-action="view-rev" data-revid="${D(n.id)}" data-slug="${D(e)}" style="font-size:.72rem">Voir</button>
    ${i?``:`<button class="btn btn-sm" data-action="restore-rev" data-revid="${D(n.id)}" data-slug="${D(e)}"
      style="font-size:.72rem;background:rgba(45,90,61,.08);color:var(--text-accent)">${D(M(`wiki.restore`,t,`Restaurer`))}</button>`}
  </div>
</div>`}).join(``);return`<div style="padding-bottom:40px">
<div style="background:var(--g1);color:var(--white);padding:12px 16px;display:flex;align-items:center;gap:10px">
  <button data-action="go-article" data-slug="${D(e)}"
    style="background:rgba(255,255,255,.15);color:white;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem">← ${D(n.title)}</button>
  <div style="font-size:.9rem;font-weight:700">${D(M(`wiki.history`,t,`Historique`))}</div>
</div>
<div id="cca-wiki-rev-content" style="display:none;padding:12px 16px;background:var(--cream2);border-bottom:1px solid var(--cream3)"></div>
<div style="padding:0 16px">${r}</div>
</div>`}function le(e,t){let n=re(e),r=n.map(t=>{let n=(t.revisions.at(-1)?.content||``).replace(/#+\s|[*_`]/g,``),r=n.toLowerCase().indexOf((e||``).toLowerCase()),i=r>=0?`…`+n.slice(Math.max(0,r-40),r+70)+`…`:n.slice(0,90)+`…`,a=w[t.category]||`#546e7a`;return`<div class="wiki-page-row" data-action="go-article" data-slug="${D(t.slug)}">
  <div class="wiki-page-cat-dot" style="background:${a}"></div>
  <div style="flex:1;min-width:0">
    <div class="wiki-page-title">${D(t.title)}</div>
    <div style="font-size:.72rem;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${D(i)}</div>
  </div>
  <div class="wiki-page-meta">${E[t.category]||``}</div>
</div>`}).join(``);return`<div>
<div style="padding:10px 16px;display:flex;align-items:center;gap:8px">
  <button data-action="go-home" class="btn btn-sm" style="font-size:.75rem">← Wiki</button>
  <div style="font-size:.85rem;font-weight:600">${n.length} résultat${n.length===1?``:`s`} pour « ${D(e)} »</div>
</div>
<div class="wiki-page-list">${r||`<div style="padding:16px 16px;text-align:center;color:var(--muted);font-size:.82rem">${D(M(`wiki.noArticles`,t,`Aucun article`))}</div>`}</div>
</div>`}var z=`home`,B=null,V=``,H=!1;function ue(){if(H){H=!1;return}z=`home`,B=null,V=``}function de(e){z=`article`,B=e,H=!0}function fe(e,t){e&&U(e,t)}function U(e,t){z===`article`&&B?e.innerHTML=oe(B,t):z===`editor`?e.innerHTML=se(B,t):z===`history`&&B?e.innerHTML=ce(B,t):z===`search`?e.innerHTML=le(V,t):z===`cat`&&B?pe(e,B,t):e.innerHTML=ae(t),me(e,t)}function pe(e,t,n){let r=I().filter(e=>e.category===t),i=C.find(e=>e.slug===t)||{icon:`📄`,slug:t},a=r.map(e=>`<div class="wiki-page-row" data-action="go-article" data-slug="${D(e.slug)}">
  <div class="wiki-page-title">${i.icon} ${D(e.title)}</div>
  <div class="wiki-page-meta">${e.revisions.length} rév. · ${A(e.revisions.at(-1)?.createdAt)}</div>
</div>`).join(``);e.innerHTML=`<div>
<div style="background:var(--g1);color:var(--white);padding:12px 16px">
  <button data-action="go-home" style="background:rgba(255,255,255,.15);color:white;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.8rem">← Wiki</button>
  <div style="font-size:.95rem;font-weight:700;margin-top:6px">${i.icon} ${D(j(t,n))}</div>
</div>
<div class="wiki-page-list">${a||`<div style="padding:16px;color:var(--muted);font-size:.82rem">Aucun article dans cette catégorie.</div>`}</div>
<div style="padding:10px 16px">
  <button class="btn btn-sm" data-action="new-article" style="font-size:.75rem">+ ${D(M(`wiki.newArticle`,n,`Nouvel article`))}</button>
</div>
</div>`}function me(e,t){e.addEventListener(`click`,n=>{let r=n.target.closest(`[data-action]`);if(!r)return;n.stopPropagation();let i=r.dataset.action,a=r.dataset.slug||null,o=r.dataset.revid||null;switch(i){case`go-home`:z=`home`,B=null,U(e,t);break;case`go-article`:z=`article`,B=a,U(e,t);break;case`go-cat`:z=`cat`,B=a,U(e,t);break;case`go-history`:z=`history`,B=a,U(e,t);break;case`new-article`:z=`editor`,B=null,U(e,t);break;case`edit-article`:z=`editor`,B=a,U(e,t);break;case`do-search`:V=e.querySelector(`#cca-wiki-search`)?.value?.trim()||``,z=`search`,U(e,t);break;case`save-article`:he(e,t,a);break;case`preview-toggle`:ge(e);break;case`restore-rev`:_e(e,t,a,o);break;case`view-rev`:ve(e,a,o);break;case`md-bold`:W(e,`**`,`**`);break;case`md-italic`:W(e,`*`,`*`);break;case`md-h2`:W(e,`
## `,`
`);break;case`md-bullet`:W(e,`
- `,``);break;case`md-link`:W(e,`[`,`](https://)`);break;case`md-ref`:W(e,`[^`,`]`);break}});let n=e.querySelector(`#cca-wiki-search`);n&&n.addEventListener(`keydown`,r=>{r.key===`Enter`&&(V=n.value.trim(),z=`search`,U(e,t))})}function he(e,t,n){let r=e.querySelector(`#cca-wiki-content`)?.value?.trim()||``,i=e.querySelector(`#cca-wiki-summary`)?.value?.trim()||``;if(!r){alert(`Contenu requis`);return}if(!i){alert(M(`wiki.summary`,t,`Résumé requis`));return}if(n)te(n,r,i),z=`article`,B=n;else{let t=e.querySelector(`#cca-wiki-title`)?.value?.trim()||``,n=e.querySelector(`#cca-wiki-cat`)?.value||`general`;if(!t){alert(`Titre requis`);return}let a=R({title:t,category:n,content:r,summary:i});z=`article`,B=a.slug}U(e,t)}function ge(e){let t=e.querySelector(`#cca-wiki-preview`),n=e.querySelector(`#cca-wiki-content`)?.value||``;t&&(t.style.display===`none`?(t.innerHTML=N(n),t.style.display=`block`):t.style.display=`none`)}function _e(e,t,n,r){confirm(M(`wiki.restore`,t,`Restaurer cette révision ?`))&&(ne(n,r),z=`article`,B=n,U(e,t))}function ve(e,t,n){let r=L(t)?.revisions.find(e=>e.id===n),i=e.querySelector(`#cca-wiki-rev-content`);if(!(!r||!i)){if(i.dataset.revid===n&&i.style.display!==`none`){i.style.display=`none`;return}i.innerHTML=`<div style="font-size:.75rem;font-weight:600;color:var(--muted);margin-bottom:8px">${r.createdAt.slice(0,16).replace(`T`,` `)} — ${D(r.summary)}</div>`+N(r.content),i.dataset.revid=n,i.style.display=`block`}}function W(e,t,n){let r=e.querySelector(`#cca-wiki-content`);if(!r)return;let i=r.selectionStart,a=r.selectionEnd,o=r.value.slice(i,a);r.value=r.value.slice(0,i)+t+o+n+r.value.slice(a),r.focus(),r.selectionStart=i+t.length,r.selectionEnd=i+t.length+o.length}window.__CCA_wiki=x;var ye=document.getElementById(`cca-wiki-root`);ye&&typeof T==`function`&&fe(ye,T);var be=t({addPlantToSystem:()=>Oe,calcSystemIrrigation:()=>Y,createSystem:()=>Te,deleteSystem:()=>De,getAllSystems:()=>J,getSystem:()=>we,getSystemForPlant:()=>Ae,mount:()=>Re,openDetail:()=>Me,removePlantFromSystem:()=>ke,resetView:()=>je,updateSystem:()=>Ee}),xe=`agrumes_drip_systems`;function G(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function Se(){return`drip_`+Math.random().toString(36).slice(2,9)+Date.now().toString(36)}function K(e,t,n){if(typeof t==`function`){let n=t(e);if(n&&n!==e)return n}return n}function Ce(){try{return JSON.parse(localStorage.getItem(xe)||`[]`)}catch{return[]}}function q(e){localStorage.setItem(xe,JSON.stringify(e))}function J(){return Ce()}function we(e){return J().find(t=>t.id===e)||null}function Te(e){let t=J(),n={id:Se(),name:e.name||`Nouveau circuit`,emitterFlow:parseFloat(e.emitterFlow)||2,emittersPerPlant:parseInt(e.emittersPerPlant)||2,pressure:parseFloat(e.pressure)||1.5,filterType:e.filterType||`disque`,timerEnabled:!!e.timerEnabled,timerSchedule:e.timerSchedule||``,plantIds:e.plantIds||[],notes:e.notes||``,createdAt:new Date().toISOString()};return t.unshift(n),q(t),n}function Ee(e,t){let n=J(),r=n.findIndex(t=>t.id===e);r<0||(n[r]={...n[r],...t},q(n))}function De(e){q(J().filter(t=>t.id!==e))}function Oe(e,t){let n=J(),r=n.find(t=>t.id===e);!r||r.plantIds.includes(t)||(r.plantIds.push(t),q(n))}function ke(e,t){let n=J(),r=n.find(t=>t.id===e);r&&(r.plantIds=r.plantIds.filter(e=>e!==t),q(n))}function Ae(e){return J().find(t=>(t.plantIds||[]).includes(e))||null}function Y(e,t){let n=window.calcDripRecommendation,r=(e.plantIds||[]).map(e=>(t||[]).find(t=>t.id===e)).filter(Boolean).map(t=>{let r=null,i=null,a=null;if(typeof n==`function`)try{let o=n(t);if(r=o.volL,i=o.etcMm,r!==null){let t=e.emitterFlow||2,n=e.emittersPerPlant||2;a=Math.round(r/(t*n)*60)}}catch{}return{id:t.id,name:t.name||t.species||`—`,species:t.species||``,volL:r,etcMm:i,durMin:a}}),i=r.filter(e=>e.volL!==null);if(!i.length)return{plants:r,maxVolL:null,durationMin:null,totalVolL:null,overIrrigated:[],underIrrigated:[]};let a=Math.max(...i.map(e=>e.volL)),o=e.emitterFlow||2,s=e.emittersPerPlant||2,c=Math.round(a/(o*s)*60),l=Math.round(i.reduce((e,t)=>e+t.volL,0)*10)/10,u=Math.round(o*s*(c/60)*10)/10;return{plants:r,maxVolL:a,durationMin:c,totalVolL:l,overIrrigated:i.filter(e=>e.volL<a).map(e=>({...e,excessL:Math.round((u-e.volL)*10)/10})),underIrrigated:[]}}var X=`list`,Z=null,Q=null;function je(){X=`list`,Z=null,Q=null}function Me(e){X=`detail`,Z=e}function Ne(e,t,n){if(!e.length)return`
    <div style="padding:32px 20px;text-align:center;color:var(--muted)">
      <div style="font-size:2.2rem;margin-bottom:10px">💧</div>
      <div style="font-weight:600;font-size:.92rem;margin-bottom:6px;color:var(--text-strong)">
        ${G(K(`drip.title`,n,`Systèmes d'irrigation`))}
      </div>
      <div style="font-size:.78rem;margin-bottom:18px;line-height:1.6">
        Aucun circuit configuré.<br>Créez un circuit pour piloter l'irrigation de plusieurs plantes ensemble.
      </div>
      <button class="btn btn-p" data-action="drip-new">
        + ${G(K(`drip.newSystem`,n,`Nouveau circuit`))}
      </button>
    </div>`;let r=e.map(e=>{let r=Y(e,t),i=(e.plantIds||[]).length,a=r.overIrrigated.length,o=r.durationMin===null?`—`:`${r.durationMin} min`,s=r.totalVolL===null?`—`:`${r.totalVolL} L`;return`<div class="cca-drip-card" data-action="drip-detail" data-id="${G(e.id)}" role="button" tabindex="0">
      <div class="cca-drip-card-header">
        <span class="cca-drip-card-ico">🔵</span>
        <span class="cca-drip-card-name">${G(e.name)}</span>
        <span class="cca-drip-card-count">${i} plante${i===1?``:`s`}</span>
      </div>
      <div class="cca-drip-card-body">
        <span>${G(K(`drip.duration`,n,`Durée recommandée`))} : <strong>${G(o)}</strong></span>
        <span style="margin-left:10px">${G(K(`drip.totalVol`,n,`Volume total`))} : <strong>${G(s)}</strong></span>
      </div>
      ${a?`<div class="cca-drip-over-tag">⚠ ${a} plante${a>1?`s`:``} en sur-arrosage</div>`:``}
    </div>`}).join(``);return`<div style="padding:12px 14px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 class="secttl" style="margin:0">💧 ${G(K(`drip.title`,n,`Systèmes d'irrigation`))}</h3>
      <button class="btn btn-p btn-sm" data-action="drip-new">
        + ${G(K(`drip.newSystem`,n,`Nouveau circuit`))}
      </button>
    </div>
    ${r}
  </div>`}function Pe(e,t,n){let r=Y(e,t),i=e.emitterFlow||2,a=e.emittersPerPlant||2,o=r.plants.map(t=>{let n=t.volL!==null&&t.volL===r.maxVolL,i=r.overIrrigated.find(e=>e.id===t.id);return`<div class="cca-drip-detail-row${n?` cca-drip-detail-max`:``}">
      <span class="cca-drip-det-name">${G(t.name)}</span>
      <span class="cca-drip-det-val">${t.etcMm===null?`—`:G(String(t.etcMm))+` mm`}</span>
      <span class="cca-drip-det-val">${t.volL===null?`—`:G(String(t.volL))+` L`}</span>
      <span class="cca-drip-det-val">${t.durMin===null?`—`:G(String(t.durMin))+` min`}${n?` ←`:``}</span>
      <span>${i?`<span class="cca-drip-over-badge">⚠ +${G(String(i.excessL))}L</span>`:``}</span>
      <button class="cca-drip-det-rm"
        data-action="drip-remove-plant"
        data-id="${G(e.id)}"
        data-plant-id="${G(t.id)}"
        title="Retirer du circuit">✕</button>
    </div>`}).join(``),s=r.overIrrigated.map(e=>`<div class="cca-drip-warn-row">⚠ <strong>${G(e.name)}</strong> ${G(K(`drip.overIrrig`,n,`⚠ Sur-arrosage`))} : ${G(K(`drip.excessL`,n,`+{n}L en excès`).replace(`{n}`,String(e.excessL)))}</div>`).join(``);return`<div style="padding:12px 14px">
    <div class="cca-drip-detail-topbar">
      <button class="btn btn-sm" data-action="drip-back">← Retour</button>
      <h3 class="secttl" style="margin:0;flex:1">💧 ${G(e.name)}</h3>
      <button class="btn btn-sm" data-action="drip-edit" data-id="${G(e.id)}" title="Modifier">✏️</button>
      <button class="btn btn-sm cca-drip-del-btn"
        data-action="drip-delete" data-id="${G(e.id)}" title="Supprimer">🗑</button>
    </div>
    <div style="font-size:.75rem;color:var(--muted);margin-bottom:10px">
      Émetteurs : <strong>${G(String(i))} L/h</strong> × <strong>${G(String(a))}/plante</strong>
      ${e.filterType?` · Filtre : ${G(e.filterType)}`:``}
      ${e.timerEnabled&&e.timerSchedule?` · ⏱ ${G(e.timerSchedule)}`:``}
    </div>
    <div class="cca-drip-detail-header">
      <span>Plante</span><span>ETc</span><span>Volume</span><span>Durée</span><span></span><span></span>
    </div>
    ${o||`<div style="padding:16px;text-align:center;color:var(--muted);font-size:.78rem">Aucune plante dans ce circuit.</div>`}
    ${r.durationMin===null?``:`
    <div class="cca-drip-summary">
      <span>📊 ${G(K(`drip.duration`,n,`Durée circuit`))} : <strong>${G(String(r.durationMin))} min</strong></span>
      <span style="margin-left:12px">${G(K(`drip.totalVol`,n,`Volume total`))} : <strong>${G(String(r.totalVolL))} L</strong></span>
    </div>`}
    ${s?`<div class="cca-drip-warn-block">
      ${s}
      <div class="cca-drip-sep-hint">💡 ${G(K(`drip.separateHint`,n,`Séparer les plantes aux besoins très différents`))}</div>
    </div>`:``}
    <button class="btn btn-p btn-sm" style="margin-top:12px;width:100%"
      data-action="drip-add-plant" data-id="${G(e.id)}">
      + ${G(K(`drip.addPlant`,n,`Ajouter une plante`))}
    </button>
  </div>`}function Fe(e,t){return`<div style="padding:12px 14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <button class="btn btn-sm" data-action="drip-cancel">← Annuler</button>
      <h3 class="secttl" style="margin:0">${e.id?`✏️ Modifier`:`➕ Nouveau`} circuit</h3>
    </div>
    <div class="ff">
      <label>${G(K(`drip.name`,t,`Nom du circuit`))}</label>
      <input id="drip-f-name" type="text" maxlength="60"
        value="${G(e.name||``)}" placeholder="Ex: Circuit serre A"
        class="cca-drip-input"/>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="ff">
        <label>${G(K(`drip.flow`,t,`Débit émetteur (L/h)`))}</label>
        <input id="drip-f-flow" type="number" min="0.5" max="20" step="0.5"
          value="${G(String(e.emitterFlow||2))}" class="cca-drip-input"/>
      </div>
      <div class="ff">
        <label>${G(K(`drip.emitters`,t,`Émetteurs/plante`))}</label>
        <input id="drip-f-emitters" type="number" min="1" max="20" step="1"
          value="${G(String(e.emittersPerPlant||2))}" class="cca-drip-input"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="ff">
        <label>Pression (bar)</label>
        <input id="drip-f-pressure" type="number" min="0.1" max="10" step="0.1"
          value="${G(String(e.pressure||1.5))}" class="cca-drip-input"/>
      </div>
      <div class="ff">
        <label>Filtre</label>
        <select id="drip-f-filter" class="cca-drip-input">
          ${[`disque`,`sable`,`tamis`].map(t=>`<option value="${G(t)}" ${e.filterType===t?`selected`:``}>${G(t.charAt(0).toUpperCase()+t.slice(1))}</option>`).join(``)}
        </select>
      </div>
    </div>
    <div class="ff">
      <label>Programmateur</label>
      <div style="display:flex;align-items:center;gap:10px">
        <label class="sw"><input type="checkbox" id="drip-f-timer"
          ${e.timerEnabled?`checked`:``}><span class="sw-track"></span></label>
        <input id="drip-f-schedule" type="text"
          value="${G(e.timerSchedule||``)}"
          placeholder="Ex: 06:00, 18:00" class="cca-drip-input" style="flex:1"/>
      </div>
    </div>
    <div class="ff">
      <label>Notes</label>
      <textarea id="drip-f-notes" rows="2" class="cca-drip-input"
        style="resize:vertical">${G(e.notes||``)}</textarea>
    </div>
    <input type="hidden" id="drip-f-id" value="${G(e.id||``)}"/>
    <button class="btn btn-p" style="width:100%;margin-top:8px" data-action="drip-save">
      ${G(K(`ui.save`,t,`Enregistrer`))}
    </button>
  </div>`}function Ie(e,t,n,r){let i=new Set(t.flatMap(e=>e.plantIds||[])),a=(n||[]).filter(e=>!i.has(e.id));if(!a.length)return`
    <div style="padding:12px 14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <button class="btn btn-sm" data-action="drip-back">← Annuler</button>
        <h3 class="secttl" style="margin:0">+ ${G(K(`drip.addPlant`,r,`Ajouter une plante`))}</h3>
      </div>
      <div style="padding:20px;text-align:center;color:var(--muted);font-size:.78rem">
        Toutes les plantes sont déjà dans un circuit.
      </div>
    </div>`;let o=a.map(e=>`
    <label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--cream3);font-size:.8rem;cursor:pointer">
      <input type="checkbox" class="drip-add-chk" value="${G(e.id)}"
        style="width:16px;height:16px;flex-shrink:0">
      <span style="flex:1;font-weight:600">${G(e.name||e.species||`—`)}</span>
      <span style="font-size:.7rem;color:var(--muted);font-style:italic">${G(e.species||``)}</span>
    </label>`).join(``);return`<div style="padding:12px 14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <button class="btn btn-sm" data-action="drip-back">← Annuler</button>
      <h3 class="secttl" style="margin:0">+ ${G(K(`drip.addPlant`,r,`Ajouter une plante`))}</h3>
    </div>
    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--cream3);border-radius:8px;padding:6px 10px;background:var(--cream2)">
      ${o}
    </div>
    <button class="btn btn-p" style="width:100%;margin-top:10px"
      data-action="drip-confirm-add" data-id="${G(e)}">
      Ajouter la sélection
    </button>
  </div>`}function $(e,t,n){let r=J();if(X===`detail`&&Z){let i=r.find(e=>e.id===Z);e.innerHTML=i?Pe(i,n,t):Ne(r,n,t)}else X===`form`?e.innerHTML=Fe(Z&&r.find(e=>e.id===Z)||{},t):X===`add-plant`&&Q?e.innerHTML=Ie(Q,r,n,t):(X=`list`,e.innerHTML=Ne(r,n,t));Le(e,t,n)}function Le(e,t,n){e.addEventListener(`click`,r=>{let i=r.target.closest(`[data-action]`);if(!i)return;r.stopPropagation();let a=i.dataset.action,o=i.dataset.id,s=i.dataset.plantId;switch(a){case`drip-new`:X=`form`,Z=null,$(e,t,n);break;case`drip-detail`:X=`detail`,Z=o,$(e,t,n);break;case`drip-edit`:X=`form`,Z=o,$(e,t,n);break;case`drip-delete`:if(!confirm(`Supprimer ce circuit d'irrigation ?`))break;De(o),X=`list`,Z=null,$(e,t,n);break;case`drip-back`:X===`add-plant`?X=`detail`:(X=`list`,Z=null),$(e,t,n);break;case`drip-cancel`:X=Z?`detail`:`list`,$(e,t,n);break;case`drip-save`:{let r=document.getElementById(`drip-f-name`)?.value.trim();if(!r){alert(K(`drip.name`,t,`Nom requis`)+` — requis`);break}let i={name:r,emitterFlow:parseFloat(document.getElementById(`drip-f-flow`)?.value)||2,emittersPerPlant:parseInt(document.getElementById(`drip-f-emitters`)?.value)||2,pressure:parseFloat(document.getElementById(`drip-f-pressure`)?.value)||1.5,filterType:document.getElementById(`drip-f-filter`)?.value||`disque`,timerEnabled:document.getElementById(`drip-f-timer`)?.checked||!1,timerSchedule:document.getElementById(`drip-f-schedule`)?.value.trim()||``,notes:document.getElementById(`drip-f-notes`)?.value.trim()||``},a=document.getElementById(`drip-f-id`)?.value;a?(Ee(a,i),Z=a):Z=Te(i).id,X=`detail`,$(e,t,n);break}case`drip-remove-plant`:if(!o||!s)break;ke(o,s),$(e,t,n);break;case`drip-add-plant`:X=`add-plant`,Q=o,$(e,t,n);break;case`drip-confirm-add`:[...e.querySelectorAll(`.drip-add-chk:checked`)].map(e=>e.value).forEach(e=>Oe(o,e)),X=`detail`,Z=o,Q=null,$(e,t,n);break}})}function Re(e,t,n){e&&$(e,t,n||[])}window.__CCA_drip=be;var ze=document.getElementById(`cca-drip-root`);ze&&typeof T==`function`&&typeof plants<`u`&&Re(ze,T,plants);