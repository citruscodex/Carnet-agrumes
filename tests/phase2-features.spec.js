// @ts-check
import { test, expect } from 'playwright/test'

const BASE = 'http://localhost:5173'

const MOCK_PLANTS = [
  {
    id: 'plant-f1', name: 'Citrus limon Sync Test', species: 'Citrus limon',
    accessionId: '2024-0001', datePrecision: 'month', cultureType: 'pot',
    provenanceType: 'achat', provenanceMode: 'pepiniere', productionType: 'greffe',
    acquisitionDate: '2023-05-15', photos: [], events: [],
    locationData: { zone: 'Serre A', section: 'Étagère 2', position: 'Pot 5', lat: null, lng: null },
    location: 'Serre A', status: 'bon'
  },
  {
    id: 'plant-f2', name: 'Yuzu intérieur', species: 'Citrus junos',
    accessionId: '2024-0002', datePrecision: 'full', cultureType: 'pot',
    provenanceType: 'don', provenanceMode: 'particulier', productionType: 'greffe',
    acquisitionDate: '2022-03-10',
    photos: [{ url: '/img/yuzu.jpg', id: 'ph1', date: '2022-03-10', caption: '' }],
    events: [],
    locationData: { zone: 'Intérieur', section: '', position: '', lat: null, lng: null },
    location: 'Intérieur', status: 'bon'
  },
  {
    id: 'plant-f3', name: 'Mandarine extérieure', species: 'Citrus reticulata',
    accessionId: null, datePrecision: 'year', cultureType: 'pot',
    provenanceType: 'semis', provenanceMode: 'particulier', productionType: 'semis',
    acquisitionDate: '2024-01-01', photos: [], events: [],
    locationData: { zone: 'Extérieur', section: '', position: '', lat: null, lng: null },
    location: 'Extérieur', status: 'attention'
  }
]

async function _gotoCollection(page) {
  await page.addInitScript(plants => {
    localStorage.setItem('agrumes_v5', JSON.stringify(plants))
    localStorage.setItem('agrumes_cfg', JSON.stringify({ lang: 'fr', profileType: 'collectionneur' }))
    // Marquer la migration comme terminée pour éviter l'overlay
    localStorage.setItem('agrumes_migrated_to_server', 'true')
    // Effacer les filtres persistés pour repartir propre
    localStorage.removeItem('agrumes_coll_filters')
  }, MOCK_PLANTS)
  await page.goto(BASE)
  // L'app démarre sur dashboard — naviguer vers collection
  await page.click('#nv-collection')
  await page.waitForSelector('.pcard', { timeout: 8000 })
  // Attendre que le module collection-filters soit chargé et monté
  await page.waitForSelector('#cca-filters-panel', { timeout: 8000 })
}

test.describe('Phase 2 — Features F1/F2/F3/F9/F5', () => {

  test('T1 F9 — badges emplacement section/position sur les cartes', async ({ page }) => {
    await _gotoCollection(page)
    // plant-f1 a section "Étagère 2" et position "Pot 5" → doit afficher des chips
    const badges = page.locator('.cca-location-chip')
    const count = await badges.count()
    expect(count).toBeGreaterThan(0)
    await expect(badges.first()).toBeVisible()
  })

  test('T2 F9 — section emplacement affichée dans la fiche plante', async ({ page }) => {
    await _gotoCollection(page)
    // Ouvrir la fiche de la première plante (plant-f1 avec section + position)
    await page.locator('.pcard').first().click()
    await page.waitForSelector('.cca-location-section', { timeout: 5000 })

    const section = page.locator('.cca-location-section')
    await expect(section).toBeVisible()
    await expect(section).toContainText('Serre A')
    await expect(section).toContainText('Étagère 2')
    await expect(section).toContainText('Pot 5')
  })

  test('T3 F5 — panneau filtres visible avec son titre', async ({ page }) => {
    await _gotoCollection(page)
    await expect(page.locator('#cca-filters-panel')).toBeVisible()
    // Le titre peut être en FR ou EN selon la langue du navigateur de test
    const titleText = await page.locator('.cca-filters-title').textContent()
    expect(titleText?.trim().length).toBeGreaterThan(0)
  })

  test('T4 F5 — filtre texte réduit les résultats', async ({ page }) => {
    await _gotoCollection(page)

    // Ouvrir le panneau pour accéder aux champs
    await page.locator('#cca-filters-header').click()
    await page.waitForSelector('#cca-filters-body', { timeout: 3000 })

    const totalBefore = await page.locator('.pcard').count()
    expect(totalBefore).toBe(3)

    await page.fill('[data-ccaf="search"]', 'limon')
    await page.waitForTimeout(400)

    const totalAfter = await page.locator('.pcard').count()
    expect(totalAfter).toBe(1)
    await expect(page.locator('.pcard')).toContainText('Citrus limon Sync Test')
  })

  test('T5 F5 — reset filtres restaure toute la collection', async ({ page }) => {
    await _gotoCollection(page)

    await page.locator('#cca-filters-header').click()
    await page.waitForSelector('#cca-filters-body', { timeout: 3000 })

    // Filtrer par quelque chose d'inexistant
    await page.fill('[data-ccaf="search"]', 'xyz_inexistant_zzz')
    await page.waitForTimeout(400)
    expect(await page.locator('.pcard').count()).toBe(0)

    // Reset
    await page.locator('#cca-filters-reset').click()
    await page.waitForTimeout(400)

    expect(await page.locator('.pcard').count()).toBe(3)
    // Badge doit avoir disparu
    expect(await page.locator('.cca-filters-badge').count()).toBe(0)
  })

})
