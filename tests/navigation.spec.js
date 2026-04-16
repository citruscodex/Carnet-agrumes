// @ts-check
import { test, expect } from 'playwright/test';

/**
 * navigation.spec.js — Navigation entre les pages principales
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.showPage === 'function' && document.getElementById('app')?.style.display !== 'none', { timeout: 15_000 });
  });

  test('Dashboard charge correctement', async ({ page }) => {
    await page.evaluate(() => window.showPage('dashboard'));
    await page.waitForTimeout(800);
    const main = page.locator('#main');
    await expect(main).toBeVisible();
    const content = await main.innerHTML();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Page collection accessible', async ({ page }) => {
    await page.evaluate(() => window.showPage('collection'));
    await page.waitForTimeout(800);
    const main = page.locator('#main');
    const content = await main.innerHTML();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Page calendrier accessible', async ({ page }) => {
    await page.evaluate(() => window.showPage('fert'));
    await page.waitForTimeout(500);
    const main = page.locator('#main');
    const content = await main.innerHTML();
    expect(content.length).toBeGreaterThan(50);
  });

  test('Toutes les pages principales chargent sans erreur critique', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const pages = ['dashboard', 'collection', 'fert', 'eco', 'settings'];
    for (const p of pages) {
      await page.evaluate((pg) => window.showPage(pg), p);
      await page.waitForTimeout(400);
    }
    const critical = errors.filter(e =>
      !e.includes('fetch') && !e.includes('api') && !e.includes('404') &&
      !e.includes('push') && !e.includes('notification')
    );
    expect(critical).toHaveLength(0);
  });

  test('Le bouton nav dashboard est marqué actif sur le dashboard', async ({ page }) => {
    await page.evaluate(() => window.showPage('dashboard'));
    await page.waitForTimeout(500);
    const dashBtn = page.locator('#nv-dashboard');
    if (await dashBtn.count() > 0) {
      const ariaSelected = await dashBtn.getAttribute('aria-selected');
      expect(ariaSelected).toBe('true');
    }
  });
});
