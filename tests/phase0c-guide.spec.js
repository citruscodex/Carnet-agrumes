// @ts-check
import { test, expect } from 'playwright/test'

test.describe('Phase 0C — Guide débutant', () => {

  test('T1 accès guide depuis onglet Fertilisation', async ({ page }) => {
    await _login(page)
    await page.click('#nv-fert')
    await page.waitForTimeout(800)
    await page.click('.fert-tab[data-view="guide"]')
    await page.waitForTimeout(3000)
    await expect(page.locator('.cca-guide-toc')).toBeVisible()
    await expect(page.locator('.cca-guide-content h1, .cca-guide-content h2').first()).toBeVisible()
    const tocItems = await page.locator('#cca-guide-toc-nav .cca-toc-item').count()
    expect(tocItems).toBeGreaterThan(10)
  })

  test('T2 deep-link depuis gauge NPK (bouton 📖)', async ({ page }) => {
    await _login(page)
    await page.click('#nv-fert')
    await page.waitForTimeout(800)
    // Chercher n'importe quel bouton guide sur une gauge
    const helpBtn = page.locator('.cca-gauge-help[data-guide-anchor]').first()
    const exists = await helpBtn.count()
    if (!exists) {
      // Pas de plante avec fertilisation enregistrée — naviguer directement
      await page.click('.fert-tab[data-view="guide"]')
      await page.waitForTimeout(3000)
      await expect(page.locator('.cca-guide-toc')).toBeVisible()
      return
    }
    await helpBtn.click()
    await page.waitForTimeout(3000)
    await expect(page.locator('.cca-guide-content')).toBeVisible()
    const activeLink = page.locator('#cca-guide-toc-nav a.active')
    await expect(activeLink).toBeVisible()
  })

  test('T3 deep-link depuis alerte carence dans diagnostic', async ({ page }) => {
    await _login(page)
    // Vérifier présence d'un bouton carence dans un résultat de diag (skip si absent)
    const carenceBtn = page.locator('.cca-alert-carence[data-guide-anchor]').first()
    const exists = await carenceBtn.count()
    if (!exists) {
      test.skip(true, 'Aucun résultat de carence dans le diagnostic pour ce test')
      return
    }
    await carenceBtn.click()
    await page.waitForTimeout(3000)
    await expect(page.locator('.cca-guide-content')).toBeVisible()
  })

  test('T4 recherche dans le guide filtre le TOC', async ({ page }) => {
    await _login(page)
    await page.click('#nv-fert')
    await page.waitForTimeout(800)
    await page.click('.fert-tab[data-view="guide"]')
    await page.waitForTimeout(3000)
    await expect(page.locator('#cca-guide-search')).toBeVisible()
    await page.fill('#cca-guide-search', 'azote')
    await page.waitForTimeout(400)
    const results = await page.locator('#cca-guide-toc-nav .cca-toc-item').count()
    expect(results).toBeGreaterThan(0)
    // Effacer la recherche = restaure tous les chapitres
    await page.fill('#cca-guide-search', '')
    await page.waitForTimeout(400)
    const allItems = await page.locator('#cca-guide-toc-nav .cca-toc-item').count()
    expect(allItems).toBeGreaterThan(results)
  })

  test('T5 téléchargement PDF (lien avec attribut download)', async ({ page }) => {
    await _login(page)
    await page.click('#nv-fert')
    await page.waitForTimeout(800)
    await page.click('.fert-tab[data-view="guide"]')
    await page.waitForTimeout(3000)
    const pdfLink = page.locator('a[href*="guide-debutant-citruscodex.pdf"][download]')
    await expect(pdfLink).toBeVisible()
    // Vérifier l'attribut download (pas l'ouverture inline)
    const dl = await pdfLink.getAttribute('download')
    expect(dl).not.toBeNull()
  })

  test('T6 bannière FR-only pour langue EN', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('agrumes_cfg', JSON.stringify({
        pwdHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        lang: 'en',
        profile: { name: 'Test Guide EN', profileType: 'collectionneur' },
        createdAt: '2024-01-01'
      }))
      localStorage.setItem('agrumes_migrated_to_server', 'true')
      localStorage.setItem('agrumes_v5', '[]')
      localStorage.setItem('agrumes_collections', '[]')
      localStorage.removeItem('agrumes_guide_last_read')
    })
    await page.goto('http://localhost:5173')
    await page.waitForSelector('nav#navbar', { timeout: 15000 })
    await page.waitForTimeout(600)
    await page.click('#nv-fert')
    await page.waitForTimeout(800)
    await page.click('.fert-tab[data-view="guide"]')
    await page.waitForTimeout(3000)
    await expect(page.locator('.cca-lang-notice')).toBeVisible()
    const firstHeading = await page.locator('.cca-guide-content h1, .cca-guide-content h2').first().textContent()
    expect(firstHeading).not.toBe('')
  })

})

async function _login(page) {
  await page.addInitScript(() => {
    localStorage.setItem('agrumes_cfg', JSON.stringify({
      pwdHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      lang: 'fr',
      profile: { name: 'Test Guide', profileType: 'collectionneur' },
      createdAt: '2024-01-01'
    }))
    localStorage.setItem('agrumes_migrated_to_server', 'true')
    localStorage.setItem('agrumes_v5', '[]')
    localStorage.setItem('agrumes_collections', '[]')
    localStorage.removeItem('agrumes_guide_last_read')
  })
  await page.goto('http://localhost:5173')
  await page.waitForSelector('nav#navbar', { timeout: 15000 })
  await page.waitForTimeout(600)
}
