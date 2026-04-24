import { esc } from '../lib/esc.js'

const LS_KEY = 'agrumes_coll_filters'
const CSS_ID = 'cca-filters-css'

let _active = {}
let _onFilterChange = null

// ── i18n helper ───────────────────────────────────────────────────────────────

function _t(key) {
  return typeof window.T === 'function' ? window.T(key) : key
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function _injectCSS() {
  if (document.getElementById(CSS_ID)) return
  const s = document.createElement('style')
  s.id = CSS_ID
  s.textContent = `
.cca-filters-panel {
  background: var(--cream2, #f9f5ec);
  border: 1px solid var(--cream3, #e8dfc8);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}
.cca-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 12px;
  cursor: pointer;
  user-select: none;
}
.cca-filters-title {
  font-size: .78rem;
  font-weight: 700;
  color: var(--text-strong, #162d1f);
  display: flex;
  align-items: center;
  gap: 6px;
}
.cca-filters-badge {
  background: var(--text-accent, #2e7d32);
  color: white;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: .7rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}
.cca-filters-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cca-filters-reset {
  font-size: .72rem;
  padding: 2px 8px;
  border: 1px solid rgba(198,40,40,.3);
  border-radius: 5px;
  background: rgba(198,40,40,.06);
  color: #c62828;
  cursor: pointer;
}
.cca-filters-toggle-icon {
  font-size: .7rem;
  color: var(--muted, #888);
  padding: 2px 5px;
}
.cca-filters-body {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--cream3, #e8dfc8);
}
.cca-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.cca-filter-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cca-filter-label {
  font-size: .68rem;
  font-weight: 700;
  color: var(--muted, #888);
  text-transform: uppercase;
  letter-spacing: .05em;
}
.cca-filter-input,
.cca-filter-select {
  padding: 6px 8px;
  border: 1px solid var(--cream3, #e8dfc8);
  border-radius: 6px;
  font-size: .8rem;
  background: var(--white, #fff);
  color: var(--text, #333);
  width: 100%;
  box-sizing: border-box;
}
.cca-filter-input:focus,
.cca-filter-select:focus {
  outline: none;
  border-color: var(--text-accent, #2e7d32);
  box-shadow: 0 0 0 2px rgba(45,90,61,.12);
}
.cca-filter-field--check {
  flex-direction: row;
  align-items: center;
  gap: 7px;
  padding-top: 18px;
}
.cca-filter-label-check {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: .8rem;
  color: var(--text, #333);
}
.cca-filter-label-check input[type=checkbox] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--text-accent, #2e7d32);
}
@media (max-width: 600px) {
  .cca-filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}
`
  document.head.appendChild(s)
}

// ── Persist / restore ─────────────────────────────────────────────────────────

function _save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(_active)) } catch {}
}

function _load() {
  try {
    const s = localStorage.getItem(LS_KEY)
    if (s) _active = JSON.parse(s)
  } catch { _active = {} }
}

// ── Filter definitions ────────────────────────────────────────────────────────

function _defs() {
  return [
    {
      id: 'search',
      label: _t('filters.search'),
      type: 'text',
      placeholder: _t('filters.search_placeholder'),
      test(plant, val) {
        if (!val) return true
        const q = val.toLowerCase()
        return [plant.name, plant.species, plant.variety, plant.accessionId]
          .some(f => (f || '').toLowerCase().includes(q))
      }
    },
    {
      id: 'provenance_type',
      label: _t('filters.provenance_type'),
      type: 'select',
      options: [
        { value: '', label: _t('filters.all') },
        { value: 'achat',    label: _t('plant.provenance.achat') },
        { value: 'don',      label: _t('plant.provenance.don') },
        { value: 'echange',  label: _t('plant.provenance.echange') },
        { value: 'semis',    label: _t('provenanceType.semis') },
        { value: 'bouture',  label: _t('provenanceType.bouture') },
        { value: 'inconnu',  label: _t('filters.all') + ' / ' + _t('provenanceType.inconnu') }
      ],
      test: (plant, val) => !val || (plant.provenanceType || '') === val
    },
    {
      id: 'emplacement_zone',
      label: _t('filters.zone'),
      type: 'text',
      placeholder: _t('filters.zone_placeholder'),
      test(plant, val) {
        if (!val) return true
        const zone = plant.locationData?.zone || plant.location || ''
        return zone.toLowerCase().includes(val.toLowerCase())
      }
    },
    {
      id: 'has_photo',
      label: _t('filters.has_photo'),
      type: 'boolean',
      test: (plant, val) => !val || (plant.photos || []).length > 0
    },
    {
      id: 'acquisition_year',
      label: _t('filters.acquisition_year'),
      type: 'year',
      placeholder: 'ex: 2023',
      test(plant, val) {
        if (!val) return true
        const d = plant.acquisitionDate || plant.plantingDate
        if (!d) return false
        return new Date(d).getFullYear() === Number(val)
      }
    },
    {
      id: 'production_type',
      label: _t('filters.production_type'),
      type: 'select',
      options: [
        { value: '', label: _t('filters.all') },
        { value: 'greffe',   label: _t('productionType.greffe') },
        { value: 'marcotte', label: _t('plant.production.marcotte') },
        { value: 'semis',    label: _t('provenanceType.semis') },
        { value: 'bouture',  label: _t('provenanceType.bouture') },
        { value: 'inconnu',  label: _t('productionType.inconnu') }
      ],
      test: (plant, val) => !val || (plant.productionType || '') === val
    }
  ]
}

// ── Render helpers ────────────────────────────────────────────────────────────

function _renderField(def) {
  const val = _active[def.id]

  if (def.type === 'text' || def.type === 'year') {
    return `<div class="cca-filter-field">
  <label class="cca-filter-label" for="ccaf-${esc(def.id)}">${esc(def.label)}</label>
  <input
    type="${def.type === 'year' ? 'number' : 'text'}"
    id="ccaf-${esc(def.id)}"
    class="cca-filter-input"
    data-ccaf="${esc(def.id)}"
    value="${esc(String(val || ''))}"
    placeholder="${esc(def.placeholder || '')}"
    ${def.type === 'year' ? 'min="1900" max="2099" step="1"' : ''}
  />
</div>`
  }

  if (def.type === 'select') {
    return `<div class="cca-filter-field">
  <label class="cca-filter-label" for="ccaf-${esc(def.id)}">${esc(def.label)}</label>
  <select id="ccaf-${esc(def.id)}" class="cca-filter-select" data-ccaf="${esc(def.id)}">
    ${def.options.map(o =>
      `<option value="${esc(o.value)}"${val === o.value ? ' selected' : ''}>${esc(o.label)}</option>`
    ).join('')}
  </select>
</div>`
  }

  if (def.type === 'boolean') {
    return `<div class="cca-filter-field cca-filter-field--check">
  <label class="cca-filter-label-check" for="ccaf-${esc(def.id)}">
    <input
      type="checkbox"
      id="ccaf-${esc(def.id)}"
      data-ccaf="${esc(def.id)}"
      ${val ? 'checked' : ''}
    />
    ${esc(def.label)}
  </label>
</div>`
  }

  return ''
}

function _renderPanel(open) {
  const defs = _defs()
  const activeCount = defs.filter(d => {
    const v = _active[d.id]
    return v !== undefined && v !== '' && v !== false && v !== null
  }).length

  return `<div class="cca-filters-panel" id="cca-filters-panel">
  <div class="cca-filters-header" id="cca-filters-header">
    <span class="cca-filters-title">
      🔍 ${esc(_t('filters.title'))}
      ${activeCount > 0 ? `<span class="cca-filters-badge">${activeCount}</span>` : ''}
    </span>
    <div class="cca-filters-actions">
      ${activeCount > 0 ? `<button class="cca-filters-reset" id="cca-filters-reset">${esc(_t('filters.reset'))}</button>` : ''}
      <span class="cca-filters-toggle-icon" id="cca-filters-arrow">${open ? '▲' : '▼'}</span>
    </div>
  </div>
  ${open ? `<div class="cca-filters-body" id="cca-filters-body">
    <div class="cca-filters-grid">
      ${defs.map(_renderField).join('')}
    </div>
  </div>` : ''}
</div>`
}

// ── Mount ─────────────────────────────────────────────────────────────────────

let _open = false

export function mount(container, onFilterChange, _plants) {
  if (!container) return
  _injectCSS()
  _load()
  _onFilterChange = onFilterChange
  container.innerHTML = _renderPanel(_open)
  _attachListeners(container)
}

function _attachListeners(container) {
  container.querySelector('#cca-filters-header')?.addEventListener('click', e => {
    if (e.target.closest('#cca-filters-reset')) return
    _open = !_open
    container.innerHTML = _renderPanel(_open)
    _attachListeners(container)
  })

  container.querySelector('#cca-filters-reset')?.addEventListener('click', e => {
    e.stopPropagation()
    _active = {}
    _save()
    container.innerHTML = _renderPanel(_open)
    _attachListeners(container)
    _onFilterChange?.()
  })

  container.querySelectorAll('[data-ccaf]').forEach(el => {
    const id = el.getAttribute('data-ccaf')
    const ev = el.type === 'checkbox' ? 'change' : 'input'
    el.addEventListener(ev, () => {
      const val = el.type === 'checkbox' ? el.checked : el.value
      if (val === '' || val === false) {
        delete _active[id]
      } else {
        _active[id] = val
      }
      _save()
      _refreshBadge(container)
      _onFilterChange?.()
    })
  })
}

function _refreshBadge(container) {
  const defs = _defs()
  const n = defs.filter(d => {
    const v = _active[d.id]
    return v !== undefined && v !== '' && v !== false && v !== null
  }).length
  const titleEl = container.querySelector('.cca-filters-title')
  if (!titleEl) return
  const existing = titleEl.querySelector('.cca-filters-badge')
  if (n > 0) {
    if (existing) { existing.textContent = n } else {
      const b = document.createElement('span')
      b.className = 'cca-filters-badge'
      b.textContent = n
      titleEl.appendChild(b)
    }
  } else {
    existing?.remove()
  }
  const resetBtn = container.querySelector('#cca-filters-reset')
  if (n > 0 && !resetBtn) {
    const actions = container.querySelector('.cca-filters-actions')
    if (actions) {
      const btn = document.createElement('button')
      btn.className = 'cca-filters-reset'
      btn.id = 'cca-filters-reset'
      btn.textContent = _t('filters.reset')
      btn.addEventListener('click', e => {
        e.stopPropagation()
        _active = {}
        _save()
        container.innerHTML = _renderPanel(_open)
        _attachListeners(container)
        _onFilterChange?.()
      })
      actions.insertBefore(btn, actions.firstChild)
    }
  } else if (n === 0 && resetBtn) {
    resetBtn.remove()
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function applyFilters(plants) {
  const defs = _defs()
  return plants.filter(plant =>
    defs.every(def => {
      const val = _active[def.id]
      if (val === undefined || val === '' || val === null || val === false) return true
      return def.test(plant, val)
    })
  )
}

export function getActiveFiltersCount() {
  return _defs().filter(d => {
    const v = _active[d.id]
    return v !== undefined && v !== '' && v !== false && v !== null
  }).length
}

export function resetFilters() {
  _active = {}
  _save()
}

export function initFilters() {
  _load()
}
