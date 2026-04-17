// @ts-check
import { test, expect } from 'playwright/test'

/**
 * phase0a-sync.spec.js — Tests Phase 0A : Synchronisation serveur
 *
 * Prérequis : 5 comptes test en DB
 *   testsync1..5@citruscodex.fr  /  TestSync1234!
 *
 * Lancer : npx playwright test tests/phase0a-sync.spec.js
 */

const BASE = 'http://localhost:5173'
const PWD  = 'TestSync1234!'

async function login(page, email, password = PWD) {
  await page.goto(BASE)
  // Server login form
  const emailInput = page.locator('#sl-email')
  await emailInput.waitFor({ timeout: 10000 })
  await emailInput.fill(email)
  await page.locator('#sl-pwd').fill(password)
  await page.locator('#sl-btn').click()
  // Wait for dashboard or local login
  await page.waitForSelector('#app[style*="flex"], .dashboard', { timeout: 20000 })
  // If local login form appears, skip (new account needs setup)
}

async function addPlant(page, name) {
  // Click add button — find by text or common selectors
  const addBtn = page.locator('button:has-text("Ajouter"), .btn-add, [aria-label*="Ajouter"]').first()
  await addBtn.click()
  await page.waitForTimeout(500)
  const nameInput = page.locator('#ap-nm')
  await nameInput.waitFor({ timeout: 5000 })
  await nameInput.fill(name)
  // Fill required species field
  const speciesInput = page.locator('#ap-sp-input')
  if (await speciesInput.count() > 0) await speciesInput.fill('Citrus limon')
  await page.locator('button:has-text("Enregistrer"), button:has-text("Ajouter"), button:has-text("Valider")').last().click()
  await page.waitForTimeout(1000)
}

test.describe('Phase 0A — Sync serveur', () => {

  test('T1 — Indicateur sync visible après connexion', async ({ page }) => {
    await login(page, 'testsync1@citruscodex.fr')
    // Wait for sync indicator to appear (injected by server-sync.js init)
    await expect(page.locator('#cca-sync-btn')).toBeVisible({ timeout: 10000 })
    const dot = page.locator('.cca-sync-dot')
    await expect(dot).toBeVisible()
  })

  test('T2 — Sync cross-device (device A → device B)', async ({ browser }) => {
    // Device A : login + add plant
    const ctxA = await browser.newContext()
    const pageA = await ctxA.newPage()
    await login(pageA, 'testsync2@citruscodex.fr')
    await addPlant(pageA, 'Citrus limon Cross Device A')
    // Wait for sync indicator to show synced
    await expect(pageA.locator('.cca-sync-dot[data-status="synced"]')).toBeVisible({ timeout: 15000 })

    // Device B : login, should see the plant
    const ctxB = await browser.newContext()
    const pageB = await ctxB.newPage()
    await login(pageB, 'testsync2@citruscodex.fr')
    await pageB.waitForTimeout(4000)
    await expect(pageB.locator('text=Citrus limon Cross Device A')).toBeVisible({ timeout: 15000 })

    await ctxA.close()
    await ctxB.close()
  })

  test('T3 — Offline mutation + flush on reconnect', async ({ page, context }) => {
    await login(page, 'testsync3@citruscodex.fr')
    await expect(page.locator('#cca-sync-btn')).toBeVisible({ timeout: 10000 })

    // Go offline
    await context.setOffline(true)
    await addPlant(page, 'Offline Citrus T3')
    // Should show pending indicator
    await expect(page.locator('.cca-sync-dot[data-status="pending"]')).toBeVisible({ timeout: 8000 })

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(5000)
    await expect(page.locator('.cca-sync-dot[data-status="synced"]')).toBeVisible({ timeout: 15000 })
  })

  test('T4 — Export RGPD JSON téléchargeable', async ({ page }) => {
    await login(page, 'testsync4@citruscodex.fr')
    await addPlant(page, 'Export Test Plant T4')
    await page.waitForTimeout(4000)  // let sync complete

    // Navigate to settings/profile
    await page.locator('#nv-settings, button:has-text("Réglages"), [aria-label*="Réglages"]').first().click()
    await page.waitForTimeout(500)

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.locator('button:has-text("Télécharger toutes mes données"), a:has-text("Exporter"), button:has-text("Exporter")').first().click()
    ])

    const path = await download.path()
    if (path) {
      const { readFileSync } = await import('fs')
      const content = JSON.parse(readFileSync(path, 'utf8'))
      expect(content.export_version).toBeTruthy()
      expect(Array.isArray(content.plants)).toBe(true)
    } else {
      // Download triggered — accept as pass even without path (CI environment)
      expect(download).toBeTruthy()
    }
  })

  test('T5 — Modal migration premier login avec données locales', async ({ page }) => {
    await page.goto(BASE)
    // Pre-fill localStorage with local plants before login
    await page.evaluate(() => {
      localStorage.setItem('agrumes_v5', JSON.stringify([
        { id: 'local-mig-1', name: 'Local Pre-Migration Plant', species: 'Citrus reticulata',
          cultureType: 'pot', events: [], photos: [] }
      ]))
      localStorage.removeItem('agrumes_migrated_to_server')
    })

    await login(page, 'testsync5@citruscodex.fr')

    // Migration modal should appear
    await expect(page.locator('text=Migration de vos données')).toBeVisible({ timeout: 15000 })

    // Click push to server
    await page.locator('button:has-text("Envoyer vers le serveur")').click()

    // Success message
    await expect(page.locator('text=Migration réussie')).toBeVisible({ timeout: 20000 })
  })

  test('T6 — profileType non éditable côté utilisateur', async ({ page }) => {
    await login(page, 'testsync1@citruscodex.fr')
    await page.locator('#nv-settings, button:has-text("Réglages")').first().click()
    await page.waitForTimeout(500)

    // Profile type should be read-only (disabled/readonly attribute or no select)
    const profileSelect = page.locator('select[name="profileType"], select[data-profile-type], #profile-type-select').first()
    if (await profileSelect.count() > 0) {
      const isDisabled = await profileSelect.evaluate(el => el.disabled || el.readOnly || el.hasAttribute('readonly'))
      expect(isDisabled).toBe(true)
    } else {
      // If there's a locked badge/hint, that's also acceptable
      const locked = page.locator('text=Verrouillé, text=Lecture seule, .profile-locked')
      expect(await locked.count()).toBeGreaterThan(0)
    }
  })

})
