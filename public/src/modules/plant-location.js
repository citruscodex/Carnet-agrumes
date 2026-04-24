import { esc } from '../lib/esc.js'

const _CSS_ID = 'cca-location-css'

function _injectCSS() {
  if (document.getElementById(_CSS_ID)) return
  const s = document.createElement('style')
  s.id = _CSS_ID
  s.textContent = `
.cca-location-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.cca-location-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: .72rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(45,90,61,.08);
  color: var(--text-accent, #2e7d32);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.cca-location-chip--section {
  background: rgba(45,90,61,.05);
  color: var(--muted, #888);
}
.cca-location-chip--position {
  background: rgba(45,90,61,.04);
  color: var(--muted, #888);
}
.cca-location-section {
  background: var(--surface, #fff);
  border-left: 3px solid rgba(45,90,61,.3);
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  margin: 4px 0;
}
.cca-location-section-title {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--muted, #888);
  margin-bottom: 6px;
}
.cca-location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .8rem;
  margin-bottom: 3px;
}
.cca-location-row-lbl {
  color: var(--muted, #888);
  min-width: 64px;
  font-size: .75rem;
}
`
  document.head.appendChild(s)
}

function _t(key) {
  return typeof window.T === 'function' ? window.T(key) : key
}

// Compact badges for card/list views — only shows section/position if set
export function renderEmplacementBadges(plant) {
  const section  = plant.locationData?.section  || ''
  const position = plant.locationData?.position || ''
  if (!section && !position) return ''
  _injectCSS()
  return `<span class="cca-location-display">${
    section  ? `<span class="cca-location-chip cca-location-chip--section" title="${esc(_t('plant.emplacement.section'))}">📌 ${esc(section)}</span>` : ''
  }${
    position ? `<span class="cca-location-chip cca-location-chip--position" title="${esc(_t('plant.emplacement.position'))}">· ${esc(position)}</span>` : ''
  }</span>`
}

// Full display section for the fiche (read-only summary, distinct from edit fields)
export function renderEmplacementDisplay(plant) {
  const zone     = plant.locationData?.zone     || plant.location || ''
  const section  = plant.locationData?.section  || ''
  const position = plant.locationData?.position || ''
  if (!zone && !section && !position) return ''
  _injectCSS()
  return `<div class="cca-location-section">
  <div class="cca-location-section-title">📍 ${esc(_t('plant.emplacement.title'))}</div>
  ${zone     ? `<div class="cca-location-row"><span class="cca-location-row-lbl">${esc(_t('plant.emplacement.zone'))}</span><span>${esc(zone)}</span></div>` : ''}
  ${section  ? `<div class="cca-location-row"><span class="cca-location-row-lbl">${esc(_t('plant.emplacement.section'))}</span><span>${esc(section)}</span></div>` : ''}
  ${position ? `<div class="cca-location-row"><span class="cca-location-row-lbl">${esc(_t('plant.emplacement.position'))}</span><span>${esc(position)}</span></div>` : ''}
</div>`
}
