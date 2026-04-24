const { test, expect } = require('@playwright/test');

async function loginAdmin(page) {
  await page.goto('http://localhost:5173');
  await page.fill('[name="email"]', 'citruscodex@gmail.com');
  await page.fill('[name="password"]', process.env.ADMIN_PASSWORD || 'adminpass');
  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-view="dashboard"], .cca-dashboard, #nv-collection', { timeout: 15000 });
}

test.describe('Admin panel — test complet', () => {

  test('A1 — Onglet Comptes affiche la liste utilisateurs', async ({ page }) => {
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await expect(page.locator('.cca-admin-wrap, .cca-admin-tabs')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.cca-admin-card, .cca-admin-user-email').first()).toBeVisible({ timeout: 8000 });
  });

  test('A2 — Onglet Bugs charge sans erreur 404', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    const bugsTab = page.locator('[data-admin-tab="bugs"], button:has-text("Bugs"), button:has-text("Bug")').first();
    await bugsTab.click();
    await page.waitForTimeout(1500);
    expect(errors404.filter(u => u.includes('bugs'))).toEqual([]);
  });

  test('A3 — Onglet Historique charge sans erreur 404', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    const auditTab = page.locator('[data-admin-tab="audit"], button:has-text("Historique"), button:has-text("History")').first();
    await auditTab.click();
    await page.waitForTimeout(1500);
    expect(errors404.filter(u => u.includes('audit-log'))).toEqual([]);
  });

  test('A4 — Onglet Statistiques charge sans erreur 404', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    const statsTab = page.locator('[data-admin-tab="stats"], button:has-text("Statistiques"), button:has-text("Statistics")').first();
    await statsTab.click();
    await page.waitForTimeout(1500);
    expect(errors404.filter(u => u.includes('stats/extended'))).toEqual([]);
  });

  test('A5 — Onglet Statistiques affiche des chiffres', async ({ page }) => {
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    const statsTab = page.locator('[data-admin-tab="stats"], button:has-text("Statistiques"), button:has-text("Statistics")').first();
    await statsTab.click();
    await expect(page.locator('.cca-admin-stat-card').first()).toBeVisible({ timeout: 6000 });
    const val = await page.locator('.cca-admin-stat-val').first().textContent();
    expect(val).not.toBe('⏳ Chargement…');
  });

  test('A6 — Section invitation bêta-testeur visible onglet Comptes', async ({ page }) => {
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    // Onglet Comptes = premier onglet par défaut
    await expect(page.locator('#cca-admin-inv-email, input[placeholder*="email@"]')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#cca-admin-invite-btn, button:has-text("Créer"), button:has-text("Create")')).toBeVisible();
  });

  test('A7 — Bouton Supprimer visible pour compte désactivé', async ({ page }) => {
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    // Filtrer sur les comptes désactivés
    const statusSel = page.locator('#cca-adm-fs');
    if (await statusSel.count() > 0) {
      await statusSel.selectOption('disabled');
      await page.locator('#cca-adm-filter-btn').click();
      await page.waitForTimeout(1000);
      const deleteBtn = page.locator('[data-adusr-delete]').first();
      const activateBtn = page.locator('[data-adusr-activate]').first();
      // Si des comptes désactivés existent, vérifier les boutons
      if (await deleteBtn.count() > 0) {
        await expect(deleteBtn).toBeVisible();
        await expect(activateBtn).toBeVisible();
      }
    }
  });

  test('A8 — Aucun 404 sur navigation complète tous onglets admin', async ({ page }) => {
    const errors404 = [];
    page.on('response', r => {
      if (r.url().includes('/api/admin/') && r.status() === 404) errors404.push(r.url());
    });
    await loginAdmin(page);
    const adminBtn = page.locator('[data-view="admin"], #nv-admin, button:has-text("Admin"), a:has-text("Admin")').first();
    await adminBtn.click();
    await page.waitForSelector('.cca-admin-tabs', { timeout: 8000 });
    for (const tabKey of ['bugs', 'audit', 'stats']) {
      const tab = page.locator(`[data-admin-tab="${tabKey}"]`).first();
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForTimeout(1200);
      }
    }
    expect(errors404, `404s détectés : ${errors404.join(', ')}`).toEqual([]);
  });

});
