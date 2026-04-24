'use strict';

export function init() {
  const back = document.getElementById('tb-back');
  const logo = document.getElementById('tb-logo');

  if (back) {
    back.removeAttribute('onclick');
    back.addEventListener('click', () => window.goBack?.());
  }
  if (logo) {
    logo.removeAttribute('onclick');
    logo.addEventListener('click', () => window.showPage?.('dashboard'));
  }
}

export function setTitle(subtitle) {
  const el = document.getElementById('tb-sub');
  if (el) el.textContent = subtitle || '';
}

export function setActions(html) {
  const el = document.getElementById('tb-act');
  if (el) el.innerHTML = html || '';
}

export function setBackVisible(show) {
  const el = document.getElementById('tb-back');
  if (el) el.style.display = show ? 'block' : 'none';
}

export function updateReadOnlyBadge() {
  const el = document.getElementById('cca-readonly-badge');
  if (el) el.style.display = localStorage.getItem('agrumes_readonly') === '1' ? 'flex' : 'none';
}

window.__CCA_topbar = { init, setTitle, setActions, setBackVisible, updateReadOnlyBadge };
