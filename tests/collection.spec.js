// @ts-check
import { test, expect } from 'playwright/test';

/**
 * collection.spec.js — Page collection en mode local
 */

test.describe('Collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.showPage === 'function', { timeout: 15_000 });
    await page.evaluate(() => window.showPage('collection'));
    await page.waitForTimeout(800);
  });

  test('La page collection s\'affiche', async ({ page }) => {
    // #main est rempli par render() après showPage('collection')
    const main = page.locator('#main');
    await expect(main).toBeVisible({ timeout: 5000 });
    // Le contenu ne doit pas être vide
    const content = await main.innerHTML();
    expect(content.length).toBeGreaterThan(100);
  });

  test('showPage collection ne produit pas d\'erreur JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.evaluate(() => window.showPage('collection'));
    await page.waitForTimeout(500);
    const critical = errors.filter(e => !e.includes('fetch') && !e.includes('api'));
    expect(critical).toHaveLength(0);
  });

  test('La navigation retourne au dashboard', async ({ page }) => {
    await page.evaluate(() => window.showPage('dashboard'));
    await page.waitForTimeout(500);
    // Le bouton dashboard doit être actif
    const dashBtn = page.locator('#nv-dashboard');
    if (await dashBtn.count() > 0) {
      const isActive = await dashBtn.evaluate(el => el.classList.contains('active'));
      expect(isActive).toBe(true);
    }
  });
});
