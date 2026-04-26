import { esc } from '../lib/esc.js';

const toast      = (msg, err) => window.toast?.(msg, err);
const showModal  = html       => window.showModal?.(html);
const closeModal = ()         => window.closeModal?.();

let _prodScanTarget = null;

function openProductScanner(target) {
  _prodScanTarget = target;
  showModal(`<h3>📷 Scanner étiquette produit</h3>
<p style="font-size:.8rem;color:var(--muted);margin-bottom:10px">Scannez le code-barres du produit. Les informations NPK seront extraites si disponibles.</p>
<div class="scanner-wrap" id="psc-wrap">
  <video id="psc-video" class="scanner-video" autoplay muted playsinline></video>
  <div class="scanner-overlay"><div class="scanner-frame"></div><div class="scan-line"></div></div>
</div>
<div id="psc-result" style="padding:8px 0;display:none"></div>
<div class="fact" style="flex-wrap:wrap;gap:8px;margin-top:10px">
  <button class="btn" style="background:var(--cream3);color:var(--text)" onclick="closeProductScanner()">Fermer</button>
  <label class="btn" style="background:var(--g2);color:white;cursor:pointer">📁 Image<input type="file" accept="image/*" style="display:none" onchange="scanProductImage(event)"/></label>
</div>`);
  _startProductCamera();
}

async function _startProductCamera() {
  const video = document.getElementById('psc-video');
  if (!video) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
    window._prodStream = stream;
    if ('BarcodeDetector' in window) {
      const bd = new BarcodeDetector({ formats: ['qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e'] });
      window._prodScanInt = setInterval(async () => {
        try {
          const bc = await bd.detect(video);
          if (bc.length > 0) { clearInterval(window._prodScanInt); _processProductBarcode(bc[0].rawValue); }
        } catch {}
      }, 400);
    } else {
      document.getElementById('psc-wrap')?.insertAdjacentHTML('afterend', '<p style="font-size:.75rem;color:var(--amber3)">BarcodeDetector non dispo. Importez une image.</p>');
    }
  } catch {
    const w = document.getElementById('psc-wrap');
    if (w) w.style.display = 'none';
    const r = document.getElementById('psc-result');
    if (r) { r.innerHTML = '<p style="color:var(--red);font-size:.8rem">Caméra inaccessible.</p>'; r.style.display = 'block'; }
  }
}

async function scanProductImage(e) {
  const f = e.target.files[0];
  if (!f) return;
  if ('BarcodeDetector' in window) {
    const bd = new BarcodeDetector({ formats: ['qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e'] });
    const img = new Image();
    img.onload = async () => {
      try {
        const bc = await bd.detect(img);
        bc.length > 0 ? _processProductBarcode(bc[0].rawValue) : _showProductResult('Aucun code-barres détecté.', null);
      } catch { _showProductResult('Erreur de détection.', null); }
    };
    img.src = URL.createObjectURL(f);
  } else {
    _showProductResult('BarcodeDetector non supporté.', null);
  }
}

function _processProductBarcode(raw) {
  const npkRegex = /(?:NPK\s*[:\s]?)?([\d.]+)[-\s]([\d.]+)[-\s]([\d.]+)/i;
  const m = raw.match(npkRegex);
  const nameMatch = raw.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]{2,30})/);
  const extracted = { raw, n: m?m[1]:null, p: m?m[2]:null, k: m?m[3]:null, name: nameMatch?nameMatch[1].trim():null };
  _showProductResult(null, extracted);
}

function _showProductResult(err, data) {
  const r = document.getElementById('psc-result');
  if (!r) return;
  r.style.display = 'block';
  if (err) { r.innerHTML = `<p style="font-size:.8rem;color:var(--muted)">${esc(err)}</p>`; return; }
  let html = `<div style="font-size:.76rem;font-weight:700;color:var(--text-strong);margin-bottom:6px">Données extraites</div>`;
  if (data.name) html += `<div class="scan-field-row"><span class="sfr-lbl">Nom</span><span class="sfr-val">${esc(data.name)}</span><button class="sfr-btn" onclick="_applyProdField('name','${data.name.replace(/'/g,"\\'")}')">Appliquer</button></div>`;
  if (data.n)    html += `<div class="scan-field-row"><span class="sfr-lbl">N</span><span class="sfr-val">${data.n}%</span><button class="sfr-btn" onclick="_applyProdField('n','${data.n}')">Appliquer</button></div>`;
  if (data.p)    html += `<div class="scan-field-row"><span class="sfr-lbl">P</span><span class="sfr-val">${data.p}%</span><button class="sfr-btn" onclick="_applyProdField('p','${data.p}')">Appliquer</button></div>`;
  if (data.k)    html += `<div class="scan-field-row"><span class="sfr-lbl">K</span><span class="sfr-val">${data.k}%</span><button class="sfr-btn" onclick="_applyProdField('k','${data.k}')">Appliquer</button></div>`;
  html += `<div class="scan-field-row"><span class="sfr-lbl">Code</span><span class="sfr-val" style="font-family:'JetBrains Mono',monospace;font-size:.75rem">${esc((data.raw||'').slice(0,60))}</span></div>`;
  r.innerHTML = html;
}

function _applyProdField(key, val) {
  const map = { name: 'fert-name', n: 'fert-n', p: 'fert-p', k: 'fert-k' };
  const elId = map[key];
  if (!elId) return;
  const el = document.getElementById(elId);
  if (el) { el.value = val; el.style.background = 'rgba(46,125,50,.08)'; }
  toast(`Champ ${key} rempli ✓`);
}

function closeProductScanner() {
  clearInterval(window._prodScanInt);
  if (window._prodStream) { window._prodStream.getTracks().forEach(t => t.stop()); window._prodStream = null; }
  closeModal();
}

window.openProductScanner  = openProductScanner;
window.scanProductImage    = scanProductImage;
window._processProductBarcode = _processProductBarcode;
window._showProductResult  = _showProductResult;
window._applyProdField     = _applyProdField;
window.closeProductScanner = closeProductScanner;
