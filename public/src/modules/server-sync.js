/**
 * server-sync.js — Synchronisation serveur PostgreSQL
 * Expose window.__CCA_ServerSync pour interop avec le monolithe.
 * Token JWT lu depuis sessionStorage('cca_srv_token').
 */

import { esc } from '../lib/esc.js'

const LS_QUEUE    = 'agrumes_sync_queue'
const LS_LAST_SYNC = 'agrumes_srv_last_sync'
const LS_ID_MAP   = 'agrumes_srv_id_map'

const SYNC_INTERVAL_MS = 5 * 60 * 1000
const DEBOUNCE_MS      = 2000

let _queue        = []
let _lastSync     = null
let _idMap        = {}
let _status       = 'idle'
let _debounce     = null
let _prevSnapshot = null

// ── Auth ──────────────────────────────────────────────────────────────────────

function _token() {
  return sessionStorage.getItem('cca_srv_token') || null
}

async function _api(path, opts = {}) {
  const t = _token()
  if (!t) throw new Error('Not authenticated')
  const headers = { Authorization: `Bearer ${t}`, ...(opts.headers || {}) }
  if (opts.body && typeof opts.body === 'object') {
    headers['Content-Type'] = 'application/json'
    opts = { ...opts, body: JSON.stringify(opts.body) }
  }
  return fetch(path, { ...opts, headers })
}

// ── State helpers ─────────────────────────────────────────────────────────────

function _emit(status, extra = {}) {
  _status = status
  window.dispatchEvent(new CustomEvent('cca-sync-status', {
    detail: { status, queue_length: _queue.length, ...extra }
  }))
}

function _saveQueue() {
  try { localStorage.setItem(LS_QUEUE, JSON.stringify(_queue)) } catch {}
}

function _saveIdMap() {
  try { localStorage.setItem(LS_ID_MAP, JSON.stringify(_idMap)) } catch {}
}

function _loadPersisted() {
  try { _queue   = JSON.parse(localStorage.getItem(LS_QUEUE)   || '[]') } catch { _queue = [] }
  try { _idMap   = JSON.parse(localStorage.getItem(LS_ID_MAP)  || '{}') } catch { _idMap = {} }
  try { _lastSync = localStorage.getItem(LS_LAST_SYNC) } catch {}
}

// ── localStorage data readers ─────────────────────────────────────────────────

function _getAllLocalPlants() {
  const all = []
  try {
    const idx = JSON.parse(localStorage.getItem('agrumes_collections') || '[]')
    if (idx.length) {
      idx.forEach(c => {
        try { const r = localStorage.getItem(`agrumes_v5_${c.id}`); if (r) all.push(...JSON.parse(r)) } catch {}
      })
    } else {
      const r = localStorage.getItem('agrumes_v5')
      if (r) all.push(...JSON.parse(r))
    }
  } catch {}
  return all
}

// ── Field mapping monolith ↔ server ──────────────────────────────────────────

function _mapEventType(type) {
  return {
    fertilisation: 'Fertilisation', taille: 'Taille', traitement: 'Traitement',
    floraison: 'Floraison', fructification: 'Fructification', récolte: 'Récolte',
    arrosage: 'Irrigation', hivernage: 'Hivernage', greffage: 'Greffage',
    observation: 'Observation', rempotage: 'Rempotage', plantation: 'Plantation',
    sortie: 'Autre'
  }[type] || 'Observation'
}

function _mapPlant(p) {
  return {
    client_id:        p.id,
    scientific_name:  p.species || p.name || 'Citrus spp.',
    common_name:      p.name   || null,
    variety:          p.variety || null,
    rootstock:        p.rootstock || null,
    acquisition_date: p.acquisitionDate || p.plantingDate || null,
    notes:            p.notes || null,
    photo_urls:       p.photos || [],
    metadata: { cultureType: p.cultureType, location: p.location, status: p.status },
    events: (p.events || []).map(e => ({
      client_id:  e.id,
      event_type: _mapEventType(e.type),
      event_date: e.date,
      notes:      e.description || null,
      metadata:   e
    }))
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function init() {
  if (!_token()) return
  _loadPersisted()
  _injectTopbarButton()

  if (_queue.length) {
    _emit('pending')
    await flushQueue()
  }

  setInterval(() => pullFromServer(), SYNC_INTERVAL_MS)

  window.addEventListener('online', () => {
    if (_queue.length) { _emit('pending'); flushQueue() }
  })
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && _token()) pullFromServer()
  })
}

export function enqueueChange(entity, action, data) {
  _queue.push({ entity, action, data, queued_at: Date.now() })
  _saveQueue()
  _emit('pending')
  clearTimeout(_debounce)
  _debounce = setTimeout(flushQueue, DEBOUNCE_MS)
}

export async function syncNow() {
  await flushQueue()
  await pullFromServer()
}

export function getSyncStatus() {
  return { status: _status, queue_length: _queue.length, last_synced_at: _lastSync }
}

// Called by monolith saveData() — detects plant mutations via snapshot diff
export function _onPlantsChanged(plants) {
  if (!_token() || localStorage.getItem('agrumes_migrated_to_server') !== 'true') return

  const prev = _prevSnapshot
  _prevSnapshot = plants.map(p => ({ id: p.id, evLen: p.events?.length || 0 }))
  if (!prev) return  // first call after init — no diff possible

  const prevMap = new Map(prev.map(p => [p.id, p]))
  const currIds = new Set(plants.map(p => p.id))

  for (const p of plants) {
    if (!prevMap.has(p.id)) {
      enqueueChange('plant', 'create', _mapPlant(p))
    } else {
      const pp = prevMap.get(p.id)
      if (pp.evLen !== (p.events?.length || 0)) {
        enqueueChange('plant', 'update', _mapPlant(p))
      }
    }
  }
  for (const pp of prev) {
    if (!currIds.has(pp.id)) {
      enqueueChange('plant', 'delete', { client_id: pp.id })
    }
  }
}

// ── Queue flush ───────────────────────────────────────────────────────────────

export async function flushQueue() {
  if (!_queue.length || !navigator.onLine || !_token()) return
  _emit('syncing')

  let failures = 0
  const snapshot = [..._queue]

  for (const op of snapshot) {
    try {
      await _sendOp(op)
      _queue.shift()
      _saveQueue()
    } catch (err) {
      console.error('[server-sync] op failed', op, err)
      failures++
      break
    }
  }
  _emit(failures ? 'error' : (_queue.length ? 'pending' : 'synced'))
}

async function _sendOp(op) {
  const base = `/api/user/${_entityPath(op.entity)}`

  if (op.action === 'create') {
    const r = await _api(base, { method: 'POST', body: op.data })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const row = await r.json()
    if (op.data.client_id && row.id) { _idMap[op.data.client_id] = row.id; _saveIdMap() }

    // Push nested events for plant creates
    if (op.entity === 'plant' && op.data.events?.length) {
      for (const ev of op.data.events) {
        const er = await _api('/api/user/events', { method: 'POST', body: {
          plant_id:   row.id,
          event_type: ev.event_type,
          event_date: ev.event_date,
          notes:      ev.notes,
          metadata:   ev.metadata,
          client_id:  ev.client_id
        }})
        if (!er.ok) throw new Error(`Event HTTP ${er.status}`)
        const erow = await er.json()
        if (ev.client_id && erow.id) { _idMap[`ev_${ev.client_id}`] = erow.id; _saveIdMap() }
      }
    }
    return
  }

  const serverId = _idMap[op.data.client_id]

  if (op.action === 'update' && serverId) {
    const r = await _api(`${base}/${serverId}`, { method: 'PUT', body: op.data })
    if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`)
    return
  }

  if (op.action === 'delete' && serverId) {
    const r = await _api(`${base}/${serverId}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`)
    delete _idMap[op.data.client_id]; _saveIdMap()
    return
  }
  // Orphan op (no server ID yet) — skip
  console.warn('[server-sync] no server ID for client_id', op.data?.client_id)
}

function _entityPath(entity) {
  return { plant: 'plants', event: 'events', parcelle: 'parcelles', stock: 'stocks', eco: 'economic' }[entity] || entity
}

// ── Pull from server ──────────────────────────────────────────────────────────

export async function pullFromServer() {
  if (!_token()) return
  _emit('syncing')
  try {
    const url = _lastSync
      ? `/api/user/sync/snapshot?since=${encodeURIComponent(_lastSync)}`
      : `/api/user/sync/snapshot`
    const r = await _api(url)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()

    // Rebuild ID map from server data
    for (const plant of data.plants || []) {
      if (plant.client_id) _idMap[plant.client_id] = plant.id
    }
    for (const ev of data.events || []) {
      if (ev.client_id) _idMap[`ev_${ev.client_id}`] = ev.id
    }
    _saveIdMap()

    _lastSync = data.server_time
    localStorage.setItem(LS_LAST_SYNC, _lastSync)

    // Notify monolith
    window.dispatchEvent(new CustomEvent('cca-server-pull', { detail: data }))
    _emit(_queue.length ? 'pending' : 'synced')
  } catch (err) {
    console.error('[server-sync] pull failed', err)
    _emit('error')
  }
}

// ── Bulk import (migration initiale) ─────────────────────────────────────────

export async function bulkImportLocalData(strategy = 'skip_existing') {
  const t = _token()
  if (!t) throw new Error('Not authenticated')

  const plants = _getAllLocalPlants()

  let lang = 'fr'
  try { lang = JSON.parse(localStorage.getItem('agrumes_cfg') || '{}').lang || 'fr' } catch {}

  const cleanPlants = plants.map(p => ({
    id:               p.id,
    scientific_name:  p.species || p.name || 'Citrus spp.',
    common_name:      p.name   || null,
    variety:          p.variety || null,
    rootstock:        p.rootstock || null,
    acquisition_date: p.acquisitionDate || p.plantingDate || null,
    notes:            p.notes || null,
    photo_urls:       p.photos || [],
    metadata:         { cultureType: p.cultureType, location: p.location, status: p.status }
  }))

  const events = plants.flatMap(p =>
    (p.events || []).map(e => ({
      id:         e.id,
      event_type: _mapEventType(e.type),
      event_date: e.date,
      notes:      e.description || null,
      metadata:   e
    }))
  )

  const r = await fetch('/api/user/sync/bulk-import', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body:    JSON.stringify({ plants: cleanPlants, events, settings: { language: lang }, strategy })
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ── Topbar indicator ──────────────────────────────────────────────────────────

function _injectTopbarButton() {
  if (document.getElementById('cca-sync-btn')) return

  const btn = document.createElement('button')
  btn.id = 'cca-sync-btn'
  btn.className = 'cca-sync-btn'
  btn.setAttribute('aria-label', 'Synchronisation serveur')
  btn.innerHTML = '<span class="cca-sync-dot" data-status="idle"></span><span class="cca-sync-label"></span>'
  // Inject into body (fixed-position) to avoid topbar overflow:hidden clipping
  document.body.appendChild(btn)

  btn.addEventListener('click', () => syncNow())

  window.addEventListener('cca-sync-status', e => {
    const dot   = document.getElementById('cca-sync-btn')?.querySelector('.cca-sync-dot')
    const label = document.getElementById('cca-sync-btn')?.querySelector('.cca-sync-label')
    if (!dot || !label) return
    dot.setAttribute('data-status', e.detail.status)
    const T = window.T
    const n = e.detail.queue_length || 0
    label.textContent = {
      idle:    '',
      synced:  T?.('sync.status.synced')  || 'Synchronisé',
      pending: T?.('sync.status.pending') ? T('sync.status.pending').replace('{n}', n) : `${n} en attente`,
      syncing: T?.('sync.status.syncing') || 'Sync…',
      error:   T?.('sync.status.error')   || 'Erreur sync'
    }[e.detail.status] || ''
  })
}

// ── Expose on window ──────────────────────────────────────────────────────────

window.__CCA_ServerSync = {
  init, enqueueChange, syncNow, getSyncStatus,
  pullFromServer, bulkImportLocalData, _onPlantsChanged
}
