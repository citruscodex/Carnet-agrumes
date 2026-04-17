/**
 * wiki-v1-migration.js — Archive et purge du wiki localStorage v1 (solo, non partagé)
 * Le wiki v2 (PostgreSQL, collaboratif) remplace entièrement le v1.
 */

const LS_V1_KEYS     = ['wikiPages_v1', 'agrumes_wikiPages', 'cca_wiki_pages']
const LS_BACKUP      = 'wikiV1_backup'
const LS_ARCHIVED_AT = 'wikiV1_archived_at'
const PURGE_DAYS     = 30

export function migrateWikiV1IfNeeded() {
  _maybePurgeOldBackup()

  if (localStorage.getItem(LS_ARCHIVED_AT)) return  // Already processed

  const v1Raw = LS_V1_KEYS.map(k => localStorage.getItem(k)).find(v => v !== null)
  if (!v1Raw) {
    // No v1 data — mark as done immediately
    localStorage.setItem(LS_ARCHIVED_AT, new Date().toISOString())
    return
  }

  try {
    const pages = JSON.parse(v1Raw)
    const backup = {
      archived_at: new Date().toISOString(),
      pages,
      note: 'Archive wiki v1 (local, solo). Le wiki collaboratif en ligne est dans Communauté → Citrus Wiki.'
    }
    localStorage.setItem(LS_BACKUP, JSON.stringify(backup))
    localStorage.setItem(LS_ARCHIVED_AT, backup.archived_at)
    LS_V1_KEYS.forEach(k => localStorage.removeItem(k))
    console.log('[wiki-v1] Archivé', Array.isArray(pages) ? pages.length : 0, 'pages locales → wikiV1_backup. Purge dans 30 jours.')
  } catch (err) {
    console.error('[wiki-v1] Archivage échoué', err)
  }
}

function _maybePurgeOldBackup() {
  try {
    const raw = localStorage.getItem(LS_BACKUP)
    if (!raw) return
    const backup = JSON.parse(raw)
    if (!backup.archived_at) return
    const ageDays = (Date.now() - new Date(backup.archived_at).getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > PURGE_DAYS) {
      localStorage.removeItem(LS_BACKUP)
      console.log('[wiki-v1] Backup purgé après 30 jours.')
    }
  } catch {}
}

export function hasWikiV1Backup() {
  return !!localStorage.getItem(LS_BACKUP)
}

export function downloadWikiV1Backup() {
  const raw = localStorage.getItem(LS_BACKUP)
  if (!raw) return
  const backup = JSON.parse(raw)
  const daysLeft = Math.ceil(
    (PURGE_DAYS * 24 * 3600 * 1000 - (Date.now() - new Date(backup.archived_at).getTime())) / (1000 * 60 * 60 * 24)
  )
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `citruscodex_wikiV1_archive_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return daysLeft
}

// Delegated click handler for the backup download button in settings
document.addEventListener('click', e => {
  if (e.target.id === 'btn-dl-wikiv1-backup' || e.target.closest('#btn-dl-wikiv1-backup')) {
    downloadWikiV1Backup()
  }
})

window.__CCA_WikiV1Migration = { migrateWikiV1IfNeeded, hasWikiV1Backup, downloadWikiV1Backup }
