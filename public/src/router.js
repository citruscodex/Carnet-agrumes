const routes = {}
let currentView = null
let mainContainer = null

export function initRouter(container) {
  mainContainer = container
  window.addEventListener('popstate', () => navigate(location.hash.slice(1) || 'dashboard'))
  window.addEventListener('cca-navigate', (e) => navigate(e.detail.view, e.detail))
}

export function registerRoute(name, loader) {
  routes[name] = loader
}

export async function navigate(view, params = {}) {
  if (!routes[view]) {
    console.error(`[router] Route inconnue: ${view}`)
    return
  }

  currentView = view
  location.hash = view

  try {
    mainContainer.innerHTML = '<div class="cca-loading">Chargement...</div>'
    const module = await routes[view]()
    if (currentView !== view) return
    if (module.render) {
      await module.render(mainContainer, params)
    } else if (module.default) {
      await module.default(mainContainer, params)
    }
  } catch (err) {
    console.error(`[router] Erreur chargement vue ${view}:`, err)
    mainContainer.innerHTML = `<div class="cca-error-state">Erreur de chargement</div>`
  }
}

export function getCurrentView() { return currentView }
