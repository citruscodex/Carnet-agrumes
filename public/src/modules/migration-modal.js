/**
 * migration-modal.js — Modal de migration localStorage → serveur
 * Affiché au premier login d'un utilisateur ayant des données locales.
 * Utilise window.T() (i18n monolithe) et window.__CCA_ServerSync.
 */

import { esc } from '../lib/esc.js'

const LS_MIGRATED = 'agrumes_migrated_to_server'

function _countLocalPlants() {
  let total = 0
  try {
    const idx = JSON.parse(localStorage.getItem('agrumes_collections') || '[]')
    if (idx.length) {
      idx.forEach(c => {
        try {
          const r = localStorage.getItem(`agrumes_v5_${c.id}`)
          if (r) total += JSON.parse(r).length
        } catch {}
      })
    } else {
      const r = localStorage.getItem('agrumes_v5')
      if (r) total += JSON.parse(r).length
    }
  } catch {}
  return total
}

async function _countServerPlants() {
  const t = sessionStorage.getItem('cca_srv_token')
  if (!t) return 0
  try {
    const r = await fetch('/api/user/plants', { headers: { Authorization: `Bearer ${t}` } })
    if (!r.ok) return 0
    const data = await r.json()
    return Array.isArray(data) ? data.length : 0
  } catch { return 0 }
}

function _T(key, vars = {}) {
  let s = window.T?.(key) || key
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v)
  return s
}

export async function showMigrationModalIfNeeded() {
  if (localStorage.getItem(LS_MIGRATED) === 'true') return

  const localCount = _countLocalPlants()

  if (localCount === 0) {
    localStorage.setItem(LS_MIGRATED, 'true')
    return
  }

  const serverCount = await _countServerPlants()

  return new Promise(resolve => {
    if (serverCount > 0) {
      _showConflictModal(localCount, serverCount, resolve)
    } else {
      _showPushModal(localCount, resolve)
    }
  })
}

function _overlay() {
  const el = document.createElement('div')
  el.className = 'cca-mig-overlay'
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px'
  return el
}

function _card(html) {
  const el = document.createElement('div')
  el.style.cssText = 'background:var(--white,#fff);border-radius:16px;padding:24px 20px;max-width:420px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.18)'
  el.innerHTML = html
  return el
}

function _showPushModal(localCount, resolve) {
  const overlay = _overlay()
  const card = _card(`
    <h2 style="margin:0 0 10px;font-size:1.1rem">${esc(_T('sync.migrationTitle'))}</h2>
    <p style="font-size:.88rem;color:var(--muted,#888);margin:0 0 20px;line-height:1.5">
      ${esc(_T('sync.migrationIntro').replace('{n}', localCount))}
    </p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button id="mig-push" style="padding:11px 16px;background:#e8941a;color:#fff;border:none;border-radius:10px;font-size:.92rem;font-weight:600;cursor:pointer">
        ${esc(_T('sync.migrationPush'))}
      </button>
      <button id="mig-skip" style="padding:10px 16px;background:transparent;color:var(--muted,#888);border:1px solid var(--cream3,#ddd);border-radius:10px;font-size:.88rem;cursor:pointer">
        ${esc(_T('sync.migrationLater'))}
      </button>
    </div>`)

  overlay.appendChild(card)
  document.body.appendChild(overlay)

  card.querySelector('#mig-push').addEventListener('click', async () => {
    card.innerHTML = `<p style="text-align:center;padding:20px;font-size:.95rem">⏳ ${esc(_T('sync.migrating'))}</p>`
    try {
      const result = await window.__CCA_ServerSync.bulkImportLocalData('skip_existing')
      const n = result.stats?.plants || 0
      const e = result.stats?.events || 0
      localStorage.setItem(LS_MIGRATED, 'true')
      card.innerHTML = `
        <h2 style="margin:0 0 14px;color:#388e3c;font-size:1.05rem">✅ ${esc(_T('sync.migrationSuccess').replace('{n}', n).replace('{e}', e))}</h2>
        <button id="mig-close" style="width:100%;padding:11px;background:#e8941a;color:#fff;border:none;border-radius:10px;font-size:.92rem;font-weight:600;cursor:pointer">
          ${esc(_T('common.close') || 'Fermer')}
        </button>`
      card.querySelector('#mig-close').addEventListener('click', () => { overlay.remove(); resolve() })
    } catch (err) {
      card.innerHTML = `
        <h2 style="margin:0 0 10px;color:#c62828;font-size:1.05rem">❌ ${esc(_T('sync.migrationFailed'))}</h2>
        <p style="font-size:.85rem;color:var(--muted,#888);margin:0 0 16px">${esc(err.message)}</p>
        <button id="mig-close" style="width:100%;padding:11px;background:#e8941a;color:#fff;border:none;border-radius:10px;font-size:.92rem;cursor:pointer">Fermer</button>`
      card.querySelector('#mig-close').addEventListener('click', () => { overlay.remove(); resolve() })
    }
  })

  card.querySelector('#mig-skip').addEventListener('click', () => { overlay.remove(); resolve() })
}

function _showConflictModal(localCount, serverCount, resolve) {
  const overlay = _overlay()
  const card = _card(`
    <h2 style="margin:0 0 10px;font-size:1.05rem">⚠️ ${esc(_T('sync.migrationConflict'))}</h2>
    <p style="font-size:.88rem;color:var(--muted,#888);margin:0 0 18px;line-height:1.5">
      ${esc(_T('sync.migrationConflictIntro').replace('{local}', localCount).replace('{server}', serverCount))}
    </p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button id="mig-keep-server" style="padding:11px 16px;background:#e8941a;color:#fff;border:none;border-radius:10px;font-size:.88rem;font-weight:600;cursor:pointer">
        ${esc(_T('sync.migrationPull'))} (${serverCount} sujets)
      </button>
      <button id="mig-merge" style="padding:10px 16px;background:transparent;color:var(--text,#333);border:1px solid var(--cream3,#ddd);border-radius:10px;font-size:.88rem;cursor:pointer">
        ${esc(_T('sync.migrationMerge'))}
      </button>
      <button id="mig-skip" style="padding:8px 16px;background:transparent;color:var(--muted,#888);border:none;border-radius:10px;font-size:.82rem;cursor:pointer">
        ${esc(_T('sync.migrationLater'))}
      </button>
    </div>`)

  overlay.appendChild(card)
  document.body.appendChild(overlay)

  card.querySelector('#mig-keep-server').addEventListener('click', async () => {
    card.innerHTML = `<p style="text-align:center;padding:20px;font-size:.95rem">⏳ ${esc(_T('sync.migrating'))}</p>`
    try {
      await window.__CCA_ServerSync.pullFromServer()
      localStorage.setItem(LS_MIGRATED, 'true')
      card.innerHTML = `
        <p style="text-align:center;padding:16px;color:#388e3c;font-size:.95rem">✅ Données serveur restaurées</p>
        <button id="mig-close" style="width:100%;padding:11px;background:#e8941a;color:#fff;border:none;border-radius:10px;font-size:.92rem;cursor:pointer">Fermer</button>`
      card.querySelector('#mig-close').addEventListener('click', () => { overlay.remove(); resolve() })
    } catch (err) {
      overlay.remove(); resolve()
    }
  })

  card.querySelector('#mig-merge').addEventListener('click', async () => {
    card.innerHTML = `<p style="text-align:center;padding:20px;font-size:.95rem">⏳ ${esc(_T('sync.migrating'))}</p>`
    try {
      await window.__CCA_ServerSync.bulkImportLocalData('skip_existing')
      localStorage.setItem(LS_MIGRATED, 'true')
      overlay.remove(); resolve()
    } catch { overlay.remove(); resolve() }
  })

  card.querySelector('#mig-skip').addEventListener('click', () => { overlay.remove(); resolve() })
}

window.__CCA_MigrationModal = { showMigrationModalIfNeeded }
