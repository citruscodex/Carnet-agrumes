'use strict';

const _api = () => window.CCA_API || '';
let _onAuthSuccess = null;

const SCREENS = ['sc-server-login', 'sc-register', 'sc-srv-forgot', 'sc-srv-reset'];

function _hideAll() {
  SCREENS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

export function togglePwdVis(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
  const btn = el.parentElement?.querySelector(`.pwd-eye[data-pwd="${id}"]`);
  if (btn) btn.textContent = el.type === 'password' ? '👁' : '🙈';
}

function _pwdWrap(inputId, autocomplete) {
  return `<div class="pwd-wrap">` +
    `<input type="password" id="${inputId}" placeholder="••••••••" autocomplete="${autocomplete}"/>` +
    `<button type="button" class="pwd-eye" data-pwd="${inputId}" title="Afficher/masquer">👁</button>` +
    `</div>`;
}

function _legalLinks() {
  return `<div style="text-align:center;margin-top:14px;font-size:.75rem;color:rgba(255,255,255,.65)">` +
    `<a href="/mentions-legales.html" style="color:rgba(255,255,255,.65);text-decoration:none">Mentions légales</a> · ` +
    `<a href="/confidentialite.html" style="color:rgba(255,255,255,.65);text-decoration:none">Confidentialité</a> · ` +
    `<a href="/cgu.html" style="color:rgba(255,255,255,.65);text-decoration:none">CGU</a>` +
    `</div>`;
}

function _screenHTML() {
  return `
<div id="sc-server-login" style="display:none"><div class="asc">
  <div class="alo"><span class="cca-logo-splash">🍊</span><h1>CitrusCodex</h1><p>Gérez votre collection d'agrumes comme un professionnel.</p></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;max-width:340px;margin:0 auto 18px;text-align:center">
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 4px;font-size:.72rem;color:rgba(255,255,255,.85)"><div style="font-size:1.1rem;margin-bottom:2px">🌿</div>Phénologie BBCH</div>
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 4px;font-size:.72rem;color:rgba(255,255,255,.85)"><div style="font-size:1.1rem;margin-bottom:2px">🌤</div>Météo &amp; irrigation</div>
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 4px;font-size:.72rem;color:rgba(255,255,255,.85)"><div style="font-size:1.1rem;margin-bottom:2px">🔄</div>Bourse greffons</div>
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 4px;font-size:.72rem;color:rgba(255,255,255,.85)"><div style="font-size:1.1rem;margin-bottom:2px">📖</div>Wiki collaboratif</div>
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 4px;font-size:.72rem;color:rgba(255,255,255,.85)"><div style="font-size:1.1rem;margin-bottom:2px">🗺</div>Observatoire</div>
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:8px 4px;font-size:.72rem;color:rgba(255,255,255,.85)"><div style="font-size:1.1rem;margin-bottom:2px">📋</div>Fiches culturales</div>
  </div>
  <div class="acard">
    <h2>Connexion</h2>
    <p class="acsub">Accès réservé aux testeurs de la bêta.</p>
    <div id="sl-err" class="aerr" style="display:none"></div>
    <div class="afield"><label>Email</label><input type="email" id="sl-email" name="email" placeholder="votre@email.fr" autocomplete="email"/></div>
    <div class="afield"><label>Mot de passe</label>${_pwdWrap('sl-pwd', 'current-password')}</div>
    <button class="abtn" id="sl-btn" type="button">Accéder à la bêta</button>
    <div style="text-align:center;margin-top:10px;font-size:.82rem">
      <button type="button" id="sl-forgot-btn" style="background:none;border:none;color:rgba(255,255,255,.55);cursor:pointer;font-size:.82rem;padding:0">Mot de passe oublié ?</button>
    </div>
    <div id="sl-register-link" style="text-align:center;margin-top:8px;font-size:.85rem;color:rgba(255,255,255,.65)">
      Pas encore de compte ? <button type="button" id="sl-goto-reg" style="background:none;border:none;color:#c4965a;font-weight:600;cursor:pointer;font-size:.85rem;padding:0">Créer un compte</button>
    </div>
    <div style="text-align:center;margin-top:12px;font-size:.8rem"><a href="/bienvenue.html" style="color:#c4965a;text-decoration:none;font-weight:600">📖 Guide du bêta-testeur</a></div>
    ${_legalLinks()}
  </div>
</div></div>

<div id="sc-register" style="display:none"><div class="asc">
  <div class="alo"><span class="cca-logo-splash">🍊</span><h1>CitrusCodex</h1><p>Créer un compte (bêta)</p></div>
  <div class="acard">
    <h2>Créer un compte</h2>
    <p class="acsub">Vous avez besoin d'un code d'invitation pour vous inscrire.</p>
    <div id="reg-err" class="aerr" style="display:none"></div>
    <div id="reg-ok" style="display:none;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:12px 14px;margin-bottom:12px;font-size:.9rem"></div>
    <div class="afield"><label>Code d'invitation *</label><input type="text" id="reg-code" placeholder="XXXX-XXXX" autocomplete="off" style="text-transform:uppercase;letter-spacing:2px" maxlength="9"/></div>
    <div class="afield"><label>Email *</label><input type="email" id="reg-email" name="email" placeholder="email@exemple.fr" autocomplete="email"/></div>
    <div class="afield"><label>Mot de passe * <span style="font-size:.75rem;color:var(--muted)">(8+ car., 1 lettre, 1 chiffre)</span></label>${_pwdWrap('reg-pwd', 'new-password')}</div>
    <div class="afield"><label>Confirmer le mot de passe *</label>${_pwdWrap('reg-pwd2', 'new-password')}</div>
    <input type="text" id="reg-website" name="website" style="display:none" tabindex="-1" autocomplete="off"/>
    <div style="display:flex;align-items:flex-start;gap:8px;margin:8px 0 14px">
      <input type="checkbox" id="reg-cgu" style="margin-top:3px;flex-shrink:0"/>
      <label for="reg-cgu" style="font-size:.83rem;color:rgba(255,255,255,.85);cursor:pointer">
        J'accepte les <a href="/cgu.html" target="_blank" style="color:var(--accent,#f5a623);text-decoration:underline">CGU</a> et la <a href="/confidentialite.html" target="_blank" style="color:var(--accent,#f5a623);text-decoration:underline">politique de confidentialité</a>
      </label>
    </div>
    <button class="abtn" id="reg-btn" type="button">Créer mon compte</button>
    <div style="text-align:center;margin-top:12px;font-size:.85rem;color:rgba(255,255,255,.65)">
      Déjà un compte ? <button type="button" id="reg-goto-login" style="background:none;border:none;color:#c4965a;font-weight:600;cursor:pointer;font-size:.85rem;padding:0">Se connecter</button>
    </div>
    ${_legalLinks()}
  </div>
</div></div>

<div id="sc-srv-forgot" style="display:none"><div class="asc">
  <div class="alo"><span class="cca-logo-splash">🍊</span><h1>CitrusCodex</h1><p>Mot de passe oublié</p></div>
  <div class="acard">
    <h2>Réinitialiser le mot de passe</h2>
    <p class="acsub">Entrez votre email. Si un compte existe, vous recevrez un lien de réinitialisation.</p>
    <div id="forgot-err" class="aerr" style="display:none"></div>
    <div id="forgot-ok" style="display:none;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:12px 14px;margin-bottom:12px;font-size:.9rem"></div>
    <div class="afield"><label>Email</label><input type="email" id="forgot-email" placeholder="votre@email.fr" autocomplete="email"/></div>
    <button class="abtn" id="forgot-btn" type="button">Envoyer le lien</button>
    <div style="text-align:center;margin-top:12px;font-size:.85rem;color:rgba(255,255,255,.65)">
      <button type="button" id="forgot-back-btn" style="background:none;border:none;color:#c4965a;font-weight:600;cursor:pointer;font-size:.85rem;padding:0">← Retour à la connexion</button>
    </div>
  </div>
</div></div>

<div id="sc-srv-reset" style="display:none"><div class="asc">
  <div class="alo"><span class="cca-logo-splash">🍊</span><h1>CitrusCodex</h1><p>Nouveau mot de passe</p></div>
  <div class="acard">
    <h2>Choisir un nouveau mot de passe</h2>
    <p class="acsub">Votre lien de réinitialisation est valide. Choisissez un nouveau mot de passe.</p>
    <div id="reset-err" class="aerr" style="display:none"></div>
    <div id="reset-ok" style="display:none;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:12px 14px;margin-bottom:12px;font-size:.9rem"></div>
    <div class="afield"><label>Nouveau mot de passe <span style="font-size:.75rem;color:var(--muted)">(8+ car., 1 lettre, 1 chiffre)</span></label>${_pwdWrap('reset-pwd', 'new-password')}</div>
    <div class="afield"><label>Confirmer</label>${_pwdWrap('reset-pwd2', 'new-password')}</div>
    <button class="abtn" id="reset-btn" type="button">Changer le mot de passe</button>
  </div>
</div></div>`;
}

function _injectHTML() {
  if (document.getElementById('sc-server-login')) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'cca-auth-wrapper';
  wrapper.innerHTML = _screenHTML();
  document.body.prepend(wrapper);
}

function _bindEvents() {
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.matches('.pwd-eye[data-pwd]')) { togglePwdVis(t.dataset.pwd); return; }
    const id = t.id;
    if (id === 'sl-btn')          { _submitServerLogin(); return; }
    if (id === 'sl-forgot-btn')   { showSrvForgot(); return; }
    if (id === 'sl-goto-reg')     { showRegister(); return; }
    if (id === 'reg-btn')         { _submitRegister(); return; }
    if (id === 'reg-goto-login')  { showServerLogin(); return; }
    if (id === 'forgot-btn')      { _submitForgot(); return; }
    if (id === 'forgot-back-btn') { showServerLogin(); return; }
    if (id === 'reset-btn')       { _submitSrvReset(); return; }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const sl = document.getElementById('sc-server-login');
    const sf = document.getElementById('sc-srv-forgot');
    if (sl?.style.display !== 'none') { _submitServerLogin(); return; }
    if (sf?.style.display !== 'none') { _submitForgot(); return; }
  });
}

export function showServerLogin() {
  _hideAll();
  document.getElementById('sc-server-login').style.display = 'block';
  setTimeout(() => document.getElementById('sl-email')?.focus(), 100);
}

export function showRegister() {
  _hideAll();
  document.getElementById('sc-register').style.display = 'block';
  setTimeout(() => document.getElementById('reg-code')?.focus(), 100);
}

export function showSrvForgot() {
  _hideAll();
  document.getElementById('sc-srv-forgot').style.display = 'block';
  setTimeout(() => document.getElementById('forgot-email')?.focus(), 100);
}

export function showSrvReset(token) {
  _hideAll();
  window._srvResetToken = token || '';
  document.getElementById('sc-srv-reset').style.display = 'block';
  setTimeout(() => document.getElementById('reset-pwd')?.focus(), 100);
}

async function _submitServerLogin() {
  const email = document.getElementById('sl-email')?.value?.trim();
  const pwd   = document.getElementById('sl-pwd')?.value;
  const err   = document.getElementById('sl-err');
  const btn   = document.getElementById('sl-btn');
  err.style.display = 'none';
  if (!email || !pwd) { err.textContent = 'Email et mot de passe requis.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Connexion…';
  try {
    const r = await fetch(_api() + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd }),
      cache: 'no-store'
    });
    const d = await r.json();
    if (!r.ok) {
      err.textContent = d.error || 'Identifiants invalides.';
      err.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Accéder à la bêta';
      return;
    }
    window._srvToken        = d.token;
    window._srvProfile      = d.profile;
    window._srvRefreshToken = d.refreshToken || null;
    window._srvEmail        = d.email || null;
    sessionStorage.setItem('cca_srv_token',  d.token);
    sessionStorage.setItem('cca_srv_profile', d.profile);
    if (d.refreshToken) sessionStorage.setItem('cca_srv_refresh', d.refreshToken);
    if (d.email)        sessionStorage.setItem('cca_srv_email',   d.email);
    sessionStorage.setItem('cca_srv_role', d.role || 'member');
    const pt = d.profile || d.profile_type;
    if (pt) sessionStorage.setItem('cca_srv_profile_type', pt);
    // Purge previous account's data so it cannot bleed into the new session
    Object.keys(localStorage).filter(k => k.startsWith('agrumes_')).forEach(k => localStorage.removeItem(k));
    if (pt) {
      const cfg = window.getCfg?.();
      if (cfg?.profile) { cfg.profile.profileType = pt; window.setCfg?.(cfg); }
    }
    document.getElementById('sc-server-login').style.display = 'none';
    _onAuthSuccess?.();
  } catch {
    err.textContent = 'Erreur réseau. Réessayez.';
    err.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Accéder à la bêta';
  }
}

async function _submitRegister() {
  const code    = (document.getElementById('reg-code')?.value  || '').trim().toUpperCase();
  const email   = (document.getElementById('reg-email')?.value || '').trim();
  const pwd     = document.getElementById('reg-pwd')?.value  || '';
  const pwd2    = document.getElementById('reg-pwd2')?.value || '';
  const website = document.getElementById('reg-website')?.value || '';
  const cgu     = document.getElementById('reg-cgu')?.checked;
  const err     = document.getElementById('reg-err');
  const ok      = document.getElementById('reg-ok');
  const btn     = document.getElementById('reg-btn');
  err.style.display = 'none'; ok.style.display = 'none';
  if (!code)            { err.textContent = 'Code d\'invitation requis.'; err.style.display = 'block'; return; }
  if (!email)           { err.textContent = 'Email requis.'; err.style.display = 'block'; return; }
  if (pwd.length < 8)   { err.textContent = 'Mot de passe trop court (8 caractères minimum).'; err.style.display = 'block'; return; }
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) { err.textContent = 'Le mot de passe doit contenir au moins 1 lettre et 1 chiffre.'; err.style.display = 'block'; return; }
  if (pwd !== pwd2)     { err.textContent = 'Les mots de passe ne correspondent pas.'; err.style.display = 'block'; return; }
  if (!cgu)             { err.textContent = 'Vous devez accepter les CGU pour continuer.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Création…';
  try {
    const r = await fetch(_api() + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_code: code, email, password: pwd, website }),
      cache: 'no-store'
    });
    const d = await r.json();
    if (!r.ok) { err.textContent = d.error || 'Erreur lors de la création du compte.'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Créer mon compte'; return; }
    ok.textContent = 'Compte créé ! Vérifiez votre email pour activer votre compte.';
    ok.style.display = 'block';
    btn.style.display = 'none';
    setTimeout(() => showServerLogin(), 4000);
  } catch {
    err.textContent = 'Erreur réseau. Réessayez.';
    err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Créer mon compte';
  }
}

async function _submitForgot() {
  const email = (document.getElementById('forgot-email')?.value || '').trim();
  const err   = document.getElementById('forgot-err');
  const ok    = document.getElementById('forgot-ok');
  const btn   = document.getElementById('forgot-btn');
  err.style.display = 'none'; ok.style.display = 'none';
  if (!email) { err.textContent = 'Email requis.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Envoi…';
  try {
    await fetch(_api() + '/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store'
    });
    ok.textContent = 'Si un compte existe pour cet email, vous recevrez un lien de réinitialisation dans quelques minutes.';
    ok.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Envoyer le lien';
  } catch {
    err.textContent = 'Erreur réseau. Réessayez.';
    err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Envoyer le lien';
  }
}

async function _submitSrvReset() {
  const pwd  = document.getElementById('reset-pwd')?.value  || '';
  const pwd2 = document.getElementById('reset-pwd2')?.value || '';
  const err  = document.getElementById('reset-err');
  const ok   = document.getElementById('reset-ok');
  const btn  = document.getElementById('reset-btn');
  err.style.display = 'none'; ok.style.display = 'none';
  if (pwd.length < 8)   { err.textContent = 'Mot de passe trop court (8 caractères minimum).'; err.style.display = 'block'; return; }
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) { err.textContent = 'Le mot de passe doit contenir au moins 1 lettre et 1 chiffre.'; err.style.display = 'block'; return; }
  if (pwd !== pwd2) { err.textContent = 'Les mots de passe ne correspondent pas.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Changement…';
  try {
    const r = await fetch(_api() + '/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: window._srvResetToken || '', new_password: pwd }),
      cache: 'no-store'
    });
    const d = await r.json();
    if (!r.ok) { err.textContent = d.error || 'Lien invalide ou expiré.'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Changer le mot de passe'; return; }
    ok.textContent = 'Mot de passe modifié avec succès. Vous pouvez vous connecter.';
    ok.style.display = 'block'; btn.style.display = 'none';
    setTimeout(() => showServerLogin(), 3000);
  } catch {
    err.textContent = 'Erreur réseau. Réessayez.';
    err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Changer le mot de passe';
  }
}

function _srvTokenValid() {
  const t = window._srvToken || sessionStorage.getItem('cca_srv_token');
  if (!t) return false;
  try {
    const p = JSON.parse(atob(t.split('.')[1]));
    return p.exp * 1000 > Date.now() + 60000;
  } catch { return false; }
}

function _handleUrlParams(onValidToken) {
  const params   = new URLSearchParams(window.location.search);
  const resetTok = params.get('reset_token');
  const verified = params.get('verified');

  if (resetTok) {
    showSrvReset(resetTok);
    history.replaceState(null, '', window.location.pathname);
  } else if (verified === '1') {
    showServerLogin();
    const el = document.getElementById('sl-err');
    if (el) {
      el.style.cssText = 'display:block;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:.9rem;border:none';
      el.textContent = 'Email vérifié avec succès ! Vous pouvez vous connecter.';
    }
    history.replaceState(null, '', window.location.pathname);
  } else if (verified === '0') {
    showServerLogin();
    const el = document.getElementById('sl-err');
    if (el) {
      el.style.cssText = 'display:block;background:#ffeaea;color:#c62828;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:.9rem;border:none';
      el.textContent = 'Lien de vérification invalide ou expiré. Contactez le support si le problème persiste.';
    }
    history.replaceState(null, '', window.location.pathname);
  } else if (_srvTokenValid()) {
    onValidToken();
  } else {
    sessionStorage.removeItem('cca_srv_token');
    sessionStorage.removeItem('cca_srv_profile');
    showServerLogin();
  }
}

export function initAuth(onAuthSuccess) {
  _onAuthSuccess = onAuthSuccess;
  _injectHTML();
  _bindEvents();
  _handleUrlParams(onAuthSuccess);

  // Expose globals for inline script callers still referencing these by name
  window.showServerLogin = showServerLogin;
  window.showRegister    = showRegister;
  window.showSrvForgot   = showSrvForgot;
  window.showSrvReset    = showSrvReset;
  window.togglePwdVis    = togglePwdVis;
  window.submitServerLogin = _submitServerLogin;
  window.submitForgot    = _submitForgot;
}

window.__CCA_login = {
  initAuth, showServerLogin, showRegister, showSrvForgot, showSrvReset, togglePwdVis
};
