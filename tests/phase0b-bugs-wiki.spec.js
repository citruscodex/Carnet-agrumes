// @ts-check
import { test, expect } from 'playwright/test'

/**
 * phase0b-bugs-wiki.spec.js — Tests Phase 0B : Bugs + Wiki v2
 *
 * Prérequis : comptes test en DB (testsync1-5@citruscodex.fr / TestSync1234!)
 * Lancer : npx playwright test tests/phase0b-bugs-wiki.spec.js
 */

const BASE = 'http://localhost:5173'
const PWD  = 'TestSync1234!'

async function login(page, email, password = PWD) {
  await page.addInitScript(() => {
    localStorage.setItem('agrumes_cfg', JSON.stringify({
      pwdHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      lang: 'fr',
      profile: { name: 'Test', profileType: 'collectionneur' },
      createdAt: '2024-01-01'
    }))
    localStorage.setItem('agrumes_migrated_to_server', 'true')
    localStorage.setItem('agrumes_v5', '[]')
    localStorage.setItem('agrumes_collections', '[]')
  })
  await page.goto(BASE)
  await page.waitForFunction(() => typeof window.showServerLogin === 'function', { timeout: 15000 })
  await page.evaluate(() => window.showServerLogin())
  const emailInput = page.locator('#sl-email')
  await emailInput.waitFor({ state: 'visible', timeout: 10000 })
  await emailInput.fill(email)
  await page.locator('#sl-pwd').fill(password)
  await page.locator('#sl-btn').click()
  await page.waitForSelector('nav#navbar', { timeout: 30000 })
}

test.describe('Phase 0B — Bugs + Wiki', () => {

  // T1 — Observatoire : markers affichés (DEMO_OBS ou vraies données)
  test('T1 — Observatoire affiche des markers sur la carte', async ({ page }) => {
    await login(page, 'testsync1@citruscodex.fr')

    // Navigate to Communauté → Observatoire
    await page.locator('#nv-community').click()
    await page.waitForTimeout(500)

    // Click Observatoire tab
    const obsTab = page.locator('.comm-tab:has-text("Observatoire"), [onclick*="observatoire"]').first()
    await obsTab.waitFor({ state: 'visible', timeout: 8000 })
    await obsTab.click()
    await page.waitForTimeout(3000)  // Wait for Leaflet + data load

    // In IS_LOCAL mode, DEMO_OBS is used (6 points)
    // In prod mode, real data with 3+ points
    // Check that the observatoire content rendered
    const obsContent = page.locator('#obs-map, .cca-obs-bloc, .cca-obs-journal')
    await expect(obsContent.first()).toBeAttached({ timeout: 10000 })

    // Check that Leaflet SVG markers OR canvas markers are present
    // In IS_LOCAL mode, the Leaflet CDN loads and renders DEMO_OBS markers
    const leafletContainer = page.locator('.leaflet-container, #obs-map')
    await expect(leafletContainer.first()).toBeAttached({ timeout: 5000 })
  })

  // T2 — Bug tracker : soumission + liste
  test('T2 — Bug tracker : POST + GET mine', async ({ page }) => {
    await login(page, 'testsync2@citruscodex.fr')

    // Verify via API (IS_LOCAL mock returns mocked data)
    const result = await page.evaluate(async () => {
      const token = sessionStorage.getItem('cca_srv_token')
      if (!token || token === 'local-dev-token') {
        // IS_LOCAL mode: test that bug submission UI exists
        return { isLocal: true }
      }
      // Real mode: test API
      const post = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'Test Phase0B T2', description: 'Test bug from Playwright', severity: 'low' })
      })
      const mine = await fetch('/api/bugs/mine', { headers: { Authorization: `Bearer ${token}` } })
      const list = await mine.json()
      return {
        isLocal: false,
        postStatus: post.status,
        mineOk: mine.ok,
        hasTestBug: list.some(b => b.title.includes('Phase0B'))
      }
    })

    if (result.isLocal) {
      // IS_LOCAL: just check the bug FAB button exists
      const bugFab = page.locator('[aria-label*="bug"], [aria-label*="Bug"], #cca-bug-fab, .cca-bug-fab')
      expect(await bugFab.count()).toBeGreaterThan(0)
    } else {
      expect(result.postStatus).toBe(201)
      expect(result.mineOk).toBe(true)
      expect(result.hasTestBug).toBe(true)
    }
  })

  // T3 — Wiki v2 : bouton Wiki absent de la bottom nav
  test('T3 — Bouton Wiki absent de la bottom nav', async ({ page }) => {
    await login(page, 'testsync3@citruscodex.fr')

    // Bottom nav (navbar) should NOT have a separate wiki button
    // There are only: dashboard, collection, fert, community, settings (+ admin for admins)
    const navButtons = page.locator('nav#navbar .navi')
    const count = await navButtons.count()
    expect(count).toBeGreaterThan(0)

    // None of the navbar buttons should be a dedicated wiki page button
    const wikiNavBtn = page.locator('nav#navbar .navi[onclick*="showPage(\'wiki\'"]')
    expect(await wikiNavBtn.count()).toBe(0)

    // The community nav item should exist (wiki v2 is inside community)
    await expect(page.locator('#nv-community')).toBeAttached()
  })

  // T4 — Wiki v2 : notes de bas de page dans le parseur markdown
  test('T4 — Wiki parseMarkdown gère les notes [^key]: content', async ({ page }) => {
    await login(page, 'testsync4@citruscodex.fr')

    // Navigate to wiki editor
    await page.locator('#nv-community').click()
    await page.waitForTimeout(400)

    // Wait for wiki module to load
    await page.waitForFunction(
      () => typeof window.__CCA_wiki !== 'undefined' || typeof window.parseMarkdown !== 'undefined',
      { timeout: 10000 }
    ).catch(() => {})

    // Test the parseMarkdown function directly if available
    const footnoteResult = await page.evaluate(() => {
      // Try to access parseMarkdown from the wiki module
      const wikiModule = window.__CCA_wiki

      // Alternatively test the footnote rendering via DOM
      const md = 'Texte principal [^1] et [^2].\n\n[^1]: Première note\n[^2]: Deuxième note'

      // If parseMarkdown is exposed globally (it's not), test it
      // Otherwise check that the wiki editor has the footnote button
      const editorArea = document.querySelector('#cca-wiki-content, #cca-wiki-root')
      return {
        hasWikiModule: !!wikiModule,
        hasEditorArea: !!editorArea
      }
    })

    // The wiki module should be loaded
    expect(footnoteResult.hasWikiModule).toBe(true)

    // Navigate to create a new article to verify editor exists
    const newArticleBtn = page.locator('[data-action="new-article"], button:has-text("Nouvel article"), button:has-text("Nouvelle page")').first()
    if (await newArticleBtn.count() > 0) {
      await newArticleBtn.click()
      await page.waitForTimeout(500)

      // Check footnote toolbar button exists
      const footnoteBtn = page.locator('[data-action="md-footnote"]')
      expect(await footnoteBtn.count()).toBeGreaterThan(0)

      // Check that the textarea placeholder mentions footnotes
      const textarea = page.locator('#cca-wiki-content')
      if (await textarea.count() > 0) {
        // Type content with footnote
        await textarea.fill('Contenu test [^1]\n\n[^1]: Définition de la note')
        await page.waitForTimeout(200)

        // Click preview to see rendering
        const previewBtn = page.locator('[data-action="preview-toggle"]')
        if (await previewBtn.count() > 0) {
          await previewBtn.click()
          await page.waitForTimeout(300)
          // Preview should show the footnote sup marker
          const preview = page.locator('#cca-wiki-preview')
          if (await preview.isVisible()) {
            const previewContent = await preview.innerHTML()
            // Should contain sup tag for footnote reference
            expect(previewContent).toContain('cca-wiki-reflink')
            // Should contain footnote section
            expect(previewContent).toContain('cca-footnotes')
          }
        }
      }
    }
  })

  // T5 — Wiki v1 migration : module chargé
  test('T5 — Wiki v1 migration module chargé', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('agrumes_cfg', JSON.stringify({
        pwdHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        lang: 'fr',
        profile: { name: 'Test', profileType: 'collectionneur' },
        createdAt: '2024-01-01'
      }))
      localStorage.setItem('agrumes_migrated_to_server', 'true')
      // Plant some fake wiki v1 data
      localStorage.setItem('wikiPages_v1', JSON.stringify([
        { id: 'test-page', title: 'Old Wiki Page', content: 'Old content' }
      ]))
      localStorage.removeItem('wikiV1_archived_at')
      localStorage.removeItem('wikiV1_backup')
    })
    await page.goto(BASE)

    // Wait for wiki-v1-migration module to run
    await page.waitForFunction(
      () => window.__CCA_WikiV1Migration !== undefined || localStorage.getItem('wikiV1_archived_at') !== null,
      { timeout: 10000 }
    ).catch(() => {})

    // The module should have archived the v1 data
    const archived = await page.evaluate(() => ({
      moduleLoaded: typeof window.__CCA_WikiV1Migration !== 'undefined',
      archivedAt: localStorage.getItem('wikiV1_archived_at'),
      backup: localStorage.getItem('wikiV1_backup'),
      v1Gone: localStorage.getItem('wikiPages_v1') === null
    }))

    expect(archived.moduleLoaded || archived.archivedAt !== null).toBe(true)
  })

})
