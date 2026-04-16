// @ts-check
import { test, expect } from 'playwright/test';

/**
 * layout.spec.js — Structure de base de la PWA
 * IS_LOCAL=true → session dev injectée + config localStorage auto → dashboard direct
 */

test.describe('Layout de base', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Attendre que launchApp() affiche #app
    await page.waitForSelector('#app[style*="flex"], #app[style*="display: flex"]', { timeout: 15_000 });
  });

  test('La page charge sans erreur JS critique', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('sw.js') &&
      !e.includes('ResizeObserver') &&
      !e.includes('push') &&
      !e.includes('notification')
    );
    expect(critical).toHaveLength(0);
  });

  test('La bannière MODE LOCAL est visible', async ({ page }) => {
    await expect(page.locator('#cca-local-banner')).toBeVisible({ timeout: 10_000 });
  });

  test('La navigation principale est présente', async ({ page }) => {
    // Barre de navigation inférieure avec les onglets
    const nav = page.locator('#nv-dashboard, nav, [role="tablist"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('Le titre de la page est défini', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test('#app est affiché en flex', async ({ page }) => {
    const appDisplay = await page.locator('#app').evaluate(el => getComputedStyle(el).display);
    expect(appDisplay).toBe('flex');
  });
});
