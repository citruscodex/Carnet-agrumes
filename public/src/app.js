import { initRouter, registerRoute, navigate } from './router.js'

registerRoute('dashboard',     () => import('./modules/dashboard.js'))
registerRoute('collection',    () => import('./modules/collection.js'))
registerRoute('plant',         () => import('./modules/plant-detail.js'))
registerRoute('plant-add',     () => import('./modules/plant-form.js'))
registerRoute('plant-edit',    () => import('./modules/plant-form.js'))
registerRoute('fertilization', () => import('./modules/fertilization.js'))
registerRoute('calendar',      () => import('./modules/calendar.js'))
registerRoute('community',     () => import('./modules/community.js'))
registerRoute('settings',      () => import('./modules/settings.js'))
registerRoute('profile',       () => import('./modules/profile.js'))
registerRoute('admin',         () => import('./modules/admin-panel.js'))
registerRoute('login',         () => import('./modules/login.js'))
registerRoute('register',      () => import('./modules/register.js'))

export async function launchApp() {
  const mainContainer = document.getElementById('main-content')
  if (!mainContainer) return

  initRouter(mainContainer)

  try {
    const { initServerSync } = await import('./modules/server-sync.js')
    await initServerSync()
  } catch (err) {
    console.warn('[app] server-sync load failed', err)
  }

  try {
    const { migrateWikiV1IfNeeded } = await import('./modules/wiki-v1-migration.js')
    migrateWikiV1IfNeeded()
  } catch {}

  const hash = location.hash.slice(1) || 'dashboard'
  navigate(hash)
}
