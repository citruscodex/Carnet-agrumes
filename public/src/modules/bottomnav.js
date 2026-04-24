'use strict';

const NAV_PAGES = ['dashboard', 'collection', 'settings', 'fert', 'eco', 'pro', 'community'];

export function init() {
  document.querySelectorAll('#navbar .navi').forEach(btn => {
    btn.removeAttribute('onclick');
    btn.addEventListener('click', () => {
      const id = btn.id; // e.g. "nv-dashboard"
      const page = id.startsWith('nv-') ? id.slice(3) : id;
      window.showPage?.(page === 'admin' ? 'admin-users' : page);
    });
  });
}

export function setActive(page) {
  NAV_PAGES.forEach(n => {
    const el = document.getElementById('nv-' + n);
    if (el) {
      el.classList.toggle('active', n === page);
      el.setAttribute('aria-selected', n === page ? 'true' : 'false');
    }
  });
}

export function updateForProfile() {
  const settingsEl = document.getElementById('nv-settings');
  if (settingsEl) settingsEl.style.display = '';
  const adminEl = document.getElementById('nv-admin');
  if (adminEl) adminEl.style.display = window._srvUserRole?.() === 'admin' ? '' : 'none';
}

window.__CCA_bottomnav = { init, setActive, updateForProfile };
